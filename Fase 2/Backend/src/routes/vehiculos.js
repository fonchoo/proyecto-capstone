// ============================================================
// src/routes/vehiculos.js
// ============================================================
// CRUD de la tabla "vehiculo" (con nombre de compañía incluido).
// Cada vehículo trae además su estado de mantención preventiva
// (última, próxima, días restantes y estado), ver src/preventiva.js.
//
// Alcance (src/alcance.js): cada usuario solo ve y modifica los
// vehículos de las compañías que tiene visibles. Un vehículo fuera
// de su alcance responde 404, como si no existiera.
//
// Permisos: ver, cualquier rol. Crear y editar (HU03/HU04), solo
// ROLES_VEHICULOS (Teniente Tercero en adelante). Eliminar, solo el
// administrador.

import { Router } from "express";
import { pool } from "../db.js";
import { ROLES_VEHICULOS, requireRol } from "../auth.js";
import {
  filtroCompanias,
  puedeUsarVehiculo,
  puedeVerCompania,
} from "../alcance.js";
import { COLUMNAS_PREVENTIVA, JOIN_PREVENTIVA } from "../preventiva.js";
import { hoyChile } from "../estadoVehiculo.js";
import {
  ANIO_MIN_VEHICULO,
  esPatente,
  normalizarNomenclatura,
  normalizarPatente,
  texto,
} from "../validaciones.js";
import { MARCAS_VEHICULO, MODELO_MAX, TIPOS_VEHICULO } from "../catalogoVehiculos.js";

const router = Router();

const ESTADOS = ["operativo", "no_operativo", "en_mantencion"];
// Valida el cuerpo de POST y PUT (HU03 CA2/CA4, HU04 CA3/CA6). Obligatorios:
// nomenclatura, tipo, patente, marca, año y compañía; el modelo es
// opcional. Formatos en src/validaciones.js y listas en
// src/catalogoVehiculos.js. Devuelve { datos } normalizados o
// { errores } por campo.
function validarVehiculo(body) {
  const datos = {
    nomenclatura: normalizarNomenclatura(body.nomenclatura),
    tipo: texto(body.tipo),
    patente: normalizarPatente(body.patente),
    marca: texto(body.marca),
    modelo: texto(body.modelo) || null,
    ano_fabricacion: Number(body.ano_fabricacion),
    id_compania: Number(body.id_compania),
  };
  const errores = {};
  const maxAnio = Number(hoyChile().slice(0, 4)) + 1;

  if (!texto(body.nomenclatura)) errores.nomenclatura = "La nomenclatura es obligatoria";
  else if (!datos.nomenclatura) {
    errores.nomenclatura = "Usa la sigla y el número del carro, por ejemplo B-1 o BX-2";
  }

  if (!datos.tipo) errores.tipo = "El tipo es obligatorio";
  else if (!TIPOS_VEHICULO.includes(datos.tipo)) errores.tipo = "Elige un tipo de la lista";

  if (!datos.patente) errores.patente = "La patente es obligatoria";
  else if (!esPatente(datos.patente)) {
    errores.patente = "La patente debe ser de 4 letras y 2 números (KLHT-21) o de 2 letras y 4 números (AB-1234)";
  }

  if (!datos.marca) errores.marca = "La marca es obligatoria";
  else if (!Object.hasOwn(MARCAS_VEHICULO, datos.marca)) errores.marca = "Elige una marca de la lista";

  if (datos.modelo && datos.modelo.length > MODELO_MAX) {
    errores.modelo = `Máximo ${MODELO_MAX} caracteres`;
  }
  if (
    !Number.isInteger(datos.ano_fabricacion) ||
    datos.ano_fabricacion < ANIO_MIN_VEHICULO ||
    datos.ano_fabricacion > maxAnio
  ) {
    errores.ano_fabricacion = `Año inválido (${ANIO_MIN_VEHICULO} - ${maxAnio})`;
  }
  if (!Number.isInteger(datos.id_compania)) errores.id_compania = "Selecciona una compañía";

  return Object.keys(errores).length ? { errores } : { datos };
}

// 400 con un mensaje legible y el detalle por campo (el front lo
// muestra bajo cada input).
function responderErrores(res, errores) {
  return res.status(400).json({
    error: Object.values(errores).join(". "),
    campos: errores,
  });
}

// Patente o nomenclatura repetida (UNIQUE de la base): el 409 lleva el
// mensaje bajo el campo que corresponde, o null si es otro error.
// - Patente (uq_vehiculo_patente): única en TODAS las compañías, es la
//   del registro nacional de vehículos.
// - Nomenclatura (uq_vehiculo_compania_nomenclatura): única dentro de
//   cada compañía; la B-1 de la Primera y la B-1 de la Segunda conviven.
function duplicado(error, datos) {
  if (error?.code !== "23505") return null;
  if (error.constraint === "uq_vehiculo_patente") {
    return {
      error: `Ya existe un vehículo registrado con la patente ${datos.patente}`,
      campos: { patente: "Esta patente ya está registrada" },
    };
  }
  if (error.constraint === "uq_vehiculo_compania_nomenclatura") {
    return {
      error: `La compañía ya tiene un vehículo ${datos.nomenclatura}`,
      campos: { nomenclatura: "Esta compañía ya tiene un vehículo con esa nomenclatura" },
    };
  }
  return null;
}

