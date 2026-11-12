// ============================================================
// src/routes/notificaciones.js
// ============================================================
// Notificaciones dentro de la app del USUARIO DE LA SESIÓN (HU11).
// Cada usuario solo ve y marca las suyas: el id_usuario sale siempre
// de la sesión, nunca de la URL ni del body.
//
// Quién recibe cada aviso lo decide src/notificaciones.js; acá solo se
// leen y se marcan como leídas.

import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// Cuántas se devuelven en el listado (las más recientes).
const LIMITE = 20;

// ---------- GET /api/notificaciones ----------
// { no_leidas, notificaciones: [...] }. El front lo consulta cada
// cierto tiempo mientras la app está abierta.
router.get("/", async (req, res, next) => {
  try {
    const [lista, conteo] = await Promise.all([
      pool.query(
        `SELECT n.id_notificacion, n.tipo, n.mensaje, n.id_vehiculo,
                n.id_reporte_falla, n.creada_en, n.leida_en
         FROM notificacion n
         WHERE n.id_usuario = $1
         ORDER BY n.creada_en DESC, n.id_notificacion DESC
         LIMIT ${LIMITE}`,
        [req.usuario.id_usuario]
      ),
      pool.query(
        "SELECT COUNT(*)::int AS no_leidas FROM notificacion WHERE id_usuario = $1 AND leida_en IS NULL",
        [req.usuario.id_usuario]
      ),
    ]);
    res.json({ no_leidas: conteo.rows[0].no_leidas, notificaciones: lista.rows });
  } catch (error) {
    next(error);
  }
});

// ---------- PATCH /api/notificaciones/leer-todas ----------
// Va ANTES de "/:id/leer" para que "leer-todas" no se tome como id.
router.patch("/leer-todas", async (req, res, next) => {
  try {
    await pool.query(
      "UPDATE notificacion SET leida_en = now() WHERE id_usuario = $1 AND leida_en IS NULL",
      [req.usuario.id_usuario]
    );
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// ---------- PATCH /api/notificaciones/:id/leer ----------
// Una notificación de otro usuario responde 404, como si no existiera.
router.patch("/:id/leer", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(404).json({ error: "Notificación no encontrada" });
    }
    const { rowCount } = await pool.query(
      `UPDATE notificacion SET leida_en = COALESCE(leida_en, now())
       WHERE id_notificacion = $1 AND id_usuario = $2`,
      [id, req.usuario.id_usuario]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: "Notificación no encontrada" });
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
