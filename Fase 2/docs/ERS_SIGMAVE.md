# ERS — Especificación de Requisitos de Software

## SIGMAVE — Sistema de Gestión de Mantenimiento de Vehículos

| Campo | Valor |
|---|---|
| Proyecto | SIGMAVE — Sistema de Gestión de Mantenimiento de Vehículos |
| Asignatura | Capstone — APT122 |
| Institución | Companía de Bomberos (1.ª Compañía) — Maipú, Chile |
| Versión del documento | 1.0 |
| Fecha | 26 de septiembre de 2026 |
| Autores | Enzo Toledo (Backend) · Patricio Finschi (Frontend) · Ramón Ortiz (SCRUM Master y Documentación) |

---

## 1. Introducción

### 1.1 Propósito

Este documento especifica los requisitos funcionales y no funcionales del sistema **SIGMAVE**, una plataforma web destinada a la gestión y control del mantenimiento de la flota de vehículos de emergencia de una compañía de bomberos. El documento está dirigido a los desarrolladores del equipo, al docente evaluador y a los interesados del proyecto, y constituye la base para el desarrollo, verificación y aceptación del sistema.

### 1.2 Alcance

SIGMAVE permite:

- Autenticar usuarios según rol y mantener la sesión activa.
- Registrar y consultar los vehículos de la flota y su estado operativo.
- Registrar el ingreso y egreso de mantenciones (preventivas y reactivas) con sus costos de mano de obra y repuestos.
- Reportar fallas de vehículos y gestionar recordatorios de mantención.
- Gestionar usuarios y sus roles.
- Generar reportería de costos de mantención con exportación a PDF.

Quedan fuera del alcance de esta versión: facturación electrónica, integración con proveedores, módulo móvil y notificaciones por correo/SMS.

### 1.3 Definiciones, siglas y abreviaturas

| Término | Definición |
|---|---|
| ERS | Especificación de Requisitos de Software |
| API | Application Programming Interface |
| REST | Estilo de arquitectura para servicios web |
| CRUD | Create, Read, Update, Delete |
| Falla | Anomalía operativa reportada sobre un vehículo |
| Mantención preventiva | Mantención programada según periodos o kilometraje |
| Mantención reactiva | Mantención correctiva tras una falla o emergencia |
| Material mayor | Denominación del material móvil (carros, máquinas) de bomberos |
| UC | Unidad de competencia |

### 1.4 Referencias

- Guía 2. Desarrollo Proyecto APT (evidencia 2.4)
- Guía 3. Informe final Proyecto APT (evidencia 2.6)
- Modelo de datos: `backend/schema.sql` y `backend/seed.sql`
- Repositorio: `proyecto-capstone/Fase 2`

### 1.5 Resumen general

El resto del documento describe la perspectiva general del sistema (apartado 2), los requisitos funcionales y no funcionales (apartado 3), la matriz de trazabilidad (apartado 4) y el modelo de datos (apartado 5).

---

## 2. Descripción general

### 2.1 Perspectiva del producto

SIGMAVE es una aplicación web full-stack de tres capas:

```
┌───────────────────┐      ┌────────────────────┐      ┌─────────────────────┐
│ Frontend (web)    │      │ Backend (API REST) │      │ Base de datos       │
│ React + Vite      │ ───▶ │ Node.js + Express  │ ───▶ │ PostgreSQL          │
│ Tailwind CSS      │  /api│                    │  SQL │ (contenedor Docker) │
└───────────────────┘      └────────────────────┘      └─────────────────────┘
```

- El **frontend** (React + Vite + Tailwind) consume la API mediante el prefijo `/api`.
- El **backend** (Node.js + Express) expone los servicios REST y entrega datos JSON.
- La **base de datos** (PostgreSQL) se ejecuta en un contenedor Docker con volumen persistente (`pgdata`) y se inicializa automáticamente con los scripts `01-schema.sql` y `02-seed.sql`.

