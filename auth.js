// Inicializar Supabase usando configuración centralizada
const supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
// Hacer disponible globalmente
window.supabaseClient = supabase;

// Clase para manejar la autenticación
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionToken = null;
        this.init();
    }

    async init() {
        // Verificar si hay una sesión activa
        const token = localStorage.getItem('admin_token');
        if (token) {
            const isValid = await this.validateSession(token);
            if (isValid) {
                this.sessionToken = token;
                this.currentUser = JSON.parse(localStorage.getItem('admin_user'));
                this.redirectIfNeeded();
            } else {
                this.logout();
            }
        } else {
            this.redirectIfNeeded();
        }
    }

    async login(email, password) {
        try {
            // Buscar usuario en la base de datos
            const { data: users, error } = await supabase
                .from('admin_users')
                .select('*')
                .eq('email', email)
                .eq('password_hash', password)
                .single();

            if (error || !users) {
                throw new Error('Credenciales inválidas');
            }

            // Crear token de sesión
            const token = this.generateToken();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + CONFIG.SESSION_DURATION_HOURS);

            // Guardar sesión en la base de datos
            const { error: sessionError } = await supabase
                .from('admin_sessions')
                .insert({
                    user_id: users.id,
                    token: token,
                    expires_at: expiresAt.toISOString()
                });

            if (sessionError) {
                throw new Error('Error al crear sesión');
            }

            // Actualizar último login
            await supabase
                .from('admin_users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', users.id);

            // Guardar en localStorage
            this.currentUser = {
                id: users.id,
                email: users.email,
                name: users.name,
                role: users.role
            };
            this.sessionToken = token;
            
            localStorage.setItem('admin_token', token);
            localStorage.setItem('admin_user', JSON.stringify(this.currentUser));

            return { success: true, user: this.currentUser };

        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    }

    async logout() {
        try {
            if (this.sessionToken) {
                // Eliminar sesión de la base de datos
                await supabase
                    .from('admin_sessions')
                    .delete()
                    .eq('token', this.sessionToken);
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        } finally {
            // Limpiar datos locales
            this.currentUser = null;
            this.sessionToken = null;
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            
            // Redirigir al login
            if (window.location.pathname !== '/login.html' && !window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
        }
    }

    async validateSession(token) {
        try {
            const { data: sessions, error } = await supabase
                .from('admin_sessions')
                .select('*')
                .eq('token', token)
                .gt('expires_at', new Date().toISOString())
                .single();

            if (error || !sessions) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error validando sesión:', error);
            return false;
        }
    }

    generateToken() {
        return 'token_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    redirectIfNeeded() {
        const currentPath = window.location.pathname;
        const isLoginPage = currentPath.includes('login.html') || currentPath.endsWith('/');
        
        if (this.currentUser && isLoginPage) {
            // Usuario autenticado en página de login, redirigir al admin
            window.location.href = 'admin.html';
        } else if (!this.currentUser && !isLoginPage) {
            // Usuario no autenticado en página protegida, redirigir al login
            window.location.href = 'login.html';
        }
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getSessionToken() {
        return this.sessionToken;
    }
}

// Instanciar el administrador de autenticación
const authManager = new AuthManager();

// Función para obtener headers de autorización
function getAuthHeaders() {
    const token = authManager.getSessionToken();
    return {
        'Authorization': token,
        'Content-Type': 'application/json'
    };
}

// Manejar el formulario de login
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Mostrar loading
        loginBtn.disabled = true;
        loading.style.display = 'inline';
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';

        try {
            const result = await authManager.login(email, password);
            
            if (result.success) {
                successMessage.textContent = '¡Inicio de sesión exitoso! Redirigiendo...';
                successMessage.style.display = 'block';
                
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
            }
        } catch (error) {
            errorMessage.textContent = error.message || 'Error al iniciar sesión';
            errorMessage.style.display = 'block';
        } finally {
            loginBtn.disabled = false;
            loading.style.display = 'none';
        }
    });
}

// Función para cerrar sesión (se puede llamar desde cualquier página)
function logout() {
    authManager.logout();
}

// Exportar para uso en otros archivos
window.authManager = authManager;
window.getAuthHeaders = getAuthHeaders;
window.logout = logout; 