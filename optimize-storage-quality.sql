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

-- 3. Verificar políticas de storage
SELECT 
    name,
    definition,
    operation
FROM storage.policies 
WHERE bucket_id = 'menu-images';

-- 4. Crear política para preservar metadatos de archivos
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
    'Preserve file metadata',
    'menu-images',
    'INSERT',
    'true'
) ON CONFLICT (name, bucket_id, operation) DO NOTHING;

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