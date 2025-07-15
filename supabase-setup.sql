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

-- Habilitar RLS (Row Level Security) pero permitir acceso público
ALTER TABLE menu_images ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir lectura pública
CREATE POLICY "Enable read access for all users" ON menu_images
    FOR SELECT USING (true);

-- Crear política para permitir inserción pública
CREATE POLICY "Enable insert access for all users" ON menu_images
    FOR INSERT WITH CHECK (true);

-- Crear política para permitir actualización pública
CREATE POLICY "Enable update access for all users" ON menu_images
    FOR UPDATE USING (true);

-- Crear política para permitir eliminación pública
CREATE POLICY "Enable delete access for all users" ON menu_images
    FOR DELETE USING (true);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_menu_images_active ON menu_images(active);
CREATE INDEX idx_menu_images_category ON menu_images(category);
CREATE INDEX idx_menu_images_created_at ON menu_images(created_at DESC); 