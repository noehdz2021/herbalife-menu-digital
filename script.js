// Versión minimalista del script con autenticación
let files = [];

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

// Subir archivos (imágenes y videos)
async function uploadFiles() {
    if (!window.supabaseClient) {
        alert('Error: Base de datos no disponible');
        return;
    }
    
    const fileInput = document.getElementById('fileInput');
    const category = document.getElementById('fileCategory').value;
    const title = document.getElementById('fileTitle').value;
    const duration = parseInt(document.getElementById('fileDuration').value);
    const repeat = parseInt(document.getElementById('fileRepeat').value);
    const selectedFiles = fileInput.files;

    if (selectedFiles.length === 0) {
        alert('Selecciona al menos un archivo');
        return;
    }

    if (!title.trim()) {
        alert('Ingresa un título');
        return;
    }

    try {
        console.log('🔄 Iniciando subida de archivos...');
        
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            
            if (isImage || isVideo) {
                const fileName = `${Date.now()}_${i}.${file.name.split('.').pop()}`;
                
                console.log(`📤 Subiendo archivo: ${fileName} (${isImage ? 'imagen' : 'video'})`);
                
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
                const fileData = {
                    title: selectedFiles.length > 1 ? `${title} ${i + 1}` : title,
                    category: category,
                    src: urlData.publicUrl,
                    duration: isImage ? duration : null, // Los videos usan su duración natural
                    repeat: repeat,
                    active: true
                };
                
                // Agregar file_type solo si la columna existe (después de migración)
                if (isVideo) {
                    fileData.file_type = 'video';
                } else {
                    fileData.file_type = 'image';
                }
                
                console.log('💾 Guardando en base de datos:', fileData.title);
                
                try {
                    // Intentar insertar con file_type
                    await window.supabaseClient.from('menu_images').insert([fileData]);
                } catch (error) {
                    if (error.message.includes('file_type') || error.message.includes('column')) {
                        console.log('⚠️ Columna file_type no existe, insertando sin ella...');
                        // Remover file_type y reintentar
                        const { file_type, ...fileDataWithoutType } = fileData;
                        await window.supabaseClient.from('menu_images').insert([fileDataWithoutType]);
                    } else {
                        throw error;
                    }
                }
            } else {
                console.warn(`⚠️ Archivo no soportado: ${file.name} (${file.type})`);
            }
        }

        // Limpiar formulario
        fileInput.value = '';
        document.getElementById('fileTitle').value = '';
        
        console.log('✅ Archivos subidos exitosamente');
        alert('✅ Archivos subidos');
        await loadFiles();
        
    } catch (error) {
        console.error('❌ Error subiendo archivos:', error);
        alert('Error al subir archivos: ' + error.message);
    }
}

// Cargar archivos
async function loadFiles() {
    if (!window.supabaseClient) return;

    try {
        const { data, error } = await window.supabaseClient
            .from('menu_images')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        files = data || [];
        renderFiles();
        updateStats();
        
    } catch (error) {
        console.error('Error cargando archivos:', error);
    }
}

// Mostrar archivos
function renderFiles() {
    const grid = document.getElementById('imagesGrid');
    
    if (!files.length) {
        grid.innerHTML = `
            <div class="no-images">
                <h3>📁 Sin archivos</h3>
                <p>Sube tu primer archivo</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = files.map(file => {
        // Detectar si es video basado en file_type o extensión de archivo
        const isVideo = file.file_type === 'video' || 
                       (file.src && (file.src.includes('.mp4') || file.src.includes('.webm') || file.src.includes('.mov') || file.src.includes('.avi')));
        const icon = isVideo ? '🎥' : '📷';
        const durationText = isVideo ? 'Video' : `${file.duration}s`;
        
        return `
            <div class="image-card">
                <div class="image-container">
                    ${isVideo ? 
                        `<video src="${file.src}" alt="${file.title}" controls>
                            Tu navegador no soporta videos.
                        </video>` :
                        `<img src="${file.src}" alt="${file.title}">`
                    }
                    <div class="image-overlay">
                        <span class="file-type-badge">${icon}</span>
                        <button class="btn btn-small btn-danger" onclick="deleteFile(${file.id})">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="image-info">
                    <h4>${file.title}</h4>
                    <div class="image-meta">
                        <span class="category">${file.category}</span>
                        <span class="duration">${durationText}</span>
                        <span class="repeat">${file.repeat}x</span>
                    </div>
                    ${!isVideo ? `
                        <div class="edit-controls">
                            <input type="number" 
                                   value="${file.duration}" 
                                   min="1" max="60" 
                                   onchange="updateDuration(${file.id}, this.value)"
                                   class="edit-input">
                            <input type="number" 
                                   value="${file.repeat}" 
                                   min="1" max="10" 
                                   onchange="updateRepeat(${file.id}, this.value)"
                                   class="edit-input">
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Actualizar estadísticas
function updateStats() {
    const total = files.length;
    const active = files.filter(file => file.active).length;
    
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
        
        const file = files.find(f => f.id === id);
        if (file) file.duration = parseInt(duration);
        
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
        
        const file = files.find(f => f.id === id);
        if (file) file.repeat = parseInt(repeat);
        
    } catch (error) {
        console.error('Error actualizando repetición:', error);
    }
}

// Eliminar archivo
async function deleteFile(id) {
    if (!window.supabaseClient || !confirm('¿Eliminar archivo?')) return;

    try {
        console.log('🗑️ Eliminando archivo ID:', id);
        
        const file = files.find(f => f.id === id);
        if (file) {
            console.log('🗑️ Eliminando archivo de storage:', file.src);
            const fileName = file.src.split('/').pop();
            await window.supabaseClient.storage.from(CONFIG.STORAGE_BUCKET).remove([fileName]);
        }
        
        console.log('🗑️ Eliminando registro de base de datos');
        await window.supabaseClient.from('menu_images').delete().eq('id', id);
        
        console.log('✅ Archivo eliminado exitosamente');
        await loadFiles();
        
    } catch (error) {
        console.error('❌ Error eliminando archivo:', error);
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
            await loadFiles();
        } else {
            renderFiles();
            updateStats();
        }
    } else {
        // Si no está autenticado, redirigir al login
        window.location.href = 'login.html';
    }
}); 