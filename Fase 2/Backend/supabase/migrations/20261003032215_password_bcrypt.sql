-- ============================================================
-- supabase/migrations/20261003032215_password_bcrypt.sql
-- ============================================================
-- Obliga a que usuario.password sea SIEMPRE un hash bcrypt.
--
-- Por que: el login (src/routes/auth.js) compara con bcrypt.compare.
-- Si alguien inserta un usuario con la contraseña en texto plano
-- (p. ej. desde Supabase Studio), el login falla siempre con 401 y
-- no queda claro por que. Con este CHECK el error salta AL GUARDAR.
--
-- Formato bcrypt: $2a$12$ + 53 caracteres = 60 en total.
--   - bcryptjs (la API) genera "$2b$..."
--   - pgcrypto (SQL) genera "$2a$..."
--
-- Para crear un usuario desde SQL/Studio, guardar el hash:
--   extensions.crypt('mi_clave', extensions.gen_salt('bf', 12))
-- ============================================================

-- 1) Si ya hay contraseñas en texto plano, se hashean en el lugar
--    (la contraseña sigue siendo la misma, solo cambia como se
--    guarda). Sin esto, el ALTER de abajo fallaria en esas bases.
UPDATE usuario
SET password = extensions.crypt(password, extensions.gen_salt('bf', 12))
WHERE password !~ '^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$';

-- 2) La restriccion.
ALTER TABLE usuario
  ADD CONSTRAINT chk_usuario_password_bcrypt
  CHECK (password ~ '^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$');
