#!/bin/bash

echo "🧹 Limpiando archivos innecesarios del proyecto..."

# Crear carpeta de backup para archivos SQL
mkdir -p backup-sql

# Mover archivos SQL a carpeta de backup
echo "📦 Moviendo archivos SQL a carpeta de backup..."
mv *.sql backup-sql/

# Eliminar archivos del sistema
echo "🗑️ Eliminando archivos del sistema..."
rm -f .DS_Store
rm -f Thumbs.db 2>/dev/null

# Crear archivo con lista de archivos esenciales
echo "📝 Creando lista de archivos esenciales..."
cat > ARCHIVOS-ESENCIALES.md << 'EOF'
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

### CSS:
- `styles.css` - Estilos del panel
- `display-styles.css` - Estilos del display

### Configuración:
- `.gitignore` - Configuración de Git

## 📁 Archivos de Backup (en carpeta backup-sql/)
- Todos los archivos .sql para configuración de base de datos

## 📚 Documentación:
- `README.md` - Documentación principal
- `INSTRUCCIONES-*.md` - Guías de uso

## 🔧 Para Restaurar Archivos SQL:
```bash
# Si necesitas configurar la base de datos nuevamente:
cp backup-sql/supabase-setup.sql .
```
EOF

echo "✅ Limpieza completada!"
echo "📁 Los archivos SQL están en: backup-sql/"
echo "📝 Lista de archivos esenciales en: ARCHIVOS-ESENCIALES.md"
echo ""
echo "🎯 Archivos esenciales que quedan:"
ls -la | grep -E "\.(html|js|css)$|\.gitignore|README|INSTRUCCIONES|SOLUCION" 