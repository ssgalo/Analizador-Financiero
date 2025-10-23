/**
 * Servicio de API para el Analizador Financiero
 * 
 * Proporciona cliente configurado de Axios y servicios para:
 * - Autenticación (login, registro, sesiones)
 * - Gastos (CRUD completo)
 * - Ingresos (CRUD completo)
 * - Categorías (gestión de categorías)
 * - Chat (integración con Azure OpenAI)
 * 
 * Incluye interceptores para:
 * - Agregar automáticamente tokens JWT a las peticiones
 * - Manejar expiración de sesiones
 */

import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';

// Configuración base de la API desde variables de entorno
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';

/**
 * Cliente configurado de Axios para todas las peticiones API
 * Base URL: /api/v1
 * Timeout: 10 segundos
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

/**
 * Interceptor de peticiones
 * Agrega automáticamente el token JWT a los headers de autorización
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(import.meta.env.VITE_TOKEN_KEY || 'auth_token');
    
    // ✅ Debug: mostrar si hay token o no
    if (token) {
      console.log('🔑 Token encontrado, agregando a header:', token.substring(0, 20) + '...');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ No se encontró token en localStorage para:', config.url);
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
      
      console.log('🔒 Token expirado detectado por interceptor');
      
      // Notificar al store sobre la expiración del token
      // Usar un evento personalizado para evitar dependencias circulares
      window.dispatchEvent(new CustomEvent('token-expired', {
        detail: { 
          message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          reason: 'token_expired'
        }
      }));
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
    
    // ✅ Guardar token y usuario en localStorage inmediatamente
    const { access_token, user_info } = response.data;
    localStorage.setItem(import.meta.env.VITE_TOKEN_KEY || 'auth_token', access_token);
    localStorage.setItem(import.meta.env.VITE_USER_KEY || 'user_info', JSON.stringify(user_info));
    
    console.log('✅ Token guardado en localStorage:', access_token.substring(0, 20) + '...');
    
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

// Tipos para Gastos
export interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion: string;
  es_personalizada: boolean;
  id_usuario?: number;
  color?: string;
  icono?: string;
}

export interface CategoriaCreate {
  nombre: string;
  descripcion?: string;
  es_personalizada?: boolean;
  id_usuario?: number;
  color?: string;
  icono?: string;
}

export interface Gasto {
  id_gasto: number;
  id_usuario: number;
  fecha: string;
  monto: number;
  descripcion: string;
  comercio: string;
  id_categoria: number;
  categoria?: Categoria;
  fuente: 'manual' | 'PDF' | 'imagen' | 'MercadoPago' | 'banco';
  id_archivo_importado?: number;
  estado: 'confirmado' | 'eliminado' | 'pendiente'; // ✅ Cambiado: ahora usa los valores correctos de la BD
  fecha_creacion: string;
  fecha_modificacion: string;
}

export interface GastoCreate {
  fecha: string;
  monto: number;
  descripcion: string;
  comercio: string;
  id_categoria: number;
  fuente: 'manual' | 'PDF' | 'imagen' | 'MercadoPago' | 'banco';
  id_usuario: number;
}

export interface GastoUpdate {
  fecha?: string;
  monto?: number;
  descripcion?: string;
  comercio?: string;
  id_categoria?: number;
  fuente?: 'manual' | 'PDF' | 'imagen' | 'MercadoPago' | 'banco';
}

// Servicios de Gastos
export const gastosService = {
  // Obtener lista de gastos con filtros
  async getGastos(filtros?: {
    skip?: number;
    limit?: number;
    id_usuario?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
    id_categoria?: number;
  }): Promise<Gasto[]> {
    const params = new URLSearchParams();
    if (filtros?.skip !== undefined) params.append('skip', filtros.skip.toString());
    if (filtros?.limit !== undefined) params.append('limit', filtros.limit.toString());
    if (filtros?.id_usuario !== undefined) params.append('id_usuario', filtros.id_usuario.toString());
    if (filtros?.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
    if (filtros?.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);
    if (filtros?.id_categoria !== undefined) params.append('id_categoria', filtros.id_categoria.toString());

    const queryString = params.toString();
    const url = `/gastos/${queryString ? '?' + queryString : ''}`;
    const response = await apiClient.get<Gasto[]>(url);
    return response.data;
  },

  // Obtener un gasto por ID
  async getGasto(id: number): Promise<Gasto> {
    const response = await apiClient.get<Gasto>(`/gastos/${id}`);
    return response.data;
  },

  // Crear un nuevo gasto
  async createGasto(gasto: GastoCreate): Promise<Gasto> {
    const response = await apiClient.post<Gasto>('/gastos/', gasto);
    return response.data;
  },

  // Actualizar un gasto
  async updateGasto(id: number, gasto: GastoUpdate): Promise<Gasto> {
    const response = await apiClient.put<Gasto>(`/gastos/${id}`, gasto);
    return response.data;
  },

  // Eliminar un gasto
  async deleteGasto(id: number): Promise<void> {
    await apiClient.delete(`/gastos/${id}`);
  },

  // Obtener estadísticas de gastos
  async getEstadisticas(año?: number, mes?: number): Promise<any> {
    const params = new URLSearchParams();
    if (año !== undefined) params.append('año', año.toString());
    if (mes !== undefined) params.append('mes', mes.toString());

    const queryString = params.toString();
    const url = `/gastos/stats${queryString ? '?' + queryString : ''}`;
    const response = await apiClient.get(url);
    return response.data;
  }
};

// Servicios de Categorías
export const categoriasService = {
  // Obtener lista de categorías
  async getCategorias(filtros?: {
    skip?: number;
    limit?: number;
    es_personalizada?: boolean;
  }): Promise<Categoria[]> {
    const params = new URLSearchParams();
    if (filtros?.skip !== undefined) params.append('skip', filtros.skip.toString());
    if (filtros?.limit !== undefined) params.append('limit', filtros.limit.toString());
    if (filtros?.es_personalizada !== undefined) params.append('es_personalizada', filtros.es_personalizada.toString());

    const queryString = params.toString();
    const url = `/categorias/${queryString ? '?' + queryString : ''}`;
    const response = await apiClient.get<Categoria[]>(url);
    return response.data;
  },

  // Obtener categorías de un usuario específico (incluye personalizadas y globales)
  async getCategoriasUsuario(userId: number, filtros?: {
    skip?: number;
    limit?: number;
  }): Promise<Categoria[]> {
    const params = new URLSearchParams();
    if (filtros?.skip !== undefined) params.append('skip', filtros.skip.toString());
    if (filtros?.limit !== undefined) params.append('limit', filtros.limit.toString());

    const queryString = params.toString();
    const url = `/categorias/usuario/${userId}${queryString ? '?' + queryString : ''}`;
    const response = await apiClient.get<Categoria[]>(url);
    return response.data;
  },

  // Obtener una categoría por ID
  async getCategoria(id: number): Promise<Categoria> {
    const response = await apiClient.get<Categoria>(`/categorias/${id}`);
    return response.data;
  },

  // Crear una nueva categoría
  async createCategoria(categoria: CategoriaCreate): Promise<Categoria> {
    const response = await apiClient.post<Categoria>('/categorias/', categoria);
    return response.data;
  }
};

// Tipos para Ingresos
export interface Ingreso {
  id_ingreso: number;
  id_usuario: number;
  fecha: string;
  monto: number;
  descripcion: string;
  fuente?: string;
  tipo: 'salario' | 'freelance' | 'inversion' | 'venta' | 'regalo' | 'otro';
  recurrente: boolean;
  frecuencia: 'semanal' | 'quincenal' | 'mensual' | 'trimestral' | 'anual' | 'unica';
  estado: 'confirmado' | 'pendiente' | 'cancelado';
  fecha_creacion: string;
  fecha_modificacion: string;
  moneda: string;
  notas?: string;
  id_categoria?: number;
  categoria?: Categoria;
}

export interface IngresoCreate {
  fecha: string;
  monto: number;
  descripcion: string;
  fuente?: string;
  tipo: 'salario' | 'freelance' | 'inversion' | 'venta' | 'regalo' | 'otro';
  recurrente?: boolean;
  frecuencia?: 'semanal' | 'quincenal' | 'mensual' | 'trimestral' | 'anual' | 'unica';
  id_categoria?: number;
  notas?: string;
  moneda?: string;
}

export interface IngresoUpdate {
  fecha?: string;
  monto?: number;
  descripcion?: string;
  fuente?: string;
  tipo?: 'salario' | 'freelance' | 'inversion' | 'venta' | 'regalo' | 'otro';
  recurrente?: boolean;
  frecuencia?: 'semanal' | 'quincenal' | 'mensual' | 'trimestral' | 'anual' | 'unica';
  estado?: 'confirmado' | 'pendiente' | 'cancelado';
  id_categoria?: number;
  notas?: string;
  moneda?: string;
}

export interface IngresoStats {
  total_ingresos: number;
  cantidad_ingresos: number;
  promedio_ingreso: number;
  ingresos_por_tipo: Record<string, { total: number; cantidad: number }>;
  ingresos_por_categoria: Record<string, { total: number; cantidad: number }>;
}

export interface OpcionesTipos {
  tipos: Array<{ value: string; label: string }>;
  frecuencias: Array<{ value: string; label: string }>;
  estados: Array<{ value: string; label: string }>;
}

// Servicios de Ingresos
export const ingresosService = {
  // Obtener lista de ingresos con filtros
  async getIngresos(filtros?: {
    skip?: number;
    limit?: number;
    categoria_id?: number;
    tipo?: string;
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<Ingreso[]> {
    const params = new URLSearchParams();
    if (filtros?.skip !== undefined) params.append('skip', filtros.skip.toString());
    if (filtros?.limit !== undefined) params.append('limit', filtros.limit.toString());
    if (filtros?.categoria_id !== undefined) params.append('categoria_id', filtros.categoria_id.toString());
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.estado) params.append('estado', filtros.estado);
    if (filtros?.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
    if (filtros?.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);

    const queryString = params.toString();
    const url = `/ingresos/${queryString ? '?' + queryString : ''}`;
    const response = await apiClient.get<Ingreso[]>(url);
    return response.data;
  },

  // Obtener un ingreso por ID
  async getIngreso(id: number): Promise<Ingreso> {
    const response = await apiClient.get<Ingreso>(`/ingresos/${id}`);
    return response.data;
  },

  // Crear un nuevo ingreso
  async createIngreso(ingreso: IngresoCreate): Promise<Ingreso> {
    const response = await apiClient.post<Ingreso>('/ingresos/', ingreso);
    return response.data;
  },

  // Actualizar un ingreso
  async updateIngreso(id: number, ingreso: IngresoUpdate): Promise<Ingreso> {
    const response = await apiClient.put<Ingreso>(`/ingresos/${id}`, ingreso);
    return response.data;
  },

  // Eliminar un ingreso
  async deleteIngreso(id: number): Promise<void> {
    await apiClient.delete(`/ingresos/${id}`);
  },

  // Obtener estadísticas de ingresos
  async getEstadisticas(año?: number, mes?: number): Promise<IngresoStats> {
    const params = new URLSearchParams();
    if (año !== undefined) params.append('año', año.toString());
    if (mes !== undefined) params.append('mes', mes.toString());

    const queryString = params.toString();
    const url = `/ingresos/stats${queryString ? '?' + queryString : ''}`;
    const response = await apiClient.get<IngresoStats>(url);
    return response.data;
  },

  // Obtener opciones de tipos y frecuencias
  async getOpcionesTipos(): Promise<OpcionesTipos> {
    const response = await apiClient.get<OpcionesTipos>('/ingresos/tipos/opciones');
    return response.data;
  }
};

export default apiClient;