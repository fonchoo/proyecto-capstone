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

import { Router } from "express";
import { pool } from "../db.js";
import { requireRol } from "../auth.js";
import {
  filtroCompanias,
  puedeUsarVehiculo,
  puedeVerCompania,
} from "../alcance.js";
import { COLUMNAS_PREVENTIVA, JOIN_PREVENTIVA } from "../preventiva.js";

const router = Router();

const SELECT_VEHICULO = `
  SELECT v.id_vehiculo, v.nomenclatura, v.patente, v.marca, v.modelo,
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

// ---------- POST /api/vehiculos (crear) ----------
router.post("/", async (req, res, next) => {
  try {
    const {
      nomenclatura,
      patente,
      marca,
      modelo,
      ano_fabricacion,
      estado_vehiculo,
      id_compania,
    } = req.body;

    if (!nomenclatura || !id_compania) {
      return res.status(400).json({
        error: 'Se requieren "nomenclatura" (texto) e "id_compania" (número)',
      });
    }
    if (!puedeVerCompania(req.usuario, id_compania)) {
      return res.status(403).json(OTRA_COMPANIA);
    }

    const { rows } = await pool.query(
      `INSERT INTO vehiculo
         (nomenclatura, patente, marca, modelo, ano_fabricacion, estado_vehiculo, id_compania)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        nomenclatura,
        patente || null,
        marca || null,
        modelo || null,
        ano_fabricacion || null,
        estado_vehiculo || "operativo",
        id_compania,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ---------- PUT /api/vehiculos/:id (actualizar) ----------
router.put("/:id", async (req, res, next) => {
  try {
    const {
      nomenclatura,
      patente,
      marca,
      modelo,
      ano_fabricacion,
      estado_vehiculo,
      id_compania,
    } = req.body;

    if (!nomenclatura || !id_compania) {
      return res.status(400).json({
        error: 'Se requieren "nomenclatura" (texto) e "id_compania" (número)',
      });
    }
    // El vehículo actual tiene que estar en su alcance...
    if (!(await puedeUsarVehiculo(req.usuario, req.params.id))) {
      return res.status(404).json(NO_ENCONTRADO);
    }
    // ...y no puede moverlo a una compañía fuera de su alcance.
    if (!puedeVerCompania(req.usuario, id_compania)) {
      return res.status(403).json(OTRA_COMPANIA);
    }

    const { rows } = await pool.query(
      `UPDATE vehiculo
       SET nomenclatura = $1, patente = $2, marca = $3, modelo = $4,
           ano_fabricacion = $5, estado_vehiculo = $6, id_compania = $7
       WHERE id_vehiculo = $8 RETURNING *`,
      [
        nomenclatura,
        patente || null,
        marca || null,
        modelo || null,
        ano_fabricacion || null,
        estado_vehiculo || "operativo",
        id_compania,
        req.params.id,
      ]
    );
    if (rows.length === 0) {
      return res.status(404).json(NO_ENCONTRADO);
    }
    res.json(rows[0]);
  } catch (error) {
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
