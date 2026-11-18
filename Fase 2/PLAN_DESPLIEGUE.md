# Plan de despliegue: Vercel + Supabase en la nube

Plan de trabajo para publicar SIGMAVE y mostrarlo funcionando en la evaluación. Se ejecuta en una sesión de 2 a 3 horas, en este orden.

## Decisión

| Ambiente | Dónde corre | Para qué |
|---|---|---|
| **Desarrollo** | Docker en cada equipo (Front, API y Supabase CLI), igual que hoy | Programar y probar |
| **Publicación** | **Vercel** (frontend y API) + **Supabase en la nube** (base de datos) | Mostrar el producto con una URL pública con HTTPS |

Docker no cambia: sigue siendo el entorno de desarrollo. Los `Dockerfile` de producción con Nginx quedan como alternativa, pero no se usan para publicar.

Costo: **$0** (Vercel Hobby y Supabase Free). Vercel Hobby es para uso personal y no comercial; un proyecto académico calza.

## Arquitectura objetivo

```
Navegador ──HTTPS──▶ Vercel · proyecto "sigmave-web"   (raíz: Fase 2/Front)
                       ├── sitio estático (Vite build)
                       └── /api/*  ──rewrite──▶ Vercel · proyecto "sigmave-api" (raíz: Fase 2/Backend)
                                                  └── Express como función serverless
                                                        └──SQL (pooler, SSL)──▶ Supabase en la nube
```

El `rewrite` hace que el navegador vea un solo dominio. Eso importa porque la cookie de sesión es `SameSite=strict`: si el frontend y la API quedaran en dominios distintos, el login no funcionaría.

## Antes de empezar (checklist)

- [ ] Cuenta en **Vercel**, entrando con GitHub.
- [ ] Acceso de administrador al repositorio `fonchoo/proyecto-capstone`. Vercel necesita instalar su app de GitHub en el repo; si el dueño es otra persona, tiene que autorizarlo él o darles permisos.
- [ ] Cuenta en **Supabase**.
- [ ] Docker Desktop abierto, para comparar con el entorno local si algo falla.
- [ ] Decidir si la demo usa los usuarios del seed. Su clave (`prueba1234`) está publicada en el README, así que con una URL pública conviene cambiarla en la base de la nube.

## Paso 0 · Preparar el código (rama `despliegue-vercel`)

| Cambio | Archivo | Por qué |
|---|---|---|
| SSL opcional (`PGSSL=true`) | `Backend/src/db.js` | Supabase en la nube exige conexión cifrada; en local no |
| Tamaño del pool configurable (`PGPOOL_MAX`) | `Backend/src/db.js` | En serverless cada instancia abre sus conexiones; hay que mantenerlas pocas |
| `vercel.json` con el rewrite de `/api` y el fallback a `index.html` | `Front/vercel.json` | Un solo dominio para la cookie, y que recargar en `/vehiculos/1` no dé 404 |
| Sección «Publicación» | `README.md` | Que cualquiera del equipo pueda repetirlo |

Verificación local antes de subir: `npm run build` en Front, y que la API siga funcionando con Docker sin definir `PGSSL`.

## Paso 1 · Base de datos en Supabase (≈ 30 min)

1. Crear el proyecto `sigmave` en la región más cercana (São Paulo). **Guardar la contraseña de la base**: se pide una sola vez.
2. Desde `Backend/`, vincular el proyecto local con el de la nube (pide la contraseña):

   ```bash
   npx supabase link --project-ref <ref-del-proyecto>
   ```

3. Aplicar las migraciones y el seed:

   ```bash
   npx supabase db push --include-seed
   ```

4. Verificar en el panel de Supabase (Table Editor) que existan las 8 tablas y los datos del seed.
5. En **Connect → Transaction pooler**, anotar el host, el puerto (6543), el usuario (`postgres.<ref>`) y la base (`postgres`).

## Paso 2 · API en Vercel (≈ 30 min)

> **La API se publica con la CLI, no con la integración de Git.** Con Git, Vercel nombra la función con su ruta en el repositorio (`Fase 2/Backend/api/index.js`) y rechaza el despliegue por el espacio de «Fase 2» (*A Serverless Function has an invalid name*). Pasa con el preset Express, con la carpeta `api/` y aunque se desactive «Include files outside the root directory». Subida con la CLI desde `Backend/`, la función queda como `api/index.js`.

