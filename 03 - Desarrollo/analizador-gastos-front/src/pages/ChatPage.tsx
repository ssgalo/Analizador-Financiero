// ============================================================================
// PÁGINA DE CHAT CON IA
// ============================================================================
import { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { Send, Plus, MessageSquare, Trash2, Bot, User, Loader2, X } from 'lucide-react';

export default function ChatPage() {
  // Estado local con valores por defecto seguros
  const [inputMensaje, setInputMensaje] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [hookError, setHookError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hook con manejo de errores más robusto
  let chatHook;
  try {
    chatHook = useChat();
  } catch (error) {
    console.error('Error al inicializar useChat:', error);
    if (!hookError) {
      setHookError(error instanceof Error ? error.message : 'Error desconocido');
    }
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="font-bold">Error en el Chat</h2>
          <p>No se pudo inicializar el chat. Error: {hookError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Recargar Página
          </button>
        </div>
      </div>
    );
  }

  // Verificar que el hook retornó un objeto válido
  if (!chatHook) {
    return (
      <div className="p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <h2 className="font-bold">Inicializando Chat...</h2>
          <p>Cargando componentes del chat...</p>
        </div>
      </div>
    );
  }

  // Destructuring seguro con valores por defecto
  const {
    mensajes = [],
    conversaciones = [],
    conversacionActual = null,
    isLoading = false,
    isTyping = false,
    error = null,
    tokensRestantes = 10000,
    limiteDiario = 10000,
    tokensUsadosHoy = 0,
    enviarMensaje,
    seleccionarConversacion,
    nuevaConversacion,
    eliminarConversacion,
    limpiarError,
    cargarLimites,
  } = chatHook || {};

  // Verificaciones adicionales de seguridad
  if (!enviarMensaje || !seleccionarConversacion || !nuevaConversacion || !eliminarConversacion || !cargarLimites) {
    return (
      <div className="p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <h2 className="font-bold">Cargando Chat...</h2>
          <p>Inicializando funciones del chat...</p>
          <div className="mt-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // Auto-scroll al nuevo mensaje con validación
  useEffect(() => {
    try {
      if (messagesEndRef?.current && Array.isArray(mensajes) && mensajes.length > 0) {
        // Usar setTimeout para asegurar que el DOM se ha actualizado
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    } catch (err) {
      console.warn('Error en scroll automático:', err);
    }
  }, [mensajes]);

  const handleEnviar = async () => {
    if (!inputMensaje.trim() || isTyping) return;
    
    try {
      if (enviarMensaje) {
        await enviarMensaje(inputMensaje);
        setInputMensaje('');
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const formatearFecha = (fecha: Date | string) => {
    try {
      // Validar que fecha no sea null o undefined
      if (!fecha) {
        return ''; // Retornar string vacío en lugar de "Sin fecha"
      }
      
      // Manejar tanto objetos Date como strings ISO
      let fechaObj: Date;
      
      if (typeof fecha === 'string') {
        fechaObj = new Date(fecha);
      } else if (fecha instanceof Date) {
        fechaObj = fecha;
      } else {
        return ''; // Retornar string vacío en lugar de "Formato inválido"
      }
      
      // Verificar que la fecha sea válida
      if (isNaN(fechaObj.getTime())) {
        return ''; // Retornar string vacío en lugar de "Fecha inválida"
      }
      
      return fechaObj.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return ''; // Retornar string vacío en lugar de "Error fecha"
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4 p-4">
      {/* Sidebar de conversaciones */}
      <div 
        className={`${
          showSidebar ? 'w-80' : 'w-0'
        } transition-all duration-300 overflow-hidden`}
      >
        <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Conversaciones
              </h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="md:hidden p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={nuevaConversacion}
              disabled={isLoading}
              className="w-full bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nueva Conversación
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {isLoading && (!conversaciones || conversaciones.length === 0) ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : !conversaciones || conversaciones.length === 0 ? (
              <div className="text-center text-gray-500 text-sm mt-8">
                No hay conversaciones aún
              </div>
            ) : (
              conversaciones.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors group ${
                    conversacionActual?.id === conv.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                  onClick={() => seleccionarConversacion(conv.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {conv.titulo || 'Nueva conversación'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatearFecha(conv.fecha_modificacion)}
                      </p>
                    </div>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await eliminarConversacion(conv.id);
                        } catch (error) {
                          console.error('Error al eliminar conversación:', error);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Área principal de chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 flex flex-col h-full bg-white rounded-lg shadow-sm border">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!showSidebar && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="font-semibold">Asistente Financiero IA</h2>
                  <p className="text-xs text-gray-500">
                    Consultas sobre tus gastos y finanzas
                  </p>
                </div>
              </div>
              
              {/* Indicador de tokens */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-gray-600">
                    {tokensRestantes.toLocaleString()} / {limiteDiario.toLocaleString()} tokens
                  </span>
                </div>
                {tokensUsadosHoy > 0 && (
                  <div className="text-gray-500">
                    {tokensUsadosHoy.toLocaleString()} usados hoy
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Área de mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!mensajes || mensajes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  ¡Hola! Soy tu asistente financiero
                </h3>
                <p className="text-gray-500 max-w-md">
                  Puedo ayudarte a analizar tus gastos, darte recomendaciones
                  financieras y responder tus preguntas.
                </p>
                <div className="mt-6 space-y-2">
                  <button
                    onClick={() => setInputMensaje('¿Cuáles fueron mis principales gastos este mes?')}
                    className="block w-full text-left px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
                  >
                    💰 ¿Cuáles fueron mis principales gastos este mes?
                  </button>
                  <button
                    onClick={() => setInputMensaje('¿En qué categoría gasté más dinero?')}
                    className="block w-full text-left px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
                  >
                    📊 ¿En qué categoría gasté más dinero?
                  </button>
                  <button
                    onClick={() => setInputMensaje('Dame consejos para ahorrar')}
                    className="block w-full text-left px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
                  >
                    💡 Dame consejos para ahorrar
                  </button>
                </div>
              </div>
            ) : (
              <>
                {mensajes.map((mensaje) => (
                  <div
                    key={mensaje.id}
                    className={`flex gap-3 ${
                      mensaje.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {mensaje.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        mensaje.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {mensaje.content}
                        {/* Mostrar cursor parpadeante o puntos animados si está escribiendo */}
                        {mensaje.role === 'assistant' && 
                         isTyping && 
                         mensaje.id === mensajes.filter(m => m.role === 'assistant').slice(-1)[0]?.id && (
                          mensaje.content ? (
                            <span className="inline-block w-2 h-4 bg-gray-500 ml-1 animate-pulse"></span>
                          ) : (
                            <span className="flex gap-1 inline-flex ml-2">
                              <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                              <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </span>
                          )
                        )}
                      </p>
                      <p
                        className={`text-xs mt-2 ${
                          mensaje.role === 'user'
                            ? 'text-blue-100'
                            : 'text-gray-500'
                        }`}
                      >
                        {formatearFecha(mensaje.timestamp)}
                      </p>
                    </div>

                    {mensaje.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                ))}



                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Error display */}
          {error && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-red-600">{error}</p>
                <button
                  onClick={limpiarError}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Input de mensaje */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <textarea
                value={inputMensaje}
                onChange={(e) => setInputMensaje(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Escribe tu mensaje... (Enter para enviar)"
                className="flex-1 resize-none border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] max-h-32"
                rows={1}
                disabled={isTyping}
              />
              <button
                onClick={handleEnviar}
                disabled={!inputMensaje.trim() || isTyping}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isTyping ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Presiona Enter para enviar, Shift+Enter para nueva línea
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
