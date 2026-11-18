// ============================================================
// src/routes/auth.js
// ============================================================
// Autenticación: valida credenciales contra la tabla "usuario",
// abre la sesión (cookie con JWT, ver src/auth.js) y devuelve los
// datos del usuario autenticado (con su rol y compañía).
//
// Límite de intentos: 5 contraseñas incorrectas seguidas para un mismo
// correo lo bloquean 15 minutos (tabla intento_login, ver su
// migración). Los fallos se cuentan aunque el correo no exista, así la
// respuesta no delata qué correos están registrados.

import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import {
  SELECT_USUARIO_SESION,
  cerrarSesion,
  iniciarSesion,
  requireAuth,
} from "../auth.js";
import { esEmail, normalizarEmail } from "../validaciones.js";

const router = Router();

// Hash bcrypt de relleno: si el email no existe se compara igual
// contra este, para que la respuesta tarde lo mismo y no delate qué
// emails están registrados.
const HASH_RELLENO =
  "$2a$12$NhfoUkbg4sc04kf5UKO23uFXo7vSYEysSzM7qcwU/MtwoTEI5U4P2";

const MAX_INTENTOS = 5;
const MINUTOS_BLOQUEO = 15;

const bloqueado = (minutos) => ({
  error: `Demasiados intentos fallidos. Vuelve a intentarlo en ${minutos} ${
    minutos === 1 ? "minuto" : "minutos"
  }.`,
});

// Minutos que le quedan al bloqueo del correo, o 0 si no está bloqueado.
async function minutosBloqueo(email) {
  const { rows } = await pool.query(
    `SELECT CEIL(EXTRACT(EPOCH FROM (bloqueado_hasta - now())) / 60)::int AS minutos
     FROM intento_login
     WHERE email = $1 AND bloqueado_hasta > now()`,
    [email]
  );
  return rows[0]?.minutos ?? 0;
}

// Suma un fallo y devuelve true si con este el correo quedó bloqueado.
// La cuenta parte de nuevo si el último fallo fue hace más de 15
// minutos o si venía de un bloqueo ya vencido: son "fallos seguidos".
async function registrarFallo(email) {
  const { rows } = await pool.query(
    `INSERT INTO intento_login AS i (email, fallidos, ultimo_fallo)
     VALUES ($1, 1, now())
     ON CONFLICT (email) DO UPDATE SET
       fallidos = CASE
         WHEN i.bloqueado_hasta IS NOT NULL
           OR i.ultimo_fallo < now() - make_interval(mins => $2)
         THEN 1
         ELSE i.fallidos + 1
       END,
       ultimo_fallo = now(),
       bloqueado_hasta = NULL
     RETURNING fallidos`,
    [email, MINUTOS_BLOQUEO]
  );
  if (rows[0].fallidos < MAX_INTENTOS) return false;
  await pool.query(
    `UPDATE intento_login
     SET bloqueado_hasta = now() + make_interval(mins => $2)
     WHERE email = $1`,
    [email, MINUTOS_BLOQUEO]
  );
  return true;
}

// ---------- POST /api/auth/login ----------
router.post("/login", async (req, res, next) => {
  try {
    const email = normalizarEmail(req.body.email);
    const { password } = req.body;

    if (!email || typeof password !== "string" || !password) {
      return res
        .status(400)
        .json({ error: 'Se requieren "email" y "password"' });
    }
    // Un correo con formato inválido no puede ser de nadie: no se
    // consulta ni se cuenta (evita llenar intento_login con basura).
    if (!esEmail(email)) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const minutos = await minutosBloqueo(email);
    if (minutos > 0) return res.status(429).json(bloqueado(minutos));

    const { rows } = await pool.query(
      "SELECT id_usuario, password FROM usuario WHERE email = $1",
      [email]
    );

    const valid = await bcrypt.compare(
      password,
      rows.length ? rows[0].password : HASH_RELLENO
    );
    if (rows.length === 0 || !valid) {
      if (await registrarFallo(email)) {
        return res.status(429).json(bloqueado(MINUTOS_BLOQUEO));
      }
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Login correcto: se olvidan los fallos de ese correo.
    await pool.query("DELETE FROM intento_login WHERE email = $1", [email]);

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
