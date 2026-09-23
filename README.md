# SIGMAVE — Sistema de Gestión de Mantenimiento de Vehículos

Proyecto Capstone del ramo **APT122** que consiste en una plataforma web para la gestión y seguimiento del mantenimiento de flotas de vehículos.

## 📋 Descripción

SIGMAVE permite registrar vehículos, reportar fallas, programar mantenciones y visualizar métricas del estado de la flota, con distintos niveles de acceso según el rol del usuario.

## 📁 Estructura del repositorio

proyecto-capstone/
├── frontend/ # Aplicación cliente (React + Vite + Tailwind CSS)
├── backend/ # API servidor (Node.js + Express + PostgreSQL)
└── docs/ # Documentación y evidencias académicas
└── Fase 1/ # Entregables de la primera fase del proyecto


## 🚀 Tecnologías

### Frontend
- **React 18** — Librería de UI
- **Vite** — Bundler y dev server
- **Tailwind CSS** — Estilos
- **React Router** — Navegación

### Backend
- **Node.js** — Entorno de ejecución
- **Express** — Framework para API REST
- **PostgreSQL** — Base de datos relacional
- **Prisma** — ORM para acceso a datos _(a definir)_


## ⚙️ Instalación y ejecución

### Requisitos previos
- Node.js 18 o superior
- npm (incluido con Node.js)
- PostgreSQL 14 o superior

### Frontend

```bash
cd frontend
npm install
npm run dev
```
La aplicación estará disponible en http://localhost:5173 (puerto por defecto de Vite).


### Backend

cd backend
npm install
# Configurar variables de entorno (.env)
npm run dev

El servidor estará disponible en http://localhost:3000 (o el puerto configurado).


### Base de datos

# Crear la base de datos en PostgreSQL
createdb sigmave_db

👥 Equipo
Nombre	                Rol
Enzo Toledo	            Desarrollador back-end
Patricio Finschi	      Desarrollador Front-end
Ramón Ortiz	            Scrum Master

📚 Documentación
Las evidencias y entregables académicos se encuentran en la carpeta docs/.


📄 Licencia
Proyecto académico — uso educativo.


}
