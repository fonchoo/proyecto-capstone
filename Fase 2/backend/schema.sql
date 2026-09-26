-- ============================================================
-- backend/schema.sql
-- ============================================================
-- Crea TODAS las tablas del Sistema de Control de Mantención.
-- Es IDEMPOTENTE (IF NOT EXISTS): se puede ejecutar las veces
-- que haga falta.
--
-- Este script se monta en el contenedor postgres de desarrollo
-- via /docker-entrypoint-initdb.d (ver docker-compose.override.yml).
-- El orden de ejecucion lo da el prefijo numerico del archivo
-- (01-schema.sql antes que 02-seed.sql).
-- ============================================================

CREATE TABLE IF NOT EXISTS compania (
  id_compania     SERIAL PRIMARY KEY,
  numero_compania INTEGER NOT NULL,
  nombre          VARCHAR(255) NOT NULL,
  direccion       VARCHAR(255),
  comuna          VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS rol (
  id_rol     SERIAL PRIMARY KEY,
  nombre_rol VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario     SERIAL PRIMARY KEY,
  rut            VARCHAR(255) NOT NULL UNIQUE,
  nombre_completo VARCHAR(255) NOT NULL,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password       VARCHAR(255) NOT NULL,
  id_rol         INTEGER NOT NULL,
  id_compania    INTEGER NOT NULL,
  CONSTRAINT fk_rol_id_rol_usuario
    FOREIGN KEY (id_rol) REFERENCES rol(id_rol) ON DELETE RESTRICT,
  CONSTRAINT fk_compania_id_compania_usuario
    FOREIGN KEY (id_compania) REFERENCES compania(id_compania) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_usuario_compania ON usuario(id_compania);

CREATE TABLE IF NOT EXISTS vehiculo (
  id_vehiculo     SERIAL PRIMARY KEY,
  nomenclatura    VARCHAR(255) NOT NULL,
  patente         VARCHAR(255),
  marca           VARCHAR(255),
  modelo          VARCHAR(255),
  ano_fabricacion INTEGER,
  estado_vehiculo VARCHAR(255) NOT NULL DEFAULT 'operativo',
  id_compania     INTEGER NOT NULL,
  CONSTRAINT chk_estado_vehiculo CHECK
    (estado_vehiculo IN ('operativo', 'no_operativo', 'en_mantencion')),
  CONSTRAINT fk_compania_id_compania_vehiculo
    FOREIGN KEY (id_compania) REFERENCES compania(id_compania) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_vehiculo_compania ON vehiculo(id_compania);

CREATE TABLE IF NOT EXISTS tipo_mantencion (
  id_tipo_mantencion SERIAL PRIMARY KEY,
  nombre             VARCHAR(255) NOT NULL,
  descripcion        VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS mantencion (
  id_mantencion       SERIAL PRIMARY KEY,
  fecha_ingreso       DATE NOT NULL,
  fecha_salida        DATE,
  kilometraje_ingreso INTEGER,
  detalle_trabajo     TEXT,
  proveedor           VARCHAR(255),
  costo_total         NUMERIC(10,2),
  mano_obra           NUMERIC(10,2),
  estado_mantencion   VARCHAR(255) NOT NULL DEFAULT 'en_proceso',
  id_vehiculo         INTEGER NOT NULL,
  id_tipo_mantencion  INTEGER NOT NULL,
  id_usuario          INTEGER NOT NULL,
  CONSTRAINT fk_vehiculo_id_vehiculo_mantencion
    FOREIGN KEY (id_vehiculo) REFERENCES vehiculo(id_vehiculo) ON DELETE RESTRICT,
  CONSTRAINT fk_tipo_mantencion_id_tipo_mantencion_mantencion
    FOREIGN KEY (id_tipo_mantencion) REFERENCES tipo_mantencion(id_tipo_mantencion) ON DELETE RESTRICT,
  CONSTRAINT fk_usuario_id_usuario_mantencion
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_mantencion_usuario ON mantencion(id_usuario);
CREATE INDEX IF NOT EXISTS idx_mantencion_vehiculo ON mantencion(id_vehiculo);

CREATE TABLE IF NOT EXISTS alerta_recordatorio (
  id_alerta              SERIAL PRIMARY KEY,
  tipo_alerta            VARCHAR(255) NOT NULL,
  fecha_programada       DATE NOT NULL,
  kilometraje_programado INTEGER,
  mensaje                VARCHAR(255),
  estado_alerta          VARCHAR(255) NOT NULL DEFAULT 'pendiente',
  id_vehiculo            INTEGER NOT NULL,
  CONSTRAINT fk_vehiculo_id_vehiculo_alerta_recordatorio
    FOREIGN KEY (id_vehiculo) REFERENCES vehiculo(id_vehiculo) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alerta_vehiculo ON alerta_recordatorio(id_vehiculo);