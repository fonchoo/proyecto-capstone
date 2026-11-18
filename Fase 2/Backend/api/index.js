// ============================================================
// api/index.js
// ============================================================
// Punto de entrada de la API en Vercel (ver PLAN_DESPLIEGUE.md). En
// local y en Docker se usa src/index.js, que hace app.listen(); en
// Vercel no se escucha un puerto: la plataforma invoca la app Express
// como una función por cada petición.
//
// Por qué una carpeta api/ y no el preset "Express" de Vercel: ese
// preset nombra la función con su ruta dentro del repositorio
// ("Fase 2/Backend/src/app.js"), y Vercel rechaza nombres con espacios.
// Las funciones de api/ se nombran relativas a la raíz del proyecto
// (Backend/), así que quedan como "api/index.js". El rewrite de
// vercel.json manda todas las rutas acá, y Express recibe la URL
// original (/api/auth/login, /api/vehiculos, ...).

import app from "../src/app.js";

export default app;
