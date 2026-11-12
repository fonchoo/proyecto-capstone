-- ============================================================
-- supabase/migrations/20261112034015_eliminar_alerta_recordatorio.sql
-- ============================================================
-- Elimina la tabla "alerta_recordatorio" (y su CRUD /api/alertas).
--
-- Por qué: nunca se usó. Las alertas de mantención preventiva (HU09,
-- HU10) NO se guardan: se calculan en cada consulta a partir de la
-- última preventiva de cada vehículo (src/preventiva.js), así nunca
-- quedan desactualizadas. Tampoco sirve para las notificaciones de
-- HU11 (no tiene destinatario ni estado de lectura): esas van en la
-- tabla "notificacion" (migración siguiente).
--
-- Si algún día se piden recordatorios manuales (revisión técnica,
-- permiso de circulación, SOAP), se crea una tabla nueva pensada
-- para eso.
-- ============================================================

DROP TABLE IF EXISTS alerta_recordatorio;
