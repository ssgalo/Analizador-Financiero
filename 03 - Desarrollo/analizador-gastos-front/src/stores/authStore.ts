import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/api';
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '../services/api';

interface AuthState {
  // Estado
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tokenExpiry: number | null;
  sessionExpired: boolean;
  
  // Acciones
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: (showMessage?: boolean) => void;
  forceLogout: () => void;
  refreshUser: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  checkTokenExpiry: () => boolean;
  clearSessionExpired: () => void;
  setupTokenExpiryWarning: (expiresInSeconds: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      isLoading: true,
      tokenExpiry: null,
      sessionExpired: false,

      // Acción: Login
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, sessionExpired: false });
        
        try {
          console.log('🔐 Iniciando login...'); // Debug
          const authResponse: AuthResponse = await authService.login(credentials);
          
          // Calcular tiempo de expiración del token (en milisegundos)
          const expiryTime = Date.now() + (authResponse.expires_in * 1000);
          
          console.log('✅ Login exitoso, actualizando estado...'); // Debug
          // Actualizar estado
          set({
            user: authResponse.user_info,
            isAuthenticated: true,
            isLoading: false,
            tokenExpiry: expiryTime,
            sessionExpired: false
          });
          
          console.log('🚀 Estado actualizado correctamente'); // Debug
          
          // Configurar timer para advertir sobre expiración
          get().setupTokenExpiryWarning(authResponse.expires_in);
          
        } catch (error: any) {
          // Limpiar sessionExpired también en caso de error
          set({ isLoading: false, sessionExpired: false });
          
          // Manejar errores específicos del backend
          if (error.response?.status === 422) {
            const validationErrors = error.response.data.detail
              .map((err: any) => err.msg)
              .join(', ');
            throw new Error(validationErrors);
          } else if (error.response?.status === 401) {
            throw new Error('Email o contraseña incorrectos');
          } else if (error.response?.status === 403) {
            throw new Error('Cuenta de usuario inactiva');
          } else if (error.response?.data?.detail) {
            throw new Error(error.response.data.detail);
          } else if (error.message) {
            throw new Error(error.message);
          } else {
            throw new Error('Error al iniciar sesión. Intenta nuevamente.');
          }
        }
      },

      // Configurar advertencia de expiración de token
      setupTokenExpiryWarning: (expiresInSeconds: number) => {
        // Advertir 5 minutos antes de que expire el token
        const warningTime = Math.max(0, (expiresInSeconds - 300) * 1000);
        
        setTimeout(() => {
          const state = get();
          if (state.isAuthenticated && !state.sessionExpired) {
            console.warn('⚠️ Token expirará pronto');
            // Aquí podrías mostrar una notificación al usuario
          }
        }, warningTime);
        
        // Logout automático cuando expire el token
        setTimeout(() => {
          const state = get();
          if (state.isAuthenticated) {
            console.warn('🔒 Token expirado, cerrando sesión automáticamente');
            state.forceLogout();
          }
        }, expiresInSeconds * 1000);
      },

      // Acción: Registro
      register: async (userData: RegisterRequest) => {
        set({ isLoading: true, sessionExpired: false });
        
        try {
          await authService.register(userData);
          
          // Después del registro, hacer login automáticamente
          await get().login({
            email: userData.email,
            contraseña: userData.contraseña
          });
          
        } catch (error: any) {
          // Limpiar sessionExpired también en caso de error
          set({ isLoading: false, sessionExpired: false });
          
          // Manejar errores específicos del backend
          if (error.response?.status === 422) {
            const validationErrors = error.response.data.detail
              .map((err: any) => err.msg)
              .join(', ');
            throw new Error(validationErrors);
          } else if (error.response?.status === 400) {
            const errorMessage = error.response.data.detail;
            if (errorMessage.includes('Email already registered')) {
              throw new Error('Este email ya está registrado');
            } else if (errorMessage.includes('Username already taken')) {
              throw new Error('Este nombre de usuario ya está en uso');
            } else {
              throw new Error(errorMessage);
            }
          } else if (error.response?.data?.detail) {
            throw new Error(error.response.data.detail);
          } else if (error.message) {
            throw new Error(error.message);
          } else {
            throw new Error('Error al registrar usuario. Intenta nuevamente.');
          }
        }
      },

      // Acción: Logout normal
      logout: (showMessage: boolean = true) => {
        console.log('👋 Cerrando sesión...');
        
        authService.logout();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          tokenExpiry: null,
          sessionExpired: false
        });
        
        if (showMessage) {
          // Mostrar mensaje de logout exitoso
          setTimeout(() => {
            console.log('✅ Sesión cerrada correctamente');
          }, 100);
        }
      },

      // Acción: Logout forzado (por expiración de token)
      forceLogout: () => {
        console.log('🔒 Sesión expirada, cerrando automáticamente...');
        
        authService.logout();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          tokenExpiry: null,
          sessionExpired: true
        });
      },

      // Verificar si el token ha expirado
      checkTokenExpiry: (): boolean => {
        const { tokenExpiry, isAuthenticated } = get();
        
        if (!isAuthenticated || !tokenExpiry) {
          return false;
        }
        
        const isExpired = Date.now() >= tokenExpiry;
        
        if (isExpired) {
          console.log('🔒 Token expirado detectado');
          get().forceLogout();
          return true;
        }
        
        return false;
      },

      // Limpiar flag de sesión expirada
      clearSessionExpired: () => {
        set({ sessionExpired: false });
      },

      // Acción: Refrescar usuario
      refreshUser: async () => {
        const currentState = get();
        
        // Si ya se está cargando, no hacer nada
        if (currentState.isLoading) {
          return;
        }
        
        try {
          // Verificar si el token ha expirado antes de hacer la request
          if (currentState.checkTokenExpiry()) {
            return;
          }
          
          if (authService.isAuthenticated()) {
            // Solo actualizar si no hay usuario o si el usuario cambió
            if (!currentState.user) {
              console.log('🔄 Refrescando datos de usuario...'); // Debug
              const currentUser = await authService.getCurrentUser();
              set({
                user: currentUser,
                isAuthenticated: true,
                isLoading: false
              });
            } else {
              // Usuario ya existe, solo asegurar que esté marcado como autenticado
              set({
                isAuthenticated: true,
                isLoading: false
              });
            }
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              tokenExpiry: null,
              sessionExpired: false
            });
          }
        } catch (error: any) {
          console.error('Error al refrescar usuario:', error);
          
          // Si es error 401, significa que el token expiró
          if (error.response?.status === 401) {
            get().forceLogout();
          } else {
            get().logout(false);
          }
        }
      },

      // Acción: Set loading
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-store', // Nombre para localStorage
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        tokenExpiry: state.tokenExpiry
      }), // Persistir user, isAuthenticated y tokenExpiry
    }
  )
);

// Hook para inicializar el store al cargar la app
export const initializeAuth = async () => {
  const { refreshUser, setLoading } = useAuthStore.getState();
  
  try {
    setLoading(true);
    await refreshUser();
  } catch (error) {
    console.error('Error al inicializar autenticación:', error);
  } finally {
    setLoading(false);
  }
};