-- ============================================================
-- supabase/seed.sql
-- ============================================================
-- supabase/config.toml declara [db.seed] sql_paths = ["./seed.sql"]:
-- "supabase start" (la primera vez) y "supabase db reset" lo corren
-- DESPUES de aplicar las migraciones.
--
-- Datos iniciales que replica la BD que existia en el PostgreSQL
-- local del host (antes de dockerizar la base):
--   - 4 roles
--   - 2 compañías (Primera y Segunda)
--   - 2 usuarios administradores (globales, ven todas las compañías)
--   - 6 usuarios de prueba: bombero, teniente tercero e inspector de
--     material mayor en CADA compañía
--   - 3 vehículos (2 de la Primera, 1 de la Segunda), cada uno con
--     una mantención registrada
--
-- Es IDEMPOTENTE: usa ids fijos + ON CONFLICT DO NOTHING, asi que
-- repetirlo no duplica filas. Al final resincroniza las secuencias.
-- ============================================================

-- Roles
INSERT INTO rol (id_rol, nombre_rol) VALUES
  (1, 'bombero'),
  (2, 'teniente_tercero'),
  (3, 'inspector_material_mayor'),
  (4, 'administrador')
ON CONFLICT (id_rol) DO NOTHING;

-- Compañías
INSERT INTO compania (id_compania, numero_compania, nombre, direccion, comuna) VALUES
  (1, 1, 'Primera compañia', 'Direccion #123', 'Maipu'),
  (2, 2, 'Segunda Compañía', 'Direccion #456', 'Maipu')
ON CONFLICT (id_compania) DO NOTHING;

-- Usuarios administradores de prueba
-- Password de ambos: admin1234 (bcrypt, cost 12)
--
-- OJO: "password" SIEMPRE va como hash bcrypt, nunca en texto plano:
-- el login compara con bcrypt.compare y la tabla tiene un CHECK que
-- rechaza cualquier otra cosa (ver migracion password_bcrypt).
-- Para generar uno nuevo desde SQL:
--   extensions.crypt('mi_clave', extensions.gen_salt('bf', 12))
--
-- "ON CONFLICT DO NOTHING" SIN columna: ignora cualquier duplicado
-- (id, email o rut), no solo el id. Asi el seed no falla en una base
-- donde esos datos ya existen con otro id.
INSERT INTO usuario (id_usuario, rut, nombre_completo, email, password, id_rol, id_compania) VALUES
  (1, '123456789', 'Administrador', 'administrador@gmail.com',
   '$2a$12$NhfoUkbg4sc04kf5UKO23uFXo7vSYEysSzM7qcwU/MtwoTEI5U4P2', 4, 1),
  (2, '111111111', 'Admin', 'admin@admin.cl',
   '$2a$12$NhfoUkbg4sc04kf5UKO23uFXo7vSYEysSzM7qcwU/MtwoTEI5U4P2', 4, 1)
ON CONFLICT DO NOTHING;

-- Usuarios de prueba: uno por rol en cada compañía.
-- Password de todos: prueba1234 (bcrypt, cost 12)
--   Primera  -> bombero.c1@sigmave.cl, teniente.c1@sigmave.cl, inspector.c1@sigmave.cl
--   Segunda  -> bombero.c2@sigmave.cl, teniente.c2@sigmave.cl, inspector.c2@sigmave.cl
INSERT INTO usuario (id_usuario, rut, nombre_completo, email, password, id_rol, id_compania) VALUES
  (3, '200000001', 'Bombero Primera',   'bombero.c1@sigmave.cl',
   '$2b$12$oGzAOWhvgNpE3YJOVq18De/6ZJMuY.IKmmJblJTA6Ju4YKhl8IhDO', 1, 1),
  (4, '200000002', 'Teniente Primera',  'teniente.c1@sigmave.cl',
   '$2b$12$oGzAOWhvgNpE3YJOVq18De/6ZJMuY.IKmmJblJTA6Ju4YKhl8IhDO', 2, 1),
  (5, '200000003', 'Inspector Primera', 'inspector.c1@sigmave.cl',
   '$2b$12$oGzAOWhvgNpE3YJOVq18De/6ZJMuY.IKmmJblJTA6Ju4YKhl8IhDO', 3, 1),
  (6, '300000001', 'Bombero Segunda',   'bombero.c2@sigmave.cl',
   '$2b$12$oGzAOWhvgNpE3YJOVq18De/6ZJMuY.IKmmJblJTA6Ju4YKhl8IhDO', 1, 2),
  (7, '300000002', 'Teniente Segunda',  'teniente.c2@sigmave.cl',
   '$2b$12$oGzAOWhvgNpE3YJOVq18De/6ZJMuY.IKmmJblJTA6Ju4YKhl8IhDO', 2, 2),
  (8, '300000003', 'Inspector Segunda', 'inspector.c2@sigmave.cl',
   '$2b$12$oGzAOWhvgNpE3YJOVq18De/6ZJMuY.IKmmJblJTA6Ju4YKhl8IhDO', 3, 2)
