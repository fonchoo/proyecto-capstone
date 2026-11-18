-- ============================================================
-- supabase/migrations/20261118152513_vehiculo_nomenclatura_unica_por_compania.sql
-- ============================================================
-- La nomenclatura del carro ("B-1", "BX-2") identifica al vehículo
-- dentro de su compañía: hasta ahora se podían registrar dos B-1 en la
-- misma compañía. Desde acá es ÚNICA POR COMPAÑÍA (la B-1 de la
-- Primera y la B-1 de la Segunda conviven).
--
-- La API la guarda normalizada ("b1" / "B 1" -> "B-1", ver
-- normalizarNomenclatura en src/validaciones.js), así que el UNIQUE
-- compara siempre el mismo formato.
-- ============================================================

-- 1) Normaliza las existentes: mayúsculas, sin espacios y con guion
--    entre la sigla y el número ("b1" -> "B-1").
UPDATE vehiculo
SET nomenclatura = regexp_replace(
  upper(regexp_replace(nomenclatura, '\s+', '', 'g')),
  '^([A-Z]{1,3})-?(\d{1,3})$',
  '\1-\2'
)
WHERE nomenclatura IS DISTINCT FROM regexp_replace(
  upper(regexp_replace(nomenclatura, '\s+', '', 'g')),
  '^([A-Z]{1,3})-?(\d{1,3})$',
  '\1-\2'
);

-- 2) Si una base ya tiene repetidos en la misma compañía (p. ej. por
--    correr varias veces un caso de prueba), el más antiguo conserva
--    la nomenclatura y los demás quedan como "B-1 (id 12)" para que se
--    vean y se corrijan a mano. Sin esto, el UNIQUE fallaría.
UPDATE vehiculo v
SET nomenclatura = v.nomenclatura || ' (id ' || v.id_vehiculo || ')'
WHERE EXISTS (
  SELECT 1 FROM vehiculo o
  WHERE o.id_compania = v.id_compania
    AND o.nomenclatura = v.nomenclatura
    AND o.id_vehiculo < v.id_vehiculo
);

-- 3) La restricción.
ALTER TABLE vehiculo
  ADD CONSTRAINT uq_vehiculo_compania_nomenclatura UNIQUE (id_compania, nomenclatura);
