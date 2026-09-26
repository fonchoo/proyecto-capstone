-- ============================================================
-- backend/seed.sql
-- ============================================================
-- Datos iniciales que replica la BD que existia en el PostgreSQL
-- local del host (antes de dockerizar la base):
--   - 4 roles
--   - 1 compañía (Primera compañia)
--   - 1 usuario administrador (password hasheado con bcrypt, rounds 12)
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

-- Compañía
INSERT INTO compania (id_compania, numero_compania, nombre, direccion, comuna) VALUES
  (1, 1, 'Primera compañia', 'Direccion #123', 'Maipu')
ON CONFLICT (id_compania) DO NOTHING;

-- Usuario administrador
-- Password: admin1234 (bcrypt, cost 12)
INSERT INTO usuario (id_usuario, rut, nombre_completo, email, password, id_rol, id_compania) VALUES
  (1, '123456789', 'Administrador', 'administrador@gmail.com',
   '$2a$12$NhfoUkbg4sc04kf5UKO23uFXo7vSYEysSzM7qcwU/MtwoTEI5U4P2', 4, 1)
ON CONFLICT (id_usuario) DO NOTHING;

-- Tipos de mantención
INSERT INTO tipo_mantencion (id_tipo_mantencion, nombre, descripcion) VALUES
  (1, 'preventiva', 'Mantención preventiva programada'),
  (2, 'reactiva', 'Mantención reactiva por falla')
ON CONFLICT (id_tipo_mantencion) DO NOTHING;

-- Resincroniza las secuencias (los inserts usan ids fijos).
SELECT setval('rol_id_rol_seq', (SELECT MAX(id_rol) FROM rol));
SELECT setval('compania_id_compania_seq', (SELECT MAX(id_compania) FROM compania));
SELECT setval('usuario_id_usuario_seq', (SELECT MAX(id_usuario) FROM usuario));
SELECT setval('tipo_mantencion_id_tipo_mantencion_seq', (SELECT MAX(id_tipo_mantencion) FROM tipo_mantencion));

-- Verificaciones opcionales (comentadas por si se quiere debuggear).
-- SELECT * FROM rol;
-- SELECT * FROM compania;
-- SELECT id_usuario, email FROM usuario;