// ============================================================
// src/routes/mantenimientos.js
// ============================================================
// CRUD de la tabla "mantencion". Incluye los datos legibles del
// vehículo, del tipo de mantención y del usuario responsable.
//
// Alcance (src/alcance.js): una mantención pertenece a la compañía
// de su VEHÍCULO. Cada usuario solo ve y registra mantenciones de
// vehículos dentro de su alcance.
//
// Escritura: solo los roles de ROLES_MANTENCION. El responsable
// (id_usuario) es SIEMPRE el usuario de la sesión: no se acepta del
// body, para que nadie registre a nombre de otro.
//
// Costos: se reciben "costo_repuestos" y "mano_obra"; el costo_total
// lo calcula SIEMPRE la API (repuestos + mano de obra). Un
// "costo_total" enviado en el body se ignora.

import { Router } from "express";
import { pool } from "../db.js";
import { ROLES_MANTENCION, requireRol } from "../auth.js";
import {
  companiasVisibles,
  filtroCompanias,
  puedeUsarVehiculo,
} from "../alcance.js";

const router = Router();

const SELECT_MANTENCION = `
  SELECT m.id_mantencion, m.fecha_ingreso, m.fecha_salida,
         m.kilometraje_ingreso, m.detalle_trabajo, m.proveedor,
         m.costo_total, m.mano_obra,
         (m.costo_total - COALESCE(m.mano_obra, 0)) AS costo_repuestos,
         m.estado_mantencion,
         v.id_vehiculo, v.nomenclatura, v.patente, v.id_compania,
         tm.id_tipo_mantencion, tm.nombre AS tipo_mantencion_nombre,
         u.id_usuario, u.nombre_completo AS usuario_nombre
  FROM mantencion m
  JOIN vehiculo v          ON v.id_vehiculo = m.id_vehiculo
  JOIN tipo_mantencion tm  ON tm.id_tipo_mantencion = m.id_tipo_mantencion
  JOIN usuario u           ON u.id_usuario = m.id_usuario
`;

const NO_ENCONTRADA = { error: "Mantención no encontrada" };

// Valida repuestos y mano de obra y calcula el total.
// Devuelve { error } o { costo_total, mano_obra }. Si no viene ningún
// monto, ambos quedan en null (la mantención no tiene costos aún).
function calcularCostos(body) {
  const montos = {};
  for (const campo of ["costo_repuestos", "mano_obra"]) {
    const valor = body[campo];
    if (valor === undefined || valor === null || valor === "") {
      montos[campo] = null;
      continue;
    }
    const n = Number(valor);
    if (!Number.isFinite(n) || n < 0) {
      return { error: `"${campo}" debe ser un monto mayor o igual a 0` };
    }
    montos[campo] = n;
  }

  if (montos.costo_repuestos === null && montos.mano_obra === null) {
    return { costo_total: null, mano_obra: null };
  }
  return {
    costo_total: (montos.costo_repuestos ?? 0) + (montos.mano_obra ?? 0),
    mano_obra: montos.mano_obra,
  };
}
const VEHICULO_NO_ENCONTRADO = { error: "Vehículo no encontrado" };

// Busca una mantención SOLO si su vehículo está en el alcance.
async function buscarEnAlcance(req, idMantencion) {
  const { rows } = await pool.query(
    `${SELECT_MANTENCION}
     WHERE m.id_mantencion = $1
       AND ($2::int[] IS NULL OR v.id_compania = ANY($2))`,
    [idMantencion, companiasVisibles(req.usuario)]
  );
  return rows[0] || null;
}

// ---------- GET /api/mantenimientos (listar) ----------
// ?id_compania=N filtra por compañía (selector del administrador).
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `${SELECT_MANTENCION}
       WHERE ($1::int[] IS NULL OR v.id_compania = ANY($1))
       ORDER BY m.fecha_ingreso DESC`,
      [filtroCompanias(req)]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// ---------- GET /api/mantenimientos/:id (uno solo) ----------
router.get("/:id", async (req, res, next) => {
  try {
    const mantencion = await buscarEnAlcance(req, req.params.id);
    if (!mantencion) {
      return res.status(404).json(NO_ENCONTRADA);
    }
    res.json(mantencion);
  } catch (error) {
    next(error);
  }
});