ON CONFLICT DO NOTHING;

-- Tipos de mantención
INSERT INTO tipo_mantencion (id_tipo_mantencion, nombre, descripcion) VALUES
  (1, 'preventiva', 'Mantención preventiva programada'),
  (2, 'reactiva', 'Mantención reactiva por falla')
ON CONFLICT (id_tipo_mantencion) DO NOTHING;

-- Vehículos: 2 de la Primera compañía, 1 de la Segunda.
INSERT INTO vehiculo (id_vehiculo, nomenclatura, patente, marca, modelo, ano_fabricacion, estado_vehiculo, id_compania) VALUES
  (1, 'B-1', 'KLHT21', 'Mercedes-Benz', 'Atego 1726',   2019, 'operativo',     1),
  (2, 'R-1', 'JXPS48', 'Renault',       'Midlum 300',   2016, 'en_mantencion', 1),
  (3, 'B-2', 'LBRC73', 'Iveco',         'Eurocargo 150', 2021, 'operativo',     2)
ON CONFLICT DO NOTHING;

-- Mantenciones: una por vehículo, registrada por personal de la MISMA
-- compañía del vehículo (la API exige eso al registrar).
INSERT INTO mantencion (id_mantencion, fecha_ingreso, fecha_salida, kilometraje_ingreso,
                        detalle_trabajo, proveedor, costo_total, mano_obra,
                        estado_mantencion, id_vehiculo, id_tipo_mantencion, id_usuario) VALUES
  (1, '2026-09-10', '2026-09-12', 48200,
   'Cambio de aceite, filtros y revisión de frenos', 'Taller Maipú Diesel',
   420000, 120000, 'finalizada', 1, 1, 4),
  (2, '2026-09-28', NULL, 91350,
   'Falla en bomba de agua: diagnóstico y reemplazo', 'Servicio Técnico Renault',
   850000, 250000, 'en_proceso', 2, 2, 5),
  (3, '2026-09-20', '2026-09-21', 22800,
   'Mantención de los 20.000 km', 'Iveco Chile',
   380000, 90000, 'finalizada', 3, 1, 7)
ON CONFLICT DO NOTHING;

-- Resincroniza las secuencias (los inserts usan ids fijos).
SELECT setval('rol_id_rol_seq', (SELECT MAX(id_rol) FROM rol));
SELECT setval('compania_id_compania_seq', (SELECT MAX(id_compania) FROM compania));
SELECT setval('usuario_id_usuario_seq', (SELECT MAX(id_usuario) FROM usuario));
SELECT setval('tipo_mantencion_id_tipo_mantencion_seq', (SELECT MAX(id_tipo_mantencion) FROM tipo_mantencion));
SELECT setval('vehiculo_id_vehiculo_seq', (SELECT MAX(id_vehiculo) FROM vehiculo));
SELECT setval('mantencion_id_mantencion_seq', (SELECT MAX(id_mantencion) FROM mantencion));

-- Verificaciones opcionales (comentadas por si se quiere debuggear).
-- SELECT * FROM rol;
-- SELECT * FROM compania;
-- SELECT id_usuario, email FROM usuario;