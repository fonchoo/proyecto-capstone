// ============================================================
// vite.config.js (FRONTEND)
// ============================================================
// Estrategia con Docker (mismo enfoque que el proyecto de
// referencia):
//   - "host: true" -> Vite escucha en 0.0.0.0, necesario cuando
//     corre dentro de un contenedor Docker (puerto 5173 accesible).
//   - "usePolling" -> en Windows/WSL2 los archivos por bind-mount
//     no disparan eventos de filesystem; se activa via la variable
//     VITE_USE_POLLING (la setea docker-compose.override.yml).
//   - Proxy "/api" -> reenvía las peticiones de la API al backend:
//     por defecto http://localhost:3000, o al nombre de servicio del
//     compose con la variable VITE_API_PROXY (la setea el override).

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// A que destino se reenvia el prefijo "/api".
//  - Dev con Docker  -> "http://server:3000" (nombre de servicio).
//  - Dev local (npm) -> "http://localhost:3000" (por defecto).
const apiProxy = process.env.VITE_API_PROXY || "http://localhost:3000";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // En Windows/WSL2 los bind-mounts no disparan eventos de
    // archivos: polling para que el HMR funcione dentro de Docker.
    watch: {
      usePolling: process.env.VITE_USE_POLLING === "true",
    },
    // El prefijo "/api" NUNCA debe colisionar con rutas del frontend.
    proxy: {
      "/api": apiProxy,
    },
  },
});