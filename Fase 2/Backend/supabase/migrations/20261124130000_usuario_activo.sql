-- ============================================================
-- supabase/migrations/20261124130000_usuario_activo.sql
-- ============================================================
-- HU16: desactivar la cuenta de un usuario que ya no pertenece a la
-- compañía, en vez de borrarlo.
--
-- Por qué desactivar y no borrar: el usuario figura en reportes de
-- falla («Reportado por», «Derivado por») y en mantenciones, con FK
-- RESTRICT. Borrarlo era imposible apenas tenía historial (la API
-- respondía 409), y aunque se pudiera, se perdería la trazabilidad.
--
-- Una cuenta inactiva:
--   - no puede iniciar sesión (routes/auth.js);
--   - pierde la sesión que tuviera abierta en su siguiente petición
--     (requireAuth en src/auth.js relee al usuario y exige activo);
--   - deja de recibir notificaciones (src/notificaciones.js);
--   - conserva su historial intacto.
--
-- DEFAULT true: todas las cuentas que ya existen siguen activas.
-- ============================================================

ALTER TABLE usuario
  ADD COLUMN activo BOOLEAN NOT NULL DEFAULT true;
