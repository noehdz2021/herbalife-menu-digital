-- Script para optimizar la calidad de imágenes en Supabase Storage
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar la configuración actual del bucket
SELECT 
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'menu-images';

-- 2. Actualizar configuración del bucket para preservar calidad
UPDATE storage.buckets 
SET 
    file_size_limit = 52428800, -- 50MB (aumentar límite)
    allowed_mime_types = ARRAY[
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/webm',
        'video/mov',
        'video/avi'
    ]
WHERE name = 'menu-images';

-- 3. Verificar configuración de RLS (Row Level Security)
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 4. Verificar políticas existentes en storage.objects
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 5. Verificar archivos existentes
SELECT 
    name,
    metadata,
    updated_at,
    created_at
FROM storage.objects 
WHERE bucket_id = 'menu-images'
ORDER BY created_at DESC
LIMIT 10;

-- 6. Comentarios sobre optimización
COMMENT ON TABLE storage.objects IS 'Objetos de storage con calidad preservada';
COMMENT ON COLUMN storage.objects.metadata IS 'Metadatos preservados del archivo original'; 