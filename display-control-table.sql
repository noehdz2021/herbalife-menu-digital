-- Tabla de control para forzar actualización del Display vía Realtime (botón "Actualizar Display" en Admin).
-- El Admin hace UPDATE en esta tabla; el Display está suscrito a cambios y recarga el pool.

CREATE TABLE IF NOT EXISTS display_control (
    id int PRIMARY KEY DEFAULT 1,
    last_refresh timestamptz NOT NULL DEFAULT now()
);

INSERT INTO display_control (id, last_refresh) VALUES (1, now())
ON CONFLICT (id) DO NOTHING;

-- Habilitar Realtime: añadir tablas a la publicación (si da error "already a member", está bien)
ALTER PUBLICATION supabase_realtime ADD TABLE menu_images;
ALTER PUBLICATION supabase_realtime ADD TABLE display_control;

-- Nivel de réplica FULL para que Realtime envíe los cambios correctamente (UPDATE/DELETE)
ALTER TABLE menu_images REPLICA IDENTITY FULL;
ALTER TABLE display_control REPLICA IDENTITY FULL;

COMMENT ON TABLE display_control IS 'Una fila (id=1). El Admin hace UPDATE last_refresh para señalar al Display que recargue el pool.';
