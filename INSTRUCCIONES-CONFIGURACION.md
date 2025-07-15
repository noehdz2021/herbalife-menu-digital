# 🔧 Instrucciones para Configurar Supabase

## ⚠️ PROBLEMA ACTUAL
El error `net::ERR_NAME_NOT_RESOLVED` indica que las credenciales de Supabase no son válidas o el proyecto no existe. Necesitas crear un nuevo proyecto y configurarlo correctamente.

## 🚀 PASO A PASO

### 1. Crear Proyecto en Supabase
1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Haz clic en "New Project"
4. Elige una organización
5. Ingresa:
   - **Name**: `herbalife-menu-digital`
   - **Database Password**: (guarda esta contraseña en lugar seguro)
   - **Region**: Elige la más cercana a tu ubicación
6. Haz clic en "Create new project"
7. Espera a que el proyecto se inicialice (2-3 minutos)

### 2. Obtener Credenciales
1. Una vez creado el proyecto, ve a **Settings** → **API**
2. Copia estos valores:
   - **URL**: `https://tu-proyecto.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Configurar Base de Datos
1. Ve a **SQL Editor** en el panel lateral
2. Copia y pega el contenido del archivo `database-setup.sql`
3. Haz clic en "Run" para ejecutar el script
4. Verifica que se creó la tabla `menu_images` en **Table Editor**

### 4. Configurar Storage
1. Ve a **Storage** en el panel lateral
2. Haz clic en "Create a new bucket"
3. Ingresa:
   - **Name**: `menu-images`
   - **Public**: ✅ Activado
4. Haz clic en "Create bucket"
5. Ve a **SQL Editor** y ejecuta el contenido de `storage-setup.sql`

### 5. Actualizar Credenciales en el Código
1. Abre el archivo `supabase-config.js`
2. Reemplaza:
   ```javascript
   const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
   const SUPABASE_ANON_KEY = 'TU-CLAVE-ANONIMA-AQUI';
   ```
   Por tus credenciales reales:
   ```javascript
   const SUPABASE_URL = 'https://tu-proyecto-real.supabase.co';
   const SUPABASE_ANON_KEY = 'tu-clave-anonima-real';
   ```

### 6. Verificar la Configuración
1. Abre `index.html` en tu navegador
2. Abre las herramientas de desarrollador (F12)
3. Busca en la consola:
   - ✅ `Supabase inicializado correctamente`
   - ✅ `Conectividad con Supabase verificada`
4. Si ves errores, revisa que:
   - Las credenciales sean correctas
   - La tabla `menu_images` exista
   - El bucket `menu-images` esté creado

## 🔍 VERIFICAR PROBLEMAS COMUNES

### Error: "Credenciales no configuradas"
- Verifica que hayas actualizado `SUPABASE_URL` y `SUPABASE_ANON_KEY`
- Las credenciales no deben contener los textos placeholder

### Error: "relation menu_images does not exist"
- Ejecuta el script `database-setup.sql` en SQL Editor
- Verifica que la tabla se creó en Table Editor

### Error: "bucket menu-images does not exist"
- Crea el bucket manualmente en Storage
- Ejecuta el script `storage-setup.sql`

### Error: "Invalid JWT"
- Verifica que la `anon public key` sea correcta
- Copia la clave completa sin espacios adicionales

## 📝 ARCHIVOS IMPORTANTES

- `supabase-config.js`: Configuración principal
- `database-setup.sql`: Script para crear la tabla
- `storage-setup.sql`: Script para configurar el storage
- `INSTRUCCIONES-CONFIGURACION.md`: Este archivo

## 🔧 SIGUIENTE PASO
Una vez completada la configuración, puedes eliminar los archivos temporales:
- `database-setup.sql`
- `storage-setup.sql`
- `INSTRUCCIONES-CONFIGURACION.md`

## 🆘 SOPORTE
Si sigues teniendo problemas después de seguir estos pasos, verifica:
1. Que tu conexión a internet funcione correctamente
2. Que no haya firewalls bloqueando supabase.co
3. Que las credenciales sean exactamente como aparecen en Supabase

¡Una vez configurado correctamente, tu sistema de menú digital funcionará perfectamente! 🌿 