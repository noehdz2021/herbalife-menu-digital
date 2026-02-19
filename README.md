# 🌿 Herbalife - Menú Digital

Sistema minimalista para gestionar y mostrar imágenes en pantallas digitales para cafés Herbalife con sistema de autenticación completo.

## 🔐 Sistema de Autenticación

El sistema incluye un completo sistema de login para administradores:

### Credenciales por defecto:
- **Email:** `admin@herbalife.com`
- **Contraseña:** `admin123`

### Características del sistema de autenticación:
- ✅ Login seguro con validación de credenciales
- ✅ Sesiones persistentes (24 horas)
- ✅ Protección de rutas administrativas
- ✅ Logout automático
- ✅ Gestión de sesiones en base de datos
- ✅ Interfaz minimalista y responsive

## 📁 Estructura del Proyecto

```
remote-herbalife/
├── login.html              # Página de login
├── auth.js                 # Sistema de autenticación
├── config.js               # Configuración centralizada
├── index.html              # Interfaz de administración (protegida)
├── script.js               # Lógica de administración
├── display.html            # Pantalla de visualización
├── display-script.js       # Lógica de visualización con repetición aleatoria
├── styles.css              # Estilos principales (colores Herbalife)
├── display-styles.css      # Estilos para pantalla de visualización
├── README.md               # Este archivo
├── INSTRUCCIONES-CONFIGURACION.md  # Guía de configuración
├── database-setup.sql      # Script de configuración de base de datos
├── storage-setup.sql       # Script de configuración de storage
└── supabase-setup.sql      # Script completo de configuración con autenticación
```

## 🎨 Características

### **Colores Oficiales de Herbalife:**
- **Verde Principal:** `#00A651`
- **Verde Oscuro:** `#007A3D`
- **Verde Claro:** `#7ED321`
- **Naranja:** `#FF6B35`
- **Amarillo:** `#FFD700`

### **Funcionalidades:**
- ✅ **Sistema de autenticación** completo y seguro
- ✅ **Subida de archivos** (Supabase) o **Agregar por URL** (Imgur, etc.) - sin límite de Salida en caché
- ✅ **Categorización:** Bebidas, Productos, Ofertas, Información
- ✅ **Control de duración:** 1-60 segundos por imagen (videos usan duración natural)
- ✅ **Reproducción automática de videos** en bucle
- ✅ **Repetición aleatoria:** 1-10 veces por archivo
- ✅ **Visualización a pantalla completa** con reloj
- ✅ **Sincronización en tiempo real** con Supabase
- ✅ **Interfaz minimalista** y fácil de usar

## 🚀 Instalación

### 1. Configurar Supabase
Sigue las instrucciones en `INSTRUCCIONES-CONFIGURACION.md` para:
- Crear proyecto en Supabase
- Configurar base de datos
- Configurar storage
- Obtener credenciales

### 2. Actualizar Credenciales
Edita `config.js` con tus credenciales de Supabase:
```javascript
const CONFIG = {
    SUPABASE_URL: 'tu-url-de-supabase',
    SUPABASE_ANON_KEY: 'tu-anon-key',
    // ... resto de configuración
};
```

### 3. Ejecutar
Abre `login.html` en tu navegador para acceder al sistema de autenticación.

## 📖 Uso

### **Sistema de Login (`login.html`):**
1. **Acceder:** Usa las credenciales por defecto o las configuradas
2. **Sesión:** La sesión se mantiene activa por 24 horas
3. **Seguridad:** Todas las rutas administrativas están protegidas

### **Panel de Administración (`admin.html`):**

El panel tiene dos pestañas en el sidebar:

#### **🔗 Agregar por URL** (recomendado - no consume Supabase)
1. Sube tu imagen/video a **Imgur** (u otro servicio)
2. Obtén el **enlace directo** (ej: `https://i.imgur.com/xxxxx.jpg`)
3. Pega la URL en el campo, completa título, categoría, duración y repetición
4. Si es video, marca el checkbox "Es video"
5. Clic en "Agregar por URL"

#### **📤 Subir archivo** (usa Supabase Storage)
1. Selecciona imágenes o videos desde tu PC
2. Completa categoría, título, duración (solo imágenes) y repetición
3. Clic en "Subir"

#### **Otras acciones:**
- **Ver pantalla:** Clic en "📺 Pantalla"
- **Actualizar display:** Clic en "🔄 Actualizar Display" (para refrescar pantallas remotas)
- **Eliminar:** Botón 🗑️ en cada tarjeta
- **Editar:** Duración y repetición inline (solo imágenes)

### **Pantalla de Visualización (`display.html`):**
- **Pantalla completa:** Las imágenes y videos cubren toda la pantalla
- **Reloj:** Muestra la hora actual en la esquina superior derecha
- **Reproducción automática:** Los videos se reproducen automáticamente en bucle
- **Repetición aleatoria:** Los archivos aparecen de forma aleatoria según su configuración
- **Transiciones suaves:** Cambios automáticos con efectos de fade
- **Adaptación al monitor:** Imágenes y videos (URL o Supabase) se ajustan automáticamente (contain/cover) según el formato

## 🔗 Agregar por URL - Guía completa

### **Servicios recomendados (imágenes + videos):**

| Servicio | URL directa | Imágenes | Videos | Gratis |
|----------|-------------|----------|--------|--------|
| **Imgur** | ✅ | ✅ | ✅ (máx. 3 min) | Sí |
| **Cloudinary** | ✅ | ✅ | ✅ | 25 créditos/mes |
| **Catbox.moe** | ✅ | ✅ | ✅ | Sí |

