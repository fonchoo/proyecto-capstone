// ============================================================
// src/routes/fallas.js
// ============================================================
// Reportes de falla (tabla "reporte_falla"), con datos legibles del
// vehículo, de quién reportó y de quién derivó.
//
// Alcance (src/alcance.js): un reporte pertenece a la compañía de su
// VEHÍCULO. Cada usuario solo ve y reporta fallas de vehículos de su
// alcance.
//
// Flujo (HU05 -> HU06 -> HU07):
//   pendiente  -> lo crea CUALQUIER rol (POST /api/fallas)
//   derivado   -> el Teniente Tercero (o superior) lo deriva al
//                 Inspector de Material Mayor (PATCH /:id/derivar)
//   resuelto   -> al finalizar la mantención que lo resuelve
//                 (ver routes/mantenimientos.js)
// Quién reporta y quién deriva es SIEMPRE el usuario de la sesión.

import { Router } from "express";
import { pool } from "../db.js";
import { ROLES_MANTENCION, requireRol } from "../auth.js";
import { companiasVisibles, filtroCompanias, puedeUsarVehiculo } from "../alcance.js";
import { enTransaccion, recalcularEstadoVehiculo } from "../estadoVehiculo.js";

const router = Router();

const URGENCIAS = ["alta", "media", "baja"];
const ESTADOS = ["pendiente", "derivado", "resuelto"];
const MAX_DESCRIPCION = 2000;

const SELECT_FALLA = `
  SELECT r.id_reporte_falla, r.fecha_reporte, r.urgencia, r.descripcion,
         r.estado_reporte, r.fecha_derivacion, r.id_mantencion,
         v.id_vehiculo, v.nomenclatura, v.patente, v.marca, v.modelo,
         v.id_compania, c.nombre AS nombre_compania,
         u.id_usuario, u.nombre_completo AS usuario_nombre,
         d.nombre_completo AS derivado_por
  FROM reporte_falla r
  JOIN vehiculo v      ON v.id_vehiculo = r.id_vehiculo
  JOIN compania c      ON c.id_compania = v.id_compania
  JOIN usuario u       ON u.id_usuario = r.id_usuario
  LEFT JOIN usuario d  ON d.id_usuario = r.id_usuario_deriva
`;

const NO_ENCONTRADO = { error: "Reporte de falla no encontrado" };
const VEHICULO_NO_ENCONTRADO = { error: "Vehículo no encontrado" };

async function buscarEnAlcance(req, idReporte) {
  const { rows } = await pool.query(
    `${SELECT_FALLA}
     WHERE r.id_reporte_falla = $1
       AND ($2::int[] IS NULL OR v.id_compania = ANY($2))`,
    [idReporte, companiasVisibles(req.usuario)]
  );
  return rows[0] || null;
}

// ---------- GET /api/fallas (listar) ----------
// ?id_vehiculo=N        -> historial de un vehículo.
// ?estado=a,b           -> solo esos estados (pendiente/derivado/resuelto).
// ?id_compania=N        -> filtra por compañía (selector del administrador).
router.get("/", async (req, res, next) => {
  try {
    const idVehiculo = req.query.id_vehiculo ? Number(req.query.id_vehiculo) : null;
    if (idVehiculo !== null && !Number.isInteger(idVehiculo)) {
      return res.status(400).json({ error: '"id_vehiculo" debe ser un número' });
    }
    let estados = null;
    if (req.query.estado) {
      estados = String(req.query.estado).split(",").map((e) => e.trim());
      if (estados.some((e) => !ESTADOS.includes(e))) {
        return res
          .status(400)
          .json({ error: `"estado" debe ser uno de: ${ESTADOS.join(", ")}` });
      }
    }

    const { rows } = await pool.query(
      `${SELECT_FALLA}
       WHERE ($1::int[] IS NULL OR v.id_compania = ANY($1))
         AND ($2::int IS NULL OR r.id_vehiculo = $2)
         AND ($3::text[] IS NULL OR r.estado_reporte = ANY($3))
       ORDER BY r.fecha_reporte DESC`,
      [filtroCompanias(req), idVehiculo, estados]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// ---------- GET /api/fallas/:id (uno solo) ----------
router.get("/:id", async (req, res, next) => {
  try {
    const reporte = await buscarEnAlcance(req, req.params.id);
    if (!reporte) {
      return res.status(404).json(NO_ENCONTRADO);
    }
    res.json(reporte);
  } catch (error) {
    next(error);
  }
});

// ---------- POST /api/fallas (reportar) ----------
// Guarda el reporte y recalcula el estado del vehículo en una sola
// transacción (normalmente queda "no_operativo"; si ya está en el
// taller sigue "en_mantencion", ver src/estadoVehiculo.js).
router.post("/", async (req, res, next) => {
  const { id_vehiculo, urgencia } = req.body;
  const descripcion =
    typeof req.body.descripcion === "string" ? req.body.descripcion.trim() : "";

  if (!id_vehiculo || !urgencia || !descripcion) {
    return res.status(400).json({
      error: 'Se requieren "id_vehiculo", "urgencia" y "descripcion"',
    });
  }
  if (!URGENCIAS.includes(urgencia)) {
    return res
      .status(400)
      .json({ error: '"urgencia" debe ser "alta", "media" o "baja"' });
  }
  if (descripcion.length > MAX_DESCRIPCION) {
    return res.status(400).json({
      error: `La descripción no puede superar los ${MAX_DESCRIPCION} caracteres`,
    });
  }

  try {
    if (!(await puedeUsarVehiculo(req.usuario, id_vehiculo))) {
      return res.status(404).json(VEHICULO_NO_ENCONTRADO);
    }

    const idReporte = await enTransaccion(pool, async (client) => {
      const { rows } = await client.query(
        `INSERT INTO reporte_falla (urgencia, descripcion, id_vehiculo, id_usuario)
         VALUES ($1, $2, $3, $4)
         RETURNING id_reporte_falla`,
        [urgencia, descripcion, id_vehiculo, req.usuario.id_usuario]
      );
      await recalcularEstadoVehiculo(client, id_vehiculo);
      return rows[0].id_reporte_falla;
    });

    res.status(201).json(await buscarEnAlcance(req, idReporte));
  } catch (error) {
    next(error);
  }
});

// ---------- PATCH /api/fallas/:id/derivar (HU06) ----------
// El Teniente Tercero (o un rol superior) deriva un reporte PENDIENTE
// al Inspector de Material Mayor, que lo ve en su panel de fallas.
router.patch("/:id/derivar", requireRol(...ROLES_MANTENCION), async (req, res, next) => {
  try {
    const reporte = await buscarEnAlcance(req, req.params.id);
    if (!reporte) {
      return res.status(404).json(NO_ENCONTRADO);
    }
    // "AND estado_reporte = 'pendiente'": si dos personas derivan a la
    // vez, solo una lo logra (la otra recibe el 409).
    const { rowCount } = await pool.query(
      `UPDATE reporte_falla
       SET estado_reporte = 'derivado', fecha_derivacion = now(), id_usuario_deriva = $2
       WHERE id_reporte_falla = $1 AND estado_reporte = 'pendiente'`,
      [reporte.id_reporte_falla, req.usuario.id_usuario]
    );
    if (rowCount === 0) {
      return res
        .status(409)
        .json({ error: "Solo se puede derivar un reporte pendiente" });
    }
    res.json(await buscarEnAlcance(req, reporte.id_reporte_falla));
  } catch (error) {
    next(error);
  }
});

export default router;