1. Crear el proyecto `sigmave-api` en Vercel **sin** conectar el repositorio (o, si ya se importó, dejar **Root Directory** vacío y desconectar Git en **Settings → Git**). Preset: **Other**.
2. Variables de entorno:

   | Variable | Valor |
   |---|---|
   | `PGHOST` | host del pooler |
   | `PGPORT` | `6543` |
   | `PGUSER` | `postgres.<ref>` |
   | `PGPASSWORD` | contraseña de la base |
   | `PGDATABASE` | `postgres` |
   | `PGSSL` | `true` |
   | `PGPOOL_MAX` | `3` |
   | `JWT_SECRET` | uno nuevo, de 32 caracteres o más (no reutilizar el local) |
   | `COOKIE_SECURE` | `true` |
   | `NODE_ENV` | `production` |

3. Desde `Backend/`, iniciar sesión, vincular la carpeta con el proyecto y desplegar. `Backend/.vercelignore` limita la subida a `api/`, `src/`, `package*.json` y `vercel.json`; sin él la CLI subiría el `.env` local.

   ```bash
   npx vercel login
   npx vercel link
   npx vercel deploy --prod
   ```

   Cada cambio en la API se publica repitiendo `npx vercel deploy --prod`.

4. Probar el login directo contra la API desde Git Bash; tiene que responder `200` con un `Set-Cookie`:

   ```bash
   curl -i -X POST https://<api>.vercel.app/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@admin.cl","password":"admin1234"}'
   ```

## Paso 3 · Frontend en Vercel (≈ 20 min)

1. Poner la URL de la API en el `rewrite` de `Front/vercel.json`, hacer commit y push a la rama.
2. **Add New → Project →** el mismo repositorio. En **Root Directory**: `Fase 2/Front`, con el preset de Vite.
3. Desplegar y abrir la URL.

## Paso 4 · Pruebas de humo (≈ 30 min)

- [ ] Login con cada rol; al recargar la página la sesión se mantiene.
- [ ] Dashboard con los datos del seed.
- [ ] Recargar estando en `/vehiculos/1`: carga la ficha, no un 404.
- [ ] Flujo completo de la demo (MTC_0340): reportar falla en B-2 → aviso al teniente → derivar → aviso al inspector → registrar mantención con costos → B-2 «Operativo».
- [ ] La campana se actualiza sin recargar (consulta cada 30 s).
- [ ] Alertas preventivas y fechas correctas en hora de Chile.
- [ ] Reportería y exportación a PDF.
- [ ] Todo lo anterior desde un celular con datos móviles.
- [ ] Cerrar sesión.

## Paso 5 · Cierre

- [x] Hacer merge de la rama a `dev` y push. Vercel publica el frontend desde `dev` (**Settings → Environments → Production → Branch Tracking**).
- [x] Guardar la URL pública en el README y en la tarjeta de Trello («TT - Levantamiento e implementación del proyecto»).
- [x] Captura de la URL funcionando como evidencia: `Evidencias/Evidencia Grupal/Publicacion Vercel/`.
- [x] Desactivar la Data API de Supabase: las tablas de `public` no tienen RLS y la API REST automática las expondría.
- [ ] Cambiar las claves de los usuarios de prueba en la base de la nube, si se decidió.

**Sistema publicado: https://proyecto-capstone-front.vercel.app**

## Riesgos y plan B

| Riesgo | Cómo se detecta | Qué hacer |
|---|---|---|
| La cookie no se guarda a través del `rewrite` | El login responde 200, pero al recargar se pierde la sesión | Plan B: un solo proyecto de Vercel, con la API como función dentro del proyecto del frontend |
| «Too many connections» en Supabase | Errores 500 intermitentes | Bajar `PGPOOL_MAX` a 1 y confirmar que se usa el pooler (puerto 6543) |
| Supabase Free se pausa tras 7 días sin uso | La API responde con errores de conexión | Abrir el sistema unos días antes de la demo; reanudar el proyecto desde el panel |
| Arranque en frío de la función | La primera petición tarda unos segundos | Abrir el sistema un minuto antes de presentar |
| Falla algo el día de la evaluación | — | Respaldo: el sistema en Docker local, más las capturas de MTC_0340 |
