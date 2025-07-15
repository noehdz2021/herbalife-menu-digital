// Clase principal para gestionar las imágenes del menú
class MenuImageManager {
    constructor() {
        this.images = [];
        this.currentFilter = 'all';
        this.supabaseReady = false;
        this.init();
    }

    async init() {
        // Esperar a que Supabase esté listo
        await this.waitForSupabase();
        await this.loadImages();
        this.renderImages();
        this.updateStats();
        this.setupEventListeners();
        this.setupRealtimeSubscription();
    }

    async waitForSupabase() {
        // Intentar inicializar Supabase
        if (!supabase) {
            const maxAttempts = 10;
            let attempts = 0;
            
            while (attempts < maxAttempts && !supabase) {
                if (initSupabase()) {
                    this.supabaseReady = true;
                    return;
                }
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            if (!supabase) {
                console.error('❌ No se pudo inicializar Supabase');
                this.showMessage('Error: No se pudo conectar con la base de datos', 'error');
                return;
            }
        }
        this.supabaseReady = true;
    }

    checkSupabaseReady() {
        if (!this.supabaseReady || !supabase) {
            this.showMessage('Error: Base de datos no disponible. Recarga la página.', 'error');
            return false;
        }
        return true;
    }

    async loadImages() {
        if (!this.checkSupabaseReady()) return;
        
        try {
            const { data, error } = await supabase
                .from('menu_images')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                handleSupabaseError(error, 'loadImages');
                return;
            }
            
            this.images = data || [];
        } catch (error) {
            console.error('Error cargando imágenes:', error);
            this.images = [];
        }
    }

    setupRealtimeSubscription() {
        // Suscribirse a cambios en tiempo real
        supabase
            .channel('menu_images_changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'menu_images' }, 
                (payload) => {
                    console.log('Cambio detectado:', payload);
                    this.loadImages().then(() => {
                        this.renderImages();
                        this.updateStats();
                    });
                }
            )
            .subscribe();
    }

    setupEventListeners() {
        // Prevenir comportamiento por defecto en drag & drop
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
    }

    async uploadImages() {
        if (!this.checkSupabaseReady()) return;

        const fileInput = document.getElementById('imageInput');
        const category = document.getElementById('imageCategory').value;
        const title = document.getElementById('imageTitle').value;
        const duration = parseInt(document.getElementById('imageDuration').value);
        const repeat = parseInt(document.getElementById('imageRepeat').value);
        const files = fileInput.files;

        if (files.length === 0) {
            this.showMessage('Por favor selecciona al menos una imagen', 'error');
            return;
        }

        if (!title.trim()) {
            this.showMessage('Por favor ingresa un título para la imagen', 'error');
            return;
        }

        if (!duration || duration < 1 || duration > 60) {
            this.showMessage('La duración debe estar entre 1 y 60 segundos', 'error');
            return;
        }

        this.showMessage('Subiendo imágenes...', 'info');

        try {
            const uploadPromises = Array.from(files).map(async (file, index) => {
                if (file.type.startsWith('image/')) {
                    // Generar nombre único para el archivo
                    const fileExtension = file.name.split('.').pop();
                    const fileName = `${Date.now()}_${index}.${fileExtension}`;
                    
                    // Subir imagen a Supabase Storage
                    const { data: storageData, error: storageError } = await supabase.storage
                        .from('menu-images')
                        .upload(fileName, file);
                    
                    if (storageError) {
                        throw storageError;
                    }
                    
                    // Obtener URL pública
                    const { data: urlData } = supabase.storage
                        .from('menu-images')
                        .getPublicUrl(fileName);
                    
                    // Guardar metadatos en base de datos
                    const imageData = {
                        title: files.length > 1 ? `${title} ${index + 1}` : title,
                        category: category,
                        src: urlData.publicUrl,
                        duration: duration,
                        repeat: repeat || 1,
                        active: true
                    };
                    
                    const { data: dbData, error: dbError } = await supabase
                        .from('menu_images')
                        .insert([imageData])
                        .select();
                    
                    if (dbError) {
                        throw dbError;
                    }
                    
                    return dbData[0];
                }
            });

            await Promise.all(uploadPromises);
            
            // Limpiar formulario
            fileInput.value = '';
            document.getElementById('imageTitle').value = '';
            document.getElementById('imageDuration').value = '5';
            document.getElementById('imageRepeat').value = '1';
            
            this.showMessage('Imágenes subidas exitosamente', 'success');
            
        } catch (error) {
            console.error('Error subiendo imágenes:', error);
            this.showMessage('Error al subir imágenes: ' + error.message, 'error');
        }
    }

