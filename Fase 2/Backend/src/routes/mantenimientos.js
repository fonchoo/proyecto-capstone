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
//
// Ciclo de la mantención (HU07):
//   - Sin fecha de salida -> "en_proceso"; con fecha de salida ->
//     "finalizada". El estado NO se recibe del body: se deriva.
//   - Una mantención puede resolver un reporte de falla DERIVADO
//     ("id_reporte_falla"). Al finalizar, ese reporte pasa a "resuelto".
//   - Después de cada cambio se recalcula el estado del vehículo
//     (src/estadoVehiculo.js).

import { Router } from "express";
import { pool } from "../db.js";
import { ROLES_MANTENCION, requireRol } from "../auth.js";
import {
  companiasVisibles,
  filtroCompanias,
  puedeUsarVehiculo,
} from "../alcance.js";
import {
  enTransaccion,
  errorPublico,
  esFecha,
  hoyChile,
  recalcularEstadoVehiculo,
  responderErrorPublico,
} from "../estadoVehiculo.js";

const router = Router();

const SELECT_MANTENCION = `
  SELECT m.id_mantencion, m.fecha_ingreso, m.fecha_salida,
         m.kilometraje_ingreso, m.detalle_trabajo, m.proveedor,
         m.costo_total, m.mano_obra,
         (m.costo_total - COALESCE(m.mano_obra, 0)) AS costo_repuestos,
         m.estado_mantencion,
         v.id_vehiculo, v.nomenclatura, v.patente, v.id_compania,
         tm.id_tipo_mantencion, tm.nombre AS tipo_mantencion_nombre,
         u.id_usuario, u.nombre_completo AS usuario_nombre,
         (SELECT COUNT(*)::int FROM reporte_falla r
          WHERE r.id_mantencion = m.id_mantencion) AS reportes_asociados
  FROM mantencion m
  JOIN vehiculo v          ON v.id_vehiculo = m.id_vehiculo
  JOIN tipo_mantencion tm  ON tm.id_tipo_mantencion = m.id_tipo_mantencion
  JOIN usuario u           ON u.id_usuario = m.id_usuario
`;

const NO_ENCONTRADA = { error: "Mantención no encontrada" };
const VEHICULO_NO_ENCONTRADO = { error: "Vehículo no encontrado" };

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

// Fechas: ingreso obligatorio; salida opcional, no anterior al
// ingreso y no futura (una mantención no puede terminar mañana).
// Devuelve un mensaje de error o null.
function validarFechas(fechaIngreso, fechaSalida) {
  if (!esFecha(fechaIngreso)) {
    return '"fecha_ingreso" debe ser una fecha válida (AAAA-MM-DD)';
  }
  if (fechaSalida === undefined || fechaSalida === null || fechaSalida === "") {
    return null;
  }
  if (!esFecha(fechaSalida)) {
    return '"fecha_salida" debe ser una fecha válida (AAAA-MM-DD)';
  }
  if (fechaSalida < fechaIngreso) {
    return "La fecha de salida no puede ser anterior a la de ingreso";
  }
  if (fechaSalida > hoyChile()) {
    return "La fecha de salida no puede ser futura";
  }
  return null;
}

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

// Enlaza un reporte de falla a la mantención que lo resuelve. Solo un
// reporte DERIVADO, del MISMO vehículo y sin otra mantención.
async function enlazarReporte(client, idReporte, idVehiculo, idMantencion) {
  const { rows } = await client.query(
    `SELECT id_vehiculo, estado_reporte, id_mantencion
     FROM reporte_falla WHERE id_reporte_falla = $1 FOR UPDATE`,
    [idReporte]
  );
  if (rows.length === 0 || rows[0].id_vehiculo !== Number(idVehiculo)) {
    throw errorPublico(400, "El reporte de falla no corresponde a este vehículo");
  }
  if (rows[0].estado_reporte !== "derivado" || rows[0].id_mantencion !== null) {
    throw errorPublico(
      409,
      "Solo se puede asociar un reporte de falla derivado que no tenga otra mantención"
    );
  }
  await client.query(
    "UPDATE reporte_falla SET id_mantencion = $1 WHERE id_reporte_falla = $2",
    [idMantencion, idReporte]
  );
}

