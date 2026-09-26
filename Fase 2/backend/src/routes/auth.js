// ============================================================
// src/routes/auth.js
// ============================================================
// Autenticación: valida credenciales contra la tabla "usuario" y
// devuelve los datos del usuario autenticado (con su rol).

import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";

const router = Router();

// ---------- POST /api/auth/login ----------
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: 'Se requieren "email" y "password"' });
    }

    const { rows } = await pool.query(
      `SELECT u.id_usuario, u.rut, u.nombre_completo, u.email, u.password,
              r.id_rol, r.nombre_rol, c.id_compania, c.nombre AS nombre_compania
       FROM usuario u
       JOIN rol r      ON r.id_rol = u.id_rol
       JOIN compania c ON c.id_compania = u.id_compania
       WHERE u.email = $1`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const { password: _omit, ...user } = rows[0];
    res.json(user);
  } catch (error) {
    next(error);
  }
});

export default router;