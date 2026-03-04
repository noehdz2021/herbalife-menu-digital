-- Columna frecuencia para menu_images (display usa esto para cuántas veces aparece en el pool)
-- Si no existe, el display usa valor por defecto 1.

ALTER TABLE menu_images
ADD COLUMN IF NOT EXISTS frecuencia int4 DEFAULT 1;

COMMENT ON COLUMN menu_images.frecuencia IS 'Veces que el elemento aparece en el carrusel (pool). Mayor = más apariciones.';

-- Opcional: actualizar filas existentes que tengan NULL
UPDATE menu_images SET frecuencia = 1 WHERE frecuencia IS NULL;
