// Usar configuración centralizada de config.js
// Las credenciales se obtienen de window.CONFIG

// Clase para gestionar el display del menú
class MenuDisplay {
    constructor() {
        this.images = []; // Pool expandido y mezclado
        this.currentPoolIndex = 0; // Índice actual en el pool mezclado
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
        this.setupBroadcastChannel(); // Escuchar refresco manual desde admin
        this.hideLoadingScreen();
        
        // Configurar actualización periódica (opcional, ver CONFIG.DISPLAY_REFRESH_INTERVAL_MS)
        this.setupPeriodicRefresh();
    }

    // Función para crear/actualizar fondo difuminado usando la misma imagen
    setBlurredBackground(container, imageSrc) {
        if (!container || !imageSrc) return;
        
        // Buscar o crear el elemento de fondo difuminado
        let blurBg = container.querySelector('.blur-background');
        
        if (!blurBg) {
            // Crear elemento de fondo difuminado
            blurBg = document.createElement('div');
            blurBg.className = 'blur-background';
            container.insertBefore(blurBg, container.firstChild);
        }
        
        // Establecer la imagen de fondo directamente
        blurBg.style.backgroundImage = `url("${imageSrc}")`;
        console.log('🎨 Fondo difuminado establecido con imagen:', imageSrc);
    }

    // Función helper para crear elementos de media
    createMediaElement(imageData, container) {
        // Establecer fondo difuminado siempre (para imágenes y videos)
        // Usa la misma imagen/video como fondo difuminado
        this.setBlurredBackground(container, imageData.src);
        
        if (imageData.file_type === 'video') {
            // Crear elemento de video
            const video = document.createElement('video');
            video.src = imageData.src;
            video.alt = imageData.title;
            video.autoplay = true;
            video.muted = true;
            video.loop = false; // No usar loop, las repeticiones están en el pool mezclado
            video.style.width = '100%';
            video.style.height = '100%';
            
            // Detectar formato y aplicar ajuste inteligente para videos
            this.applySmartFitVideo(video, imageData.src);
            
            // Manejar el final del video - simplemente pasar al siguiente
            // Las repeticiones ya están en el pool mezclado
            const handleVideoEnd = () => {
                console.log(`🎥 Video terminado: ${imageData.title}, pasando al siguiente...`);
                this.nextSlide();
            };
            
            // Evento principal: cuando el video termina
            video.addEventListener('ended', handleVideoEnd);
            
            // Remover el event listener de timeupdate que causaba problemas
            // El evento 'ended' es suficiente para detectar cuando termina el video
            
            container.appendChild(video);
        } else {
            // Crear elemento de imagen
            const img = document.createElement('img');
            img.src = imageData.src;
            img.alt = imageData.title;
            img.style.width = '100%';
            img.style.height = '100%';
            
            // Detectar formato y aplicar ajuste inteligente para pantalla de 40"
            this.applySmartFit(img, imageData.src);
            
            container.appendChild(img);
        }
    }

    // Función para aplicar ajuste inteligente basado en formato
    applySmartFit(img, src) {
        // Crear una imagen temporal para obtener dimensiones
        const tempImg = new Image();
        tempImg.onload = () => {
            const width = tempImg.naturalWidth;
            const height = tempImg.naturalHeight;
            const aspectRatio = width / height;
            
            console.log(`📐 Formato detectado: ${width}x${height} (ratio: ${aspectRatio.toFixed(2)})`);
            
            // Para pantalla de 40" (típicamente 16:9 o 4:3)
            const screenRatio = 16/9; // Asumiendo pantalla 16:9
            
            if (aspectRatio > 1.5) {
                // Imagen muy ancha (panorámica) - usar contain para mostrar todo
                img.className = 'wide-content';
                img.style.objectFit = 'contain';
                img.style.background = 'transparent';
                console.log('📐 Aplicando: contain (imagen panorámica)');
            } else if (aspectRatio < 0.8) {
                // Imagen muy alta (vertical) - usar contain para mostrar todo
                img.className = 'tall-content';
                img.style.objectFit = 'contain';
                img.style.background = 'transparent';
                console.log('📐 Aplicando: contain (imagen vertical)');
            } else if (Math.abs(aspectRatio - screenRatio) < 0.3) {
                // Formato similar a la pantalla - usar cover para llenar
                img.className = 'screen-fit';
                img.style.objectFit = 'cover';
                console.log('📐 Aplicando: cover (formato similar a pantalla)');
            } else {
                // Formato estándar - usar contain para mostrar completo
                img.className = 'standard-content';
                img.style.objectFit = 'contain';
                img.style.background = 'transparent';
                console.log('📐 Aplicando: contain (formato estándar)');
            }
        };
        
        tempImg.onerror = () => {
            // Si no se puede cargar, usar ajuste por defecto
            img.className = 'default-content';
            img.style.objectFit = 'contain';
            img.style.background = 'transparent';
            console.log('📐 Aplicando: contain (por defecto)');
        };
        
        tempImg.src = src;
    }

