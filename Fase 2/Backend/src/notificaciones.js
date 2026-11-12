// ============================================================
// src/notificaciones.js
// ============================================================
// ÚNICO lugar que decide QUIÉN recibe cada notificación dentro de la
// app (HU11 y HU06 CA5). Las rutas las crean llamando a estas
// funciones DENTRO de su transacción: si el reporte o la derivación
// fallan, tampoco queda el aviso.
//
// "Vehículo asociado" (HU11) = vehículo de la compañía del usuario: en
// SIGMAVE los usuarios están ligados a una compañía, no a vehículos.
// Los administradores no reciben estos avisos: su compañía es nominal
// (ven todas) y ya tienen el panel de Fallas.
//
// Avisos dentro de la app, no push del sistema operativo: el front los
// consulta mientras la app está abierta (GET /api/notificaciones).

const MAX_EXTRACTO = 80;

const extracto = (texto) =>
  texto.length > MAX_EXTRACTO ? `${texto.slice(0, MAX_EXTRACTO - 1)}…` : texto;

// HU11: falla reportada -> usuarios de la compañía del vehículo,
// menos quien la reportó y los administradores.
// "db" es el client de la transacción.
export async function notificarFallaReportada(db, reporte) {
  const mensaje =
    `Nueva falla en ${reporte.nomenclatura} (urgencia ${reporte.urgencia}): ` +
    extracto(reporte.descripcion);
  await db.query(
    `INSERT INTO notificacion (id_usuario, tipo, mensaje, id_vehiculo, id_reporte_falla)
     SELECT u.id_usuario, 'falla_reportada', $1, $2, $3
     FROM usuario u
     JOIN rol r ON r.id_rol = u.id_rol
     WHERE u.id_compania = $4
       AND u.id_usuario <> $5
       AND r.nombre_rol <> 'administrador'`,
    [mensaje, reporte.id_vehiculo, reporte.id_reporte_falla, reporte.id_compania, reporte.id_usuario]
  );
}

// HU06 CA5: falla derivada -> Inspectores de Material Mayor de la
// compañía del vehículo (quien deriva no se avisa a sí mismo).
export async function notificarFallaDerivada(db, reporte, idUsuarioDeriva) {
  const mensaje =
    `Falla N° ${reporte.id_reporte_falla} de ${reporte.nomenclatura} derivada para mantención ` +
    `(urgencia ${reporte.urgencia}): ${extracto(reporte.descripcion)}`;
  await db.query(
    `INSERT INTO notificacion (id_usuario, tipo, mensaje, id_vehiculo, id_reporte_falla)
     SELECT u.id_usuario, 'falla_derivada', $1, $2, $3
     FROM usuario u
     JOIN rol r ON r.id_rol = u.id_rol
     WHERE u.id_compania = $4
       AND u.id_usuario <> $5
       AND r.nombre_rol = 'inspector_material_mayor'`,
    [mensaje, reporte.id_vehiculo, reporte.id_reporte_falla, reporte.id_compania, idUsuarioDeriva]
  );
}
