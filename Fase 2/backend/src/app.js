// ============================================================
// src/app.js
// ============================================================
// Configura la aplicación Express: middlewares, monta las rutas de
// la API y define el manejador central de errores.

import express from "express";
import authRouter from "./routes/auth.js";
import companiasRouter from "./routes/companias.js";
import rolesRouter from "./routes/roles.js";
import usuariosRouter from "./routes/usuarios.js";
import vehiculosRouter from "./routes/vehiculos.js";
import tiposMantencionRouter from "./routes/tiposMantencion.js";
import mantenimientosRouter from "./routes/mantenimientos.js";
import alertasRouter from "./routes/alertas.js";

const app = express();

app.use(express.json());

// Rutas de la API (prefijo /api para no chocar con el frontend).
app.use("/api/auth", authRouter);
app.use("/api/companias", companiasRouter);
app.use("/api/roles", rolesRouter);
app.use("/api/usuarios", usuariosRouter);
app.use("/api/vehiculos", vehiculosRouter);
app.use("/api/tipos-mantencion", tiposMantencionRouter);
app.use("/api/mantenimientos", mantenimientosRouter);
app.use("/api/alertas", alertasRouter);

// 404 para rutas no definidas.
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// ------------------------------------------------------------
// Manejador CENTRAL de errores
// ------------------------------------------------------------
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  if (status >= 500) console.error(err);

  res.status(status).json({
    error:
      status >= 500
        ? "Error interno del servidor"
        : "Solicitud inválida",
  });
});

export default app;