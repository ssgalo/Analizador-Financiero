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
  enviarMensaje: (mensaje: string, contextoGastos?: boolean) => Promise<void>;
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
    cargarConversaciones();
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
      setConversacionActual(conv);
      setMensajes(conv.mensajes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar conversación');
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

  const enviarMensaje = useCallback(async (mensaje: string, contextoGastos = true) => {
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

    try {
      const response = await chatApi.enviarMensaje({
        mensaje,
        conversacion_id: conversacionActual?.id,
        contexto_gastos: contextoGastos,
      });

      const mensajeAsistente: ChatMessage = {
        id: `response-${Date.now()}`,
        role: 'assistant',
        content: response.respuesta,
        timestamp: new Date(),
      };

      setMensajes((prev: ChatMessage[]) => [...prev, mensajeAsistente]);

      // Actualizar ID de conversación si es nueva
      if (!conversacionActual?.id && response.conversacion_id) {
        const conv = await chatApi.obtenerConversacion(response.conversacion_id);
        setConversacionActual(conv);
        await cargarConversaciones();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar mensaje');
      // Remover el mensaje del usuario si hubo error
      setMensajes((prev: ChatMessage[]) => prev.filter((m: ChatMessage) => m.id !== nuevoMensajeUsuario.id));
    } finally {
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
