// Configuración centralizada para el proyecto Herbalife Menú Digital
const CONFIG = {
    SUPABASE_URL: 'https://tmfwggfraxvpbjnpttnx.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZndnZ2ZyYXh2cGJqbnB0dG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MTI0NDIsImV4cCI6MjA2ODE4ODQ0Mn0.Roojl7R6KXicFlSt17Bqp5Sa_nIpvwsQxdlZ6VtovSc',
    
    // Configuración de autenticación
    SESSION_DURATION_HOURS: 24,
    
    // Configuración de almacenamiento
    STORAGE_BUCKET: 'menu-images',
    
    // Configuración de la aplicación
    APP_NAME: 'Herbalife Menú Digital',
    DEFAULT_IMAGE_DURATION: 5,
    DEFAULT_IMAGE_REPEAT: 1,
    
    // Categorías disponibles
    CATEGORIES: [
        { value: 'bebidas', label: 'Bebidas' },
        { value: 'productos', label: 'Productos' },
        { value: 'ofertas', label: 'Ofertas' },
        { value: 'informacion', label: 'Información' }
    ]
};

// Exportar para uso en otros archivos
window.CONFIG = CONFIG; 