// Los reportes enlazados a una mantención quedan "resuelto" si está
// finalizada, o vuelven a "derivado" si se reabrió (salida borrada).
async function sincronizarReportes(client, idMantencion, finalizada) {
  await client.query(
    `UPDATE reporte_falla
     SET estado_reporte = CASE WHEN $2 THEN 'resuelto' ELSE 'derivado' END
     WHERE id_mantencion = $1`,
    [idMantencion, finalizada]
  );
}

// ---------- GET /api/mantenimientos (listar) ----------
// ?id_compania=N filtra por compañía (selector del administrador).
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `${SELECT_MANTENCION}
       WHERE ($1::int[] IS NULL OR v.id_compania = ANY($1))
       ORDER BY m.fecha_ingreso DESC, m.id_mantencion DESC`,
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
// Body opcional: "id_reporte_falla" -> reporte derivado que resuelve.
router.post("/", requireRol(...ROLES_MANTENCION), async (req, res, next) => {
  try {
    const {
      fecha_ingreso,
      fecha_salida,
      kilometraje_ingreso,
      detalle_trabajo,
      proveedor,
      id_vehiculo,
      id_tipo_mantencion,
      id_reporte_falla,
    } = req.body;

    if (!fecha_ingreso || !id_vehiculo || !id_tipo_mantencion) {
      return res.status(400).json({
        error: 'Se requieren "fecha_ingreso", "id_vehiculo" e "id_tipo_mantencion"',
      });
    }
    const errorFechas = validarFechas(fecha_ingreso, fecha_salida);
    if (errorFechas) {
      return res.status(400).json({ error: errorFechas });
    }
    const costos = calcularCostos(req.body);
    if (costos.error) {
      return res.status(400).json({ error: costos.error });
    }
    if (!(await puedeUsarVehiculo(req.usuario, id_vehiculo))) {
      return res.status(404).json(VEHICULO_NO_ENCONTRADO);
    }

    const finalizada = Boolean(fecha_salida);

    const creada = await enTransaccion(pool, async (client) => {
      const { rows } = await client.query(
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
          finalizada ? "finalizada" : "en_proceso",
          id_vehiculo,
          id_tipo_mantencion,
          req.usuario.id_usuario,
        ]
      );
      const mantencion = rows[0];

      if (id_reporte_falla) {
        await enlazarReporte(client, id_reporte_falla, id_vehiculo, mantencion.id_mantencion);
        await sincronizarReportes(client, mantencion.id_mantencion, finalizada);
      }
      mantencion.estado_vehiculo = await recalcularEstadoVehiculo(client, id_vehiculo);
      return mantencion;
    });

    res.status(201).json(creada);
  } catch (error) {
    if (responderErrorPublico(res, error)) return;
    next(error);
  }
});

// ---------- PATCH /api/mantenimientos/:id/finalizar ----------
// Registra la fecha de salida de una mantención en proceso: queda
// "finalizada", sus reportes de falla pasan a "resuelto" y se
// recalcula el estado del vehículo (vuelve a operativo si corresponde).
router.patch(
  "/:id/finalizar",
  requireRol(...ROLES_MANTENCION),
  async (req, res, next) => {
    try {
      const actual = await buscarEnAlcance(req, req.params.id);
      if (!actual) {
        return res.status(404).json(NO_ENCONTRADA);
      }
      if (actual.estado_mantencion !== "en_proceso") {
        return res.status(409).json({ error: "La mantención ya está finalizada" });
      }
      const { fecha_salida } = req.body;
      if (!fecha_salida) {
        return res.status(400).json({ error: 'Se requiere "fecha_salida"' });
      }
      const errorFechas = validarFechas(actual.fecha_ingreso, fecha_salida);
      if (errorFechas) {
        return res.status(400).json({ error: errorFechas });
      }

      const estadoVehiculo = await enTransaccion(pool, async (client) => {
        await client.query(
          `UPDATE mantencion
           SET fecha_salida = $1, estado_mantencion = 'finalizada'
           WHERE id_mantencion = $2`,
          [fecha_salida, actual.id_mantencion]
        );
        await sincronizarReportes(client, actual.id_mantencion, true);
        return recalcularEstadoVehiculo(client, actual.id_vehiculo);
      });

      const finalizada = await buscarEnAlcance(req, actual.id_mantencion);
      res.json({ ...finalizada, estado_vehiculo: estadoVehiculo });
    } catch (error) {
      next(error);
    }
  }
);