El entorno se despliega con Docker Compose en tres servicios: `capstone-db-1` (base de datos, puerto host 5434), `capstone-server-1` (API, puerto 3000) y `capstone-web-dev-1` (frontend Vite, puerto 5173 con proxy hacia la API).

### 2.2 Funciones del producto

1. **Autenticación y sesión**: el usuario inicia sesión con email y contraseña; el backend valida contra la base de datos y devuelve el usuario con su rol. La sesión se persiste en `localStorage`.
2. **Gestión de vehículos**: listado del estado de la flota, registro de nuevos vehículos, detalle por vehículo.
3. **Gestión de mantenciones**: registro de mantenciones preventivas y reactivas con fechas, kilometraje, detalle del trabajo, proveedor, costos (repuestos y mano de obra) y responsable.
4. **Reporte de fallas**: formulario de reporte y confirmación de fallas de un vehículo.
5. **Alertas**: recordatorios de mantención por fecha o kilometraje programado.
6. **Gestión de usuarios**: administración de usuarios, roles y compañías (solo administrador).
7. **Reportería**: filtro de costos por periodo (generado desde fechas reales de mantenciones) y exportación a PDF.
8. **Control de acceso por rol**: navegación y acciones limitadas según la matriz de roles.

### 2.3 Características de los usuarios

| Role | Descripción | Acceso principal |
|---|---|---|
| Bombero | Voluntario de la compañía | Dashboard, alertas, detalle de vehículo, reportar falla |
| Teniente Tercero | Oficial a cargo de material | Lo anterior + registrar mantenciones |
| Inspector de Material Mayor | Encargado de la mantención y costos | Lo anterior + reportería y costos |
| Administrador | Gestión integral del sistema | Todos los módulos, incluida gestión de usuarios |

### 2.4 Entorno operativo

- **Servidores**: contenedores Docker (Compose v3) sobre Windows o Linux.
- **Clientes**: navegadores modernos (Chrome, Edge, Firefox) con soporte de JavaScript moderno y ES modules.
- **Rutas de la API**: todas bajo el prefijo `/api`.
- **Puertos**: base de datos 5434 (host), API 3000, frontend 5173 (desarrollo) y 80/443 (producción con Nginx).

### 2.5 Restricciones

- La base de datos solo admite tres estados de vehículo: `operativo`, `no_operativo` y `en_mantencion`.
- Las contraseñas se almacenan con hash (bcrypt); nunca en texto plano.
- Las claves foráneas de las tablas de negocio usan `ON DELETE RESTRICT` para proteger la integridad referencial.
- El backend define restricciones de unicidad en `rut` y `email` de los usuarios, y en `nomenclatura` de los vehículos.
- Los requisitos obligatorios de la API son validados por el backend y reflejados en los formularios del frontend.

### 2.6 Supuestos y dependencias

- Existe al menos una compañía y los roles definidos en el `seed.sql` (bombero, teniente tercero, inspector de material mayor, administrador).
- La compañía de bomberos dispone de conectividad a internet para el despliegue y de navegadores actualizados en su sitio.
- Los scripts de inicialización de la base de datos se ejecutan en orden numérico (`01-schema.sql` antes de `02-seed.sql`).

---

## 3. Requisitos funcionales

Cada requisito se identifica como `RF-XX` y describe el comportamiento esperado del sistema.

### 3.1 Autenticación

| ID | Requisito | Prioridad | Rol |
|---|---|---|---|
| RF-01 | El sistema debe validar credenciales (email y contraseña) contra la base de datos y devolver el usuario autenticado con su `nombre_rol`. | Alta | Todos |
| RF-02 | Si las credenciales son incorrectas, la API debe responder con error 401 y el frontend debe mostrar un mensaje claro. | Alta | Todos |
| RF-03 | El sistema debe persistir la sesión del usuario (clave `sigmave_user` en `localStorage`) para que no se pierda al recargar la página. | Alta | Todos |
| RF-04 | El sistema debe permitir cerrar sesión, limpiando la sesión y redirigiendo al login. | Alta | Todos |

