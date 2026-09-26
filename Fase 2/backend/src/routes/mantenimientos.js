// ============================================================
// src/routes/mantenimientos.js
// ============================================================
// CRUD de la tabla "mantencion". Incluye los datos legibles del
// vehículo, del tipo de mantención y del usuario responsable.

import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

const SELECT_MANTENCION = `
  SELECT m.id_mantencion, m.fecha_ingreso, m.fecha_salida,
         m.kilometraje_ingreso, m.detalle_trabajo, m.proveedor,
         m.costo_total, m.mano_obra, m.estado_mantencion,
         v.id_vehiculo, v.nomenclatura, v.patente,
         tm.id_tipo_mantencion, tm.nombre AS tipo_mantencion_nombre,
         u.id_usuario, u.nombre_completo AS usuario_nombre
  FROM mantencion m
  JOIN vehiculo v          ON v.id_vehiculo = m.id_vehiculo
  JOIN tipo_mantencion tm  ON tm.id_tipo_mantencion = m.id_tipo_mantencion
  JOIN usuario u           ON u.id_usuario = m.id_usuario
`;

// ---------- GET /api/mantenimientos (listar) ----------
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `${SELECT_MANTENCION} ORDER BY m.fecha_ingreso DESC`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// ---------- GET /api/mantenimientos/:id (uno solo) ----------
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `${SELECT_MANTENCION} WHERE m.id_mantencion = $1`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Mantención no encontrada" });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ---------- POST /api/mantenimientos (crear) ----------
router.post("/", async (req, res, next) => {
  try {
    const {
      fecha_ingreso,
      fecha_salida,
      kilometraje_ingreso,
      detalle_trabajo,
      proveedor,
      costo_total,
      mano_obra,
      estado_mantencion,
      id_vehiculo,
      id_tipo_mantencion,
      id_usuario,
    } = req.body;

    if (!fecha_ingreso || !id_vehiculo || !id_tipo_mantencion || !id_usuario) {
      return res.status(400).json({
        error:
          'Se requieren "fecha_ingreso", "id_vehiculo", "id_tipo_mantencion" e "id_usuario"',
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO mantencion
         (fecha_ingreso, fecha_salida, kilometraje_ingreso, detalle_trabajo,
          proveedor, costo_total, mano_obra, estado_mantencion, id_vehiculo,
          id_tipo_mantencion, id_usuario)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        fecha_ingreso,
        fecha_salida || null,
        kilometraje_ingreso || null,
        detalle_trabajo || null,
        proveedor || null,
        costo_total || null,
        mano_obra || null,
        estado_mantencion || "en_proceso",
        id_vehiculo,
        id_tipo_mantencion,
        id_usuario,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ---------- PUT /api/mantenimientos/:id (actualizar) ----------
router.put("/:id", async (req, res, next) => {
  try {
    const {
      fecha_ingreso,
      fecha_salida,
      kilometraje_ingreso,
      detalle_trabajo,
      proveedor,
      costo_total,
      mano_obra,
      estado_mantencion,
      id_vehiculo,
      id_tipo_mantencion,
      id_usuario,
    } = req.body;

    if (!fecha_ingreso || !id_vehiculo || !id_tipo_mantencion || !id_usuario) {
      return res.status(400).json({
        error:
          'Se requieren "fecha_ingreso", "id_vehiculo", "id_tipo_mantencion" e "id_usuario"',
      });
    }

    const { rows } = await pool.query(
      `UPDATE mantencion
       SET fecha_ingreso = $1, fecha_salida = $2, kilometraje_ingreso = $3,
           detalle_trabajo = $4, proveedor = $5, costo_total = $6,
           mano_obra = $7, estado_mantencion = $8, id_vehiculo = $9,
           id_tipo_mantencion = $10, id_usuario = $11
       WHERE id_mantencion = $12 RETURNING *`,
      [
        fecha_ingreso,
        fecha_salida || null,
        kilometraje_ingreso || null,
        detalle_trabajo || null,
        proveedor || null,
        costo_total || null,
        mano_obra || null,
        estado_mantencion || "en_proceso",
        id_vehiculo,
        id_tipo_mantencion,
        id_usuario,
        req.params.id,
      ]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Mantención no encontrada" });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ---------- DELETE /api/mantenimientos/:id (eliminar) ----------
router.delete("/:id", async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM mantencion WHERE id_mantencion = $1",
      [req.params.id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: "Mantención no encontrada" });
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;