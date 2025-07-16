-- Script para verificar y corregir políticas de autenticación
-- Ejecutar este script si las tablas existen pero el login no funciona

-- 1. Verificar que las tablas existen
SELECT 'admin_users' as table_name, COUNT(*) as row_count FROM admin_users
UNION ALL
SELECT 'admin_sessions' as table_name, COUNT(*) as row_count FROM admin_sessions
UNION ALL
SELECT 'menu_images' as table_name, COUNT(*) as row_count FROM menu_images;

-- 2. Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('admin_users', 'admin_sessions', 'menu_images')
ORDER BY tablename, policyname;

-- 3. Eliminar políticas problemáticas de admin_users (si existen)
DROP POLICY IF EXISTS "Users can read own data" ON admin_users;

-- 4. Crear política más permisiva para admin_users (temporal para testing)
CREATE POLICY "Enable read access for all users" ON admin_users
    FOR SELECT USING (true);

-- 5. Eliminar políticas problemáticas de admin_sessions (si existen)
DROP POLICY IF EXISTS "Users can manage own sessions" ON admin_sessions;

-- 6. Crear política más permisiva para admin_sessions (temporal para testing)
CREATE POLICY "Enable all access for all users" ON admin_sessions
    FOR ALL USING (true);

-- 7. Verificar que el usuario admin existe
SELECT id, email, name, role FROM admin_users WHERE email = 'admin@herbalife.com';

-- 8. Limpiar sesiones expiradas
DELETE FROM admin_sessions WHERE expires_at < NOW();

-- 9. Mostrar estado final
SELECT 'Verificación completada' as status; 