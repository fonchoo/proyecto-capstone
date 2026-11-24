-- MTC_0430 · Volumen de prueba (solo en la base LOCAL) y su limpieza.
-- Se crea una compañía aparte (N° 99) para poder borrar todo al final sin tocar otros datos.
BEGIN;
INSERT INTO compania (numero_compania, nombre, comuna) VALUES (99, 'Compañía de Prueba de Rendimiento', 'Maipú');
INSERT INTO vehiculo (nomenclatura, patente, marca, modelo, ano_fabricacion, estado_vehiculo, id_compania, tipo)
SELECT 'P-' || i, 'ZZ' || lpad(i::text, 4, '0'),
       (ARRAY['Mercedes-Benz','Scania','Renault','Iveco','MAN','Volvo'])[1 + i % 6], 'Modelo prueba ' || i,
       2000 + i % 25, 'operativo', (SELECT id_compania FROM compania WHERE numero_compania = 99),
       (ARRAY['Bomba','Rescate','Escala','Cisterna','Forestal'])[1 + i % 5]
FROM generate_series(1, 300) AS i;
-- 2 preventivas finalizadas por vehículo, con fechas variadas (unas vencidas, otras próximas o al día).
INSERT INTO mantencion (fecha_ingreso, fecha_salida, kilometraje_ingreso, detalle_trabajo, proveedor, costo_total, mano_obra,
                        estado_mantencion, id_vehiculo, id_tipo_mantencion, id_usuario)
SELECT d.ingreso, d.ingreso + 2, 10000 + v.id_vehiculo * 10 + d.n * 5000, 'Mantención preventiva de prueba de rendimiento',
       'Taller de prueba', 300000, 100000, 'finalizada', v.id_vehiculo, 1, 1
FROM vehiculo v JOIN compania c ON c.id_compania = v.id_compania AND c.numero_compania = 99
CROSS JOIN LATERAL (VALUES (1, DATE '2026-11-20' - (v.id_vehiculo % 300) - 200), (2, DATE '2026-11-20' - (v.id_vehiculo % 200))) AS d(n, ingreso);
COMMIT;
ANALYZE vehiculo; ANALYZE mantencion;

-- Limpieza (ejecutada al terminar la prueba):
-- BEGIN;
-- DELETE FROM notificacion WHERE id_vehiculo IN (SELECT v.id_vehiculo FROM vehiculo v JOIN compania c USING (id_compania) WHERE c.numero_compania = 99);
-- DELETE FROM mantencion  WHERE id_vehiculo IN (SELECT v.id_vehiculo FROM vehiculo v JOIN compania c USING (id_compania) WHERE c.numero_compania = 99);
-- DELETE FROM vehiculo    WHERE id_compania IN (SELECT id_compania FROM compania WHERE numero_compania = 99);
-- DELETE FROM compania    WHERE numero_compania = 99;
-- COMMIT;
