-- Script para configurar solo el sistema de autenticación
-- (No modifica la tabla menu_images existente)

-- Crear tabla de usuarios admin
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Crear tabla de sesiones
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Crear política para admin_users (solo lectura de propio usuario)
DROP POLICY IF EXISTS "Users can read own data" ON admin_users;
CREATE POLICY "Users can read own data" ON admin_users
    FOR SELECT USING (
        id = (
            SELECT user_id FROM admin_sessions 
            WHERE token = current_setting('request.headers')::json->>'authorization'
            AND expires_at > NOW()
        )
    );

-- Habilitar RLS para admin_sessions
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Crear política para admin_sessions
DROP POLICY IF EXISTS "Users can manage own sessions" ON admin_sessions;
CREATE POLICY "Users can manage own sessions" ON admin_sessions
    FOR ALL USING (
        user_id = (
            SELECT user_id FROM admin_sessions 
            WHERE token = current_setting('request.headers')::json->>'authorization'
            AND expires_at > NOW()
        )
    );

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- Insertar usuario admin por defecto (password: admin123)
-- Solo si no existe ya
INSERT INTO admin_users (email, password_hash, name, role) 
VALUES ('admin@herbalife.com', 'admin123', 'Administrador', 'admin')
ON CONFLICT (email) DO NOTHING; 