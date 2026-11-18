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

// Publicación (Vercel + Supabase en la nube, ver PLAN_DESPLIEGUE.md):
// - PGSSL=true: Supabase en la nube exige conexión cifrada. Se acepta
//   su certificado sin validar la cadena (rejectUnauthorized: false)
//   para no tener que distribuir el CA; el tráfico igual va cifrado.
//   En local (Supabase CLI) no se define y la conexión va sin SSL.
// - PGPOOL_MAX: en serverless cada instancia de la función abre su
//   propio pool, así que en Vercel se usa un tope bajo (p. ej. 3) para
//   no agotar las conexiones del pooler. Sin definir, el default de pg.
export const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined,
  max: Number(process.env.PGPOOL_MAX) || 10,
});

// Si Postgres se reinicia (p. ej. "supabase db reset") o corta una
// conexión INACTIVA del pool, "pg" emite "error" en el pool. Sin este
// listener Node lo trata como no manejado y la API entera se cae. Con
// él, el pool descarta esa conexión y abre otra en la próxima consulta.
pool.on("error", (error) => {
  console.error("Se perdió una conexión inactiva con Postgres:", error.message);
});