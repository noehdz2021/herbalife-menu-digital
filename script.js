// Versión minimalista del script con autenticación
let supabase = null;
let images = [];

// Inicializar Supabase
async function initSupabase() {
    if (!window.supabase?.createClient) return false;
    
    try {
        supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
        return !!supabase;
    } catch (error) {
        console.error('Error inicializando Supabase:', error);
        return false;
    }
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
    if (!supabase) {
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
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith('image/')) {
                const fileName = `${Date.now()}_${i}.${file.name.split('.').pop()}`;
                
                // Subir archivo
                const { error: storageError } = await supabase.storage
                    .from(CONFIG.STORAGE_BUCKET)
                    .upload(fileName, file);
                
                if (storageError) throw storageError;
                
                // Obtener URL
                const { data: urlData } = supabase.storage
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
                
                await supabase.from('menu_images').insert([imageData]);
            }
        }

        // Limpiar formulario
        fileInput.value = '';
        document.getElementById('imageTitle').value = '';
        
        alert('✅ Imágenes subidas');
        await loadImages();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al subir imágenes');
    }
}

// Cargar imágenes
async function loadImages() {
    if (!supabase) return;

    try {
        const { data, error } = await supabase
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
    if (!supabase) return;
    
    try {
        await supabase
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
    if (!supabase) return;
    
    try {
        await supabase
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
    if (!supabase || !confirm('¿Eliminar imagen?')) return;

    try {
        const image = images.find(img => img.id === id);
        if (image) {
            const fileName = image.src.split('/').pop();
            await supabase.storage.from(CONFIG.STORAGE_BUCKET).remove([fileName]);
        }
        
        await supabase.from('menu_images').delete().eq('id', id);
        await loadImages();
        
    } catch (error) {
        console.error('Error eliminando imagen:', error);
        alert('Error al eliminar');
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', async function() {
    // Esperar a que se cargue la autenticación
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar autenticación
    if (window.authManager && window.authManager.isAuthenticated()) {
        displayUserInfo();
        
        const success = await initSupabase();
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