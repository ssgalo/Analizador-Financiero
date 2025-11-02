// ============================================================================
// HOOK PARA MANEJO DE CHAT
// ============================================================================
import { useState, useCallback, useEffect } from 'react';
import type { ChatMessage, ChatConversation } from '../services/chatApi';
import { chatApi } from '../services/chatApi';

interface UseChatReturn {
  mensajes: ChatMessage[];
  conversaciones: ChatConversation[];
  conversacionActual: ChatConversation | null;
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  enviarMensaje: (mensaje: string) => Promise<void>;
  cargarConversaciones: () => Promise<void>;
  seleccionarConversacion: (id: string) => Promise<void>;
  nuevaConversacion: () => Promise<void>;
  eliminarConversacion: (id: string) => Promise<void>;
  limpiarError: () => void;
}

export const useChat = (): UseChatReturn => {
  const [mensajes, setMensajes] = useState<ChatMessage[]>([]);
  const [conversaciones, setConversaciones] = useState<ChatConversation[]>([]);
  const [conversacionActual, setConversacionActual] = useState<ChatConversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar conversaciones al montar
  useEffect(() => {
    const cargarInicial = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const convs = await chatApi.obtenerConversaciones();
        setConversaciones(Array.isArray(convs) ? convs : []);
      } catch (err) {
        console.error('Error al cargar conversaciones:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar conversaciones');
        setConversaciones([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarInicial();
  }, []);

  const cargarConversaciones = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const convs = await chatApi.obtenerConversaciones();
      setConversaciones(Array.isArray(convs) ? convs : []);
    } catch (err) {
      console.error('Error al cargar conversaciones:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar conversaciones');
      setConversaciones([]); // Asegurar que siempre sea un array
    } finally {
      setIsLoading(false);
    }
  }, []);

  const seleccionarConversacion = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const conv = await chatApi.obtenerConversacion(id);
      const mensajes = await chatApi.obtenerMensajes(id);
      setConversacionActual({
        ...conv,
        mensajes: mensajes || []
      });
      setMensajes(Array.isArray(mensajes) ? mensajes : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar conversación');
      setMensajes([]); // Limpiar mensajes en caso de error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const nuevaConversacion = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const conv = await chatApi.nuevaConversacion();
      setConversacionActual(conv);
      setMensajes([]);
      await cargarConversaciones();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear conversación');
    } finally {
      setIsLoading(false);
    }
  }, [cargarConversaciones]);

  const enviarMensaje = useCallback(async (mensaje: string) => {
    if (!mensaje.trim()) return;

    const nuevoMensajeUsuario: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: mensaje,
      timestamp: new Date(),
    };

    // Agregar mensaje del usuario inmediatamente
    setMensajes((prev: ChatMessage[]) => [...prev, nuevoMensajeUsuario]);
    setIsTyping(true);
    setError(null);

    // ID temporal para el mensaje del asistente
    const mensajeAsistenteId = `response-${Date.now()}`;
    
    // Agregar mensaje del asistente vacío para streaming
    const mensajeAsistenteInicial: ChatMessage = {
      id: mensajeAsistenteId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    
    setMensajes((prev: ChatMessage[]) => [...prev, mensajeAsistenteInicial]);

    try {
      await chatApi.enviarMensajeStreaming(
        {
          mensaje,
          conversacion_id: conversacionActual?.id,
        },
        {
          onChunk: (chunk: string) => {
            // Actualizar el mensaje del asistente con el nuevo chunk
            setMensajes((prev: ChatMessage[]) => 
              prev.map((msg: ChatMessage) => 
                msg.id === mensajeAsistenteId 
                  ? { ...msg, content: msg.content + chunk }
                  : msg
              )
            );
          },
          onComplete: async (fullResponse: string, conversacionId: string) => {
            // Asegurar que el mensaje final esté completo
            setMensajes((prev: ChatMessage[]) => 
              prev.map((msg: ChatMessage) => 
                msg.id === mensajeAsistenteId 
                  ? { ...msg, content: fullResponse }
                  : msg
              )
            );
            
            // Actualizar ID de conversación si es nueva
            if (!conversacionActual?.id && conversacionId) {
              try {
                const conv = await chatApi.obtenerConversacion(conversacionId);
                setConversacionActual(conv);
                await cargarConversaciones();
              } catch (err) {
                console.error('Error al actualizar conversación:', err);
              }
            }
            
            setIsTyping(false);
          },
          onError: (error: Error) => {
            setError(error.message);
            // Remover ambos mensajes si hubo error
            setMensajes((prev: ChatMessage[]) => 
              prev.filter((m: ChatMessage) => 
                m.id !== nuevoMensajeUsuario.id && m.id !== mensajeAsistenteId
              )
            );
            setIsTyping(false);
          }
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar mensaje');
      // Remover ambos mensajes si hubo error
      setMensajes((prev: ChatMessage[]) => 
        prev.filter((m: ChatMessage) => 
          m.id !== nuevoMensajeUsuario.id && m.id !== mensajeAsistenteId
        )
      );
      setIsTyping(false);
    }
  }, [conversacionActual, cargarConversaciones]);

  const eliminarConversacion = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Primero limpiar el estado local si es la conversación actual
      if (conversacionActual?.id === id) {
        setConversacionActual(null);
        setMensajes([]);
      }
      
      // Luego eliminar en el backend
      await chatApi.eliminarConversacion(id);
      
      // Finalmente recargar la lista
      await cargarConversaciones();
    } catch (err) {
      console.error('Error al eliminar conversación:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar conversación');
    } finally {
      setIsLoading(false);
    }
  }, [conversacionActual, cargarConversaciones]);

  const limpiarError = useCallback(() => {
    setError(null);
  }, []);

  return {
    mensajes,
    conversaciones,
    conversacionActual,
    isLoading,
    isTyping,
    error,
    enviarMensaje,
    cargarConversaciones,
    seleccionarConversacion,
    nuevaConversacion,
    eliminarConversacion,
    limpiarError,
  };
};
