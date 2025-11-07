import React, { useState } from 'react';

interface RecoverPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RecoverPasswordModal: React.FC<RecoverPasswordModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/usuarios/recuperar-contraseña`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Se han enviado las instrucciones a tu correo');
        setEmail('');
        // Cerrar modal después de 3 segundos
        setTimeout(() => {
          onClose();
          setStatus('idle');
          setMessage('');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.detail || 'Error al procesar la solicitud');
      }
    } catch (error) {
      console.error('Error al recuperar contraseña:', error);
      setStatus('error');
      setMessage('Error al conectar con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setStatus('idle');
    setMessage('');
    onClose();
  };

  return (
    <>
      {/* Backdrop con blur */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-scale-in">
          {/* Botón cerrar */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Icono y título */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Recuperar Contraseña
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting || status === 'success'}
                placeholder="tu@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Mensajes de estado */}
            {message && (
              <div className={`p-4 rounded-lg ${
                status === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {status === 'success' ? (
                      <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      status === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex space-x-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || status === 'success'}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  'Restablecer'
                )}
              </button>
            </div>
          </form>

          {/* Modo desarrollo: mostrar enlace directo */}
          {import.meta.env.DEV && (
            <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-xs text-yellow-800 mb-2">
                <strong>⚙️ Modo Desarrollo:</strong> En producción, recibirás un email con el token.
              </p>
              <a 
                href="/reset-password" 
                className="text-xs text-blue-600 hover:text-blue-700 font-medium underline"
                onClick={handleClose}
              >
                → Ir a página de restablecimiento manual
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RecoverPasswordModal;