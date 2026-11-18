-- ============================================================
-- supabase/migrations/20261118152309_usuario_rut_email_normalizados.sql
-- ============================================================
-- RUT y correo de "usuario" en UN solo formato, para que el UNIQUE de
-- cada uno funcione de verdad.
--
-- La API (src/routes/usuarios.js con src/validaciones.js) guarda el
-- RUT como "12345678-5" (sin puntos, con guion, DV en mayúscula) y el
-- correo en minúsculas. Los usuarios del seed tenían el RUT sin guion
-- ("111111111"): un usuario nuevo con el MISMO RUT ("11111111-1")
-- pasaba el UNIQUE porque el texto era distinto. Lo mismo con
-- "Juan@x.cl" y "juan@x.cl".
--
-- 1) Se reescriben al formato normalizado los RUT y correos que ya
--    existen. Solo cambia el formato: un RUT con dígito verificador
--    inválido sigue inválido (la API lo exige al guardar, no acá).
-- 2) CHECK de formato, como chk_vehiculo_patente_normalizada: nadie
--    puede guardar otro formato desde Studio y saltarse el UNIQUE.
-- ============================================================

-- 1a) RUT: "12.345.678-5" / "123456785" -> "12345678-5".
UPDATE usuario
SET rut = regexp_replace(
  upper(regexp_replace(rut, '[.\s-]', '', 'g')),
  '^(\d{7,8})([0-9K])$',
  '\1-\2'
)
WHERE upper(regexp_replace(rut, '[.\s-]', '', 'g')) ~ '^\d{7,8}[0-9K]$';

-- 1b) Correo en minúsculas y sin espacios al borde.
UPDATE usuario
SET email = lower(btrim(email))
WHERE email <> lower(btrim(email));

-- 2) Formatos obligatorios desde ahora.
ALTER TABLE usuario
  ADD CONSTRAINT chk_usuario_rut_formato CHECK (rut ~ '^\d{7,8}-[0-9K]$');

ALTER TABLE usuario
  ADD CONSTRAINT chk_usuario_email_minusculas CHECK (email = lower(btrim(email)));
