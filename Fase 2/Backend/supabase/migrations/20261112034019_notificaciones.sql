-- ============================================================
-- supabase/migrations/20261112034019_notificaciones.sql
-- ============================================================
-- Notificaciones dentro de la aplicación (HU11, y el aviso al
-- Inspector de HU06 CA5). Una fila por DESTINATARIO: así cada usuario
-- marca como leídas las suyas sin afectar a los demás.
--
-- Las crea la API en la misma transacción que el evento que las
-- origina (src/notificaciones.js):
--   falla_reportada -> usuarios de la compañía del vehículo, menos
--                      quien reportó y los administradores.
--   falla_derivada  -> Inspectores de Material Mayor de esa compañía.
--
-- El mensaje se guarda ya armado ("Nueva falla en B-1 ..."): es lo
-- que pasó en ese momento, aunque después cambie el vehículo.
-- ============================================================

CREATE TABLE IF NOT EXISTS notificacion (
  id_notificacion  SERIAL PRIMARY KEY,
  id_usuario       INTEGER NOT NULL,
  tipo             VARCHAR(50) NOT NULL,
  mensaje          TEXT NOT NULL,
  id_vehiculo      INTEGER NOT NULL,
  id_reporte_falla INTEGER,
  creada_en        TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- NULL = no leída.
  leida_en         TIMESTAMPTZ,
  CONSTRAINT chk_notificacion_tipo CHECK
    (tipo IN ('falla_reportada', 'falla_derivada')),
  -- Si se elimina el usuario o el vehículo, sus avisos ya no sirven.
  CONSTRAINT fk_usuario_id_usuario_notificacion
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_vehiculo_id_vehiculo_notificacion
    FOREIGN KEY (id_vehiculo) REFERENCES vehiculo(id_vehiculo) ON DELETE CASCADE,
  CONSTRAINT fk_reporte_falla_id_reporte_falla_notificacion
    FOREIGN KEY (id_reporte_falla) REFERENCES reporte_falla(id_reporte_falla) ON DELETE CASCADE
);

-- La consulta frecuente: "las mías, las más recientes primero".
CREATE INDEX IF NOT EXISTS idx_notificacion_usuario
  ON notificacion(id_usuario, creada_en DESC);

-- Igual que el resto de las tablas (ver init_schema): RLS sin
-- políticas, nadie entra por PostgREST; la API usa el usuario postgres.
ALTER TABLE notificacion ENABLE ROW LEVEL SECURITY;
