// ============================================================================
// SERVICIO DE CHAT - API
// ============================================================================
// Servicio agnóstico al proveedor de IA (Azure OpenAI, GPT, etc.)

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date | string; // Soportar tanto Date como string ISO
}

export interface ChatConversation {
  id: string;
  titulo: string;
  mensajes: ChatMessage[];
  fecha_creacion: Date | string; // Soportar tanto Date como string ISO
  fecha_modificacion: Date | string; // Soportar tanto Date como string ISO
}

export interface ChatRequest {
  mensaje: string;
  conversacion_id?: string;
}

export interface ChatResponse {
  respuesta: string;
  conversacion_id: string;
  sugerencias?: string[];
}

export interface StreamingCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: (fullResponse: string, conversacionId: string) => void;
  onError: (error: Error) => void;
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
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Error al eliminar conversación: ${response.status}`);
    }
  },

  /**
   * Obtiene los mensajes de una conversación específica
   */
  async obtenerMensajes(conversacionId: string): Promise<ChatMessage[]> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/conversaciones/${conversacionId}/mensajes`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener mensajes: ${response.status}`);
    }

    return response.json();
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

  /**
   * Envía un mensaje al chat con respuesta streaming
   */
  async enviarMensajeStreaming(request: ChatRequest, callbacks: StreamingCallbacks): Promise<void> {
    const token = localStorage.getItem('auth_token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/mensaje/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(request),
      });

      // Si el endpoint de streaming no existe, usar el método tradicional
      if (response.status === 404) {
        console.warn('Endpoint de streaming no disponible, usando método tradicional');
        const fallbackResponse = await this.enviarMensaje(request);
        
        // Simular streaming dividiendo la respuesta en chunks
        const words = fallbackResponse.respuesta.split(' ');
        let currentContent = '';
        
        for (let i = 0; i < words.length; i++) {
          const word = words[i] + (i < words.length - 1 ? ' ' : '');
          currentContent += word;
          callbacks.onChunk(word);
          
          // Pequeña pausa para simular streaming
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        callbacks.onComplete(fallbackResponse.respuesta, fallbackResponse.conversacion_id);
        return;
      }

      if (!response.ok) {
        throw new Error(`Error al enviar mensaje: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let conversacionId = '';

      if (!reader) {
        throw new Error('No se pudo obtener el stream de respuesta');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              callbacks.onComplete(fullResponse, conversacionId);
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.conversacion_id) {
                conversacionId = parsed.conversacion_id;
              }
              
              if (parsed.content) {
                fullResponse += parsed.content;
                callbacks.onChunk(parsed.content);
              }
            } catch (e) {
              // Ignorar líneas que no son JSON válido
              console.warn('Línea no JSON ignorada:', data);
            }
          }
        }
      }
      
      callbacks.onComplete(fullResponse, conversacionId);
      
    } catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error('Error desconocido'));
    }
  },
};
