// ============================================================================
// SERVICIO DE CHAT - API
// ============================================================================
// Servicio agnóstico al proveedor de IA (Azure OpenAI, GPT, etc.)

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatConversation {
  id: string;
  titulo: string;
  mensajes: ChatMessage[];
  fecha_creacion: Date;
  fecha_modificacion: Date;
}

export interface ChatRequest {
  mensaje: string;
  conversacion_id?: string;
  contexto_gastos?: boolean;
}

export interface ChatResponse {
  respuesta: string;
  conversacion_id: string;
  sugerencias?: string[];
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost';

export const chatApi = {
  /**
   * Envía un mensaje al chat y recibe una respuesta
   */
  async enviarMensaje(request: ChatRequest): Promise<ChatResponse> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/mensaje`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Error al enviar mensaje: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Obtiene el historial de conversaciones
   */
  async obtenerConversaciones(): Promise<ChatConversation[]> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/conversaciones`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener conversaciones: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Obtiene una conversación específica
   */
  async obtenerConversacion(id: string): Promise<ChatConversation> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/conversaciones/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener conversación: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Elimina una conversación
   */
  async eliminarConversacion(id: string): Promise<void> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/conversaciones/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Error al eliminar conversación: ${response.status}`);
    }
  },

  /**
   * Crea una nueva conversación
   */
  async nuevaConversacion(titulo?: string): Promise<ChatConversation> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/conversaciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ titulo }),
    });

    if (!response.ok) {
      throw new Error(`Error al crear conversación: ${response.status}`);
    }

    return response.json();
  },
};