// ---------- PUT /api/mantenimientos/:id (actualizar) ----------
// El responsable original (id_usuario) se conserva. El estado se
// deriva de la fecha de salida, igual que al crear.
router.put("/:id", requireRol(...ROLES_MANTENCION), async (req, res, next) => {
  try {
    const {
      fecha_ingreso,
      fecha_salida,
      kilometraje_ingreso,
      detalle_trabajo,
      proveedor,
      id_vehiculo,
      id_tipo_mantencion,
    } = req.body;

    if (!fecha_ingreso || !id_vehiculo || !id_tipo_mantencion) {
      return res.status(400).json({
        error: 'Se requieren "fecha_ingreso", "id_vehiculo" e "id_tipo_mantencion"',
      });
    }
    const errorFechas = validarFechas(fecha_ingreso, fecha_salida);
    if (errorFechas) {
      return res.status(400).json({ error: errorFechas });
    }
    const costos = calcularCostos(req.body);
    if (costos.error) {
      return res.status(400).json({ error: costos.error });
    }
    const actual = await buscarEnAlcance(req, req.params.id);
    if (!actual) {
      return res.status(404).json(NO_ENCONTRADA);
    }
    if (!(await puedeUsarVehiculo(req.usuario, id_vehiculo))) {
      return res.status(404).json(VEHICULO_NO_ENCONTRADO);
    }
    // Las fallas que resuelve son de SU vehículo: no se puede mover.
    if (Number(id_vehiculo) !== actual.id_vehiculo && actual.reportes_asociados > 0) {
      return res.status(409).json({
        error: "La mantención resuelve reportes de falla de su vehículo: no se puede cambiar el vehículo",
      });
    }

    const finalizada = Boolean(fecha_salida);

    const actualizada = await enTransaccion(pool, async (client) => {
      const { rows } = await client.query(
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
          finalizada ? "finalizada" : "en_proceso",
          id_vehiculo,
          id_tipo_mantencion,
          req.params.id,
        ]
      );
      await sincronizarReportes(client, actual.id_mantencion, finalizada);
      // Si cambió de vehículo, se recalculan los dos.
      if (actual.id_vehiculo !== Number(id_vehiculo)) {
        await recalcularEstadoVehiculo(client, actual.id_vehiculo);
      }
      rows[0].estado_vehiculo = await recalcularEstadoVehiculo(client, id_vehiculo);
      return rows[0];
    });

    res.json(actualizada);
  } catch (error) {
    next(error);
  }
});

// ---------- DELETE /api/mantenimientos/:id (eliminar) ----------
router.delete("/:id", requireRol(...ROLES_MANTENCION), async (req, res, next) => {
  try {
    const actual = await buscarEnAlcance(req, req.params.id);
    if (!actual) {
      return res.status(404).json(NO_ENCONTRADA);
    }
    await enTransaccion(pool, async (client) => {
      await client.query("DELETE FROM mantencion WHERE id_mantencion = $1", [
        actual.id_mantencion,
      ]);
      await recalcularEstadoVehiculo(client, actual.id_vehiculo);
    });
    res.status(204).end();
  } catch (error) {
    // FK RESTRICT: la mantención resolvió reportes de falla.
    if (error.code === "23503") {
      return res.status(409).json({
        error: "La mantención está asociada a reportes de falla y no se puede eliminar",
      });
    }
    next(error);
  }
});

export default router;
