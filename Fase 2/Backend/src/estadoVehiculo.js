// ============================================================
// src/estadoVehiculo.js
// ============================================================
// ÚNICA regla del estado operativo de un vehículo (HU07). La API la
// aplica después de cada evento que puede cambiarlo: reportar una
// falla, registrar, editar, finalizar o borrar una mantención.
//
//   1. Tiene alguna mantención en proceso       -> "en_mantencion"
//      (está en el taller, aunque además tenga fallas).
//   2. Tiene fallas pendientes o derivadas       -> "no_operativo"
//      (sin resolver).
//   3. Si no                                     -> "operativo"
//
// Es el "si corresponde" del criterio de HU07: una mantención
// finalizada deja el vehículo operativo SOLO si no le quedan otras
// mantenciones abiertas ni fallas sin resolver.
//
// OJO: recalcula a partir de los datos, así que pisa un estado puesto
// a mano (p. ej. al crear el vehículo) cuando ocurre uno de esos
// eventos.

// "db" puede ser el pool o un client dentro de una transacción.
export async function recalcularEstadoVehiculo(db, idVehiculo) {
  const { rows } = await db.query(
    `UPDATE vehiculo v
     SET estado_vehiculo = CASE
       WHEN EXISTS (SELECT 1 FROM mantencion m
                    WHERE m.id_vehiculo = v.id_vehiculo
                      AND m.estado_mantencion = 'en_proceso')
         THEN 'en_mantencion'
       WHEN EXISTS (SELECT 1 FROM reporte_falla r
                    WHERE r.id_vehiculo = v.id_vehiculo
                      AND r.estado_reporte IN ('pendiente', 'derivado'))
         THEN 'no_operativo'
       ELSE 'operativo'
     END
     WHERE v.id_vehiculo = $1
     RETURNING estado_vehiculo`,
    [idVehiculo]
  );
  return rows[0]?.estado_vehiculo ?? null;
}

// Ejecuta fn(client) dentro de una transacción: o se aplica todo o nada.
export async function enTransaccion(pool, fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const resultado = await fn(client);
    await client.query("COMMIT");
    return resultado;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

// Error con un mensaje pensado para el usuario. El manejador central
// de app.js responde "Solicitud inválida" a todo 4xx; las rutas que
// necesitan explicar el motivo lanzan este error y lo responden tal
// cual (ver responderErrorPublico).
export function errorPublico(status, mensaje) {
  const error = new Error(mensaje);
  error.status = status;
  error.publico = true;
  return error;
}

// true si respondió el error (era público); false si hay que pasarlo
// al manejador central con next(error).
export function responderErrorPublico(res, error) {
  if (!error?.publico) return false;
  res.status(error.status).json({ error: error.message });
  return true;
}

// Fecha de hoy en Chile como "YYYY-MM-DD" (no la del reloj UTC del
// servidor: cerca de la medianoche serían días distintos).
export function hoyChile() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(new Date());
}

// ¿Es un string "YYYY-MM-DD" con una fecha real?
export function esFecha(valor) {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const d = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor;
}