### 3.2 Gestión de vehículos

| ID | Requisito | Prioridad | Rol |
|---|---|---|---|
| RF-05 | El sistema debe listar los vehículos de la flota con sus datos y estado. | Alta | Todos |
| RF-06 | El sistema debe permitir registrar un nuevo vehículo mediante formulario validado; `nomenclatura` e `id_compania` son obligatorios. | Alta | Todos |
| RF-07 | El sistema debe mostrar el detalle de un vehículo con su historial de mantenciones y fallas. | Alta | Todos |
| RF-08 | El estado del vehículo debe reflejarse con un mapeo visual (`operativo` → operational, `en_mantencion` → warning, `no_operativo` → critical). | Media | Todos |
| RF-09 | El sistema debe permitir reportar una falla sobre un vehículo y confirmarla. | Media | Todos |
| RF-10 | La lista debe refrescarse automáticamente tras registrar un vehículo. | Media | Todos |

### 3.3 Gestión de mantenciones

| ID | Requisito | Prioridad | Rol |
|---|---|---|---|
| RF-11 | El sistema debe listar los tipos de mantención disponibles (preventiva y reactiva) desde la API. | Alta | Teniente Tercero, Inspector, Admin |
| RF-12 | El sistema debe permitir registrar una mantención con: fecha de ingreso (obligatoria), fecha de salida, kilometraje de ingreso, detalle del trabajo, proveedor, costo total, mano de obra, tipo de mantención, vehículo y usuario responsable. | Alta | Teniente Tercero, Inspector, Admin |
| RF-13 | El sistema debe validar que la fecha de salida no sea anterior a la fecha de ingreso. | Media | Teniente Tercero, Inspector, Admin |
| RF-14 | Al guardar una mantención, el frontend debe mostrar éxito o error, y redirigir al detalle del vehículo. | Media | Teniente Tercero, Inspector, Admin |
| RF-15 | El sistema debe incorporar el costo de **mano de obra** como dato propio de la mantención para el cálculo de costos. | Alta | Teniente Tercero, Inspector, Admin |

### 3.4 Gestión de usuarios

| ID | Requisito | Prioridad | Rol |
|---|---|---|---|
| RF-16 | El administrador debe poder listar los usuarios registrados. | Alta | Admin |
| RF-17 | El administrador debe poder crear usuarios con `rut`, `nombre_completo`, `email`, `password`, `id_rol` e `id_compania`, todos validados. | Alta | Admin |
| RF-18 | El sistema debe cargar los roles y compañías disponibles desde la API para el formulario. | Alta | Admin |
| RF-19 | El formulario debe preseleccionar la compañía del usuario logueado. | Media | Admin |
| RF-20 | La contraseña debe tener un mínimo de 6 caracteres. | Alta | Admin |
| RF-21 | Los errores de la API (como email o RUT duplicado) deben mostrarse en el formulario y luego refrescarse la lista. | Media | Admin |

### 3.5 Control de acceso por rol

| ID | Requisito | Prioridad | Rol |
|---|---|---|---|
| RF-22 | El sistema debe ocultar las pestañas de navegación según el rol (matriz de permisos en `permissions.js`). | Alta | Todos |
| RF-23 | El sistema debe bloquear el acceso directo por URL a vistas no autorizadas (guard `Protected` en `App.jsx`). | Alta | Todos |
| RF-24 | Solo Teniente Tercero, Inspector de Material Mayor y Administrador pueden acceder a "Registrar mantención" (visible u oculto en el detalle del vehículo). | Alta | Ten. 3, Insp., Admin |
| RF-25 | Solo Inspector de Material Mayor y Administrador acceden a "Reportería y costos". | Alta | Insp., Admin |
| RF-26 | Solo el Administrador accede a "Gestión de usuarios". | Alta | Admin |

**Matriz de acceso por vista**

