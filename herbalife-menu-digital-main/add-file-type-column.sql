-- Agregar columna file_type a la tabla menu_images
ALTER TABLE menu_images 
ADD COLUMN file_type TEXT DEFAULT 'image' CHECK (file_type IN ('image', 'video'));

-- Actualizar registros existentes para que sean de tipo 'image'
UPDATE menu_images 
SET file_type = 'image' 
WHERE file_type IS NULL;

-- Hacer la columna NOT NULL después de actualizar los datos existentes
ALTER TABLE menu_images 
ALTER COLUMN file_type SET NOT NULL;

-- Comentario sobre el uso
COMMENT ON COLUMN menu_images.file_type IS 'Tipo de archivo: image o video'; 