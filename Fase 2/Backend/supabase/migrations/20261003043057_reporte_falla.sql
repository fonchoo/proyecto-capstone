-- ============================================================
-- supabase/migrations/20261003043057_reporte_falla.sql
-- ============================================================
-- Reportes de falla de los vehículos (ERS: RF-09 reportar una falla,
-- RF-07 ver el historial de fallas en el detalle del vehículo).
--
-- Lo llena el formulario "Reportar Falla" (Front/src/pages/
-- ReportFault.jsx) vía POST /api/fallas. Cualquier rol puede
-- reportar, siempre sobre un vehículo de su alcance.
--
-- Pertenece a la compañía de su VEHÍCULO (igual que mantencion y
-- alerta_recordatorio): no lleva id_compania propio.
-- ============================================================

CREATE TABLE IF NOT EXISTS reporte_falla (
  id_reporte_falla SERIAL PRIMARY KEY,
  fecha_reporte    TIMESTAMPTZ NOT NULL DEFAULT now(),
  urgencia         VARCHAR(10) NOT NULL,
  descripcion      TEXT NOT NULL,
  estado_reporte   VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  id_vehiculo      INTEGER NOT NULL,
  -- Quién reportó: siempre el usuario de la sesión (lo pone la API).
  id_usuario       INTEGER NOT NULL,
  CONSTRAINT chk_reporte_falla_urgencia CHECK
    (urgencia IN ('alta', 'media', 'baja')),
  CONSTRAINT chk_reporte_falla_estado CHECK
    (estado_reporte IN ('pendiente', 'en_revision', 'resuelto')),
  CONSTRAINT chk_reporte_falla_descripcion CHECK
    (length(trim(descripcion)) > 0),
  -- RESTRICT (como mantencion): el historial de fallas no se pierde
  -- al intentar borrar un vehículo o un usuario.
  CONSTRAINT fk_vehiculo_id_vehiculo_reporte_falla
    FOREIGN KEY (id_vehiculo) REFERENCES vehiculo(id_vehiculo) ON DELETE RESTRICT,
  CONSTRAINT fk_usuario_id_usuario_reporte_falla
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_reporte_falla_vehiculo ON reporte_falla(id_vehiculo);
CREATE INDEX IF NOT EXISTS idx_reporte_falla_usuario  ON reporte_falla(id_usuario);

-- RLS sin políticas, igual que el resto de las tablas (ver
-- init_schema): nadie entra por la API REST de Supabase; la API
-- Express se conecta como "postgres" y no se ve afectada.
ALTER TABLE reporte_falla ENABLE ROW LEVEL SECURITY;
