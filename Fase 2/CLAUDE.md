# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

SIGMAVE: plataforma web para gestionar el mantenimiento de vehículos de emergencia de compañías de bomberos (Capstone APT122). El repositorio git está un nivel arriba (`proyecto-capstone/`); `Fase 1/` y `Fase 2/Evidencias/` son entregables académicos (docx/xlsx), no código. Código, comentarios, UI y mensajes de commit están en **español**.

## Comandos

Usar siempre `npm ci` (nunca `npm install`): el equipo depende del `package-lock.json`.

```bash
# Base de datos: Supabase local vía CLI (devDependency). SIEMPRE desde Backend/ (ahí está supabase/config.toml)
cd Backend
npx supabase start                    # aplica migrations/ + seed.sql; requiere Docker corriendo
npx supabase db reset                 # borra todo y reaplica migraciones + seed
npx supabase migration new <nombre>   # cambio de esquema = migración NUEVA, nunca editar una ya aplicada

# API (http://localhost:3000). Requiere Backend/.env con JWT_SECRET >= 32 caracteres o no arranca
cp .env.example .env
npm run dev                           # nodemon

# Front (http://localhost:5173). Vite reenvía /api a localhost:3000
cd Front
npm run dev
npm run build                         # única verificación automática disponible
```

No hay tests automatizados ni linter configurados. Las pruebas son manuales según el plan `Evidencias/docs/Plan_de_Pruebas_Bomberos_completado.xlsx` (casos `MTC_xxxx - HUxx-<tipo>`), con evidencia en `Evidencias/Pruebas/Sprint N/<caso>/`.

Postgres local: `postgresql://postgres:postgres@127.0.0.1:55322/postgres`, Studio en http://127.0.0.1:55323. Puertos en el rango 553xx a propósito. Consultas rápidas: `docker exec supabase_db_sigmave psql -U postgres -d postgres -c "..."`. Los usuarios de prueba (un usuario por rol en cada compañía, más dos administradores) están en la tabla del README y en `Backend/supabase/seed.sql`.

**Docker:** Front y Backend son dos stacks de Compose separados (`capstone-web`, `capstone-api`). `docker compose up -d --build` carga el override de desarrollo (nodemon/Vite con bind-mount). Para producción se usa `-f docker-compose.yml` (y en Front, además, `--profile prod`, que sirve nginx en el puerto 8080). La base de datos no está en ningún compose: los contenedores llegan a Supabase y a la API por `host.docker.internal`. Orden de arranque: Supabase → Backend → Front. Si los contenedores quedan en estado "Created", lo más probable es que haya un `npm run dev` local ocupando el puerto 3000 o el 5173.

## Arquitectura

### Backend (`Backend/src`, Express 5, ESM, SQL directo con `pg`; sin ORM)

- `app.js`: `/api/auth` es pública; todo el resto de `/api` pasa por `requireAuth`. El manejador central de errores responde "Solicitud inválida" a **todo** 4xx. Para que el usuario vea un mensaje concreto, la ruta lanza `errorPublico(status, msg)` y lo responde con `responderErrorPublico` (ambos en `estadoVehiculo.js`).
- `auth.js`: JWT en la cookie httpOnly `sigmave_token` (`SameSite=strict`, `path=/api`, 8 h). `requireAuth` relee el usuario de la base en cada request, así que los cambios de rol o de compañía rigen de inmediato. Los permisos se aplican con `requireRol(...)`; `ROLES_MANTENCION` agrupa a los roles que pueden derivar fallas y registrar mantenciones, y `ROLES_VEHICULOS` a los que pueden crear y editar vehículos (hoy es la misma lista).
- Vehículos (`routes/vehiculos.js`): `validarVehiculo` es la única validación de `POST` y `PUT`. Exige nomenclatura, tipo, patente, marca, año y compañía, y normaliza la patente (`KLHT-21` → `KLHT21`), que es única en la base (`uq_vehiculo_patente`). El `PUT` no toca `estado_vehiculo`. En el front, `components/VehicleForm.jsx` replica esas reglas y lo usan tanto la creación como la edición.
- Las reglas de negocio están en **un solo lugar cada una**. Las rutas las importan y nunca las reimplementan:
  - `alcance.js`: define qué compañías ve cada usuario (el administrador ve todas; los demás, solo la suya). Los listados filtran con `filtroCompanias(req)` usando el patrón SQL `($1::int[] IS NULL OR id_compania = ANY($1))`. Un recurso fuera del alcance se responde como **404**, no 403, para no revelar que existe.
  - `estadoVehiculo.js`: `recalcularEstadoVehiculo` deriva `estado_vehiculo` de los datos. Si hay una mantención `en_proceso`, el vehículo queda `en_mantencion`; si no, y hay fallas pendientes o derivadas, queda `no_operativo`; en cualquier otro caso, `operativo`. Hay que llamarla después de todo evento que cambie fallas o mantenciones, dentro de `enTransaccion`.
  - `preventiva.js`: define la preventiva cada 6 meses desde la `fecha_salida` de la última preventiva, con aviso 30 días antes. Entrega fragmentos SQL (`JOIN_PREVENTIVA`, `COLUMNAS_PREVENTIVA`) y el front lee las constantes desde `GET /api/config`. Las alertas (HU09/HU10) **no se guardan**: se calculan en cada consulta.
  - `validaciones.js`: reglas de formato de los campos (RUT con dígito verificador, correo en minúsculas, contraseña de 8 a 72 con letra y número, patente chilena, nomenclatura `B-1`, kilometraje, montos en pesos enteros, largos de texto). `catalogoVehiculos.js` tiene las listas cerradas de tipo y marca (y modelos sugeridos), servidas en `GET /api/config`. `Front/src/validaciones.js` repite las reglas de formato para avisar antes de enviar: **hay que mantenerla sincronizada a mano**; el catálogo no se copia, el front lo lee de `/api/config`.
  - Login (`routes/auth.js`): 5 contraseñas incorrectas seguidas para un correo lo bloquean 15 minutos (429). Los fallos viven en la tabla `intento_login`, no en memoria, porque en Vercel hay varias instancias de la función.
  - Cuentas desactivadas (HU16): los usuarios **no se borran**, se desactivan (`usuario.activo`) con `PATCH /api/usuarios/:id/desactivar` (y `/reactivar`), porque figuran en el historial con FK RESTRICT. Una cuenta inactiva no entra (403 solo con la contraseña correcta), `requireAuth` corta su sesión abierta y `notificaciones.js` no le envía avisos. Toda consulta nueva que elija usuarios para algo (avisos, asignaciones) tiene que filtrar `u.activo`.
  - `notificaciones.js`: decide quién recibe cada aviso dentro de la app (HU11). Una falla reportada avisa a los usuarios de la compañía del vehículo, salvo a quien la reportó y a los administradores. Una falla derivada avisa a los Inspectores de esa compañía. Las rutas lo llaman dentro de su transacción. El front las consulta cada 30 s (`GET /api/notificaciones`); no hay push del sistema operativo.
