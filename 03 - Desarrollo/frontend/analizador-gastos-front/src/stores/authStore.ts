import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/api';
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '../services/api';

interface AuthState {
  // Estado
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Acciones
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      isLoading: true,

      // Acción: Login
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true });
        
        try {
          console.log('🔐 Iniciando login...'); // Debug
          const authResponse: AuthResponse = await authService.login(credentials);
          
          console.log('✅ Login exitoso, actualizando estado...'); // Debug
          // Actualizar estado
          set({
            user: authResponse.user_info,
            isAuthenticated: true,
            isLoading: false
          });
          
          console.log('🚀 Estado actualizado correctamente'); // Debug
          
        } catch (error: any) {
          set({ isLoading: false });
          
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

      // Acción: Registro
      register: async (userData: RegisterRequest) => {
        set({ isLoading: true });
        
        try {
          await authService.register(userData);
          
          // Después del registro, hacer login automáticamente
          await get().login({
            email: userData.email,
            contraseña: userData.contraseña
          });
          
        } catch (error: any) {
          set({ isLoading: false });
          
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

      // Acción: Logout
      logout: () => {
        authService.logout();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      },

      // Acción: Refrescar usuario
      refreshUser: async () => {
        const currentState = get();
        
        // Si ya se está cargando, no hacer nada
        if (currentState.isLoading) {
          return;
        }
        
        try {
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
              isLoading: false
            });
          }
        } catch (error) {
          console.error('Error al refrescar usuario:', error);
          get().logout();
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
        isAuthenticated: state.isAuthenticated 
      }), // Solo persistir user e isAuthenticated, no isLoading
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