    // Función para aplicar ajuste inteligente para videos
    applySmartFitVideo(video, src) {
        // Esperar a que el video cargue los metadatos
        video.addEventListener('loadedmetadata', () => {
            const width = video.videoWidth;
            const height = video.videoHeight;
            const aspectRatio = width / height;
            
            console.log(`🎥 Formato de video detectado: ${width}x${height} (ratio: ${aspectRatio.toFixed(2)})`);
            
            // Para pantalla de 40" (típicamente 16:9)
            const screenRatio = 16/9;
            
            if (aspectRatio > 1.5) {
                // Video muy ancho (panorámico) - usar contain para mostrar todo
                video.className = 'video-wide';
                video.style.objectFit = 'contain';
                video.style.background = '#000000';
                console.log('🎥 Aplicando: contain (video panorámico)');
            } else if (aspectRatio < 0.8) {
                // Video vertical (reels, stories) - usar contain para mostrar completo
                video.className = 'video-vertical';
                video.style.objectFit = 'contain';
                video.style.background = '#000000';
                console.log('🎥 Aplicando: contain (video vertical/reel)');
            } else if (Math.abs(aspectRatio - screenRatio) < 0.3) {
                // Formato similar a la pantalla - usar cover para llenar
                video.className = 'video-screen-fit';
                video.style.objectFit = 'cover';
                console.log('🎥 Aplicando: cover (formato similar a pantalla)');
            } else {
                // Formato estándar - usar contain para mostrar completo
                video.className = 'video-standard';
                video.style.objectFit = 'contain';
                video.style.background = '#000000';
                console.log('🎥 Aplicando: contain (formato estándar)');
            }
        });
        
        // Fallback si no se pueden cargar los metadatos
        video.addEventListener('error', () => {
            video.className = 'video-default';
            video.style.objectFit = 'contain';
            video.style.background = '#000000';
            console.log('🎥 Aplicando: contain (por defecto)');
        });
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
            
            // Usar CONFIG centralizado si está disponible, sino usar valores por defecto
            const supabaseUrl = (window.CONFIG && window.CONFIG.SUPABASE_URL) || 'https://tmfwggfraxvpbjnpttnx.supabase.co';
            const supabaseKey = (window.CONFIG && window.CONFIG.SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZndnZ2ZyYXh2cGJqbnB0dG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MTI0NDIsImV4cCI6MjA2ODE4ODQ0Mn0.Roojl7R6KXicFlSt17Bqp5Sa_nIpvwsQxdlZ6VtovSc';
            
            const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
            
            if (supabase) {
                // Guardar en una propiedad de la clase para uso posterior
                this.supabaseClient = supabase;
                console.log('✅ Cliente creado exitosamente para display');
                this.supabaseReady = true;
                return;
            } else {
                console.error('❌ Cliente es null');
            }
        } catch (error) {
            console.error('❌ Error creando cliente:', error);
            this.supabaseClient = null;
        }
        
        console.error('❌ No se pudo inicializar Supabase en display');
    }

    checkSupabaseReady() {
        return this.supabaseReady && this.supabaseClient;
    }

