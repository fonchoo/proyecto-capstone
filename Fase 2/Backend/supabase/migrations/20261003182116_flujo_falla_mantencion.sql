-- ============================================================
-- supabase/migrations/20261003182116_flujo_falla_mantencion.sql
-- ============================================================
-- Flujo completo falla -> derivación -> mantención (HU05, HU06, HU07):
--
--   1. Un bombero reporta una falla        -> reporte "pendiente"
--   2. El Teniente Tercero la deriva       -> reporte "derivado"
--   3. Se registra la mantención que la    -> reporte enlazado a la
--      resuelve (reactiva)                    mantención (id_mantencion)
--   4. La mantención se finaliza           -> reporte "resuelto"
--      (se registra la fecha de salida)
--
-- El estado del VEHÍCULO lo recalcula la API en cada paso (ver
-- Backend/src/estadoVehiculo.js).
-- ============================================================

-- ------------------------------------------------------------
-- reporte_falla: estado "derivado" + trazabilidad
-- ------------------------------------------------------------
-- "en_revision" no se usaba: la historia HU06 habla de "Derivado".
ALTER TABLE reporte_falla DROP CONSTRAINT IF EXISTS chk_reporte_falla_estado;
UPDATE reporte_falla SET estado_reporte = 'derivado' WHERE estado_reporte = 'en_revision';
ALTER TABLE reporte_falla
  ADD CONSTRAINT chk_reporte_falla_estado CHECK
    (estado_reporte IN ('pendiente', 'derivado', 'resuelto'));

ALTER TABLE reporte_falla
  -- Quién derivó y cuándo (HU06).
  ADD COLUMN IF NOT EXISTS fecha_derivacion  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS id_usuario_deriva INTEGER,
  -- Mantención que resuelve la falla (HU07).
  ADD COLUMN IF NOT EXISTS id_mantencion     INTEGER;

ALTER TABLE reporte_falla
  ADD CONSTRAINT fk_usuario_id_usuario_deriva_reporte_falla
    FOREIGN KEY (id_usuario_deriva) REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
  -- RESTRICT: no se puede borrar una mantención que resolvió fallas
  -- (se perdería la trazabilidad).
  ADD CONSTRAINT fk_mantencion_id_mantencion_reporte_falla
    FOREIGN KEY (id_mantencion) REFERENCES mantencion(id_mantencion) ON DELETE RESTRICT,
  -- Un reporte derivado sabe quién y cuándo lo derivó.
  ADD CONSTRAINT chk_reporte_falla_derivacion CHECK
    (estado_reporte = 'pendiente'
     OR (fecha_derivacion IS NOT NULL AND id_usuario_deriva IS NOT NULL)),
  -- Solo un reporte ya derivado puede quedar enlazado a una mantención.
  ADD CONSTRAINT chk_reporte_falla_mantencion CHECK
    (id_mantencion IS NULL OR estado_reporte IN ('derivado', 'resuelto'));

CREATE INDEX IF NOT EXISTS idx_reporte_falla_mantencion ON reporte_falla(id_mantencion);

-- ------------------------------------------------------------
-- mantencion: el estado depende de la fecha de salida
-- ------------------------------------------------------------
-- Antes el formulario nunca enviaba el estado y toda mantención
-- quedaba "en_proceso" aunque tuviera fecha de salida. Se normaliza:
--   sin fecha de salida -> en_proceso
--   con fecha de salida -> finalizada
UPDATE mantencion
SET estado_mantencion = CASE WHEN fecha_salida IS NULL THEN 'en_proceso' ELSE 'finalizada' END;

ALTER TABLE mantencion
  ADD CONSTRAINT chk_mantencion_estado CHECK
    (estado_mantencion IN ('en_proceso', 'finalizada')),
  ADD CONSTRAINT chk_mantencion_estado_segun_salida CHECK
    ((estado_mantencion = 'en_proceso' AND fecha_salida IS NULL)
     OR (estado_mantencion = 'finalizada' AND fecha_salida IS NOT NULL)),
  ADD CONSTRAINT chk_mantencion_salida_despues_ingreso CHECK
    (fecha_salida IS NULL OR fecha_salida >= fecha_ingreso);
