// ============================================================
// src/routes/companias.js
// ============================================================
// CRUD de la tabla "compania".

import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// ---------- GET /api/companias (listar) ----------
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id_compania, numero_compania, nombre, direccion, comuna FROM compania ORDER BY id_compania"
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// ---------- GET /api/companias/:id (uno solo) ----------
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id_compania, numero_compania, nombre, direccion, comuna FROM compania WHERE id_compania = $1",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Compañía no encontrada" });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ---------- POST /api/companias (crear) ----------
router.post("/", async (req, res, next) => {
  try {
    const { numero_compania, nombre, direccion, comuna } = req.body;

    if (!numero_compania || !nombre) {
      return res.status(400).json({
        error: 'Se requieren "numero_compania" (número) y "nombre" (texto)',
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO compania (numero_compania, nombre, direccion, comuna)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [numero_compania, nombre, direccion || null, comuna || null]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ---------- PUT /api/companias/:id (actualizar) ----------
router.put("/:id", async (req, res, next) => {
  try {
    const { numero_compania, nombre, direccion, comuna } = req.body;

    if (!numero_compania || !nombre) {
      return res.status(400).json({
        error: 'Se requieren "numero_compania" (número) y "nombre" (texto)',
      });
    }

    const { rows } = await pool.query(
      `UPDATE compania
       SET numero_compania = $1, nombre = $2, direccion = $3, comuna = $4
       WHERE id_compania = $5 RETURNING *`,
      [numero_compania, nombre, direccion || null, comuna || null, req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Compañía no encontrada" });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ---------- DELETE /api/companias/:id (eliminar) ----------
router.delete("/:id", async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM compania WHERE id_compania = $1",
      [req.params.id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: "Compañía no encontrada" });
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;