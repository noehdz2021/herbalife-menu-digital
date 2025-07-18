# Archivos Esenciales del Proyecto

## 🟢 Archivos de la Aplicación (NO BORRAR)

### HTML Principal:
- `admin.html` - Panel de administración
- `display.html` - Pantalla de visualización  
- `login.html` - Página de login
- `index.html` - Página principal

### JavaScript:
- `script.js` - Lógica del panel de administración
- `display-script.js` - Lógica del display
- `auth.js` - Sistema de autenticación
- `init.js` - Inicialización de Supabase
- `config.js` - Configuración

### Base de Datos:
- `add-file-type-column.sql` - Script para agregar soporte de videos

### CSS:
- `styles.css` - Estilos del panel
- `display-styles.css` - Estilos del display

### Configuración:
- `.gitignore` - Configuración de Git

## 📁 Archivos de Backup (en carpeta backup-sql/)
- Todos los archivos .sql para configuración de base de datos

## 📚 Documentación:
- `README.md` - Documentación principal
- `SOPORTE-VIDEOS.md` - Guía de soporte de videos
- `INSTRUCCIONES-*.md` - Guías de uso

## 🔧 Para Restaurar Archivos SQL:
```bash
# Si necesitas configurar la base de datos nuevamente:
cp backup-sql/supabase-setup.sql .
```
