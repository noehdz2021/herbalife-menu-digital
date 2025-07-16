// Versión minimalista del script con autenticación
let images = [];

// Verificar Supabase
async function checkSupabase() {
    return !!window.supabaseClient;
}

// Mostrar información del usuario
function displayUserInfo() {
    const userInfo = document.getElementById('userInfo');
    if (userInfo && window.authManager) {
        const user = window.authManager.getCurrentUser();
        if (user) {
            userInfo.textContent = `👤 ${user.name}`;
        }
    }
}

// Subir imágenes
async function uploadImages() {
    if (!window.supabaseClient) {
        alert('Error: Base de datos no disponible');
        return;
    }
    
    const fileInput = document.getElementById('imageInput');
    const category = document.getElementById('imageCategory').value;
    const title = document.getElementById('imageTitle').value;
    const duration = parseInt(document.getElementById('imageDuration').value);
    const repeat = parseInt(document.getElementById('imageRepeat').value);
    const files = fileInput.files;

    if (files.length === 0) {
        alert('Selecciona al menos una imagen');
        return;
    }

    if (!title.trim()) {
        alert('Ingresa un título');
        return;
    }

    try {
        console.log('🔄 Iniciando subida de imágenes...');
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith('image/')) {
                const fileName = `${Date.now()}_${i}.${file.name.split('.').pop()}`;
                
                console.log(`📤 Subiendo archivo: ${fileName}`);
                
                // Subir archivo
                const { error: storageError } = await window.supabaseClient.storage
                    .from(CONFIG.STORAGE_BUCKET)
                    .upload(fileName, file);
                
                if (storageError) throw storageError;
                
                // Obtener URL
                const { data: urlData } = window.supabaseClient.storage
                    .from(CONFIG.STORAGE_BUCKET)
                    .getPublicUrl(fileName);
                
                // Guardar en BD
                const imageData = {
                    title: files.length > 1 ? `${title} ${i + 1}` : title,
                    category: category,
                    src: urlData.publicUrl,
                    duration: duration,
                    repeat: repeat,
                    active: true
                };
                
                console.log('💾 Guardando en base de datos:', imageData.title);
                await window.supabaseClient.from('menu_images').insert([imageData]);
            }
        }

        // Limpiar formulario
        fileInput.value = '';
        document.getElementById('imageTitle').value = '';
        
        console.log('✅ Imágenes subidas exitosamente');
        alert('✅ Imágenes subidas');
        await loadImages();
        
    } catch (error) {
        console.error('❌ Error subiendo imágenes:', error);
        alert('Error al subir imágenes: ' + error.message);
    }
}

// Cargar imágenes
async function loadImages() {
    if (!window.supabaseClient) return;

    try {
        const { data, error } = await window.supabaseClient
            .from('menu_images')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        images = data || [];
        renderImages();
        updateStats();
        
    } catch (error) {
        console.error('Error cargando imágenes:', error);
    }
}

// Mostrar imágenes
function renderImages() {
    const grid = document.getElementById('imagesGrid');
    
    if (!images.length) {
        grid.innerHTML = `
            <div class="no-images">
                <h3>📷 Sin imágenes</h3>
                <p>Sube tu primera imagen</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = images.map(image => `
        <div class="image-card">
            <div class="image-container">
                <img src="${image.src}" alt="${image.title}">
                <div class="image-overlay">
                    <button class="btn btn-small btn-danger" onclick="deleteImage(${image.id})">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="image-info">
                <h4>${image.title}</h4>
                <div class="image-meta">
                    <span class="category">${image.category}</span>
                    <span class="duration">${image.duration}s</span>
                    <span class="repeat">${image.repeat}x</span>
                </div>
                <div class="edit-controls">
                    <input type="number" 
                           value="${image.duration}" 
                           min="1" max="60" 
                           onchange="updateDuration(${image.id}, this.value)"
                           class="edit-input">
                    <input type="number" 
                           value="${image.repeat}" 
                           min="1" max="10" 
                           onchange="updateRepeat(${image.id}, this.value)"
                           class="edit-input">
                </div>
            </div>
        </div>
    `).join('');
}

// Actualizar estadísticas
function updateStats() {
    const total = images.length;
    const active = images.filter(img => img.active).length;
    
    document.getElementById('totalImages').textContent = total;
    document.getElementById('activeImages').textContent = active;
}

// Actualizar duración
async function updateDuration(id, duration) {
    if (!window.supabaseClient) return;
    
    try {
        await window.supabaseClient
            .from('menu_images')
            .update({ duration: parseInt(duration) })
            .eq('id', id);
        
        const image = images.find(img => img.id === id);
        if (image) image.duration = parseInt(duration);
        
    } catch (error) {
        console.error('Error actualizando duración:', error);
    }
}

// Actualizar repetición
async function updateRepeat(id, repeat) {
    if (!window.supabaseClient) return;
    
    try {
        await window.supabaseClient
            .from('menu_images')
            .update({ repeat: parseInt(repeat) })
            .eq('id', id);
        
        const image = images.find(img => img.id === id);
        if (image) image.repeat = parseInt(repeat);
        
    } catch (error) {
        console.error('Error actualizando repetición:', error);
    }
}

// Eliminar imagen
async function deleteImage(id) {
    if (!window.supabaseClient || !confirm('¿Eliminar imagen?')) return;

    try {
        console.log('🗑️ Eliminando imagen ID:', id);
        
        const image = images.find(img => img.id === id);
        if (image) {
            console.log('🗑️ Eliminando archivo de storage:', image.src);
            const fileName = image.src.split('/').pop();
            await window.supabaseClient.storage.from(CONFIG.STORAGE_BUCKET).remove([fileName]);
        }
        
        console.log('🗑️ Eliminando registro de base de datos');
        await window.supabaseClient.from('menu_images').delete().eq('id', id);
        
        console.log('✅ Imagen eliminada exitosamente');
        await loadImages();
        
    } catch (error) {
        console.error('❌ Error eliminando imagen:', error);
        alert('Error al eliminar: ' + error.message);
    }
}

// Forzar actualización del display
async function forceDisplayRefresh() {
    if (!window.supabaseClient) {
        alert('Error: Base de datos no disponible');
        return;
    }
    
    try {
        console.log('🔄 Forzando actualización del display...');
        
        // Crear un registro temporal para activar la suscripción en tiempo real
        const tempData = {
            title: 'Actualización forzada',
            category: 'sistema',
            src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8L3N2Zz4=',
            duration: 1,
            repeat: 1,
            active: false // No se mostrará en el display
        };
        
        // Insertar y eliminar inmediatamente para activar la suscripción
        const { data: inserted } = await window.supabaseClient
            .from('menu_images')
            .insert([tempData])
            .select();
        
        if (inserted && inserted[0]) {
            await window.supabaseClient
                .from('menu_images')
                .delete()
                .eq('id', inserted[0].id);
        }
        
        console.log('✅ Señal de actualización enviada al display');
        alert('✅ Display actualizado');
        
    } catch (error) {
        console.error('❌ Error forzando actualización:', error);
        alert('Error forzando actualización: ' + error.message);
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', async function() {
    // Esperar a que se cargue la autenticación
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar autenticación
    if (window.authManager && window.authManager.isAuthenticated()) {
        displayUserInfo();
        
        const success = await checkSupabase();
        if (success) {
            await loadImages();
        } else {
            renderImages();
            updateStats();
        }
    } else {
        // Si no está autenticado, redirigir al login
        window.location.href = 'login.html';
    }
}); 