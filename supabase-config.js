// Configuración de Supabase
const SUPABASE_URL = 'https://lymemgizqpyowwzqeguv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5bWVtZ2p6cXB5b3d3enFlZ3V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MTAwODIsImV4cCI6MjA2ODE4NjA4Mn0.5pqVut8aqwDrOibT-D-ypbLCeu0CHjqQboJe-M3vaGg';

// Variable global para el cliente de Supabase
var supabase = null;

// Función para inicializar Supabase de forma síncrona
function createSupabaseClient() {
    if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
        return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return null;
}

// Función helper para generar URLs de Storage
function getStorageUrl(fileName) {
    return `${SUPABASE_URL}/storage/v1/object/public/menu-images/${fileName}`;
}

// Función helper para manejar errores
function handleSupabaseError(error, operation) {
    console.error(`Error en ${operation}:`, error);
    return null;
} 