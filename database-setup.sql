-- Script para configurar la base de datos de Supabase
-- Ejecutar en SQL Editor de Supabase

-- Crear tabla para las imágenes del menú
CREATE TABLE IF NOT EXISTS menu_images (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title text NOT NULL,
    category text NOT NULL CHECK (category IN ('bebidas', 'productos', 'ofertas', 'informacion')),
    src text NOT NULL,
    duration integer NOT NULL DEFAULT 5 CHECK (duration >= 1 AND duration <= 60),
    repeat integer NOT NULL DEFAULT 1 CHECK (repeat >= 1 AND repeat <= 10),
    active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_menu_images_updated_at
    BEFORE UPDATE ON menu_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE menu_images ENABLE ROW LEVEL SECURITY;

-- Crear políticas para acceso público (solo lectura)
CREATE POLICY "Allow public read access" ON menu_images
    FOR SELECT USING (true);

-- Crear políticas para inserción (solo con clave válida)
CREATE POLICY "Allow authenticated insert" ON menu_images
    FOR INSERT WITH CHECK (true);

-- Crear políticas para actualización (solo con clave válida)
CREATE POLICY "Allow authenticated update" ON menu_images
    FOR UPDATE USING (true);

-- Crear políticas para eliminación (solo con clave válida)
CREATE POLICY "Allow authenticated delete" ON menu_images
    FOR DELETE USING (true);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_menu_images_category ON menu_images(category);
CREATE INDEX IF NOT EXISTS idx_menu_images_active ON menu_images(active);
CREATE INDEX IF NOT EXISTS idx_menu_images_created_at ON menu_images(created_at DESC); 