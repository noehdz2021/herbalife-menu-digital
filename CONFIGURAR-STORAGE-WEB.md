# 🖼️ Configurar Storage desde la Interfaz Web de Supabase

## 🔍 Problema de Permisos
El error `must be owner of table objects` indica que no tienes permisos de administrador para modificar directamente las tablas del sistema. Esto es normal y se puede solucionar usando la interfaz web.

## ✅ Solución: Configuración Manual desde Dashboard

### **1. 📊 Ejecutar Script de Diagnóstico**
Primero ejecuta el script `optimize-storage-web.sql` para ver la configuración actual:

```sql
-- Copiar y pegar el contenido de optimize-storage-web.sql
-- en el SQL Editor de Supabase
```

### **2. 🎛️ Configurar Bucket desde Dashboard**

#### **Paso 1: Ir al Dashboard de Supabase**
1. Abrir [supabase.com](https://supabase.com)
2. Seleccionar tu proyecto
3. Ir a **Storage** en el menú lateral

#### **Paso 2: Configurar Bucket menu-images**
1. Hacer clic en el bucket **menu-images**
2. Ir a la pestaña **Settings**
3. Configurar los siguientes valores:

**📏 File Size Limit:**
- Cambiar a **50 MB** (o el máximo permitido)

**📁 Allowed MIME Types:**
- Agregar: `image/jpeg`
- Agregar: `image/jpg`
- Agregar: `image/png`
- Agregar: `image/webp`
- Agregar: `image/gif`
- Agregar: `video/mp4`
- Agregar: `video/webm`
- Agregar: `video/mov`
- Agregar: `video/avi`

**🔒 Public Bucket:**
- Mantener marcado como **Public**

#### **Paso 3: Guardar Configuración**
1. Hacer clic en **Save**
2. Confirmar los cambios

### **3. 🔍 Verificar Configuración**

#### **Ejecutar Script de Verificación:**
```sql
-- Verificar que los cambios se aplicaron
SELECT 
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'menu-images';
```

### **4. 📊 Monitorear Archivos**

#### **Verificar Metadatos de Archivos:**
```sql
-- Ver archivos existentes con sus tamaños
SELECT 
    name,
    ROUND((metadata->>'size')::bigint / 1024.0 / 1024.0, 2) as file_size_mb,
    metadata->>'mimetype' as mime_type,
    created_at
FROM storage.objects 
WHERE bucket_id = 'menu-images'
ORDER BY created_at DESC
LIMIT 10;
```

## 🎯 Resultados Esperados

### **✅ Configuración Optimizada:**
- **Límite de archivo:** 50MB o máximo permitido
- **Tipos MIME:** Todos los formatos de imagen y video
- **Bucket público:** Habilitado
- **Metadatos:** Preservados

### **📊 Logs de Monitoreo:**
Cuando subas una imagen, deberías ver:
```
📤 Subiendo archivo: 1234567890_0_original.jpg (imagen)
📊 Tamaño original: 2.45 MB
📊 Tipo MIME: image/jpeg
🖼️ Preservando calidad de imagen: JPG
```

## 🛠️ Solución de Problemas

### **Si no puedes modificar el bucket:**
1. **Contactar al administrador** del proyecto
2. **Verificar permisos** de tu cuenta
3. **Usar configuración por defecto** (funciona bien para la mayoría de casos)

### **Si los archivos siguen perdiendo calidad:**
1. **Verificar formato original** (usar JPEG/PNG de alta calidad)
2. **Revisar configuración de cámara** (exposición normal, resolución alta)
3. **Probar con imagen de referencia** conocida

## 📈 Beneficios de la Configuración

### **Antes:**
- Límite de archivo pequeño
- Formatos limitados
- Compresión automática
- Pérdida de calidad

### **Después:**
- Límite de archivo aumentado
- Todos los formatos soportados
- Calidad preservada
- Metadatos intactos

## 🎯 Próximos Pasos

1. **Ejecutar** `optimize-storage-web.sql`
2. **Configurar** bucket desde Dashboard
3. **Probar** subida de imagen
4. **Verificar** logs en consola
5. **Comparar** calidad antes/después

## 📞 Soporte

Si necesitas ayuda:
1. Revisar logs de consola
2. Verificar configuración del bucket
3. Probar con diferentes formatos
4. Contactar soporte técnico 