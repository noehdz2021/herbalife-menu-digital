// Credenciales de Supabase (para asegurar disponibilidad)
const SUPABASE_URL = 'https://tmfwggfraxvpbjnpttnx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZndnZ2ZyYXh2cGJqbnB0dG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MTI0NDIsImV4cCI6MjA2ODE4ODQ0Mn0.Roojl7R6KXicFlSt17Bqp5Sa_nIpvwsQxdlZ6VtovSc';

// Clase para gestionar el display del menú
class MenuDisplay {
    constructor() {
        this.images = [];
        this.currentIndex = 0;
        this.currentImage = null; // Rastrear la imagen actual
        this.transitionTimeout = null;
        this.timeIntervalId = null;
        this.isActive = true;
        this.currentSlideId = 'slide1'; // Rastrear cuál slide está activo
        this.supabaseReady = false;
        this.realtimeChannel = null; // Canal de tiempo real
        this.lastUpdateTime = 0; // Para evitar actualizaciones duplicadas
        this.init();
    }

    async init() {
        // Esperar un poco para que la biblioteca se cargue completamente
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await this.waitForSupabase();
        await this.loadData();
        this.setupClock();
        this.startSlideshow();
        this.setupEventListeners();
        this.setupRealtimeSubscription();
        this.hideLoadingScreen();
        
        // Configurar actualización periódica como respaldo
        this.setupPeriodicRefresh();
    }

    async waitForSupabase() {
        console.log('🔄 Iniciando proceso de conexión con Supabase en display...');
        
        // Verificar que la biblioteca esté disponible
        if (typeof window === 'undefined') {
            console.error('❌ Window no disponible');
            return;
        }
        
        if (!window.supabase) {
            console.error('❌ window.supabase no disponible');
            return;
        }
        
        if (!window.supabase.createClient) {
            console.error('❌ window.supabase.createClient no disponible');
            return;
        }
        
        try {
            console.log('🔄 Creando cliente para display...');
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            if (supabase) {
                console.log('✅ Cliente creado exitosamente para display');
                this.supabaseReady = true;
                return;
            } else {
                console.error('❌ Cliente es null');
            }
        } catch (error) {
            console.error('❌ Error creando cliente:', error);
            supabase = null;
        }
        
        console.error('❌ No se pudo inicializar Supabase en display');
    }

    checkSupabaseReady() {
        return this.supabaseReady && supabase;
    }

    async loadData() {
        if (!this.checkSupabaseReady()) {
            this.createPlaceholderImage();
            return;
        }
        
        try {
            console.log('🔄 Cargando datos del menú...');
            
            // Cargar imágenes desde Supabase
            const { data, error } = await supabase
                .from('menu_images')
                .select('*')
                .eq('active', true)
                .order('created_at', { ascending: false });
            
            if (error) {
                throw error;
            }
            
            // Guardar las imágenes originales sin duplicar
            this.images = (data || []).map(img => ({
                ...img,
                duration: img.duration || 5,
                repeat: img.repeat || 1,
                remainingRepeats: img.repeat || 1 // Contador de repeticiones restantes
            }));
            
            console.log(`✅ Cargadas ${this.images.length} imágenes`);
            
            // Si no hay imágenes, crear una imagen de placeholder
            if (this.images.length === 0) {
                this.createPlaceholderImage();
            }
            
        } catch (error) {
            console.error('Error cargando datos:', error);
            this.createPlaceholderImage();
        }
    }