    async loadData() {
        if (!this.checkSupabaseReady()) {
            this.createPlaceholderImage();
            return;
        }
        
        try {
            console.log('🔄 Cargando datos del menú...');
            
            // Cargar imágenes desde Supabase
            const { data, error } = await this.supabaseClient
                .from('menu_images')
                .select('*')
                .eq('active', true)
                .order('created_at', { ascending: false });
            
            if (error) {
                throw error;
            }
            
            // Guardar las imágenes originales
            const originalImages = (data || []).map(img => ({
                ...img,
                duration: parseInt(img.duration) || 5,
                repeat: parseInt(img.repeat) || 1
            }));
            
            // Crear pool expandido: cada imagen aparece 'repeat' veces
            this.images = [];
            originalImages.forEach(img => {
                for (let i = 0; i < img.repeat; i++) {
                    this.images.push({ ...img }); // Crear copia para cada repetición
                }
            });
            
            // Mezclar el pool aleatoriamente (algoritmo Fisher-Yates)
            this.shuffleImages();
            
            console.log(`📊 Imágenes cargadas con duraciones:`, this.images.map(img => ({
                title: img.title,
                duration: img.duration,
                repeat: img.repeat
            })));
            
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
        console.log(`🔀 Pool mezclado: ${this.images.length} elementos`);
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
            this.realtimeChannel = this.supabaseClient.channel(channelId);
            
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

    setupBroadcastChannel() {
        try {
            const channel = new BroadcastChannel('herbalife-menu-display');
            channel.onmessage = async (e) => {
                if (e.data === 'refresh' && this.checkSupabaseReady()) {
                    console.log('🔄 Refresco manual solicitado desde admin');
                    await this.loadData();
                    this.restart();
                }
            };
        } catch (e) {
            console.warn('BroadcastChannel no disponible');
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
        // Debounce: esperar 2.5s tras el último cambio (ej: subida de 5 imágenes = 1 recarga en vez de 5)
        if (this.realtimeDebounceTimeout) clearTimeout(this.realtimeDebounceTimeout);
        
        this.realtimeDebounceTimeout = setTimeout(async () => {
            this.realtimeDebounceTimeout = null;
            const now = Date.now();
            if (now - this.lastUpdateTime < 1000) return;
            this.lastUpdateTime = now;
            
            console.log('🔄 Procesando cambio en tiempo real');
            try {
                await this.loadData();
                this.restart();
                console.log('✅ Display actualizado desde tiempo real');
            } catch (error) {
                console.error('❌ Error actualizando display:', error);
            }
        }, 2500);
    }

    setupPeriodicRefresh() {
        // Solo si está configurado: 0 = desactivado (ahorro de consultas Supabase)
        const intervalMs = (window.CONFIG && window.CONFIG.DISPLAY_REFRESH_INTERVAL_MS) || 0;
        if (!intervalMs || intervalMs <= 0) {
            console.log('ℹ️ Refresh periódico desactivado (solo realtime). Ahorro de consultas.');
            return;
        }
        setInterval(async () => {
            if (this.checkSupabaseReady()) {
                try {
                    await this.loadData();
                    const currentCount = this.images.length;
                    if (currentCount !== this.lastImageCount) {
                        this.restart();
                        this.lastImageCount = currentCount;
                    }
                } catch (error) {
                    console.error('❌ Error en actualización periódica:', error);
                }
            }
        }, intervalMs);
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
        
        // Inicializar índice del pool
        this.currentPoolIndex = 0;
        
        // Mostrar imagen actual
        this.showCurrentSlide();
        
        // Solo programar siguiente transición si hay más de una imagen
        if (this.images.length > 1) {
            this.scheduleNextTransition();
        }
    }

    scheduleNextTransition() {
        // Limpiar timeout anterior si existe
        if (this.transitionTimeout) {
            clearTimeout(this.transitionTimeout);
            this.transitionTimeout = null;
        }
        
        if (!this.currentImage) {
            console.warn('⚠️ No hay imagen actual para programar transición');
            return;
        }
        
        // Validar y obtener duración (por defecto 5 segundos si no está definida)
        const durationSeconds = parseInt(this.currentImage.duration) || 5;
        const duration = durationSeconds * 1000; // Convertir a milisegundos
        
        // Validar que la duración sea válida (mínimo 1 segundo, máximo 60 segundos)
        const validDuration = Math.max(1000, Math.min(60000, duration));
        
        console.log(`⏰ Programando transición: ${this.currentImage.title} (${durationSeconds}s / ${validDuration}ms)`);
        
        this.transitionTimeout = setTimeout(() => {
            console.log(`⏰ Transición programada ejecutada: ${this.currentImage.title} después de ${durationSeconds}s`);
            this.nextSlide();
        }, validDuration);
    }

    showCurrentSlide() {
        // Limpiar timeout anterior si existe
        if (this.transitionTimeout) {
            clearTimeout(this.transitionTimeout);
            this.transitionTimeout = null;
        }
        
        // Si llegamos al final del pool, resetear y mezclar de nuevo
        if (this.currentPoolIndex >= this.images.length) {
            console.log('🔄 Pool agotado, mezclando de nuevo...');
            this.shuffleImages();
            this.currentPoolIndex = 0;
        }
        
        // Obtener la imagen actual del pool mezclado
        this.currentImage = this.images[this.currentPoolIndex];
        this.currentPoolIndex++;
        
        const activeSlide = document.getElementById(this.currentSlideId);
        const contentElement = document.getElementById(this.currentSlideId.replace('slide', 'slideContent'));
        
        if (contentElement) {
            // Limpiar el contenido anterior
            contentElement.innerHTML = '';
            
            // Crear el elemento de media usando la función helper
            this.createMediaElement(this.currentImage, contentElement);
        }
        
        // Asegurar que solo el slide actual esté activo
        document.getElementById('slide1').classList.remove('active');
        document.getElementById('slide2').classList.remove('active');
        activeSlide.classList.add('active');
        
        console.log(`📺 Mostrando: ${this.currentImage.title} (${this.currentPoolIndex}/${this.images.length} en pool)`);
        
        // Programar la siguiente transición solo para imágenes (los videos manejan su propia duración)
        if (this.currentImage && this.currentImage.file_type !== 'video') {
            this.scheduleNextTransition();
        }
    }

    nextSlide() {
        // Limpiar timeout anterior si existe
        if (this.transitionTimeout) {
            clearTimeout(this.transitionTimeout);
            this.transitionTimeout = null;
        }
        
        if (this.images.length <= 1) return;
        
        // Si llegamos al final del pool, resetear y mezclar de nuevo
        if (this.currentPoolIndex >= this.images.length) {
            console.log('🔄 Pool agotado, mezclando de nuevo...');
            this.shuffleImages();
            this.currentPoolIndex = 0;
        }
        
        // Obtener la siguiente imagen del pool mezclado
        this.currentImage = this.images[this.currentPoolIndex];
        this.currentPoolIndex++;
        
        // Alternar entre slide1 y slide2
        this.currentSlideId = this.currentSlideId === 'slide1' ? 'slide2' : 'slide1';
        
        // Preparar la nueva imagen en el slide que va a ser activo
        const nextSlide = document.getElementById(this.currentSlideId);
        const nextContentElement = document.getElementById(this.currentSlideId.replace('slide', 'slideContent'));
        
        if (nextContentElement) {
            // Limpiar el contenido anterior
            nextContentElement.innerHTML = '';
            
            // Crear el elemento de media usando la función helper
            this.createMediaElement(this.currentImage, nextContentElement);
        }
        
        // Hacer la transición
        document.getElementById('slide1').classList.remove('active');
        document.getElementById('slide2').classList.remove('active');
        nextSlide.classList.add('active');
        
        console.log(`📺 Siguiente: ${this.currentImage.title} (${this.currentPoolIndex}/${this.images.length} en pool)`);
        
        // Programar la siguiente transición solo para imágenes (los videos manejan su propia duración)
        if (this.currentImage && this.currentImage.file_type !== 'video') {
            this.scheduleNextTransition();
        }
    }

    // Esta función ya no se usa, pero la mantengo por compatibilidad
    // Ahora usamos el pool mezclado directamente con currentPoolIndex
    selectRandomImage() {
        // Si llegamos al final del pool, resetear y mezclar de nuevo
        if (this.currentPoolIndex >= this.images.length) {
            console.log('🔄 Pool agotado, mezclando de nuevo...');
            this.shuffleImages();
            this.currentPoolIndex = 0;
        }
        
        const selectedImage = this.images[this.currentPoolIndex];
        this.currentPoolIndex++;
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
            
            // Crear el elemento de media usando la función helper
            this.createMediaElement(prevImage, prevContentElement);
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
        this.currentPoolIndex = 0;
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
        const { data, error } = await window.menuDisplay.supabaseClient
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