-- ============================================================
-- Evidencias/Pruebas/Sprint 2/datos_alertas_preventiva.sql
-- ============================================================
-- Prepara los datos para probar las alertas de mantención preventiva
-- (HU09, HU10: MTC_0290, MTC_0300, MTC_0302, MTC_0310).
--
-- Con el seed, ninguna preventiva está cerca de vencer (la próxima de
-- B-1 es en marzo de 2027). Este script mueve las fechas para que,
-- contando desde HOY (hora de Chile):
--   B-1 (Primera Compañía) -> preventiva PRÓXIMA: vence en 20 días.
--   R-1 (Primera Compañía) -> preventiva VENCIDA hace 10 días (se le
--                             agrega una preventiva antigua; con el
--                             seed no tiene ninguna).
--   B-2 (Segunda Compañía) -> preventiva VENCIDA hace 5 días.
--
-- Uso (desde Backend/, después de "npx supabase db reset"):
--   docker exec -i supabase_db_sigmave psql -U postgres -d postgres < "../Evidencias/Pruebas/Sprint 2/datos_alertas_preventiva.sql"
-- o pegarlo en el SQL Editor de Studio (http://127.0.0.1:55323).
--
-- La fecha de salida se calcula como (vencimiento deseado - 6 meses):
-- la API suma 6 meses a la salida para obtener el vencimiento.
-- ============================================================

-- B-1: mantención preventiva del seed (id 1) -> vence en 20 días.
UPDATE mantencion
SET fecha_salida  = (((now() AT TIME ZONE 'America/Santiago')::date + 20) - INTERVAL '6 months')::date,
    fecha_ingreso = (((now() AT TIME ZONE 'America/Santiago')::date + 18) - INTERVAL '6 months')::date
WHERE id_mantencion = 1;

-- B-2: mantención preventiva del seed (id 3) -> venció hace 5 días.
UPDATE mantencion
SET fecha_salida  = (((now() AT TIME ZONE 'America/Santiago')::date - 5) - INTERVAL '6 months')::date,
    fecha_ingreso = (((now() AT TIME ZONE 'America/Santiago')::date - 7) - INTERVAL '6 months')::date
WHERE id_mantencion = 3;

-- R-1: preventiva antigua (registrada por inspector.c1, id 5) -> venció hace 10 días.
INSERT INTO mantencion (fecha_ingreso, fecha_salida, kilometraje_ingreso, detalle_trabajo,
                        proveedor, costo_total, mano_obra, estado_mantencion,
                        id_vehiculo, id_tipo_mantencion, id_usuario)
VALUES ((((now() AT TIME ZONE 'America/Santiago')::date - 12) - INTERVAL '6 months')::date,
        (((now() AT TIME ZONE 'America/Santiago')::date - 10) - INTERVAL '6 months')::date,
        85000, 'Preventiva semestral', 'Servicio Técnico Renault',
        300000, 100000, 'finalizada', 2, 1, 5);

-- Verificación: vencimiento y días restantes de cada vehículo.
SELECT v.nomenclatura,
       MAX(m.fecha_salida) AS ultima_preventiva,
       (MAX(m.fecha_salida) + INTERVAL '6 months')::date AS vence,
       (MAX(m.fecha_salida) + INTERVAL '6 months')::date
         - (now() AT TIME ZONE 'America/Santiago')::date AS dias_restantes
FROM vehiculo v
JOIN mantencion m ON m.id_vehiculo = v.id_vehiculo AND m.id_tipo_mantencion = 1
WHERE m.fecha_salida IS NOT NULL
GROUP BY v.nomenclatura
ORDER BY v.nomenclatura;
