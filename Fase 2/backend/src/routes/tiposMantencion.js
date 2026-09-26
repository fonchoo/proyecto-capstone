// ============================================================
// src/routes/tiposMantencion.js
// ============================================================
// CRUD de la tabla "tipo_mantencion".

import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// ---------- GET /api/tipos-mantencion (listar) ----------
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id_tipo_mantencion, nombre, descripcion FROM tipo_mantencion ORDER BY id_tipo_mantencion"
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// ---------- GET /api/tipos-mantencion/:id (uno solo) ----------
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id_tipo_mantencion, nombre, descripcion FROM tipo_mantencion WHERE id_tipo_mantencion = $1",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Tipo de mantención no encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ---------- POST /api/tipos-mantencion (crear) ----------
router.post("/", async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({
        error: 'Se requiere "nombre" (texto)',
      });
    }

    const { rows } = await pool.query(
      "INSERT INTO tipo_mantencion (nombre, descripcion) VALUES ($1, $2) RETURNING *",
      [nombre, descripcion || null]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ---------- PUT /api/tipos-mantencion/:id (actualizar) ----------
router.put("/:id", async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({
        error: 'Se requiere "nombre" (texto)',
      });
    }

    const { rows } = await pool.query(
      "UPDATE tipo_mantencion SET nombre = $1, descripcion = $2 WHERE id_tipo_mantencion = $3 RETURNING *",
      [nombre, descripcion || null, req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Tipo de mantención no encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ---------- DELETE /api/tipos-mantencion/:id (eliminar) ----------
router.delete("/:id", async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM tipo_mantencion WHERE id_tipo_mantencion = $1",
      [req.params.id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: "Tipo de mantención no encontrado" });
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;