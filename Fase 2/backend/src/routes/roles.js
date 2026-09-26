// ============================================================
// src/routes/roles.js
// ============================================================
// Listado de la tabla "rol" (solo lectura: los roles son fijos).

import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// ---------- GET /api/roles (listar) ----------
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id_rol, nombre_rol FROM rol ORDER BY id_rol"
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

export default router;