| Vista | Bombero | Ten. 3 | Insp. M.M. | Admin |
|---|---|---|---|---|
| Dashboard | Sí | Sí | Sí | Sí |
| Detalle de vehículo | Sí | Sí | Sí | Sí |
| Reportar falla | Sí | Sí | Sí | Sí |
| Registrar mantención | No | Sí | Sí | Sí |
| Alertas | Sí | Sí | Sí | Sí |
| Reportería y costos | No | No | Sí | Sí |
| Gestión de usuarios | No | No | No | Sí |

### 3.6 Reportería y costos

| ID | Requisito | Prioridad | Rol |
|---|---|---|---|
| RF-27 | El sistema debe permitir seleccionar un periodo para el reporte de costos, generado a partir de las fechas reales de mantenciones registradas. | Alta | Insp., Admin |
| RF-28 | El sistema debe filtrar mantenciones según el periodo seleccionado. | Alta | Insp., Admin |
| RF-29 | El sistema debe exportar el reporte a PDF con cabecera (periodo, fecha de emisión), resumen, tabla por vehículo y detalle en páginas adicionales. | Alta | Insp., Admin |
| RF-30 | El archivo PDF debe identificarse con el periodo (p. ej. `reporte-costos-2026-09.pdf`). | Media | Insp., Admin |

### 3.7 Alertas

| ID | Requisito | Prioridad | Rol |
|---|---|---|---|
| RF-31 | El sistema debe listar las alertas/recordatorios de mantención con datos del vehículo asociado. | Media | Todos |
| RF-32 | El sistema debe permitir crear alertas por fecha programada y/o kilometraje programado, asociadas a un vehículo. | Media | Ten. 3, Insp., Admin |
| RF-33 | El estado de la alerta debe permitir valores como `pendiente` (valor por defecto). | Baja | — |

### 3.8 Catálogos (compañías, roles, tipos de mantención)

| ID | Requisito | Prioridad | Rol |
|---|---|---|---|
| RF-34 | El sistema debe exponer el catálogo de compañías mediante la API (`GET /api/companias`). | Alta | Todos |
| RF-35 | El sistema debe exponer el catálogo de roles mediante la API (`GET /api/roles`). | Media | Todos |
| RF-36 | El sistema debe exponer los tipos de mantención mediante la API (`GET /api/tipos-mantencion`). | Media | Ten. 3, Insp., Admin |

---

## 4. Requisitos no funcionales

| ID | Categoría | Requisito |
|---|---|---|
| RNF-01 | Seguridad | Las contraseñas deben almacenarse cifradas (bcrypt). El backend nunca debe devolver la contraseña en sus respuestas. |
| RNF-02 | Seguridad | Las credenciales de la base de datos deben mantenerse fuera del repositorio (archivo `.env`, incluido en `.gitignore`). Solo la plantilla `.env.example` se versiona. |
| RNF-03 | Seguridad | El backend debe validar los datos de entrada y responder con códigos HTTP correctos (400 para solicitudes inválidas, 404 para recursos inexistentes, 500 para errores internos). |
| RNF-04 | Rendimiento | Las consultas de listados deben ejecutarse sobre la base de datos con índices en las columnas de relación (`id_compania`, `id_usuario`, `id_vehiculo`). |
| RNF-05 | Disponibilidad | El entorno debe levantarse de forma reproducible con `docker compose` (base de datos, API y frontend). |
| RNF-06 | Escalabilidad | Un error 500 no debe exponer detalles internos: la API responde "Error interno del servidor". |
| RNF-07 | Usabilidad | La interfaz debe usar Tailwind CSS con un tema unificado (`theme.jsx`/`themeStyles.js`) y componentes reutilizables (StatusBadge, MetricCard, EmptyState). |
| RNF-08 | Compatibilidad | El frontend debe ser compatible con navegadores modernos (Chrome, Edge, Firefox). |
| RNF-09 | Mantenibilidad | El código debe estar organizado por módulos (rutas por dominio en `backend/src/routes`, páginas y componentes en `src/`), y el modelo de datos debe ser idempotente (`IF NOT EXISTS`). |
| RNF-10 | Integridad | La base de datos debe imponer integridad referencial e índices para evitar datos huérfanos y acelerar las consultas. |

