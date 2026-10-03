// ============================================================
// src/auth.js
// ============================================================
// Autenticación con JWT propio, guardado en una cookie httpOnly.
//
//   1. POST /api/auth/login valida email + password y responde con
//      la cookie "sigmave_token" (un JWT firmado con JWT_SECRET).
//   2. El navegador la reenvía sola en cada petición a /api (mismo
//      origen gracias al proxy de Vite / nginx).
//   3. requireAuth verifica el token y deja el usuario ACTUAL (leído
//      de la base) en req.usuario.
//
// Por qué cookie httpOnly y no localStorage: JavaScript no puede
// leerla, así que un XSS no puede robar la sesión. SameSite=Strict
// evita que otro sitio la use (CSRF).
//
// Por qué se relee el usuario de la base en cada petición: si un
// administrador le cambia el rol o la compañía, o lo elimina, el
// cambio rige de inmediato y no recién cuando vence el token.

import "dotenv/config";
import jwt from "jsonwebtoken";
import { pool } from "./db.js";

export const COOKIE_NAME = "sigmave_token";

// Duración de la sesión.
const SESION_HORAS = 8;

// La API NO arranca sin un secreto decente: con uno corto o vacío
// cualquiera podría firmar tokens válidos.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error(
    "Falta JWT_SECRET (mínimo 32 caracteres) en el .env. Generar uno con: " +
      "node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
  );
}

// Datos del usuario de la sesión (nunca el password).
export const SELECT_USUARIO_SESION = `
  SELECT u.id_usuario, u.rut, u.nombre_completo, u.email,
         r.id_rol, r.nombre_rol, c.id_compania, c.nombre AS nombre_compania
  FROM usuario u
  JOIN rol r      ON r.id_rol = u.id_rol
  JOIN compania c ON c.id_compania = u.id_compania
`;

// Opciones de la cookie. "secure" exige HTTPS: se activa con
// COOKIE_SECURE=true al publicar detrás de HTTPS (en local es http).
function opcionesCookie() {
  return {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/api",
  };
}

export function iniciarSesion(res, idUsuario) {
  const token = jwt.sign({ sub: String(idUsuario) }, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: `${SESION_HORAS}h`,
  });
  res.cookie(COOKIE_NAME, token, {
    ...opcionesCookie(),
    maxAge: SESION_HORAS * 60 * 60 * 1000,
  });
}

export function cerrarSesion(res) {
  res.clearCookie(COOKIE_NAME, opcionesCookie());
}

// ---------- Middleware: exige sesión válida ----------
export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ error: "Sesión no iniciada" });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    } catch {
      cerrarSesion(res);
      return res.status(401).json({ error: "Sesión expirada o inválida" });
    }

    const { rows } = await pool.query(
      `${SELECT_USUARIO_SESION} WHERE u.id_usuario = $1`,
      [Number(payload.sub)]
    );
    if (rows.length === 0) {
      // El usuario fue eliminado después de iniciar sesión.
      cerrarSesion(res);
      return res.status(401).json({ error: "Sesión expirada o inválida" });
    }

    req.usuario = rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

// ---------- Middleware: exige uno de estos roles ----------
// Uso: router.post("/", requireRol("administrador"), handler)
export function requireRol(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario?.nombre_rol)) {
      return res
        .status(403)
        .json({ error: "No tienes permisos para esta acción" });
    }
    next();
  };
}

// Roles que pueden registrar/editar mantenciones y alertas
// (misma matriz que Front/src/permissions.js).
export const ROLES_MANTENCION = [
  "teniente_tercero",
  "inspector_material_mayor",
  "administrador",
];
