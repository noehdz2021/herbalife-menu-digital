# 🌿 Sistema de Menú Digital - Herbalife

Un sistema completo para gestionar y mostrar menús digitales en pantallas de cafeterías y puntos de venta de Herbalife.

## ✨ Características

### 📱 Página de Administración (`index.html`)
- **Subida de imágenes**: Arrastra y suelta o selecciona múltiples imágenes
- **Gestión de categorías**: Bebidas, Productos, Ofertas, Información
- **Control de tiempo**: Configura el tiempo de transición entre imágenes (1-60 segundos)
- **Filtros**: Filtra imágenes por categoría
- **Activación/Desactivación**: Control individual de cada imagen
- **Estadísticas**: Visualiza el total de imágenes y las activas
- **Exportación**: Descarga los datos en formato JSON

### 📺 Página de Display (`display.html`)
- **Slideshow automático**: Transiciones suaves entre imágenes
- **Reloj en tiempo real**: Muestra la hora actual
- **Barra de progreso**: Indica el tiempo restante para la siguiente imagen
- **Indicador de categoría**: Muestra la categoría actual
- **Diseño responsive**: Se adapta a diferentes tamaños de pantalla
- **Controles de teclado**: Navegación manual y pausa/reanudación

## 🚀 Uso del Sistema

### 1. Configuración Inicial
1. Abre `index.html` en tu navegador
2. Configura el tiempo de transición deseado
3. Haz clic en "Guardar" para aplicar los cambios

### 2. Subir Imágenes
1. Selecciona la categoría apropiada
2. Escribe un título descriptivo
3. Arrastra las imágenes o usa el botón "Seleccionar archivos"
4. Haz clic en "Subir Imágenes"

### 3. Gestión de Contenido
- **Filtrar**: Usa el selector de categorías para ver imágenes específicas
- **Activar/Desactivar**: Usa el interruptor junto a cada imagen
- **Eliminar**: Haz clic en el botón "Eliminar" (requiere confirmación)

### 4. Mostrar en Pantalla
1. Haz clic en "📺 Ver Pantalla" para abrir la página de display
2. Coloca la ventana en modo pantalla completa (F11)
3. Las imágenes se mostrarán automáticamente según la configuración

## 🎮 Controles de la Pantalla de Display

### Teclado
- **Barra espaciadora**: Pausar/Reanudar slideshow
- **Flecha izquierda**: Imagen anterior
- **Flecha derecha**: Imagen siguiente
- **F5**: Recargar datos desde la administración
- **Clic en pantalla**: Reiniciar slideshow

### Características Automáticas
- **Sincronización**: Los cambios en administración se reflejan automáticamente
- **Pausa inteligente**: Se pausa cuando la ventana no está visible
- **Cursor oculto**: Se oculta automáticamente después de 3 segundos de inactividad

## 📁 Estructura del Proyecto

```
remote-herbalife/
├── index.html              # Página de administración
├── display.html            # Página de display/pantalla
├── styles.css              # Estilos para administración
├── display-styles.css      # Estilos para display
├── script.js               # JavaScript para administración
├── display-script.js       # JavaScript para display
└── README.md              # Este archivo
```

## 🔧 Características Técnicas

### Almacenamiento
- **LocalStorage**: Los datos se guardan localmente en el navegador
- **Formato JSON**: Exportación e importación de datos
- **Persistencia**: Los datos se mantienen entre sesiones

### Compatibilidad
- **Navegadores modernos**: Chrome, Firefox, Safari, Edge
- **Responsive**: Se adapta a pantallas de diferentes tamaños
- **Formatos de imagen**: JPEG, PNG, GIF, WebP

### Rendimiento
- **Optimizado**: Carga eficiente de imágenes
- **Smooth transitions**: Transiciones suaves sin parpadeo
- **Memory management**: Limpieza automática de intervalos

## 🎨 Personalización

### Colores de Marca
```css
:root {
    --primary-color: #2E8B57;    /* Verde Herbalife */
    --secondary-color: #98FB98;  /* Verde claro */
    --accent-color: #FFD700;     /* Dorado */
}
```

### Categorías
Puedes modificar las categorías en ambos archivos JavaScript:
- Bebidas 🥤
- Productos 🌿
- Ofertas 🎯
- Información ℹ️

## 🛠️ Solución de Problemas

### Las imágenes no se muestran
1. Verifica que las imágenes estén activas en la administración
2. Asegúrate de que el formato sea compatible
3. Recarga la página de display (F5)

### El slideshow no cambia
1. Verifica que haya más de una imagen activa
2. Comprueba que el tiempo de transición sea mayor a 0
3. Asegúrate de que la página esté visible (no minimizada)

### Los datos se perdieron
1. Los datos se almacenan en localStorage del navegador
2. Usar el botón "Exportar Datos" regularmente como respaldo
3. Evita limpiar los datos del navegador

## 📱 Uso Recomendado

### Para Cafeterías
1. Configura un tiempo de transición de 5-8 segundos
2. Usa imágenes de alta calidad (1920x1080 recomendado)
3. Organiza por categorías: bebidas, productos, ofertas
4. Actualiza las ofertas regularmente

### Para Puntos de Venta
1. Tiempo de transición más rápido (3-5 segundos)
2. Enfócate en productos y promociones
3. Usa imágenes llamativas y textos legibles
4. Incluye información de contacto

## 🔐 Consejos de Seguridad

1. **Respaldo regular**: Exporta los datos frecuentemente
2. **Imágenes optimizadas**: Usa imágenes de tamaño apropiado
3. **Navegador dedicado**: Usa un navegador solo para el display
4. **Modo kiosco**: Considera usar extensiones de modo kiosco

## 🆘 Soporte

Para obtener ayuda o reportar problemas:
1. Revisa este README
2. Verifica la consola del navegador (F12)
3. Asegúrate de usar un navegador compatible
4. Guarda una copia de seguridad antes de hacer cambios

---

**Desarrollado para Herbalife** 🌿  
*Nutrición para una vida activa* 