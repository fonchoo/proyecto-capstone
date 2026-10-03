// ============================================================
// src/routes/fallas.js
// ============================================================
// Reportes de falla (tabla "reporte_falla"), con datos legibles del
// vehículo y de quién reportó.
//
// Alcance (src/alcance.js): un reporte pertenece a la compañía de su
// VEHÍCULO. Cada usuario solo ve y reporta fallas de vehículos de su
// alcance.
//
// Reportar: CUALQUIER rol (ERS: "Reportar falla" para todos). Quién
// reporta (id_usuario) es SIEMPRE el usuario de la sesión.

import { Router } from "express";
import { pool } from "../db.js";
import { companiasVisibles, filtroCompanias, puedeUsarVehiculo } from "../alcance.js";

const router = Router();

const URGENCIAS = ["alta", "media", "baja"];
const MAX_DESCRIPCION = 2000;

const SELECT_FALLA = `
  SELECT r.id_reporte_falla, r.fecha_reporte, r.urgencia, r.descripcion,
         r.estado_reporte,
         v.id_vehiculo, v.nomenclatura, v.patente, v.id_compania,
         u.id_usuario, u.nombre_completo AS usuario_nombre
  FROM reporte_falla r
  JOIN vehiculo v ON v.id_vehiculo = r.id_vehiculo
  JOIN usuario u  ON u.id_usuario = r.id_usuario
`;

const NO_ENCONTRADO = { error: "Reporte de falla no encontrado" };
const VEHICULO_NO_ENCONTRADO = { error: "Vehículo no encontrado" };

// ---------- GET /api/fallas (listar) ----------
// ?id_vehiculo=N -> historial de un vehículo (detalle del vehículo).
// ?id_compania=N -> filtra por compañía (selector del administrador).
router.get("/", async (req, res, next) => {
  try {
    const idVehiculo = req.query.id_vehiculo ? Number(req.query.id_vehiculo) : null;
    if (idVehiculo !== null && !Number.isInteger(idVehiculo)) {
      return res.status(400).json({ error: '"id_vehiculo" debe ser un número' });
    }

    const { rows } = await pool.query(
      `${SELECT_FALLA}
       WHERE ($1::int[] IS NULL OR v.id_compania = ANY($1))
         AND ($2::int IS NULL OR r.id_vehiculo = $2)
       ORDER BY r.fecha_reporte DESC`,
      [filtroCompanias(req), idVehiculo]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// ---------- GET /api/fallas/:id (uno solo) ----------
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `${SELECT_FALLA}
       WHERE r.id_reporte_falla = $1
         AND ($2::int[] IS NULL OR v.id_compania = ANY($2))`,
      [req.params.id, companiasVisibles(req.usuario)]
    );
    if (rows.length === 0) {
      return res.status(404).json(NO_ENCONTRADO);
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ---------- POST /api/fallas (reportar) ----------
// Guarda el reporte Y deja el vehículo "no_operativo", en una sola
// transacción: o quedan las dos cosas, o ninguna.
router.post("/", async (req, res, next) => {
  const { id_vehiculo, urgencia } = req.body;
  const descripcion =
    typeof req.body.descripcion === "string" ? req.body.descripcion.trim() : "";

  if (!id_vehiculo || !urgencia || !descripcion) {
    return res.status(400).json({
      error: 'Se requieren "id_vehiculo", "urgencia" y "descripcion"',
    });
  }
  if (!URGENCIAS.includes(urgencia)) {
    return res
      .status(400)
      .json({ error: '"urgencia" debe ser "alta", "media" o "baja"' });
  }
  if (descripcion.length > MAX_DESCRIPCION) {
    return res.status(400).json({
      error: `La descripción no puede superar los ${MAX_DESCRIPCION} caracteres`,
    });
  }

  let client;
  try {
    if (!(await puedeUsarVehiculo(req.usuario, id_vehiculo))) {
      return res.status(404).json(VEHICULO_NO_ENCONTRADO);
    }

    client = await pool.connect();
    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO reporte_falla (urgencia, descripcion, id_vehiculo, id_usuario)
       VALUES ($1, $2, $3, $4)
       RETURNING id_reporte_falla`,
      [urgencia, descripcion, id_vehiculo, req.usuario.id_usuario]
    );
    await client.query(
      "UPDATE vehiculo SET estado_vehiculo = 'no_operativo' WHERE id_vehiculo = $1",
      [id_vehiculo]
    );

    await client.query("COMMIT");

    // Respuesta con los datos legibles (vehículo y quién reportó).
    const { rows: creado } = await pool.query(
      `${SELECT_FALLA} WHERE r.id_reporte_falla = $1`,
      [rows[0].id_reporte_falla]
    );
    res.status(201).json(creado[0]);
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    next(error);
  } finally {
    if (client) client.release();
  }
});

export default router;
