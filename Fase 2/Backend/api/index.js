// ============================================================
// api/index.js
// ============================================================
// Punto de entrada de la API en Vercel (ver PLAN_DESPLIEGUE.md). En
// local y en Docker se usa src/index.js, que hace app.listen(); en
// Vercel no se escucha un puerto: la plataforma invoca la app Express
// como una función por cada petición.
//
// Se publica con la CLI de Vercel desde Backend/ (ver .vercelignore):
// con la integración de Git, Vercel nombra la función con su ruta en
// el repositorio ("Fase 2/Backend/api/index.js") y rechaza el espacio.
// Subida desde esta carpeta, la función queda como "api/index.js". El
// rewrite de vercel.json manda todas las rutas acá, y Express recibe
// la URL original (/api/auth/login, /api/vehiculos, ...).

import app from "../src/app.js";

export default app;
