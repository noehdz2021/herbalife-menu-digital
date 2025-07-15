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
        if (!this.checkSupabaseReady()) return;
        
        // Suscribirse a cambios en tiempo real
        supabase
            .channel('menu_images_display')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'menu_images' }, 
                (payload) => {
                    console.log('Cambio detectado en display:', payload);
                    this.loadData().then(() => {
                        this.restart();
                    });
                }
            )
            .subscribe();
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
        const imageElement = document.getElementById(this.currentSlideId.replace('slide', 'slideImage'));
        
        if (imageElement) {
            imageElement.src = this.currentImage.src;
            imageElement.alt = this.currentImage.title;
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
        const nextImageElement = document.getElementById(this.currentSlideId.replace('slide', 'slideImage'));
        
        if (nextImageElement) {
            nextImageElement.src = this.currentImage.src;
            nextImageElement.alt = this.currentImage.title;
        }
        
        // Hacer la transición
        document.getElementById('slide1').classList.remove('active');
        document.getElementById('slide2').classList.remove('active');
        nextSlide.classList.add('active');
        
        // Programar la siguiente transición
        this.scheduleNextTransition();
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
        const prevImageElement = document.getElementById(this.currentSlideId.replace('slide', 'slideImage'));
        
        if (prevImageElement) {
            prevImageElement.src = prevImage.src;
            prevImageElement.alt = prevImage.title;
        }
        
        // Hacer la transición
        document.getElementById('slide1').classList.remove('active');
        document.getElementById('slide2').classList.remove('active');
        prevSlide.classList.add('active');
        
        // Programar la siguiente transición
        this.scheduleNextTransition();
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