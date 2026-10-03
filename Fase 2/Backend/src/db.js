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

const { Pool, types } = pg;

// Columnas DATE (fecha_ingreso, fecha_salida, fecha_programada) como
// texto "YYYY-MM-DD". Por defecto pg las convierte en objetos Date a
// medianoche y el JSON sale con hora y zona ("2026-09-10T00:00:00.000Z"),
// lo que además puede correr la fecha un día en el navegador (Chile está
// detrás de UTC). Una fecha sin hora debe viajar sin hora. 1082 = DATE.
types.setTypeParser(1082, (valor) => valor);

export const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});