// ---------- POST /api/mantenimientos (crear) ----------
router.post("/", requireRol(...ROLES_MANTENCION), async (req, res, next) => {
  try {
    const {
      fecha_ingreso,
      fecha_salida,
      kilometraje_ingreso,
      detalle_trabajo,
      proveedor,
      estado_mantencion,
      id_vehiculo,
      id_tipo_mantencion,
    } = req.body;

    if (!fecha_ingreso || !id_vehiculo || !id_tipo_mantencion) {
      return res.status(400).json({
        error: 'Se requieren "fecha_ingreso", "id_vehiculo" e "id_tipo_mantencion"',
      });
    }
    const costos = calcularCostos(req.body);
    if (costos.error) {
      return res.status(400).json({ error: costos.error });
    }
    if (!(await puedeUsarVehiculo(req.usuario, id_vehiculo))) {
      return res.status(404).json(VEHICULO_NO_ENCONTRADO);
    }

    const { rows } = await pool.query(
      `INSERT INTO mantencion
         (fecha_ingreso, fecha_salida, kilometraje_ingreso, detalle_trabajo,
          proveedor, costo_total, mano_obra, estado_mantencion, id_vehiculo,
          id_tipo_mantencion, id_usuario)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        fecha_ingreso,
        fecha_salida || null,
        kilometraje_ingreso || null,
        detalle_trabajo || null,
        proveedor || null,
        costos.costo_total,
        costos.mano_obra,
        estado_mantencion || "en_proceso",
        id_vehiculo,
        id_tipo_mantencion,
        req.usuario.id_usuario,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ---------- PUT /api/mantenimientos/:id (actualizar) ----------
// El responsable original (id_usuario) se conserva.
router.put("/:id", requireRol(...ROLES_MANTENCION), async (req, res, next) => {
  try {
    const {
      fecha_ingreso,
      fecha_salida,
      kilometraje_ingreso,
      detalle_trabajo,
      proveedor,
      estado_mantencion,
      id_vehiculo,
      id_tipo_mantencion,
    } = req.body;

    if (!fecha_ingreso || !id_vehiculo || !id_tipo_mantencion) {
      return res.status(400).json({
        error: 'Se requieren "fecha_ingreso", "id_vehiculo" e "id_tipo_mantencion"',
      });
    }
    const costos = calcularCostos(req.body);
    if (costos.error) {
      return res.status(400).json({ error: costos.error });
    }
    if (!(await buscarEnAlcance(req, req.params.id))) {
      return res.status(404).json(NO_ENCONTRADA);
    }
    if (!(await puedeUsarVehiculo(req.usuario, id_vehiculo))) {
      return res.status(404).json(VEHICULO_NO_ENCONTRADO);
    }

    const { rows } = await pool.query(
      `UPDATE mantencion
       SET fecha_ingreso = $1, fecha_salida = $2, kilometraje_ingreso = $3,
           detalle_trabajo = $4, proveedor = $5, costo_total = $6,
           mano_obra = $7, estado_mantencion = $8, id_vehiculo = $9,
           id_tipo_mantencion = $10
       WHERE id_mantencion = $11 RETURNING *`,
      [
        fecha_ingreso,
        fecha_salida || null,
        kilometraje_ingreso || null,
        detalle_trabajo || null,
        proveedor || null,
        costos.costo_total,
        costos.mano_obra,
        estado_mantencion || "en_proceso",
        id_vehiculo,
        id_tipo_mantencion,
        req.params.id,
      ]
    );
    if (rows.length === 0) {
      return res.status(404).json(NO_ENCONTRADA);
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ---------- DELETE /api/mantenimientos/:id (eliminar) ----------
router.delete("/:id", requireRol(...ROLES_MANTENCION), async (req, res, next) => {
  try {
    if (!(await buscarEnAlcance(req, req.params.id))) {
      return res.status(404).json(NO_ENCONTRADA);
    }
    const { rowCount } = await pool.query(
      "DELETE FROM mantencion WHERE id_mantencion = $1",
      [req.params.id]
    );
    if (rowCount === 0) {
      return res.status(404).json(NO_ENCONTRADA);
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
