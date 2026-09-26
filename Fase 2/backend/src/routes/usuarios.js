// ============================================================
// src/routes/usuarios.js
// ============================================================
// CRUD de la tabla "usuario". El password se guarda con hash
// (bcrypt) para no almacenar contraseñas en texto plano.

import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";

const router = Router();

// Selector base y campos legibles.
const SELECT_USUARIO = `
  SELECT u.id_usuario, u.rut, u.nombre_completo, u.email,
         r.id_rol, r.nombre_rol,
         c.id_compania, c.nombre AS nombre_compania
  FROM usuario u
  JOIN rol r      ON r.id_rol = u.id_rol
  JOIN compania c ON c.id_compania = u.id_compania
`;

// ---------- GET /api/usuarios (listar) ----------
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `${SELECT_USUARIO} ORDER BY u.id_usuario`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// ---------- GET /api/usuarios/:id (uno solo) ----------
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `${SELECT_USUARIO} WHERE u.id_usuario = $1`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ---------- POST /api/usuarios (crear) ----------
router.post("/", async (req, res, next) => {
  try {
    const { rut, nombre_completo, email, password, id_rol, id_compania } =
      req.body;

    if (!rut || !nombre_completo || !email || !password || !id_rol || !id_compania) {
      return res.status(400).json({
        error:
          'Se requieren "rut", "nombre_completo", "email", "password", "id_rol" e "id_compania"',
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO usuario (rut, nombre_completo, email, password, id_rol, id_compania)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_usuario, rut, nombre_completo, email, id_rol, id_compania`,
      [rut, nombre_completo, email, hash, id_rol, id_compania]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ error: "RUT o email ya registrado" });
    }
    next(error);
  }
});

// ---------- PUT /api/usuarios/:id (actualizar) ----------
router.put("/:id", async (req, res, next) => {
  try {
    const { rut, nombre_completo, email, password, id_rol, id_compania } =
      req.body;

    if (!rut || !nombre_completo || !email || !id_rol || !id_compania) {
      return res.status(400).json({
        error:
          'Se requieren "rut", "nombre_completo", "email", "id_rol" e "id_compania"',
      });
    }

    // Si viene password, se actualiza; si no, se conserva el actual.
    const params = [rut, nombre_completo, email, id_rol, id_compania, req.params.id];
    let set =
      "rut = $1, nombre_completo = $2, email = $3, id_rol = $4, id_compania = $5";

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      set =
        "rut = $1, nombre_completo = $2, email = $3, password = $4, id_rol = $5, id_compania = $6";
      params.splice(3, 0, hash);
    }

    const { rows } = await pool.query(
      `UPDATE usuario
       SET ${set}
       WHERE id_usuario = $${params.length}
       RETURNING id_usuario, rut, nombre_completo, email, id_rol, id_compania`,
      params
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ error: "RUT o email ya registrado" });
    }
    next(error);
  }
});

// ---------- DELETE /api/usuarios/:id (eliminar) ----------
router.delete("/:id", async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM usuario WHERE id_usuario = $1",
      [req.params.id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;