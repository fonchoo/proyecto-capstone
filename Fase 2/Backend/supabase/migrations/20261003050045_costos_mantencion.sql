-- ============================================================
-- supabase/migrations/20261003050045_costos_mantencion.sql
-- ============================================================
-- Define qué significa cada costo de una mantención:
--
--   costo_total = repuestos/insumos + mano_obra
--
-- El costo de repuestos NO se guarda: se deriva (costo_total -
-- mano_obra). costo_total lo calcula SIEMPRE la API a partir de lo
-- que se ingresa en el formulario (repuestos y mano de obra), así que
-- nadie suma a mano. Estas restricciones son el respaldo en la base:
-- aunque alguien escriba directo por SQL/Studio, los montos no pueden
-- quedar inconsistentes.
-- ============================================================

ALTER TABLE mantencion
  ADD CONSTRAINT chk_mantencion_costo_total_no_negativo
    CHECK (costo_total IS NULL OR costo_total >= 0),
  ADD CONSTRAINT chk_mantencion_mano_obra_no_negativa
    CHECK (mano_obra IS NULL OR mano_obra >= 0),
  -- La mano de obra es PARTE del total: no puede superarlo, y no
  -- puede existir sin un total.
  ADD CONSTRAINT chk_mantencion_mano_obra_dentro_del_total
    CHECK (mano_obra IS NULL OR (costo_total IS NOT NULL AND mano_obra <= costo_total));

COMMENT ON COLUMN mantencion.costo_total IS
  'Repuestos/insumos + mano de obra. Lo calcula la API.';
COMMENT ON COLUMN mantencion.mano_obra IS
  'Parte del costo_total correspondiente a mano de obra.';
