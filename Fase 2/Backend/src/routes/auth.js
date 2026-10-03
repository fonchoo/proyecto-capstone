// ============================================================
// src/routes/auth.js
// ============================================================
// Autenticación: valida credenciales contra la tabla "usuario",
// abre la sesión (cookie con JWT, ver src/auth.js) y devuelve los
// datos del usuario autenticado (con su rol y compañía).

import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import {
  SELECT_USUARIO_SESION,
  cerrarSesion,
  iniciarSesion,
  requireAuth,
} from "../auth.js";

const router = Router();

// Hash bcrypt de relleno: si el email no existe se compara igual
// contra este, para que la respuesta tarde lo mismo y no delate qué
// emails están registrados.
const HASH_RELLENO =
  "$2a$12$NhfoUkbg4sc04kf5UKO23uFXo7vSYEysSzM7qcwU/MtwoTEI5U4P2";

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
      "SELECT id_usuario, password FROM usuario WHERE email = $1",
      [email]
    );

    const valid = await bcrypt.compare(
      password,
      rows.length ? rows[0].password : HASH_RELLENO
    );
    if (rows.length === 0 || !valid) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const { rows: sesion } = await pool.query(
      `${SELECT_USUARIO_SESION} WHERE u.id_usuario = $1`,
      [rows[0].id_usuario]
    );

    iniciarSesion(res, rows[0].id_usuario);
    res.json(sesion[0]);
  } catch (error) {
    next(error);
  }
});

// ---------- POST /api/auth/logout ----------
router.post("/logout", (req, res) => {
  cerrarSesion(res);
  res.status(204).end();
});

// ---------- GET /api/auth/me (usuario de la sesión actual) ----------
// El front lo llama al cargar para saber si sigue habiendo sesión.
router.get("/me", requireAuth, (req, res) => {
  res.json(req.usuario);
});

export default router;
