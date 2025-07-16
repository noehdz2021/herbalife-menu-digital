-- Script para actualizar las políticas de menu_images existente
-- para requerir autenticación

-- Eliminar políticas existentes de menu_images
DROP POLICY IF EXISTS "Enable read access for all users" ON menu_images;
DROP POLICY IF EXISTS "Enable insert access for all users" ON menu_images;
DROP POLICY IF EXISTS "Enable update access for all users" ON menu_images;
DROP POLICY IF EXISTS "Enable delete access for all users" ON menu_images;

-- Crear nueva política para permitir lectura pública de menu_images (para display)
CREATE POLICY "Enable read access for all users" ON menu_images
    FOR SELECT USING (true);

-- Crear política para permitir inserción solo a usuarios autenticados
CREATE POLICY "Enable insert access for authenticated users" ON menu_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_sessions 
            WHERE token = current_setting('request.headers')::json->>'authorization'
            AND expires_at > NOW()
        )
    );

-- Crear política para permitir actualización solo a usuarios autenticados
CREATE POLICY "Enable update access for authenticated users" ON menu_images
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_sessions 
            WHERE token = current_setting('request.headers')::json->>'authorization'
            AND expires_at > NOW()
        )
    );

-- Crear política para permitir eliminación solo a usuarios autenticados
CREATE POLICY "Enable delete access for authenticated users" ON menu_images
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM admin_sessions 
            WHERE token = current_setting('request.headers')::json->>'authorization'
            AND expires_at > NOW()
        )
    ); 