// ============================================================
// src/alcance.js
// ============================================================
// ÚNICA regla de "qué compañías puede ver/modificar un usuario".
// Todas las rutas preguntan acá; ninguna decide por su cuenta.
//
// Hoy:
//   - administrador -> todas las compañías (con selector en el front)
//   - resto         -> solo su compañía
//
// Para sumar un administrador de Cuerpo de Bomberos o de región,
// se cambia SOLO companiasVisibles() (p. ej. devolviendo los ids de
// las compañías de su Cuerpo). Las rutas no se tocan.

import { pool } from "./db.js";

// null = sin restricción (todas). Array = solo esos ids.
export function companiasVisibles(usuario) {
  if (usuario.nombre_rol === "administrador") return null;
  return [usuario.id_compania];
}

export function puedeVerCompania(usuario, idCompania) {
  const visibles = companiasVisibles(usuario);
  return visibles === null || visibles.includes(Number(idCompania));
}

// Filtro para los listados: combina el alcance del usuario con el
// selector opcional "?id_compania=" (lo usa el administrador).
// Devuelve null (todas) o un array de ids para usar en SQL como:
//   WHERE ($1::int[] IS NULL OR v.id_compania = ANY($1))
// Pedir una compañía fuera del alcance devuelve [] (lista vacía).
export function filtroCompanias(req) {
  const visibles = companiasVisibles(req.usuario);
  const pedida = req.query.id_compania;

  if (pedida === undefined || pedida === "") return visibles;

  const id = Number(pedida);
  if (!Number.isInteger(id)) return [];
  if (visibles !== null && !visibles.includes(id)) return [];
  return [id];
}

// Compañía dueña de un vehículo (null si no existe).
export async function companiaDeVehiculo(idVehiculo) {
  const { rows } = await pool.query(
    "SELECT id_compania FROM vehiculo WHERE id_vehiculo = $1",
    [idVehiculo]
  );
  return rows.length ? rows[0].id_compania : null;
}

// ¿Este usuario puede operar sobre este vehículo? (existe y está en
// su alcance). Un vehículo fuera del alcance se trata como
// inexistente, para no revelar qué hay en otras compañías.
export async function puedeUsarVehiculo(usuario, idVehiculo) {
  const idCompania = await companiaDeVehiculo(idVehiculo);
  return idCompania !== null && puedeVerCompania(usuario, idCompania);
}
