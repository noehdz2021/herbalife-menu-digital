-- Crear tabla menu_images
CREATE TABLE menu_images (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    src TEXT NOT NULL,
    duration INTEGER DEFAULT 5,
    repeat INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de usuarios admin
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Crear tabla de sesiones
CREATE TABLE admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security) para menu_images
ALTER TABLE menu_images ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir lectura pública de menu_images
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

-- Habilitar RLS para admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Crear política para admin_users (solo lectura de propio usuario)
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
CREATE POLICY "Users can manage own sessions" ON admin_sessions
    FOR ALL USING (
        user_id = (
            SELECT user_id FROM admin_sessions 
            WHERE token = current_setting('request.headers')::json->>'authorization'
            AND expires_at > NOW()
        )
    );

-- Crear índices para mejor rendimiento
CREATE INDEX idx_menu_images_active ON menu_images(active);
CREATE INDEX idx_menu_images_category ON menu_images(category);
CREATE INDEX idx_menu_images_created_at ON menu_images(created_at DESC);
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX idx_admin_sessions_expires ON admin_sessions(expires_at);

-- Insertar usuario admin por defecto (password: admin123)
-- NOTA: En producción, usar bcrypt o similar para hashear contraseñas
INSERT INTO admin_users (email, password_hash, name, role) 
VALUES ('admin@herbalife.com', 'admin123', 'Administrador', 'admin'); 