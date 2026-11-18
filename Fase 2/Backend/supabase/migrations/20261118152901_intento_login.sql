-- ============================================================
-- supabase/migrations/20261118152901_intento_login.sql
-- ============================================================
-- Límite de intentos de login: después de 5 contraseñas incorrectas
-- seguidas para un mismo correo, ese correo queda bloqueado 15 minutos
-- (la regla vive en src/routes/auth.js). Sin esto se podían probar
-- contraseñas sin límite.
--
-- Por qué en la base y no en memoria: en Vercel la API corre como
-- función serverless, con varias instancias que no comparten memoria;
-- un contador en memoria se reiniciaría en cada una.
--
-- La clave es el correo escrito, exista o no como usuario: así la
-- respuesta es la misma para un correo registrado y uno inventado, y
-- el bloqueo no delata qué correos existen.
--
-- RLS activado y sin políticas: la API se conecta como dueña de la
-- tabla y no la afecta, pero la API REST automática de Supabase (Data
-- API) no puede leerla ni escribirla.
-- ============================================================

CREATE TABLE intento_login (
  email           VARCHAR(254) PRIMARY KEY,
  fallidos        INTEGER      NOT NULL DEFAULT 0 CHECK (fallidos >= 0),
  ultimo_fallo    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  bloqueado_hasta TIMESTAMPTZ
);

ALTER TABLE intento_login ENABLE ROW LEVEL SECURITY;
