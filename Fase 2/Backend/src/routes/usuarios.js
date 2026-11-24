// ============================================================
// src/routes/usuarios.js
// ============================================================
// Gestión de la tabla "usuario". El password se guarda con hash
// (bcrypt) para no almacenar contraseñas en texto plano.
//
// Los usuarios no se borran: se desactivan (HU16). Borrar era imposible
// apenas el usuario tenía reportes o mantenciones (FK RESTRICT) y se
// perdía el «Reportado por» del historial. Una cuenta inactiva no
// entra, pierde su sesión y no recibe avisos (ver la migración
// usuario_activo). Se puede reactivar por si se desactivó por error.

import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { requireRol } from "../auth.js";
import {
  NOMBRE,
  errorLargo,
  errorPassword,
  esEmail,
  normalizarEmail,
  normalizarRut,
  texto,
  vacio,
} from "../validaciones.js";

const router = Router();

// Gestión de usuarios: SOLO administrador (todas las rutas).
router.use(requireRol("administrador"));

// Selector base y campos legibles.
const SELECT_USUARIO = `
  SELECT u.id_usuario, u.rut, u.nombre_completo, u.email, u.activo,
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

// Valida el cuerpo de POST y PUT con las reglas de src/validaciones.js.
// La contraseña es obligatoria al crear; al editar, si no viene, se
// conserva la actual. Devuelve { datos } normalizados o { errores } por
// campo (el front los muestra bajo cada input).
async function validarUsuario(body, { exigePassword }) {
  const errores = {};
  const datos = {
    rut: normalizarRut(body.rut),
    nombre_completo: texto(body.nombre_completo),
    email: normalizarEmail(body.email),
    password: typeof body.password === "string" ? body.password : "",
    id_rol: Number(body.id_rol),
    id_compania: Number(body.id_compania),
  };

  if (vacio(body.rut)) errores.rut = "El RUT es obligatorio";
  else if (!datos.rut) errores.rut = "El RUT no es válido (revisa el dígito verificador)";

  if (!datos.nombre_completo) {
    errores.nombre_completo = "El nombre es obligatorio";
  } else {
    const largo = errorLargo(datos.nombre_completo, NOMBRE.min, NOMBRE.max);
    if (largo) errores.nombre_completo = largo;
    else if (!NOMBRE.patron.test(datos.nombre_completo)) {
      errores.nombre_completo = "El nombre solo puede tener letras, espacios, apóstrofo y guion";
    }
  }

  if (!datos.email) errores.email = "El correo es obligatorio";
  else if (!esEmail(datos.email)) errores.email = "El correo no tiene un formato válido";

  if (datos.password || exigePassword) {
    const error = errorPassword(datos.password);
    if (error) errores.password = error;
  }

  // Rol y compañía tienen que existir (la FK lo exige igual, pero así
  // el error llega bajo su campo y no como un 500).
  if (!Number.isInteger(datos.id_rol)) {
    errores.id_rol = "Selecciona un rol";
  } else if ((await pool.query("SELECT 1 FROM rol WHERE id_rol = $1", [datos.id_rol])).rowCount === 0) {
    errores.id_rol = "Rol inválido";
  }
  if (!Number.isInteger(datos.id_compania)) {
    errores.id_compania = "Selecciona una compañía";
  } else if (
    (await pool.query("SELECT 1 FROM compania WHERE id_compania = $1", [datos.id_compania]))
      .rowCount === 0
  ) {
    errores.id_compania = "Compañía inválida";
  }

  return Object.keys(errores).length ? { errores } : { datos };
}

function responderErrores(res, errores) {
  return res.status(400).json({ error: Object.values(errores).join(". "), campos: errores });
}

// RUT o correo repetido (UNIQUE de la base): el mensaje va bajo el
// campo que corresponde. Devuelve el cuerpo del 409 o null.
function duplicado(error) {
  if (error?.code !== "23505") return null;
  if (error.constraint === "usuario_rut_key") {
    return { error: "Ya existe un usuario con ese RUT", campos: { rut: "Este RUT ya está registrado" } };
  }
  if (error.constraint === "usuario_email_key") {
    return { error: "Ya existe un usuario con ese correo", campos: { email: "Este correo ya está registrado" } };
  }
  return { error: "RUT o correo ya registrado" };
}

const COLUMNAS_USUARIO = "id_usuario, rut, nombre_completo, email, activo, id_rol, id_compania";

// ---------- POST /api/usuarios (crear) ----------
router.post("/", async (req, res, next) => {
  try {
    const { datos, errores } = await validarUsuario(req.body, { exigePassword: true });
    if (errores) return responderErrores(res, errores);

    const hash = await bcrypt.hash(datos.password, 10);
    const { rows } = await pool.query(
      `INSERT INTO usuario (rut, nombre_completo, email, password, id_rol, id_compania)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${COLUMNAS_USUARIO}`,
      [datos.rut, datos.nombre_completo, datos.email, hash, datos.id_rol, datos.id_compania]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    const conflicto = duplicado(error);
    if (conflicto) return res.status(409).json(conflicto);
    next(error);
  }
});

// ---------- PUT /api/usuarios/:id (actualizar) ----------
router.put("/:id", async (req, res, next) => {
  try {
    const { datos, errores } = await validarUsuario(req.body, { exigePassword: false });
    if (errores) return responderErrores(res, errores);

    // Si viene password, se actualiza; si no, se conserva el actual.
    const params = [datos.rut, datos.nombre_completo, datos.email, datos.id_rol, datos.id_compania];
    let set = "rut = $1, nombre_completo = $2, email = $3, id_rol = $4, id_compania = $5";
    if (datos.password) {
      params.push(await bcrypt.hash(datos.password, 10));
      set += `, password = $${params.length}`;
    }
    params.push(req.params.id);

    const { rows } = await pool.query(
      `UPDATE usuario
       SET ${set}
       WHERE id_usuario = $${params.length}
       RETURNING ${COLUMNAS_USUARIO}`,
      params
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    const conflicto = duplicado(error);
    if (conflicto) return res.status(409).json(conflicto);
    next(error);
  }
});

// Activa o desactiva una cuenta (HU16). Responde el usuario actualizado,
// o el motivo por el que no se pudo:
//   - 400 si el administrador intenta desactivarse a sí mismo (se
//     quedaría sin sesión y, si es el único, el sistema sin administrador);
//   - 404 si el usuario no existe;
//   - 409 si la cuenta ya estaba en ese estado (HU16 CA6).
async function cambiarEstado(req, res, next, activo) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    if (!activo && id === req.usuario.id_usuario) {
      return res.status(400).json({ error: "No puedes desactivar tu propia cuenta" });
    }

    const { rows } = await pool.query(
      `UPDATE usuario SET activo = $2
       WHERE id_usuario = $1 AND activo <> $2
       RETURNING ${COLUMNAS_USUARIO}`,
      [id, activo]
    );
    if (rows.length > 0) return res.json(rows[0]);

    // No cambió nada: o no existe, o ya estaba así.
    const existe = await pool.query("SELECT 1 FROM usuario WHERE id_usuario = $1", [id]);
    if (existe.rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.status(409).json({
      error: activo ? "La cuenta ya está activa" : "La cuenta ya está desactivada",
    });
  } catch (error) {
    next(error);
  }
}

// ---------- PATCH /api/usuarios/:id/desactivar (HU16) ----------
router.patch("/:id/desactivar", (req, res, next) => cambiarEstado(req, res, next, false));

// ---------- PATCH /api/usuarios/:id/reactivar ----------
router.patch("/:id/reactivar", (req, res, next) => cambiarEstado(req, res, next, true));

export default router;