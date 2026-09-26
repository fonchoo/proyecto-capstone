// ============================================================
// src/db.js
// ============================================================
// Configuración de la conexión a PostgreSQL usando el paquete "pg".
// Se usa un Pool de conexiones reutilizables (recomendado para
// servidores con muchas peticiones).
//
// "dotenv" lee el archivo .env (que NO se sube a git) y carga las
// variables en process.env, para no hardcodear credenciales.

import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});