### **Cómo obtener el enlace directo en Imgur:**
1. Sube la imagen/video en [imgur.com](https://imgur.com)
2. Abre la imagen haciendo clic sobre ella
3. Clic derecho → **"Copiar dirección de imagen"**
4. La URL debe verse así: `https://i.imgur.com/xxxxx.jpg` o `.mp4`
5. **No uses** enlaces de álbum (`imgur.com/a/xxx`) – no funcionan en el display

### **Google Drive:**
- El sistema convierte automáticamente enlaces de Drive al formato directo
- ⚠️ **Limitación:** Drive suele bloquear la carga desde otros sitios (CORS). Si la imagen no se ve, usa Imgur u otro servicio.

### **Formatos detectados automáticamente:**
- **Video:** `.mp4`, `.webm`, `.ogg`, `.mov`, `.avi`, `.gifv`
- **Imagen:** cualquier otra URL (jpg, png, gif, etc.)
- Para enlaces sin extensión (ej. Drive), marca el checkbox **"Es video"** si corresponde

## 💾 Optimización Supabase

Para reducir el uso del plan gratuito:
- **Agregar por URL** no consume Salida en caché (las imágenes se cargan desde Imgur, etc.)
- Refresh periódico desactivado (solo Realtime)
- Debounce en subidas múltiples
- Compresión opcional al subir archivos (ver `config.js`)

## ⚙️ Configuración

### **Duración:**
- **Imágenes:** 1-60 segundos (configurable)
- **Videos:** Duración natural del archivo (no configurable)
- **Por defecto:** 5 segundos para imágenes
- **Edición:** Controles inline en cada imagen

### **Repetición:**
- **Rango:** 1-10 veces
- **Comportamiento:** Aleatorio (no secuencial)
- **Videos:** Se reproducen en bucle hasta completar repeticiones
- **Reset automático:** Cuando todas las repeticiones se agotan, se reinician

### **Categorías:**
- 🥤 **Bebidas:** Batidos, tés, etc.
- 🌿 **Productos:** Suplementos, productos Herbalife
- 🎯 **Ofertas:** Promociones y descuentos
- ℹ️ **Información:** Información general

## 🔧 Tecnologías

- **Frontend:** HTML5, CSS3, JavaScript ES6+
- **Backend:** Supabase (PostgreSQL + Storage)
- **Tiempo real:** WebSockets con Supabase
- **Diseño:** Responsive con colores Herbalife

## 📱 Responsive

El sistema funciona en:
- 💻 **Desktop:** Panel completo con todas las funciones
- 📱 **Tablet:** Interfaz adaptada para pantallas medianas
- 📺 **TV/Pantalla:** Modo pantalla completa optimizado

## 🎯 Características Especiales

### **Repetición Aleatoria:**
- Las imágenes no aparecen secuencialmente
- Cada imagen tiene un contador de repeticiones restantes
- Cuando se agotan todas las repeticiones, se reinician automáticamente
- Distribución equilibrada de todas las imágenes

### **Sincronización en Tiempo Real:**
- Cambios instantáneos entre admin y display
- No requiere refrescar páginas
- Conexión automática con reconexión

### **Interfaz Minimalista:**
- Diseño limpio y enfocado
- Controles intuitivos
- Colores corporativos de Herbalife
- Sin elementos innecesarios

## 🐛 Solución de Problemas

### **Error de Conexión:**
1. Verifica credenciales de Supabase
2. Revisa conexión a internet
3. Usa el botón "🔄 Reconectar BD"

### **Archivos no se muestran:**
1. Verifica que estén marcados como "Activos"
2. **Si usas URL:** usa el enlace **directo** (`i.imgur.com/xxx.jpg`), no el de álbum
3. **Google Drive:** no suele funcionar por CORS; usa Imgur
4. Revisa permisos de storage en Supabase (solo para archivos subidos)

### **Repetición no funciona:**
1. Verifica que el valor esté entre 1-10
2. Recarga la pantalla de display
3. Comprueba que haya múltiples archivos activos

### **Videos no se reproducen:**
1. Verifica que el navegador soporte el formato de video
2. Comprueba que el video esté en formato MP4 o WebM
3. Asegúrate de que el video no sea muy grande (>100MB)

## 🎥 Soporte de Videos

### **Formatos Soportados:**
- **MP4** (H.264) - Recomendado
- **WebM** (VP8/VP9) - Alternativa moderna
- **OGG** - Soporte limitado
- **MOV, AVI** - Soporte básico

### **Características de Video:**
- ✅ **Reproducción automática** al cargar
- ✅ **Bucle continuo** hasta completar repeticiones
- ✅ **Sin sonido** (muted por defecto)
- ✅ **Transición automática** al finalizar
- ✅ **Pantalla completa** con object-fit: cover

### **Configuración:**
1. **Ejecutar migración:** `add-file-type-column.sql`
2. **Subir videos:** Usar el panel de administración
3. **Verificar reproducción:** En la pantalla de display

### **Limitaciones:**
- **Tamaño máximo:** 100MB por archivo
- **Duración:** No configurable (usa duración natural)
- **Sonido:** Desactivado por defecto
- **Controles:** Ocultos para experiencia limpia

Para más detalles, consulta `SOPORTE-VIDEOS.md`.

## 📄 Licencia

Este proyecto está diseñado específicamente para uso con Herbalife y sus colores corporativos.

---

**🌿 Herbalife - Nutrición para una vida activa** 