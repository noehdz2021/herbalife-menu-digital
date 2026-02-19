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

// Función para actualizar la barra de progreso
function updateUploadProgress(current, total, fileName) {
    const progressBar = document.getElementById('uploadProgressBar');
    const progressPercent = document.getElementById('uploadPercent');
    const uploadStatus = document.getElementById('uploadStatus');
    const uploadFileName = document.getElementById('uploadFileName');
    const uploadProgress = document.getElementById('uploadProgress');
    const uploadBtn = document.getElementById('uploadBtn');
    
    if (current === 0) {
        // Iniciar progreso
        uploadProgress.style.display = 'block';
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Subiendo...';
    }
    
    const percent = Math.round((current / total) * 100);
    progressBar.style.width = percent + '%';
    progressPercent.textContent = percent + '%';
    uploadStatus.textContent = `Subiendo archivo ${current} de ${total}`;
    uploadFileName.textContent = fileName || '';
    
    if (current === total) {
        // Completado
        uploadStatus.textContent = '✅ Subida completada';
        setTimeout(() => {
            uploadProgress.style.display = 'none';
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Subir';
            progressBar.style.width = '0%';
            progressPercent.textContent = '0%';
        }, 2000);
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

    // Validaciones de entrada
    if (selectedFiles.length === 0) {
        alert('Selecciona al menos un archivo');
        return;
    }

    if (!title.trim()) {
        alert('Ingresa un título');
        return;
    }

    // Validar duración (1-60 segundos)
    if (isNaN(duration) || duration < 1 || duration > 60) {
        alert('La duración debe estar entre 1 y 60 segundos');
        return;
    }

    // Validar repetición (1-10 veces)
    if (isNaN(repeat) || repeat < 1 || repeat > 10) {
        alert('La repetición debe estar entre 1 y 10 veces');
        return;
    }

    // Tipos MIME permitidos
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
    const maxImageSize = 10 * 1024 * 1024; // 10MB
    const maxVideoSize = 100 * 1024 * 1024; // 100MB

    try {
        console.log('🔄 Iniciando subida de archivos...');
        
        // Validar y filtrar archivos válidos
        const validFiles = [];
        const invalidFiles = [];
        
        for (const file of selectedFiles) {
            const isImage = allowedImageTypes.includes(file.type.toLowerCase());
            const isVideo = allowedVideoTypes.includes(file.type.toLowerCase());
            
            if (!isImage && !isVideo) {
                invalidFiles.push(`${file.name}: Tipo de archivo no permitido (${file.type || 'desconocido'})`);
                continue;
            }
            
            const maxSize = isImage ? maxImageSize : maxVideoSize;
            if (file.size > maxSize) {
                const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
                invalidFiles.push(`${file.name}: Tamaño excede el límite de ${maxSizeMB}MB`);
                continue;
            }
            
            validFiles.push(file);
        }
        
        // Mostrar errores si hay archivos inválidos
        if (invalidFiles.length > 0) {
            alert('Algunos archivos no se pueden subir:\n\n' + invalidFiles.join('\n'));
            if (validFiles.length === 0) {
                return; // No hay archivos válidos
            }
        }
        
        const totalFiles = validFiles.length;
        let uploadedCount = 0;
        
        updateUploadProgress(0, totalFiles, '');
        
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            
            if (isImage || isVideo) {
                // Actualizar progreso antes de subir
                updateUploadProgress(uploadedCount, totalFiles, file.name);
                
                let fileName = `${Date.now()}_${i}.${file.name.split('.').pop()}`;
                
                console.log(`📤 Subiendo archivo: ${fileName} (${isImage ? 'imagen' : 'video'})`);
                console.log(`📊 Tamaño original: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
                console.log(`📊 Tipo MIME: ${file.type}`);
                
                // Para imágenes, verificar si necesitamos preservar calidad
                let fileToUpload = file;
                if (isImage) {
                    // Crear una copia del archivo con metadata preservada
                    const originalName = file.name;
                    const originalExtension = originalName.split('.').pop().toLowerCase();
                    
                    // Si es JPEG o PNG, intentar preservar calidad
                    if (originalExtension === 'jpg' || originalExtension === 'jpeg' || originalExtension === 'png') {
                        console.log(`🖼️ Preservando calidad de imagen: ${originalExtension.toUpperCase()}`);
                        
                        // Crear un nuevo archivo con el nombre original preservado
                        const preservedFileName = `${Date.now()}_${i}_original.${originalExtension}`;
                        fileToUpload = new File([file], preservedFileName, {
                            type: file.type,
                            lastModified: file.lastModified
                        });
                        fileName = preservedFileName;
                    }
                }
                
                // Subir archivo con opciones para preservar calidad
                const { error: storageError } = await window.supabaseClient.storage
                    .from(CONFIG.STORAGE_BUCKET)
                    .upload(fileName, fileToUpload, {
                        cacheControl: '3600',
                        upsert: false
                    });
                
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
                    duration: isImage ? duration : 10, // Los videos usan duración por defecto (se ignora en reproducción)
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
                console.log('📊 Datos a insertar:', JSON.stringify(fileData, null, 2));
                
                try {
                    // Intentar insertar con file_type
                    console.log('🔄 Intentando inserción con file_type...');
                    const { data, error } = await window.supabaseClient.from('menu_images').insert([fileData]).select();
                    
                    if (error) {
                        console.error('❌ Error en inserción:', error);
                        console.error('❌ Detalles del error:', {
                            message: error.message,
                            details: error.details,
                            hint: error.hint,
                            code: error.code
                        });
                        throw error;
                    }
                    
                    console.log('✅ Registro insertado exitosamente:', data);
                } catch (error) {
                    console.error('❌ Error detallado:', error);
                    if (error.message.includes('file_type') || error.message.includes('column')) {
                        console.log('⚠️ Columna file_type no existe, insertando sin ella...');
                        // Remover file_type y reintentar
                        const { file_type, ...fileDataWithoutType } = fileData;
                        const { data, error: retryError } = await window.supabaseClient.from('menu_images').insert([fileDataWithoutType]).select();
                        
                        if (retryError) {
                            console.error('❌ Error en reintento:', retryError);
                            throw retryError;
                        }
                        
                        console.log('✅ Registro insertado sin file_type:', data);
                    } else {
                        throw error;
                    }
                }
                
                // Incrementar contador de archivos subidos
                uploadedCount++;
                updateUploadProgress(uploadedCount, totalFiles, file.name);
                
            } else {
                console.warn(`⚠️ Archivo no soportado: ${file.name} (${file.type})`);
            }
        }

        // Actualizar progreso final
        updateUploadProgress(totalFiles, totalFiles, 'Completado');

        // Limpiar formulario
        fileInput.value = '';
        document.getElementById('fileTitle').value = '';
        
        console.log('✅ Archivos subidos exitosamente');
        await loadFiles();
        
    } catch (error) {
        console.error('❌ Error subiendo archivos:', error);
        
        // Ocultar barra de progreso en caso de error
        const uploadProgress = document.getElementById('uploadProgress');
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadProgress) {
            uploadProgress.style.display = 'none';
        }
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Subir';
        }
        
        alert('Error al subir archivos: ' + error.message);
    }
}

// Cargar archivos
async function loadFiles() {
    if (!window.supabaseClient) {
        console.error('❌ Supabase client no disponible');
        updateStats(); // Actualizar stats aunque no haya conexión
        return;
    }

    try {
        console.log('🔄 Cargando archivos desde Supabase...');
        
        const { data, error } = await window.supabaseClient
            .from('menu_images')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error en consulta:', error);
            throw error;
        }
        
        files = data || [];
        console.log(`✅ Archivos cargados: ${files.length} total`);
        console.log(`📊 Archivos activos: ${files.filter(f => f.active).length}`);
        
        renderFiles();
        updateStats();
        
    } catch (error) {
        console.error('❌ Error cargando archivos:', error);
        // Aún así actualizar las estadísticas con los archivos que tengamos
        updateStats();
        
        // Mostrar mensaje de error al usuario si es crítico
        if (error.message && !error.message.includes('permission')) {
            console.warn('⚠️ Error al cargar archivos, pero continuando...');
        }
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
    const active = files.filter(file => file.active !== false).length; // Considerar undefined como activo
    
    const totalElement = document.getElementById('totalImages');
    const activeElement = document.getElementById('activeImages');
    
    if (totalElement) {
        totalElement.textContent = total;
        console.log(`📊 Total actualizado: ${total}`);
    } else {
        console.warn('⚠️ Elemento totalImages no encontrado');
    }
    
    if (activeElement) {
        activeElement.textContent = active;
        console.log(`📊 Activos actualizados: ${active}`);
    } else {
        console.warn('⚠️ Elemento activeImages no encontrado');
    }
}

// Actualizar duración
async function updateDuration(id, duration) {
    if (!window.supabaseClient) return;
    
    // Validar rango (1-60 segundos)
    const durationValue = parseInt(duration);
    if (isNaN(durationValue) || durationValue < 1 || durationValue > 60) {
        alert('La duración debe estar entre 1 y 60 segundos');
        // Restaurar valor anterior
        const file = files.find(f => f.id === id);
        if (file) {
            const input = document.querySelector(`input[onchange*="updateDuration(${id}"]`);
            if (input) input.value = file.duration;
        }
        return;
    }
    
    try {
        await window.supabaseClient
            .from('menu_images')
            .update({ duration: durationValue })
            .eq('id', id);
        
        const file = files.find(f => f.id === id);
        if (file) file.duration = durationValue;
        
        console.log(`✅ Duración actualizada: ${durationValue}s`);
    } catch (error) {
        console.error('Error actualizando duración:', error);
        alert('Error al actualizar la duración: ' + error.message);
    }
}

// Actualizar repetición
async function updateRepeat(id, repeat) {
    if (!window.supabaseClient) return;
    
    // Validar rango (1-10 veces)
    const repeatValue = parseInt(repeat);
    if (isNaN(repeatValue) || repeatValue < 1 || repeatValue > 10) {
        alert('La repetición debe estar entre 1 y 10 veces');
        // Restaurar valor anterior
        const file = files.find(f => f.id === id);
        if (file) {
            const input = document.querySelector(`input[onchange*="updateRepeat(${id}"]`);
            if (input) input.value = file.repeat;
        }
        return;
    }
    
    try {
        await window.supabaseClient
            .from('menu_images')
            .update({ repeat: repeatValue })
            .eq('id', id);
        
        const file = files.find(f => f.id === id);
        if (file) file.repeat = repeatValue;
        
        console.log(`✅ Repetición actualizada: ${repeatValue}x`);
    } catch (error) {
        console.error('Error actualizando repetición:', error);
        alert('Error al actualizar la repetición: ' + error.message);
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

// Recargar archivos manualmente
async function reloadFiles() {
    console.log('🔄 Recargando archivos manualmente...');
    await loadFiles();
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
    console.log('🚀 Inicializando aplicación...');
    
    // Esperar a que se cargue la autenticación
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar autenticación
    if (window.authManager && window.authManager.isAuthenticated()) {
        console.log('✅ Usuario autenticado');
        displayUserInfo();
        
        const success = await checkSupabase();
        console.log(`📡 Supabase disponible: ${success}`);
        
        if (success) {
            await loadFiles();
        } else {
            console.warn('⚠️ Supabase no disponible, mostrando estado vacío');
            renderFiles();
            updateStats();
        }
    } else {
        console.log('❌ Usuario no autenticado, redirigiendo...');
        // Si no está autenticado, redirigir al login
        window.location.href = 'login.html';
    }
}); 