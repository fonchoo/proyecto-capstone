# SIGMAVE — Sistema de Gestión de Mantenimiento de Vehículos

Proyecto Capstone del ramo **APT122** que consiste en una plataforma web para la gestión y seguimiento del mantenimiento de flotas de vehículos.

## 📋 Descripción

SIGMAVE permite registrar vehículos, reportar fallas, programar mantenciones y visualizar métricas del estado de la flota, con distintos niveles de acceso según el rol del usuario.


## 📁 Estructura del repositorio

```
proyecto-capstone/
├── Fase 1/                       # Entregables de la primera fase del proyecto
└── Fase 2/
    ├── Evidencias/               # Evidencias académicas (grupales, individuales) y docs (ERS)
    ├── Front/                    # Aplicación cliente (React + Vite + Tailwind CSS)
    │   ├── docker-compose.yml          # Producción: nginx (perfil "prod", puerto 8080)
    │   ├── docker-compose.override.yml # Desarrollo: Vite con HMR (puerto 5173)
    │   ├── Dockerfile / Dockerfile.dev
    │   └── nginx.conf
    └── Backend/                  # API servidor (Node.js + Express + PostgreSQL/Supabase)
        ├── supabase/
        │   ├── config.toml             # Supabase local (project_id "sigmave", puertos 553xx)
        │   ├── migrations/             # Esquema de la base (una migración por cambio)
        │   └── seed.sql                # Datos iniciales
        ├── docker-compose.yml          # Producción: API (puerto 3000)
        ├── docker-compose.override.yml # Desarrollo: nodemon + bind-mount
        ├── Dockerfile / Dockerfile.dev
        └── .env.example                # Plantilla del .env
```


## 🚀 Tecnologías

### Frontend
- **React 18** — Librería de UI
- **Vite** — Bundler y dev server
- **Tailwind CSS** — Estilos
- **React Router** — Navegación

### Backend
- **Node.js** — Entorno de ejecución
- **Express** — Framework para API REST
- **PostgreSQL (Supabase)** — Base de datos relacional; en local con Supabase CLI
- **Prisma** — ORM para acceso a datos _(a definir)_


## ⚙️ Instalación y ejecución

### Requisitos previos
- Node.js 22 (o 20.19+)
- Docker Desktop corriendo (lo usa Supabase CLI para la base local)

> **Siempre `npm ci`, nunca `npm install`**: instala exactamente las
> versiones del `package-lock.json`. En PowerShell usar `npm.cmd` / `npx.cmd`.

### 1. Base de datos (Supabase local)

La base es **Supabase**, y en local la levanta su CLI (viene como
dependencia de desarrollo del Backend). **Correr desde `Backend/`**: ahí vive
`supabase/config.toml`.

```bash
cd Backend
npm ci
npx supabase start     # la primera vez tarda (descarga imágenes)
npx supabase status    # muestra URLs y credenciales
```

`supabase start` aplica las migraciones de `supabase/migrations/` y después
`supabase/seed.sql` (roles, compañía, tipos de mantención y dos administradores
de prueba: `administrador@gmail.com` y `admin@admin.cl`, ambos con clave `admin1234`).

> `usuario.password` **siempre es un hash bcrypt** (la base rechaza texto plano).
> Desde Studio/SQL: `extensions.crypt('mi_clave', extensions.gen_salt('bf', 12))`.

| Servicio | URL |
|---|---|
| Postgres | `postgresql://postgres:postgres@127.0.0.1:55322/postgres` |
| Studio (ver/editar tablas) | http://127.0.0.1:55323 |

Los puertos están en el rango **553xx** (no el 543xx por defecto) para no
chocar con otros proyectos Supabase levantados en la misma máquina.

Comandos útiles (siempre desde `Backend/`):

```bash
npx supabase stop                      # apaga (los datos se conservan)
npx supabase db reset                  # borra todo y reaplica migraciones + seed
npx supabase migration new <nombre>    # crea una migración nueva para cambiar el esquema
```

> Para cambiar tablas **no edites una migración ya aplicada**: creá una nueva
> con `migration new` y aplicala con `db reset`.

### 2. Backend

```bash
cd Backend
cp .env.example .env    # ya trae los valores de Supabase local
# Generar JWT_SECRET (obligatorio, la API no arranca sin él) y pegarlo en .env:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
npm run dev
```

La API queda en http://localhost:3000.

### 3. Frontend

```bash
cd Front
npm ci
npm run dev
```

La aplicación queda en http://localhost:5173 (Vite reenvía `/api` a `localhost:3000`).

### Alternativa: todo en Docker

Front y Backend son **stacks de Compose separados**, cada uno con su
`docker-compose.yml` (producción) y su `docker-compose.override.yml`
(desarrollo, se carga solo con `docker compose up`). La base **no** está en
ningún compose: la levanta Supabase CLI. Los contenedores se alcanzan por el
host (`host.docker.internal`), así que el orden es **Supabase → Backend → Front**.

```bash
# 1) Base
cd Backend
npx supabase start

# 2) API con nodemon (el .env de Backend/ sigue siendo necesario)
docker compose up -d --build

# 3) Front: Vite con HMR -> http://localhost:5173
cd ../Front
docker compose up -d --build
```

Producción (sin override):

```bash
cd Backend
docker compose -f docker-compose.yml up -d --build
cd ../Front
docker compose -f docker-compose.yml --profile prod up -d --build   # -> http://localhost:8080
```

## 🔐 Sesión, roles y compañías

- **Sesión:** el login entrega un JWT en una cookie `httpOnly` (8 h). Toda la API
  bajo `/api` exige sesión, salvo `POST /api/auth/login`. Ver `Backend/src/auth.js`.
- **Roles:** la API valida los permisos de cada rol (no solo el front):
  gestión de usuarios y compañías solo `administrador`; registrar mantenciones
  `teniente_tercero`, `inspector_material_mayor` y `administrador`.
- **Compañías:** cada usuario ve solo los datos de su compañía. El
  `administrador` ve todas y elige cuál revisar con el selector del menú
  superior. La regla vive en una sola función (`Backend/src/alcance.js`),
  pensada para sumar más adelante administradores de Cuerpo o región.

> Al cambiar dependencias del Backend con Docker, recrear el contenedor con
> `docker compose up -d --build --renew-anon-volumes` (si no, el volumen de
> `node_modules` conserva las dependencias viejas).

## 👥 Equipo

| Nombre | Rol |
|---|---|
| Enzo Toledo | Backend Developer |
| Patricio Finschi | Frontend Developer |
| Ramón Ortiz | SCRUM Master y Documentacion |

📚 Documentación
Las evidencias y entregables académicos se encuentran en la carpeta Evidencias/.


📄 Licencia
Proyecto académico — uso educativo.
