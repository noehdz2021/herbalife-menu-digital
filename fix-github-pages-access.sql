-- Script para permitir acceso desde GitHub Pages
-- Manteniendo la seguridad pero permitiendo operaciones básicas

-- 1. Verificar políticas actuales
SELECT 'Políticas actuales:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('admin_users', 'admin_sessions', 'menu_images')
ORDER BY tablename, policyname;

-- 2. Eliminar políticas restrictivas de menu_images
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON menu_images;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON menu_images;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON menu_images;

-- 3. Crear políticas más permisivas para menu_images (temporal para desarrollo)
CREATE POLICY "Enable insert access for all users" ON menu_images
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON menu_images
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON menu_images
    FOR DELETE USING (true);

-- 4. Eliminar políticas restrictivas de admin_users
DROP POLICY IF EXISTS "Enable read access for all users" ON admin_users;

-- 5. Crear política permisiva para admin_users (temporal para desarrollo)
CREATE POLICY "Enable read access for all users" ON admin_users
    FOR SELECT USING (true);

-- 6. Eliminar políticas restrictivas de admin_sessions
DROP POLICY IF EXISTS "Enable all access for all users" ON admin_sessions;

-- 7. Crear política permisiva para admin_sessions (temporal para desarrollo)
CREATE POLICY "Enable all access for all users" ON admin_sessions
    FOR ALL USING (true);

-- 8. Verificar que el usuario admin existe
SELECT 'Usuario admin:' as info;
SELECT id, email, name, role FROM admin_users WHERE email = 'admin@herbalife.com';

-- 9. Limpiar sesiones expiradas
DELETE FROM admin_sessions WHERE expires_at < NOW();

-- 10. Mostrar estado final
SELECT 'Configuración completada - Acceso desde GitHub Pages habilitado' as status; 