    async deleteImage(id) {
        if (!this.checkSupabaseReady()) return;
        
        if (confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
            try {
                // Obtener información de la imagen para eliminar archivo
                const image = this.images.find(img => img.id === id);
                if (image) {
                    // Extraer nombre del archivo de la URL
                    const fileName = image.src.split('/').pop();
                    
                    // Eliminar archivo de Storage
                    const { error: storageError } = await supabase.storage
                        .from('menu-images')
                        .remove([fileName]);
                    
                    if (storageError) {
                        console.warn('Error eliminando archivo de storage:', storageError);
                    }
                }
                
                // Eliminar registro de base de datos
                const { error } = await supabase
                    .from('menu_images')
                    .delete()
                    .eq('id', id);
                
                if (error) {
                    throw error;
                }
                
                this.showMessage('Imagen eliminada exitosamente', 'success');
                
            } catch (error) {
                console.error('Error eliminando imagen:', error);
                this.showMessage('Error al eliminar imagen', 'error');
            }
        }
    }

    async toggleImage(id) {
        if (!this.checkSupabaseReady()) return;
        
        try {
            const image = this.images.find(img => img.id === id);
            if (image) {
                const { data, error } = await supabase
                    .from('menu_images')
                    .update({ active: !image.active })
                    .eq('id', id);
                
                if (error) {
                    throw error;
                }
                
                this.showMessage(`Imagen ${!image.active ? 'activada' : 'desactivada'} exitosamente`, 'success');
            }
        } catch (error) {
            console.error('Error actualizando imagen:', error);
            this.showMessage('Error al actualizar imagen', 'error');
        }
    }

    async updateImageDuration(id, duration) {
        if (!this.checkSupabaseReady()) return;
        
        if (duration >= 1 && duration <= 60) {
            try {
                const { error } = await supabase
                    .from('menu_images')
                    .update({ duration: parseInt(duration) })
                    .eq('id', id);
                
                if (error) {
                    throw error;
                }
                
                this.showMessage('Duración actualizada exitosamente', 'success');
                
            } catch (error) {
                console.error('Error actualizando duración:', error);
                this.showMessage('Error al actualizar duración', 'error');
            }
        } else {
            this.showMessage('La duración debe estar entre 1 y 60 segundos', 'error');
        }
    }

    async updateImageRepeat(id, repeat) {
        if (!this.checkSupabaseReady()) return;
        
        if (repeat >= 1 && repeat <= 10) {
            try {
                const { error } = await supabase
                    .from('menu_images')
                    .update({ repeat: parseInt(repeat) })
                    .eq('id', id);
                
                if (error) {
                    throw error;
                }
                
                this.showMessage('Repetición actualizada exitosamente', 'success');
                
            } catch (error) {
                console.error('Error actualizando repetición:', error);
                this.showMessage('Error al actualizar repetición', 'error');
            }
        } else {
            this.showMessage('La repetición debe estar entre 1 y 10 veces', 'error');
        }
    }

    filterImages() {
        this.currentFilter = document.getElementById('categoryFilter').value;
        this.renderImages();
    }

