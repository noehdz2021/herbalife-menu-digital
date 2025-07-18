-- Script para optimizar storage usando solo permisos estándar
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar la configuración actual del bucket (solo lectura)
SELECT 
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'menu-images';

-- 2. Verificar archivos existentes y sus metadatos (solo lectura)
SELECT 
    name,
    metadata,
    updated_at,
    created_at,
    (metadata->>'size')::bigint as file_size_bytes,
    ROUND((metadata->>'size')::bigint / 1024.0 / 1024.0, 2) as file_size_mb,
    metadata->>'mimetype' as mime_type
FROM storage.objects 
WHERE bucket_id = 'menu-images'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar configuración de la tabla menu_images
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'menu_images' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Comentarios informativos (solo si tienes permisos)
-- Si tienes permisos de administrador, puedes descomentar estas líneas:
-- COMMENT ON TABLE storage.objects IS 'Objetos de storage con calidad preservada';
-- COMMENT ON COLUMN storage.objects.metadata IS 'Metadatos preservados del archivo original'; 