const SELECT_VEHICULO = `
  SELECT v.id_vehiculo, v.nomenclatura, v.tipo, v.patente, v.marca, v.modelo,
         v.ano_fabricacion, v.estado_vehiculo,
         c.id_compania, c.nombre AS nombre_compania,
         ${COLUMNAS_PREVENTIVA}
  FROM vehiculo v
  JOIN compania c ON c.id_compania = v.id_compania
  ${JOIN_PREVENTIVA}
`;

const NO_ENCONTRADO = { error: "Vehículo no encontrado" };
const OTRA_COMPANIA = {
  error: "No puedes asignar vehículos a una compañía que no es la tuya",
};

// ---------- GET /api/vehiculos (listar) ----------
// ?id_compania=N filtra por compañía (selector del administrador).
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `${SELECT_VEHICULO}
       WHERE ($1::int[] IS NULL OR v.id_compania = ANY($1))
       ORDER BY v.id_vehiculo`,
      [filtroCompanias(req)]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// ---------- GET /api/vehiculos/:id (uno solo) ----------
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `${SELECT_VEHICULO} WHERE v.id_vehiculo = $1`,
      [req.params.id]
    );
    if (rows.length === 0 || !puedeVerCompania(req.usuario, rows[0].id_compania)) {
      return res.status(404).json(NO_ENCONTRADO);
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ---------- POST /api/vehiculos (crear, HU03) ----------
// El estado inicial se puede elegir (por defecto "operativo"); desde
// ahí lo mantiene src/estadoVehiculo.js con cada falla o mantención.
router.post("/", requireRol(...ROLES_VEHICULOS), async (req, res, next) => {
  const { datos, errores } = validarVehiculo(req.body);
  if (errores) return responderErrores(res, errores);

  const estado = req.body.estado_vehiculo || "operativo";
  if (!ESTADOS.includes(estado)) {
    return responderErrores(res, { estado_vehiculo: "Estado inválido" });
  }
  if (!puedeVerCompania(req.usuario, datos.id_compania)) {
    return res.status(403).json(OTRA_COMPANIA);
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO vehiculo
         (nomenclatura, tipo, patente, marca, modelo, ano_fabricacion, estado_vehiculo, id_compania)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        datos.nomenclatura,
        datos.tipo,
        datos.patente,
        datos.marca,
        datos.modelo,
        datos.ano_fabricacion,
        estado,
        datos.id_compania,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    const conflicto = duplicado(error, datos);
    if (conflicto) return res.status(409).json(conflicto);
    next(error);
  }
});

// ---------- PUT /api/vehiculos/:id (editar, HU04) ----------
// El estado NO se edita: lo calcula src/estadoVehiculo.js a partir de
// las fallas y mantenciones, y un valor puesto a mano mentiría.
router.put("/:id", requireRol(...ROLES_VEHICULOS), async (req, res, next) => {
  const { datos, errores } = validarVehiculo(req.body);
  if (errores) return responderErrores(res, errores);

  try {
    // El vehículo actual tiene que estar en su alcance...
    if (!(await puedeUsarVehiculo(req.usuario, req.params.id))) {
      return res.status(404).json(NO_ENCONTRADO);
    }
    // ...y no puede moverlo a una compañía fuera de su alcance.
    if (!puedeVerCompania(req.usuario, datos.id_compania)) {
      return res.status(403).json(OTRA_COMPANIA);
    }

    const { rows } = await pool.query(
      `UPDATE vehiculo
       SET nomenclatura = $1, tipo = $2, patente = $3, marca = $4, modelo = $5,
           ano_fabricacion = $6, id_compania = $7
       WHERE id_vehiculo = $8 RETURNING *`,
      [
        datos.nomenclatura,
        datos.tipo,
        datos.patente,
        datos.marca,
        datos.modelo,
        datos.ano_fabricacion,
        datos.id_compania,
        req.params.id,
      ]
    );
    if (rows.length === 0) {
      return res.status(404).json(NO_ENCONTRADO);
    }
    res.json(rows[0]);
  } catch (error) {
    const conflicto = duplicado(error, datos);
    if (conflicto) return res.status(409).json(conflicto);
    next(error);
  }
});

// ---------- DELETE /api/vehiculos/:id (eliminar) ----------
// Solo administrador. Un vehículo con mantenciones o reportes de
// falla NO se puede borrar (FK ON DELETE RESTRICT): su historial se
// conserva.
router.delete("/:id", requireRol("administrador"), async (req, res, next) => {
  try {
    if (!(await puedeUsarVehiculo(req.usuario, req.params.id))) {
      return res.status(404).json(NO_ENCONTRADO);
    }
    const { rowCount } = await pool.query(
      "DELETE FROM vehiculo WHERE id_vehiculo = $1",
      [req.params.id]
    );
    if (rowCount === 0) {
      return res.status(404).json(NO_ENCONTRADO);
    }
    res.status(204).end();
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        error:
          "El vehículo tiene mantenciones o reportes de falla registrados y no se puede eliminar",
      });
    }
    next(error);
  }
});

export default router;
