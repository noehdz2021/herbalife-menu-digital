-- Script para configurar el storage de Supabase
-- Ejecutar en SQL Editor de Supabase

-- Crear bucket para las imágenes del menú
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true);

-- Crear políticas para el bucket
CREATE POLICY "Allow public read access" ON storage.objects
    FOR SELECT USING (bucket_id = 'menu-images');

CREATE POLICY "Allow authenticated upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'menu-images');

CREATE POLICY "Allow authenticated update" ON storage.objects
    FOR UPDATE USING (bucket_id = 'menu-images');

CREATE POLICY "Allow authenticated delete" ON storage.objects
    FOR DELETE USING (bucket_id = 'menu-images'); 