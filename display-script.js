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
        this.realtimeChannel = null;
        this.broadcastChannel = null; // Canal para BROADCAST (reload forzado)
        this.lastUpdateTime = 0; // Para evitar actualizaciones duplicadas
        /** Caché de dimensiones por URL: misma imagen repetida en el pool no se mide dos veces */
        this.dimensionCache = {};
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

    /** Clave estable para caché de dimensiones (sin fragmento #) */
    _cacheKey(src) {
        if (!src || typeof src !== 'string') return '';
        const f = src.indexOf('#');
        return f >= 0 ? src.substring(0, f) : src;
    }

    /**
     * Aplica clase y estilos de ajuste según aspect ratio (una sola función para imagen y video).
     * @param {HTMLImageElement|HTMLVideoElement} element
     * @param {number} aspectRatio - width/height
     * @param {boolean} isVideo - true para clases video-* (video-wide, video-vertical, etc.)
     */
    applyFitStylesByRatio(element, aspectRatio, isVideo) {
        const screenRatio = 16 / 9;
        const bg = isVideo ? '#000000' : 'transparent';
        let cls;
        if (aspectRatio > 1.5) {
            cls = isVideo ? 'video-wide' : 'wide-content';
        } else if (aspectRatio < 0.8) {
            cls = isVideo ? 'video-vertical' : 'tall-content';
        } else if (Math.abs(aspectRatio - screenRatio) < 0.3) {
            cls = isVideo ? 'video-screen-fit' : 'screen-fit';
        } else {
            cls = isVideo ? 'video-standard' : 'standard-content';
        }
        element.className = cls;
        element.style.objectFit = aspectRatio > 1.5 || aspectRatio < 0.8 || Math.abs(aspectRatio - screenRatio) >= 0.3 ? 'contain' : 'cover';
        element.style.background = bg;
    }

    /** Aplica estilos por defecto (contain) cuando no se pudo obtener ratio */
    applyFitStylesDefault(element, isVideo) {
        element.className = isVideo ? 'video-default' : 'default-content';
        element.style.objectFit = 'contain';
        element.style.background = isVideo ? '#000000' : 'transparent';
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

    // Misma lógica que admin: detectar video por file_type o por extensión en URL
    _isVideo(item) {
        if (item.file_type === 'video') return true;
        const src = (item.src || '').toLowerCase();
        return /\.(mp4|webm|ogg|mov|avi|gifv)(\?|$)/.test(src);
    }

    createMediaElement(imageData, container) {
        this.setBlurredBackground(container, imageData.src);
        
        if (this._isVideo(imageData)) {
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

    /**
     * Ajuste inteligente para imágenes. Usa caché de dimensiones para evitar
     * peticiones repetidas: si la URL ya fue medida, aplica estilos desde memoria.
     */
    applySmartFit(img, src) {
        const key = this._cacheKey(src);
        const cached = key && this.dimensionCache[key];
        if (typeof cached === 'number') {
            this.applyFitStylesByRatio(img, cached, false);
            return;
        }
        const tempImg = new Image();
        tempImg.onload = () => {
            if (!img.isConnected) return;
            const ratio = tempImg.naturalWidth / tempImg.naturalHeight;
            if (key) this.dimensionCache[key] = ratio;
            this.applyFitStylesByRatio(img, ratio, false);
        };
        tempImg.onerror = () => {
            if (!img.isConnected) return;
            this.applyFitStylesDefault(img, false);
        };
        tempImg.src = src;
    }

    /**
     * Ajuste inteligente para videos. Usa caché de dimensiones: si la URL ya tuvo
     * metadatos cargados, aplica estilos al instante sin esperar loadedmetadata.
     */
    applySmartFitVideo(video, src) {
        const key = this._cacheKey(src);
        const cached = key && this.dimensionCache[key];
        if (typeof cached === 'number') {
            this.applyFitStylesByRatio(video, cached, true);
            return;
        }
        const onMeta = () => {
            const ratio = video.videoWidth / video.videoHeight;
            if (key) this.dimensionCache[key] = ratio;
            this.applyFitStylesByRatio(video, ratio, true);
        };
        const onError = () => this.applyFitStylesDefault(video, true);
        video.addEventListener('loadedmetadata', onMeta, { once: true });
        video.addEventListener('error', onError, { once: true });
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
            
            // Cargar imágenes desde Supabase (repeat = veces que aparece en el pool)
            const { data, error } = await this.supabaseClient
                .from('menu_images')
                .select('id, title, category, src, duration, repeat, active, created_at, file_type')
                .eq('active', true)
                .order('created_at', { ascending: false });
            
            if (error) {
                throw error;
            }
            
            // Usar columna 'repeat': si es nulo o < 1, por defecto 1
            const originalImages = (data || []).map(img => {
                const duration = parseInt(img.duration) || 5;
                const raw = parseInt(img.repeat, 10);
                const frecuencia = (raw < 1 || Number.isNaN(raw)) ? 1 : raw;
                return { ...img, duration, frecuencia };
            });
            
            // Pool: cada elemento se añade 'frecuencia' veces (repeat: 4 → 4 entradas)
            this.images = [];
            originalImages.forEach(img => {
                for (let i = 0; i < img.frecuencia; i++) {
                    this.images.push({ ...img });
                }
            });
            
            console.log(`📊 Validando Pool: Originales: ${(data || []).length}, Total con repeticiones: ${this.images.length}`);
            this.shuffleImages();
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
        // Fisher-Yates: evita que las repeticiones (ej. "2x1 café") salgan una detrás de otra
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
            
            const onDataChange = (payload) => {
                console.log('🔔 Cambio detectado vía Realtime, actualizando pool...', payload.eventType);
                this.handleRealtimeChange(payload);
            };
            this.realtimeChannel
                .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_images' }, onDataChange)
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'display_control' }, onDataChange)
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
            
            // Canal de broadcast para recarga forzada (Admin puede enviar RELOAD)
            const broadcastChannelName = 'herbalife_display';
            this.broadcastChannel = this.supabaseClient.channel(broadcastChannelName)
                .on('broadcast', { event: 'cmd' }, (payload) => {
                    if (payload.payload?.type === 'RELOAD') {
                        console.log('🔔 Broadcast RELOAD recibido, recargando pantalla...');
                        window.location.reload();
                    }
                })
                .subscribe();
                
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
        if (now - this.lastUpdateTime < 1000) return;
        this.lastUpdateTime = now;
        
        try {
            await this.loadData();
            if (this.currentPoolIndex >= this.images.length) this.currentPoolIndex = 0;
            console.log('✅ Pool actualizado por Realtime (slide actual sigue hasta terminar su tiempo)');
        } catch (error) {
            console.error('❌ Error actualizando display:', error);
        }
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

    /** Limpia un contenedor de slide: pausa videos y libera recursos antes de vaciar (evita fugas) */
    clearSlideContent(contentElement) {
        if (!contentElement) return;
        const videos = contentElement.querySelectorAll('video');
        videos.forEach((v) => {
            v.pause();
            v.removeAttribute('src');
            v.load();
        });
        contentElement.innerHTML = '';
    }

    showCurrentSlide() {
        if (this.transitionTimeout) {
            clearTimeout(this.transitionTimeout);
            this.transitionTimeout = null;
        }
        
        if (this.currentPoolIndex >= this.images.length) {
            console.log('🔄 Pool agotado, mezclando de nuevo...');
            this.shuffleImages();
            this.currentPoolIndex = 0;
        }
        
        this.currentImage = this.images[this.currentPoolIndex];
        this.currentPoolIndex++;
        
        const activeSlide = document.getElementById(this.currentSlideId);
        const contentElement = document.getElementById(this.currentSlideId.replace('slide', 'slideContent'));
        
        if (contentElement) {
            this.clearSlideContent(contentElement);
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
        // Limpiar timer primero para evitar acumulación si Realtime actualiza durante la transición
        if (this.transitionTimeout) {
            clearTimeout(this.transitionTimeout);
            this.transitionTimeout = null;
        }
        if (this.images.length <= 1) return;
        
        if (this.currentPoolIndex >= this.images.length) {
            console.log('🔄 Pool agotado, mezclando de nuevo...');
            this.shuffleImages();
            this.currentPoolIndex = 0;
        }
        
        this.currentImage = this.images[this.currentPoolIndex];
        this.currentPoolIndex++;
        
        this.currentSlideId = this.currentSlideId === 'slide1' ? 'slide2' : 'slide1';
        
        const nextSlide = document.getElementById(this.currentSlideId);
        const nextContentElement = document.getElementById(this.currentSlideId.replace('slide', 'slideContent'));
        
        if (nextContentElement) {
            this.clearSlideContent(nextContentElement);
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
            this.clearSlideContent(prevContentElement);
            this.createMediaElement(prevImage, prevContentElement);
        }
        
        document.getElementById('slide1').classList.remove('active');
        document.getElementById('slide2').classList.remove('active');
        prevSlide.classList.add('active');
        
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

    destroy() {
        if (this.transitionTimeout) {
            clearTimeout(this.transitionTimeout);
            this.transitionTimeout = null;
        }
        if (this.timeIntervalId) {
            clearInterval(this.timeIntervalId);
            this.timeIntervalId = null;
        }
        if (this.controlsTimeout) clearTimeout(this.controlsTimeout);
        if (this.realtimeChannel && this.supabaseClient) {
            try { this.supabaseClient.removeChannel(this.realtimeChannel); } catch (_) {}
        }
        if (this.broadcastChannel && this.supabaseClient) {
            try { this.supabaseClient.removeChannel(this.broadcastChannel); } catch (_) {}
        }
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