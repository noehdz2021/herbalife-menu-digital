# 🔐 Configuración del Sistema de Autenticación

## 📋 Requisitos Previos

Antes de configurar el sistema de autenticación, asegúrate de tener:
- ✅ Proyecto Supabase creado
- ✅ Base de datos configurada
- ✅ Storage configurado
- ✅ Credenciales de Supabase

## 🗄️ Configuración de la Base de Datos

### 1. Ejecutar Script de Configuración

**Si ya tienes la tabla `menu_images` creada** (caso más común):

1. Primero ejecuta `supabase-setup-auth-only.sql` para crear las tablas de autenticación
2. Luego ejecuta `update-menu-images-policies.sql` para actualizar las políticas de seguridad

**Si es una instalación nueva:**

Ejecuta el contenido completo de `supabase-setup.sql`:

```sql
-- Crear tabla menu_images
CREATE TABLE menu_images (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    src TEXT NOT NULL,
    duration INTEGER DEFAULT 5,
    repeat INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de usuarios admin
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Crear tabla de sesiones
CREATE TABLE admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurar políticas de seguridad...
```

### 2. Verificar Tablas Creadas

Después de ejecutar los scripts, verifica que se hayan creado las tablas:
- `menu_images` (ya existía)
- `admin_users` (nueva)
- `admin_sessions` (nueva)

### 3. Verificar Políticas de Seguridad

Verifica que las políticas de seguridad estén configuradas correctamente:
- Lectura pública de `menu_images` (para display)
- Inserción/actualización/eliminación de `menu_images` solo para usuarios autenticados
- Acceso a `admin_users` y `admin_sessions` solo para usuarios autenticados

## 👤 Configuración de Usuarios

### Usuario por Defecto

El script crea automáticamente un usuario administrador:
- **Email:** `admin@herbalife.com`
- **Contraseña:** `admin123`
- **Nombre:** `Administrador`
- **Rol:** `admin`

### Crear Usuarios Adicionales

Para crear más usuarios, ejecuta en SQL Editor:

```sql
INSERT INTO admin_users (email, password_hash, name, role) 
VALUES ('tu-email@ejemplo.com', 'tu-contraseña', 'Tu Nombre', 'admin');
```

⚠️ **Importante:** En producción, usa bcrypt o similar para hashear contraseñas.

## 🔧 Configuración del Frontend

### 1. Actualizar Credenciales

Edita el archivo `config.js` con tus credenciales de Supabase:

```javascript
const CONFIG = {
    SUPABASE_URL: 'https://tu-proyecto.supabase.co',
    SUPABASE_ANON_KEY: 'tu-anon-key',
    // ... resto de configuración
};
```

### 2. Verificar Archivos

Asegúrate de que todos los archivos estén presentes:
- ✅ `config.js` - Configuración centralizada
- ✅ `auth.js` - Sistema de autenticación
- ✅ `login.html` - Página de login
- ✅ `index.html` - Panel de administración (actualizado)

## 🚀 Probar el Sistema

### 1. Acceder al Login

Abre `login.html` en tu navegador.

### 2. Iniciar Sesión

Usa las credenciales por defecto:
- Email: `admin@herbalife.com`
- Contraseña: `admin123`

### 3. Verificar Funcionalidad

- ✅ Login exitoso
- ✅ Redirección al panel de administración
- ✅ Información del usuario visible
- ✅ Botón de logout funcional
- ✅ Protección de rutas

## 🔒 Seguridad

### Políticas de Seguridad Implementadas

1. **Row Level Security (RLS)** habilitado en todas las tablas
2. **Políticas de acceso** basadas en autenticación
3. **Sesiones con expiración** (24 horas por defecto)
4. **Tokens únicos** para cada sesión
5. **Validación de credenciales** en base de datos

### Recomendaciones de Seguridad

1. **Cambiar credenciales por defecto** en producción
2. **Usar HTTPS** en producción
3. **Implementar rate limiting** si es necesario
4. **Usar bcrypt** para hashear contraseñas
5. **Configurar CORS** apropiadamente

## 🐛 Solución de Problemas

### Error: "relation already exists"
Si ves el error `ERROR: 42P07: relation "menu_images" already exists`:

**Solución:**
1. Usa `supabase-setup-auth-only.sql` en lugar de `supabase-setup.sql`
2. Luego ejecuta `update-menu-images-policies.sql` para actualizar las políticas
3. Esto creará solo las nuevas tablas sin tocar la tabla existente

### Error: "Credenciales inválidas"
- Verifica que el usuario existe en la tabla `admin_users`
- Comprueba que la contraseña coincida exactamente
- Revisa la consola del navegador para errores

### Error: "Error al crear sesión"
- Verifica que la tabla `admin_sessions` existe
- Comprueba permisos de inserción en la tabla
- Revisa políticas de RLS

### Error: "No autorizado"
- Verifica que el token de sesión sea válido
- Comprueba que la sesión no haya expirado
- Revisa políticas de acceso en las tablas

### Error: "Base de datos no disponible"
- Verifica credenciales de Supabase
- Comprueba conexión a internet
- Revisa configuración en `config.js`

## 📝 Personalización

### Cambiar Duración de Sesión

Edita `config.js`:

```javascript
const CONFIG = {
    // ... otras configuraciones
    SESSION_DURATION_HOURS: 48, // Cambiar a 48 horas
};
```

### Agregar Más Categorías

Edita `config.js`:

```javascript
const CONFIG = {
    // ... otras configuraciones
    CATEGORIES: [
        { value: 'bebidas', label: 'Bebidas' },
        { value: 'productos', label: 'Productos' },
        { value: 'ofertas', label: 'Ofertas' },
        { value: 'informacion', label: 'Información' },
        { value: 'nueva-categoria', label: 'Nueva Categoría' }
    ]
};
```

### Personalizar Interfaz de Login

Edita `login.html` para cambiar:
- Colores y estilos
- Textos y mensajes
- Logo y branding

## 🔄 Mantenimiento

### Limpiar Sesiones Expiradas

Ejecuta periódicamente en SQL Editor:

```sql
DELETE FROM admin_sessions 
WHERE expires_at < NOW();
```

### Verificar Usuarios Activos

```sql
SELECT au.email, au.name, au.last_login, as.expires_at
FROM admin_users au
JOIN admin_sessions as ON au.id = as.user_id
WHERE as.expires_at > NOW();
```

---

**🌿 Sistema de Autenticación Herbalife - Seguro y Confiable** 