---

## 5. Modelo de datos

Base de datos **PostgreSQL** con siete tablas (ver `backend/schema.sql`):

| Tabla | Columnas principales | Restricciones |
|---|---|---|
| `compania` | `id_compania` (PK), `numero_compania`, `nombre`, `direccion`, `comuna` | `numero_compania` y `nombre` obligatorios |
| `rol` | `id_rol` (PK), `nombre_rol` | `nombre_rol` único |
| `usuario` | `id_usuario` (PK), `rut`, `nombre_completo`, `email`, `password`, `id_rol` (FK), `id_compania` (FK) | `rut` y `email` únicos; FKs `ON DELETE RESTRICT` |
| `vehiculo` | `id_vehiculo` (PK), `nomenclatura`, `patente`, `marca`, `modelo`, `ano_fabricacion`, `estado_vehiculo`, `id_compania` (FK) | `estado_vehiculo` en (`operativo`, `no_operativo`, `en_mantencion`), default `operativo` |
| `tipo_mantencion` | `id_tipo_mantencion` (PK), `nombre`, `descripcion` | — |
| `mantencion` | `id_mantencion` (PK), `fecha_ingreso`, `fecha_salida`, `kilometraje_ingreso`, `detalle_trabajo`, `proveedor`, `costo_total`, `mano_obra`, `estado_mantencion`, `id_vehiculo` (FK), `id_tipo_mantencion` (FK), `id_usuario` (FK) | FKs `ON DELETE RESTRICT`; default `en_proceso` |
| `alerta_recordatorio` | `id_alerta` (PK), `tipo_alerta`, `fecha_programada`, `kilometraje_programado`, `mensaje`, `estado_alerta`, `id_vehiculo` (FK) | FK `ON DELETE CASCADE`; default `pendiente` |

**Diagrama de relaciones**

```
compania 1 ──< usuario N      compania 1 ──< vehiculo N
rol 1 ──< usuario N
vehiculo 1 ──< mantencion N    tipo_mantencion 1 ──< mantencion N
usuario 1 ──< mantencion N
vehiculo 1 ──< alerta_recordatorio N
```

---

## 6. Trazabilidad de requisitos

| Requisito | Frente |
|---|---|
| RF-01 a RF-04 | API `auth.js`, página `Login.jsx`, `store.jsx` (sesión persistente) |
| RF-05 a RF-10 | API `vehiculos.js`, `Dashboard.jsx`, `VehicleDetail.jsx`, `ReportFault.jsx`, `FaultConfirmation.jsx` |
| RF-11 a RF-15 | API `tiposMantencion.js` y `mantenimientos.js`, `RegisterMaintenance.jsx` |
| RF-16 a RF-21 | API `usuarios.js`, `Users.jsx` |
| RF-22 a RF-26 | `permissions.js`, guard en `App.jsx`, `TopNav.jsx`, `BottomNav.jsx`, `VehicleDetail.jsx` |
| RF-27 a RF-30 | `Reports.jsx`, jsPDF |
| RF-31 a RF-33 | API `alertas.js`, página `Alerts.jsx` |
| RF-34 a RF-36 | APIs `companias.js`, `roles.js`, `tiposMantencion.js` |

---

## 7. Verificación y aceptación

El sistema se considerará aceptado cuando se cumpla lo siguiente:

1. Los cuatro roles (bombero, teniente tercero, inspector de material mayor, administrador) autentican correctamente.
2. La navegación y las URL directas respetan la matriz de permisos.
3. El registro de vehículos y mantenciones persiste en la base de datos y refresca las listas.
4. Los reportes de costos se exportan a PDF con el periodo seleccionado.
5. La sesión se mantiene al recargar el navegador.
6. El stack completo se levanta con `docker compose` de forma reproducible.