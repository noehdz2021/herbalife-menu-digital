-- Verificar la estructura de la tabla menu_images
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'menu_images' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar las restricciones de la tabla
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'menu_images' 
AND table_schema = 'public';

-- Verificar las restricciones de check específicas
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'menu_images'::regclass; 