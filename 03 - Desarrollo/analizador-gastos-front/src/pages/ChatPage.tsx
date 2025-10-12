// ============================================================================
// PÁGINA DE CHAT CON IA
// ============================================================================
import { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { Send, Plus, MessageSquare, Trash2, Bot, User, Loader2, X } from 'lucide-react';

export default function ChatPage() {
  const {
    mensajes,
    conversaciones,
    conversacionActual,
    isLoading,
    isTyping,
    error,
    enviarMensaje,
    seleccionarConversacion,
    nuevaConversacion,
    eliminarConversacion,
    limpiarError,
  } = useChat();

  const [inputMensaje, setInputMensaje] = useState('');
  const [contextoGastos, setContextoGastos] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al nuevo mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const handleEnviar = async () => {
    if (!inputMensaje.trim() || isTyping) return;
    
    await enviarMensaje(inputMensaje, contextoGastos);
    setInputMensaje('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const formatearFecha = (fecha: Date) => {
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
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
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            </div>
            
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={contextoGastos}
                onChange={(e) => setContextoGastos(e.target.checked)}
                className="rounded cursor-pointer"
              />
              <span className="text-gray-600">Incluir contexto de gastos</span>
            </label>
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

                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

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
