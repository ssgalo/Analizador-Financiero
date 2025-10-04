import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';

// Crear instancia de axios
export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

// Interceptor para agregar token JWT automáticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(import.meta.env.VITE_TOKEN_KEY || 'auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Si el token expira o es inválido
    if (error.response?.status === 401) {
      // Limpiar localStorage
      localStorage.removeItem(import.meta.env.VITE_TOKEN_KEY || 'auth_token');
      localStorage.removeItem(import.meta.env.VITE_USER_KEY || 'user_info');
      
      // NO usar window.location.href ya que causa refresco de página
      // La navegación se manejará en el store de autenticación
      console.log('🔒 Token expirado, el store manejará la navegación');
    }
    return Promise.reject(error);
  }
);

// Tipos para las respuestas de autenticación
export interface LoginRequest {
  email: string;
  contraseña: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  usuario: string;
  contraseña: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user_info: {
    id_usuario: number;
    nombre: string;
    email: string;
    usuario: string;
    estado: string;
  };
}

export interface User {
  id_usuario: number;
  nombre: string;
  email: string;
  usuario: string;
  estado: string;
}

// Servicios de autenticación
export const authService = {
  // Login de usuario
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  // Registro de usuario
  async register(userData: RegisterRequest): Promise<User> {
    const response = await apiClient.post<User>('/auth/register', userData);
    return response.data;
  },

  // Obtener información del usuario actual
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  // Logout (limpiar tokens)
  logout(): void {
    localStorage.removeItem(import.meta.env.VITE_TOKEN_KEY || 'auth_token');
    localStorage.removeItem(import.meta.env.VITE_USER_KEY || 'user_info');
  },

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    const token = localStorage.getItem(import.meta.env.VITE_TOKEN_KEY || 'auth_token');
    return !!token;
  },

  // Obtener token del localStorage
  getToken(): string | null {
    return localStorage.getItem(import.meta.env.VITE_TOKEN_KEY || 'auth_token');
  },

  // Obtener usuario del localStorage
  getStoredUser(): User | null {
    const userJson = localStorage.getItem(import.meta.env.VITE_USER_KEY || 'user_info');
    return userJson ? JSON.parse(userJson) : null;
  }
};

export default apiClient;