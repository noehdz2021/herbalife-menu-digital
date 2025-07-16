// Inicialización centralizada de Supabase
(function() {
    'use strict';
    
    // Verificar si ya está inicializado
    if (window.supabaseClient) {
        console.log('Supabase ya inicializado');
        return;
    }
    
    // Inicializar Supabase
    if (window.supabase && window.supabase.createClient && window.CONFIG) {
        try {
            window.supabaseClient = window.supabase.createClient(
                window.CONFIG.SUPABASE_URL, 
                window.CONFIG.SUPABASE_ANON_KEY
            );
            console.log('Supabase inicializado correctamente');
        } catch (error) {
            console.error('Error inicializando Supabase:', error);
        }
    } else {
        console.error('Supabase o CONFIG no disponibles');
    }
})(); 