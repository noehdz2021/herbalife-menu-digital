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
- ✅ **Subida de imágenes** con drag & drop
- ✅ **Categorización:** Bebidas, Productos, Ofertas, Información
- ✅ **Control de duración:** 1-60 segundos por imagen
- ✅ **Repetición aleatoria:** 1-10 veces por imagen
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

### **Panel de Administración (`index.html`):**
1. **Subir imágenes:** Selecciona archivos, categoría, título, duración y repetición
2. **Editar configuración:** Usa los controles inline para ajustar duración y repetición
3. **Ver pantalla:** Haz clic en "📺 Pantalla" para abrir la visualización
4. **Eliminar:** Usa el botón 🗑️ para eliminar imágenes
5. **Cerrar sesión:** Usa el botón "🚪 Cerrar Sesión" para salir

### **Pantalla de Visualización (`display.html`):**
- **Pantalla completa:** Las imágenes cubren toda la pantalla
- **Reloj:** Muestra la hora actual en la esquina superior derecha
- **Repetición aleatoria:** Las imágenes aparecen de forma aleatoria según su configuración
- **Transiciones suaves:** Cambios automáticos con efectos de fade

## ⚙️ Configuración

### **Duración:**
- **Rango:** 1-60 segundos
- **Por defecto:** 5 segundos
- **Edición:** Controles inline en cada imagen

### **Repetición:**
- **Rango:** 1-10 veces
- **Comportamiento:** Aleatorio (no secuencial)
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

### **Imágenes no se muestran:**
1. Verifica que estén marcadas como "Activas"
2. Revisa permisos de storage en Supabase
3. Comprueba formato de archivo (JPG, PNG, etc.)

### **Repetición no funciona:**
1. Verifica que el valor esté entre 1-10
2. Recarga la pantalla de display
3. Comprueba que haya múltiples imágenes activas

## 📄 Licencia

Este proyecto está diseñado específicamente para uso con Herbalife y sus colores corporativos.

---

**🌿 Herbalife - Nutrición para una vida activa** 