- Mantenciones (`routes/mantenimientos.js`): `validarMantencion` exige siempre tipo, fecha de ingreso, taller y detalle. Al finalizar (con fecha de salida, o con `PATCH /:id/finalizar`) también exige repuestos y mano de obra (se acepta $0). El `costo_total` lo calcula la API.
- `db.js`: el pool escucha su evento `error`. Sin ese listener, un reinicio de Postgres (por ejemplo, un `db reset`) tumba la API completa.
- Fechas: `db.js` hace que las columnas `DATE` lleguen como string `YYYY-MM-DD`. "Hoy" se calcula siempre en `America/Santiago` (`hoyChile()` o el SQL equivalente), nunca en UTC.
- Flujo de una falla (HU05→HU06→HU07): `pendiente` (la reporta cualquier rol) → `derivado` (lo hace el Teniente Tercero o un rol superior, con `PATCH /api/fallas/:id/derivar`) → `resuelto` (cuando finaliza la mantención asociada, en `routes/mantenimientos.js`).

### Base de datos (`Backend/supabase`)

Las migraciones son la fuente de verdad del esquema. Los diagramas de `Evidencias/docs/` están desactualizados. Muchas reglas también se aplican con `CHECK` en la base: `usuario.password` debe ser un hash bcrypt, y los estados válidos de fallas y mantenciones, junto con su coherencia con las fechas, también están restringidos ahí. Si cambias una regla, revisa el `CHECK` correspondiente. `seed.sql` es idempotente (`ON CONFLICT DO NOTHING`): editarlo no actualiza filas que ya existen, así que hay que correr `db reset`.

### Frontend (`Front/src`, React 18 + Vite + Tailwind, JS sin TypeScript)

- `store.jsx` (`VehicleProvider`, hook `useVehicles()`) concentra la sesión (`GET /api/auth/me`), las llamadas a la API, el selector de compañía del administrador (`?id_compania=`) y el mapeo de las filas de la base a la forma que usan las vistas. Por ejemplo, `estado_vehiculo` `operativo`/`en_mantencion`/`no_operativo` pasa a `status` `operational`/`warning`/`critical`, y `nomenclatura` pasa a `code`. Las páginas consumen esos campos mapeados.
- `permissions.js` replica la matriz de roles del backend. **Hay que mantenerla sincronizada a mano** con `Backend/src/auth.js` y con los `requireRol` de las rutas. El guard de `App.jsx` es solo para la experiencia de usuario: la seguridad real la aplica la API.
- Temas: `theme.jsx` alterna entre `v1` (oscuro) y `v2`. Los componentes obtienen sus clases con `themes[theme]` desde `themeStyles.js`. Un estilo nuevo tiene que definirse en **ambos** temas.
- Ficha del vehículo (`VehicleDetail.jsx`): tiene las pestañas «Resumen» e «Historial». La pestaña va en la URL (`?tab=historial`), así que para enlazar al historial (notificaciones, panel de Fallas, después de guardar una mantención) se usa `/vehiculos/:id?tab=historial`.
- Dashboard: los indicadores (`MetricCard` con `onClick`) filtran la tabla de la flota. El filtro también va en la URL (`?estado=no_operativo`; claves en `FILTROS` de `Dashboard.jsx`), así que se puede enlazar a `/dashboard?estado=preventiva_vencida`.
- Formularios: siguen el patrón `fieldErrors`/`formError`/`formOk` dentro de la página (ver `Dashboard.jsx` y `Users.jsx`). Si el formulario se cierra al guardar, el mensaje de éxito tiene que renderizarse fuera de él, porque si no nunca se ve.

## Convenciones

- Cada archivo empieza con un bloque de comentario que explica su propósito y el **porqué** de las decisiones. Mantén ese estilo y esa densidad de comentarios.
- Mensajes de commit en español, en tercera persona y en presente ("Corrige…", "Agrega…", "Muestra…"), con un cuerpo que explique la causa. Si el cambio corrige un caso del plan de pruebas, menciona su ID (por ejemplo `MTC_0070, HU03-CA1`).
- En PowerShell con una política de ejecución restrictiva, usa `npm.cmd` y `npx.cmd`.
