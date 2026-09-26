// ============================================================
// src/routes/alertas.js
// ============================================================
// CRUD de la tabla "alerta_recordatorio" (con datos del vehículo).

import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

const SELECT_ALERTA = `
  SELECT a.id_alerta, a.tipo_alerta, a.fecha_programada,
         a.kilometraje_programado, a.mensaje, a.estado_alerta,
         v.id_vehiculo, v.nomenclatura, v.patente
  FROM alerta_recordatorio a
  JOIN vehiculo v ON v.id_vehiculo = a.id_vehiculo
`;

// ---------- GET /api/alertas (listar) ----------
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `${SELECT_ALERTA} ORDER BY a.fecha_programada DESC`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// ---------- GET /api/alertas/:id (uno solo) ----------
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `${SELECT_ALERTA} WHERE a.id_alerta = $1`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Alerta no encontrada" });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ---------- POST /api/alertas (crear) ----------
router.post("/", async (req, res, next) => {
  try {
    const {
      tipo_alerta,
      fecha_programada,
      kilometraje_programado,
      mensaje,
      estado_alerta,
      id_vehiculo,
    } = req.body;

    if (!tipo_alerta || !fecha_programada || !id_vehiculo) {
      return res.status(400).json({
        error:
          'Se requieren "tipo_alerta", "fecha_programada" e "id_vehiculo"',
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO alerta_recordatorio
         (tipo_alerta, fecha_programada, kilometraje_programado, mensaje, estado_alerta, id_vehiculo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        tipo_alerta,
        fecha_programada,
        kilometraje_programado || null,
        mensaje || null,
        estado_alerta || "pendiente",
        id_vehiculo,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ---------- PUT /api/alertas/:id (actualizar) ----------
router.put("/:id", async (req, res, next) => {
  try {
    const {
      tipo_alerta,
      fecha_programada,
      kilometraje_programado,
      mensaje,
      estado_alerta,
      id_vehiculo,
    } = req.body;

    if (!tipo_alerta || !fecha_programada || !id_vehiculo) {
      return res.status(400).json({
        error:
          'Se requieren "tipo_alerta", "fecha_programada" e "id_vehiculo"',
      });
    }

    const { rows } = await pool.query(
      `UPDATE alerta_recordatorio
       SET tipo_alerta = $1, fecha_programada = $2, kilometraje_programado = $3,
           mensaje = $4, estado_alerta = $5, id_vehiculo = $6
       WHERE id_alerta = $7 RETURNING *`,
      [
        tipo_alerta,
        fecha_programada,
        kilometraje_programado || null,
        mensaje || null,
        estado_alerta || "pendiente",
        id_vehiculo,
        req.params.id,
      ]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Alerta no encontrada" });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ---------- DELETE /api/alertas/:id (eliminar) ----------
router.delete("/:id", async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM alerta_recordatorio WHERE id_alerta = $1",
      [req.params.id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: "Alerta no encontrada" });
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;