    shuffleImages() {
        // Algoritmo Fisher-Yates para mezclar las imágenes
        for (let i = this.images.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.images[i], this.images[j]] = [this.images[j], this.images[i]];
        }
    }

    createPlaceholderImage() {
        this.images = [{
            id: 'placeholder',
            title: 'Bienvenido a Herbalife',
            category: 'informacion',
            duration: 5,
            repeat: 1,
            src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjRjBGOEZGIi8+CjxjaXJjbGUgY3g9IjQwMCIgY3k9IjI1MCIgcj0iNTAiIGZpbGw9IiMyRThCNTciLz4KPHN2ZyB4PSIzNzUiIHk9IjIyNSIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0yNSA1TDUgMjBMMjAgMzVMMzUgMjBMMjUgNVoiIGZpbGw9IndoaXRlIi8+CjwvZz4KPHRleHQgeD0iNDAwIiB5PSIzNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iNDAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMkU4QjU3Ij7wn42/IEJpZW52ZW5pZG8gYSBIZXJiYWxpZmU8L3RleHQ+Cjx0ZXh0IHg9IjQwMCIgeT0iMzg0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjNjY2NjY2Ij5OdXRyaWNpw7NuIHBhcmEgdW5hIHZpZGEgYWN0aXZhPC90ZXh0Pgo8L3N2Zz4=',
            active: true
        }];
    }

    setupRealtimeSubscription() {
        if (!this.checkSupabaseReady()) {
            console.log('⚠️ Supabase no está listo para suscripción en tiempo real');
            this.updateConnectionStatus('disconnected', 'Sin conexión');
            return;
        }
        
        try {
            console.log('🔄 Configurando suscripción en tiempo real...');
            this.updateConnectionStatus('connecting', 'Conectando...');
            
            // Crear canal único para este display
            const channelId = `menu_display_${Date.now()}`;
            this.realtimeChannel = supabase.channel(channelId);
            
            // Suscribirse a cambios en tiempo real
            this.realtimeChannel
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'menu_images' }, 
                    (payload) => {
                        console.log('🔄 Cambio detectado en tiempo real:', payload);
                        this.handleRealtimeChange(payload);
                    }
                )
                .subscribe((status) => {
                    console.log('📡 Estado de suscripción:', status);
                    if (status === 'SUBSCRIBED') {
                        console.log('✅ Suscripción en tiempo real activa');
                        this.updateConnectionStatus('connected', 'Conectado');
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('❌ Error en canal de tiempo real');
                        this.updateConnectionStatus('disconnected', 'Error de conexión');
                        // Reintentar después de 5 segundos
                        setTimeout(() => this.setupRealtimeSubscription(), 5000);
                    } else if (status === 'TIMED_OUT') {
                        console.error('❌ Timeout en canal de tiempo real');
                        this.updateConnectionStatus('disconnected', 'Timeout');
                        // Reintentar después de 5 segundos
                        setTimeout(() => this.setupRealtimeSubscription(), 5000);
                    }
                });
                
        } catch (error) {
            console.error('❌ Error configurando suscripción en tiempo real:', error);
            this.updateConnectionStatus('disconnected', 'Error');
        }
    }

    updateConnectionStatus(status, text) {
        const indicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        
        if (indicator && statusText) {
            indicator.className = `status-indicator ${status}`;
            statusText.textContent = text;
        }
    }

    async handleRealtimeChange(payload) {
        const now = Date.now();
        
        // Evitar actualizaciones duplicadas en un corto período
        if (now - this.lastUpdateTime < 1000) {
            console.log('⏭️ Actualización ignorada (muy reciente)');
            return;
        }
        
        this.lastUpdateTime = now;
        
        console.log('🔄 Procesando cambio en tiempo real:', payload.eventType);
        
        // Recargar datos y reiniciar el slideshow
        try {
            await this.loadData();
            this.restart();
            console.log('✅ Display actualizado desde tiempo real');
        } catch (error) {
            console.error('❌ Error actualizando display:', error);
        }
    }

    setupPeriodicRefresh() {
        // Actualización periódica cada 30 segundos como respaldo
        setInterval(async () => {
            if (this.checkSupabaseReady()) {
                console.log('🔄 Actualización periódica del display...');
                try {
                    await this.loadData();
                    // Solo reiniciar si hay cambios significativos
                    const currentCount = this.images.length;
                    if (currentCount !== this.lastImageCount) {
                        this.restart();
                        this.lastImageCount = currentCount;
                    }
                } catch (error) {
                    console.error('❌ Error en actualización periódica:', error);
                }
            }
        }, 30000); // 30 segundos
    }

    setupClock() {
        this.updateClock();
        this.timeIntervalId = setInterval(() => this.updateClock(), 1000);
    }

    updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('currentTime').textContent = timeString;
    }

    startSlideshow() {
        if (this.images.length === 0) return;
        
        // Limpiar timeout anterior
        if (this.transitionTimeout) {
            clearTimeout(this.transitionTimeout);
        }
        
        // Mostrar imagen actual
        this.showCurrentSlide();
        
        // Solo programar siguiente transición si hay más de una imagen
        if (this.images.length > 1) {
            this.scheduleNextTransition();
        }
    }

    scheduleNextTransition() {
        if (!this.currentImage) return;
        
        const duration = this.currentImage.duration * 1000; // Convertir a milisegundos
        
        this.transitionTimeout = setTimeout(() => {
            this.nextSlide();
        }, duration);
    }

    showCurrentSlide() {
        // Seleccionar la primera imagen de forma aleatoria
        this.currentImage = this.selectRandomImage();
        const activeSlide = document.getElementById(this.currentSlideId);
        const contentElement = document.getElementById(this.currentSlideId.replace('slide', 'slideContent'));
        
        if (contentElement) {
            // Limpiar el contenido anterior
            contentElement.innerHTML = '';
            
            if (this.currentImage.file_type === 'video') {
                // Crear elemento de video
                const video = document.createElement('video');
                video.src = this.currentImage.src;
                video.alt = this.currentImage.title;
                video.autoplay = true;
                video.muted = true;
                video.loop = true;
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.objectFit = 'cover';
                
                // Manejar el final del video
                video.addEventListener('ended', () => {
                    this.nextSlide();
                });
                
                contentElement.appendChild(video);
            } else {
                // Crear elemento de imagen
                const img = document.createElement('img');
                img.src = this.currentImage.src;
                img.alt = this.currentImage.title;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                
                contentElement.appendChild(img);
            }
        }
        
        // Asegurar que solo el slide actual esté activo
        document.getElementById('slide1').classList.remove('active');
        document.getElementById('slide2').classList.remove('active');
        activeSlide.classList.add('active');
    }

    nextSlide() {
        if (this.images.length <= 1) return;
        
        // Seleccionar la siguiente imagen de forma aleatoria considerando repeticiones
        this.currentImage = this.selectRandomImage();
        
        // Alternar entre slide1 y slide2
        this.currentSlideId = this.currentSlideId === 'slide1' ? 'slide2' : 'slide1';
        
        // Preparar la nueva imagen en el slide que va a ser activo
        const nextSlide = document.getElementById(this.currentSlideId);
        const nextContentElement = document.getElementById(this.currentSlideId.replace('slide', 'slideContent'));
        
        if (nextContentElement) {
            // Limpiar el contenido anterior
            nextContentElement.innerHTML = '';
            
            if (this.currentImage.file_type === 'video') {
                // Crear elemento de video
                const video = document.createElement('video');
                video.src = this.currentImage.src;
                video.alt = this.currentImage.title;
                video.autoplay = true;
                video.muted = true;
                video.loop = true;
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.objectFit = 'cover';
                
                // Manejar el final del video
                video.addEventListener('ended', () => {
                    this.nextSlide();
                });
                
                nextContentElement.appendChild(video);
            } else {
                // Crear elemento de imagen
                const img = document.createElement('img');
                img.src = this.currentImage.src;
                img.alt = this.currentImage.title;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                
                nextContentElement.appendChild(img);
            }
        }
        
        // Hacer la transición
        document.getElementById('slide1').classList.remove('active');
        document.getElementById('slide2').classList.remove('active');
        nextSlide.classList.add('active');
        
        // Programar la siguiente transición solo para imágenes
        if (this.currentImage.file_type !== 'video') {
            this.scheduleNextTransition();
        }
    }

    selectRandomImage() {
        // Crear un array de imágenes disponibles para selección
        const availableImages = this.images.filter(img => img.remainingRepeats > 0);
        
        if (availableImages.length === 0) {
            // Si no hay imágenes disponibles, resetear todas las repeticiones
            this.images.forEach(img => {
                img.remainingRepeats = img.repeat;
            });
            return this.selectRandomImage(); // Llamada recursiva
        }
        
        // Seleccionar una imagen aleatoria de las disponibles
        const randomIndex = Math.floor(Math.random() * availableImages.length);
        const selectedImage = availableImages[randomIndex];
        
        // Decrementar el contador de repeticiones
        selectedImage.remainingRepeats--;
        
        return selectedImage;
    }

    previousSlide() {
        if (this.images.length <= 1) return;
        
        // Cambiar al índice anterior
        this.currentIndex = this.currentIndex === 0 ? this.images.length - 1 : this.currentIndex - 1;
        
        // Alternar entre slide1 y slide2
        this.currentSlideId = this.currentSlideId === 'slide1' ? 'slide2' : 'slide1';
        
        // Preparar la nueva imagen en el slide que va a ser activo
        const prevImage = this.images[this.currentIndex];
        const prevSlide = document.getElementById(this.currentSlideId);
        const prevContentElement = document.getElementById(this.currentSlideId.replace('slide', 'slideContent'));
        
        if (prevContentElement) {
            // Limpiar el contenido anterior
            prevContentElement.innerHTML = '';
            
            if (prevImage.file_type === 'video') {
                // Crear elemento de video
                const video = document.createElement('video');
                video.src = prevImage.src;
                video.alt = prevImage.title;
                video.autoplay = true;
                video.muted = true;
                video.loop = true;
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.objectFit = 'cover';
                
                // Manejar el final del video
                video.addEventListener('ended', () => {
                    this.nextSlide();
                });
                
                prevContentElement.appendChild(video);
            } else {
                // Crear elemento de imagen
                const img = document.createElement('img');
                img.src = prevImage.src;
                img.alt = prevImage.title;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                
                prevContentElement.appendChild(img);
            }
        }
        
        // Hacer la transición
        document.getElementById('slide1').classList.remove('active');
        document.getElementById('slide2').classList.remove('active');
        prevSlide.classList.add('active');
        
        // Programar la siguiente transición solo para imágenes
        if (prevImage.file_type !== 'video') {
            this.scheduleNextTransition();
        }
    }



    setupEventListeners() {
        // Detectar cuando la página se vuelve visible/invisible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
        
        // Controles de teclado
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.isActive ? this.pause() : this.resume();
            }
            
            // Navegación manual con flechas
            if (e.code === 'ArrowLeft') {
                e.preventDefault();
                this.previousSlide();
            }
            
            if (e.code === 'ArrowRight') {
                e.preventDefault();
                this.nextSlide();
            }
            

            
            // Recargar datos con F5
            if (e.key === 'F5') {
                e.preventDefault();
                this.restart();
            }
        });
        


        // Ocultar cursor después de inactividad
        let cursorTimeout;
        document.addEventListener('mousemove', () => {
            document.body.classList.remove('hide-cursor');
            clearTimeout(cursorTimeout);
            cursorTimeout = setTimeout(() => {
                document.body.classList.add('hide-cursor');
            }, 3000);
        });
    }

    pause() {
        this.isActive = false;
        if (this.transitionTimeout) {
            clearTimeout(this.transitionTimeout);
            this.transitionTimeout = null;
        }
    }

    resume() {
        this.isActive = true;
        this.scheduleNextTransition();
    }

    async restart() {
        this.pause();
        this.currentIndex = 0;
        this.currentSlideId = 'slide1';
        
        // Resetear slides
        document.getElementById('slide1').classList.add('active');
        document.getElementById('slide2').classList.remove('active');
        
        if (this.checkSupabaseReady()) {
            await this.loadData();
        }
        this.startSlideshow();
    }

    hideLoadingScreen() {
        // Ocultar pantalla de carga después de 2 segundos
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
        }, 2000);
    }

    // Método para limpiar todos los intervalos
    destroy() {
        if (this.transitionTimeout) clearTimeout(this.transitionTimeout);
        if (this.timeIntervalId) clearInterval(this.timeIntervalId);
        if (this.controlsTimeout) clearTimeout(this.controlsTimeout);
    }
}

