// ============================================================
// src/preventiva.js
// ============================================================
// Reglas de la mantención PREVENTIVA (definidas a partir de la
// entrevista a un bombero voluntario). ÚNICO lugar donde se definen:
// la API las usa en el cálculo y el front las lee de GET /api/config.
//
//   - Cada vehículo debe tener una preventiva cada MESES_PREVENTIVA.
//   - El plazo se cuenta desde la FECHA DE SALIDA de la última
//     preventiva (cuando realmente quedó hecha). Una preventiva sin
//     fecha de salida (todavía en el taller) no cuenta.
//   - Las mantenciones REACTIVAS no reinician el plazo.
//   - Se avisa DIAS_AVISO_PREVENTIVA días antes del vencimiento.
//   - Sin ninguna preventiva registrada: "sin_registro" (no vencida).
//   - Solo cuenta el tiempo (no el kilometraje), por ahora.

export const MESES_PREVENTIVA = 6;
export const DIAS_AVISO_PREVENTIVA = 30;

// Nombre del tipo en la tabla tipo_mantencion.
export const TIPO_PREVENTIVA = "preventiva";

// "Hoy" según Chile, no según el reloj UTC del servidor: cerca de la
// medianoche serían días distintos y un vencimiento cambiaría de día.
const SQL_HOY = "(now() AT TIME ZONE 'America/Santiago')::date";

// Columnas calculadas para el SELECT de vehículos (alias "prev" viene
// de JOIN_PREVENTIVA). Estados: sin_registro | vencida | proxima | al_dia
//   - vencida: ya pasó la fecha de vencimiento.
//   - proxima: vence dentro de los próximos DIAS_AVISO días (incluye
//              el mismo día del vencimiento).
export const COLUMNAS_PREVENTIVA = `
  prev.ultima_preventiva,
  prev.proxima_preventiva,
  (prev.proxima_preventiva - ${SQL_HOY}) AS dias_para_preventiva,
  CASE
    WHEN prev.ultima_preventiva IS NULL THEN 'sin_registro'
    WHEN prev.proxima_preventiva < ${SQL_HOY} THEN 'vencida'
    WHEN prev.proxima_preventiva - ${SQL_HOY} <= ${Number(DIAS_AVISO_PREVENTIVA)} THEN 'proxima'
    ELSE 'al_dia'
  END AS estado_preventiva
`;

// Última preventiva TERMINADA de cada vehículo (fecha de salida ya
// cumplida). "+ interval" de Postgres ajusta fin de mes: 31-08 + 6
// meses = 28-02 (o 29 en bisiesto), no 03-03.
export const JOIN_PREVENTIVA = `
  LEFT JOIN LATERAL (
    SELECT MAX(m.fecha_salida) AS ultima_preventiva,
           (MAX(m.fecha_salida) + INTERVAL '${Number(MESES_PREVENTIVA)} months')::date
             AS proxima_preventiva
    FROM mantencion m
    JOIN tipo_mantencion tm ON tm.id_tipo_mantencion = m.id_tipo_mantencion
    WHERE m.id_vehiculo = v.id_vehiculo
      AND tm.nombre = '${TIPO_PREVENTIVA}'
      AND m.fecha_salida IS NOT NULL
      AND m.fecha_salida <= ${SQL_HOY}
  ) prev ON true
`;