    renderImages() {
        const grid = document.getElementById('imagesGrid');
        let filteredImages = this.images;

        if (this.currentFilter !== 'all') {
            filteredImages = this.images.filter(img => img.category === this.currentFilter);
        }

        if (filteredImages.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <h3 style="color: #666; margin-bottom: 20px;">📸 No hay imágenes disponibles</h3>
                    <p style="color: #999;">Sube algunas imágenes para comenzar a gestionar tu menú digital</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filteredImages.map(image => `
            <div class="image-card ${!image.active ? 'inactive' : ''}">
                <img src="${image.src}" alt="${image.title}" onerror="this.style.display='none'">
                <div class="image-card-content">
                    <h4>${image.title}</h4>
                    <span class="category">${this.getCategoryLabel(image.category)}</span>
                    <div class="duration-control">
                        <label>⏱️ Duración:</label>
                        <input type="number" 
                               value="${image.duration || 5}" 
                               min="1" 
                               max="60" 
                               onchange="menuManager.updateImageDuration(${image.id}, this.value)"
                               class="duration-input-small">
                        <span>segundos</span>
                    </div>
                    <div class="duration-control">
                        <label>🔄 Repetir:</label>
                        <input type="number" 
                               value="${image.repeat || 1}" 
                               min="1" 
                               max="10" 
                               onchange="menuManager.updateImageRepeat(${image.id}, this.value)"
                               class="duration-input-small">
                        <span>veces</span>
                    </div>
                    <div class="actions">
                        <label class="toggle-switch">
                            <input type="checkbox" ${image.active ? 'checked' : ''} 
                                   onchange="menuManager.toggleImage(${image.id})">
                            <span class="slider"></span>
                        </label>
                        <button class="btn btn-danger btn-small" onclick="menuManager.deleteImage(${image.id})">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getCategoryLabel(category) {
        const labels = {
            'bebidas': '🥤 Bebidas',
            'productos': '🌿 Productos',
            'ofertas': '🎯 Ofertas',
            'informacion': 'ℹ️ Información'
        };
        return labels[category] || category;
    }

    updateStats() {
        const totalImages = this.images.length;
        const activeImages = this.images.filter(img => img.active).length;
        const avgDuration = activeImages > 0 ? 
            Math.round(this.images.filter(img => img.active).reduce((sum, img) => sum + (img.duration || 5), 0) / activeImages) : 5;
        
        document.getElementById('totalImages').textContent = totalImages;
        document.getElementById('activeImages').textContent = activeImages;
        document.getElementById('avgDuration').textContent = avgDuration + 's';
    }

    async exportData() {
        if (!this.checkSupabaseReady()) return;
        
        try {
            const { data, error } = await supabase
                .from('menu_images')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                throw error;
            }
            
            const exportData = {
                images: data,
                exportDate: new Date().toISOString(),
                source: 'Supabase'
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `menu-herbalife-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showMessage('Datos exportados exitosamente', 'success');
            
        } catch (error) {
            console.error('Error exportando datos:', error);
            this.showMessage('Error al exportar datos', 'error');
        }
    }

    importData(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.images) {
                        this.images = data.images;
                        this.saveImages();
                        this.renderImages();
                        this.updateStats();
                        this.showMessage('Datos importados exitosamente', 'success');
                    } else {
                        this.showMessage('Formato de archivo inválido', 'error');
                    }
                } catch (error) {
                    this.showMessage('Error al leer el archivo', 'error');
                }
            };
            reader.readAsText(file);
        }
    }

    showMessage(message, type) {
        // Remover mensajes anteriores
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        const container = document.querySelector('.container');
        container.insertBefore(messageDiv, container.firstChild);

        // Remover mensaje después de 5 segundos
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }

    // Función para agregar imágenes de ejemplo
    addSampleImages() {
        const sampleImages = [
            {
                id: Date.now() + 1,
                title: 'Batido de Fórmula 1 - Vainilla',
                category: 'bebidas',
                duration: 8,
                src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjOThGQjk4Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjMjI4QjIyIj7wn5W0IEJhdGlkbyBGw7NybXVsYSAxPC90ZXh0PgoKPC9zdmc+',
                active: true,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 2,
                title: 'Té Concentrado de Hierbas',
                category: 'bebidas',
                duration: 6,
                src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjBGOEZGIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjMkU4QjU3Ij7wn42FIFTDqSBDb25jZW50cmFkbzwvdGV4dD4KPC9zdmc+',
                active: true,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 3,
                title: '50% de Descuento - Productos Seleccionados',
                category: 'ofertas',
                duration: 10,
                src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRkZENzAwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjRkY0NTAwIj7wn5G8IDUwJSBERVNDVUVOVE88L3RleHQ+Cjx0ZXh0IHg9IjIwMCIgeT0iMTgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjRkY0NTAwIj5Qcm9kdWN0b3MgU2VsZWNjaW9uYWRvczwvdGV4dD4KPC9zdmc+',
                active: true,
                createdAt: new Date().toISOString()
            }
        ];

        this.images.push(...sampleImages);
        this.saveImages();
        this.renderImages();
        this.updateStats();
        this.showMessage('Imágenes de ejemplo agregadas', 'success');
    }
}

// Instanciar el gestor de imágenes
const menuManager = new MenuImageManager();

// Funciones globales para los event handlers
function filterImages() {
    menuManager.filterImages();
}

function uploadImages() {
    menuManager.uploadImages();
}

function exportData() {
    menuManager.exportData();
}

// Función para agregar imágenes de ejemplo (solo para demostración)
function addSampleImages() {
    menuManager.addSampleImages();
}

// Drag & Drop functionality
document.addEventListener('DOMContentLoaded', function() {
    const imageInput = document.getElementById('imageInput');
    const uploadSection = document.querySelector('.upload-section');

    uploadSection.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadSection.style.backgroundColor = '#E0FFE0';
        uploadSection.style.borderColor = '#2E8B57';
    });

    uploadSection.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadSection.style.backgroundColor = '';
        uploadSection.style.borderColor = '';
    });

    uploadSection.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadSection.style.backgroundColor = '';
        uploadSection.style.borderColor = '';
        
        const files = e.dataTransfer.files;
        imageInput.files = files;
        
        if (files.length > 0) {
            menuManager.showMessage(`${files.length} archivo(s) seleccionado(s)`, 'success');
        }
    });

    // Agregar botón para imágenes de ejemplo solo si no hay imágenes
    if (menuManager.images.length === 0) {
        const sampleButton = document.createElement('button');
        sampleButton.textContent = '📸 Agregar Imágenes de Ejemplo';
        sampleButton.className = 'btn btn-secondary';
        sampleButton.style.marginTop = '10px';
        sampleButton.onclick = addSampleImages;
        document.querySelector('.upload-section').appendChild(sampleButton);
    }
}); 