// Inicializar el display cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.menuDisplay = new MenuDisplay();
    
    // Limpiar intervalos cuando se cierra la página
    window.addEventListener('beforeunload', () => {
        window.menuDisplay.destroy();
    });
});



// Función para recargar datos desde la consola del navegador
async function reloadMenuData() {
    if (window.menuDisplay) {
        try {
            await window.menuDisplay.restart();
        } catch (error) {
            console.error('Error recargando datos:', error);
        }
    }
}

// Función para exportar logs de display
async function exportDisplayLogs() {
    if (!window.menuDisplay || !window.menuDisplay.checkSupabaseReady()) {
        console.error('❌ Supabase no está disponible');
        return null;
    }
    
    try {
        const { data, error } = await supabase
            .from('menu_images')
            .select('*')
            .order('created_at', { ascending: false });
        
        const logs = {
            timestamp: new Date().toISOString(),
            images: data || [],
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            windowSize: `${window.innerWidth}x${window.innerHeight}`,
            source: 'Supabase'
        };
        
        console.log('Display Logs:', logs);
        return logs;
    } catch (error) {
        console.error('Error exportando logs:', error);
        return null;
    }
}

// Detectar errores de carga de imágenes
document.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') {
        console.warn('Error al cargar imagen:', e.target.src);
    }
}, true);

// Deshabilitar menú contextual
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Deshabilitar selección de texto
document.addEventListener('selectstart', (e) => {
    e.preventDefault();
});

// Inicializar cursor oculto
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.body.classList.add('hide-cursor');
    }, 3000);
}); 