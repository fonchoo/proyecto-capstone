-- ============================================================
-- supabase/migrations/20261112010415_vehiculo_tipo_patente_unica.sql
-- ============================================================
-- HU03 (crear ficha de vehículo), criterios de aceptación:
--   CA2: tipo, marca, año y patente son obligatorios.
--   CA5: no se puede registrar una patente que ya existe.
--
-- 1) Columna "tipo" (Bomba, Rescate, Escala, ...): texto libre, el
--    front solo sugiere valores. Queda NULL-able: los vehículos que ya
--    existen no lo tienen. La obligatoriedad de tipo, marca, año y
--    patente la exige la API (src/routes/vehiculos.js) al crear y al
--    editar. No va como CHECK en la base porque recalcularEstadoVehiculo
--    hace UPDATE sobre vehículos antiguos sin esos datos y fallaría.
--
-- 2) Patente única. La API la guarda NORMALIZADA (mayúsculas, sin
--    guiones, puntos ni espacios: "klht-21" -> "KLHT21"), así "KLHT21"
--    y "KLHT-21" cuentan como la misma. El CHECK obliga a ese formato
--    para que nadie la guarde distinta desde Studio y se salte el UNIQUE.
--    La patente es nacional: es única en TODAS las compañías.
-- ============================================================

ALTER TABLE vehiculo ADD COLUMN IF NOT EXISTS tipo VARCHAR(255);

-- 2a) Normaliza las patentes existentes (vacías -> NULL).
UPDATE vehiculo
SET patente = NULLIF(upper(regexp_replace(patente, '[^A-Za-z0-9]', '', 'g')), '')
WHERE patente IS NOT NULL;

-- 2b) Si en una base local quedaron duplicados (p. ej. por correr
--     varias veces un caso de prueba), la patente se conserva en el
--     vehículo más antiguo y se borra en los demás. Sin esto, el
--     UNIQUE de abajo fallaría en esas bases.
UPDATE vehiculo v
SET patente = NULL
WHERE patente IS NOT NULL
  AND EXISTS (SELECT 1 FROM vehiculo o
              WHERE o.patente = v.patente AND o.id_vehiculo < v.id_vehiculo);

-- 2c) Las restricciones.
ALTER TABLE vehiculo
  ADD CONSTRAINT chk_vehiculo_patente_normalizada
  CHECK (patente IS NULL OR patente ~ '^[A-Z0-9]+$');

ALTER TABLE vehiculo
  ADD CONSTRAINT uq_vehiculo_patente UNIQUE (patente);
