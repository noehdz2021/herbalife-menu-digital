# Soporte de Videos - Menú Digital Herbalife

## 🎥 Nuevas Funcionalidades

### Subida de Videos
- **Formatos soportados**: MP4, WebM, OGV, MOV, AVI
- **Tamaño máximo**: 100MB por archivo
- **Duración**: Los videos usan su duración natural (no se puede configurar manualmente)
- **Reproducción**: Automática, en bucle, sin sonido

### Cambios en la Interfaz

#### Panel de Administración
- ✅ Campo de archivo ahora acepta `image/*,video/*`
- ✅ Badges visuales para identificar tipo de archivo (📷 para imágenes, 🎥 para videos)
- ✅ Controles de duración solo disponibles para imágenes
- ✅ Vista previa de videos en la grilla

#### Pantalla de Display
- ✅ Reproducción automática de videos
- ✅ Transición automática al finalizar el video
- ✅ Videos en bucle hasta completar repeticiones
- ✅ Sin controles de video visibles (experiencia limpia)

## 🗄️ Cambios en Base de Datos

### Nueva Columna
```sql
file_type TEXT DEFAULT 'image' CHECK (file_type IN ('image', 'video'))
```

### Script de Migración
Ejecutar `add-file-type-column.sql` en Supabase SQL Editor.

## 📁 Archivos Modificados

### Frontend
- `admin.html` - Interfaz de subida actualizada
- `script.js` - Lógica de subida y gestión de archivos
- `styles.css` - Estilos para videos y badges
- `display-script.js` - Reproducción de videos en display

### Base de Datos
- `add-file-type-column.sql` - Script de migración

## 🚀 Instrucciones de Uso

### 1. Ejecutar Migración
```sql
-- En Supabase SQL Editor
-- Ejecutar el contenido de add-file-type-column.sql
```

### 2. Subir Videos
1. Ir al panel de administración
2. Seleccionar archivos de video
3. Configurar título y categoría
4. Configurar repeticiones
5. Hacer clic en "Subir"

### 3. Visualización
- Los videos se reproducen automáticamente en el display
- Al finalizar, pasa automáticamente al siguiente contenido
- Se respetan las repeticiones configuradas

## ⚠️ Consideraciones

### Rendimiento
- Videos grandes pueden afectar la carga inicial
- Recomendado: comprimir videos antes de subir
- Formatos recomendados: MP4 (H.264) o WebM

### Compatibilidad
- Navegadores modernos soportan reproducción de video
- Fallback automático para navegadores antiguos

### Almacenamiento
- Los videos ocupan más espacio que las imágenes
- Monitorear el uso de almacenamiento en Supabase

## 🔧 Configuración Avanzada

### Límites de Archivo
```javascript
// En script.js - Configurar límites
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
```

### Estilos Personalizados
```css
/* En styles.css - Personalizar apariencia de videos */
.image-container video {
    /* Estilos personalizados aquí */
}
```

## 📊 Estadísticas

### Tipos de Contenido
- **Imágenes**: Duración configurable, transición automática
- **Videos**: Duración natural, transición al finalizar

### Métricas
- Total de archivos (imágenes + videos)
- Archivos activos
- Uso de almacenamiento por tipo

---

**Versión**: 2.0  
**Fecha**: Diciembre 2024  
**Compatibilidad**: Supabase, Navegadores modernos 