// ============================================================
// src/routes/vehiculos.js
// ============================================================
// CRUD de la tabla "vehiculo" (con nombre de compañía incluido).

import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

const SELECT_VEHICULO = `
  SELECT v.id_vehiculo, v.nomenclatura, v.patente, v.marca, v.modelo,
         v.ano_fabricacion, v.estado_vehiculo,
         c.id_compania, c.nombre AS nombre_compania
  FROM vehiculo v
  JOIN compania c ON c.id_compania = v.id_compania
`;

// ---------- GET /api/vehiculos (listar) ----------
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `${SELECT_VEHICULO} ORDER BY v.id_vehiculo`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// ---------- GET /api/vehiculos/:id (uno solo) ----------
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `${SELECT_VEHICULO} WHERE v.id_vehiculo = $1`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Vehículo no encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ---------- POST /api/vehiculos (crear) ----------
router.post("/", async (req, res, next) => {
  try {
    const {
      nomenclatura,
      patente,
      marca,
      modelo,
      ano_fabricacion,
      estado_vehiculo,
      id_compania,
    } = req.body;

    if (!nomenclatura || !id_compania) {
      return res.status(400).json({
        error: 'Se requieren "nomenclatura" (texto) e "id_compania" (número)',
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO vehiculo
         (nomenclatura, patente, marca, modelo, ano_fabricacion, estado_vehiculo, id_compania)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        nomenclatura,
        patente || null,
        marca || null,
        modelo || null,
        ano_fabricacion || null,
        estado_vehiculo || "operativo",
        id_compania,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ---------- PUT /api/vehiculos/:id (actualizar) ----------
router.put("/:id", async (req, res, next) => {
  try {
    const {
      nomenclatura,
      patente,
      marca,
      modelo,
      ano_fabricacion,
      estado_vehiculo,
      id_compania,
    } = req.body;

    if (!nomenclatura || !id_compania) {
      return res.status(400).json({
        error: 'Se requieren "nomenclatura" (texto) e "id_compania" (número)',
      });
    }

    const { rows } = await pool.query(
      `UPDATE vehiculo
       SET nomenclatura = $1, patente = $2, marca = $3, modelo = $4,
           ano_fabricacion = $5, estado_vehiculo = $6, id_compania = $7
       WHERE id_vehiculo = $8 RETURNING *`,
      [
        nomenclatura,
        patente || null,
        marca || null,
        modelo || null,
        ano_fabricacion || null,
        estado_vehiculo || "operativo",
        id_compania,
        req.params.id,
      ]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Vehículo no encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ---------- DELETE /api/vehiculos/:id (eliminar) ----------
router.delete("/:id", async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM vehiculo WHERE id_vehiculo = $1",
      [req.params.id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: "Vehículo no encontrado" });
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;