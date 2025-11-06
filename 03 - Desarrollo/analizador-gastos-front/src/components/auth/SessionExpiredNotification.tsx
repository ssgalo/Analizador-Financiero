import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, X, LogIn } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const SessionExpiredNotification: React.FC = () => {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { sessionExpired, clearSessionExpired } = useAuthStore();

  // Escuchar eventos de token expirado
  useEffect(() => {
    const handleTokenExpired = (event: CustomEvent) => {
      setMessage(event.detail.message || 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      setShow(true);
    };

    window.addEventListener('token-expired', handleTokenExpired as EventListener);

    return () => {
      window.removeEventListener('token-expired', handleTokenExpired as EventListener);
    };
  }, []);

  // Mostrar/ocultar notificación cuando sessionExpired cambie
  useEffect(() => {
    if (sessionExpired) {
      setMessage('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      setShow(true);
    } else {
      // Si sessionExpired se limpia, ocultar el popup
      setShow(false);
    }
  }, [sessionExpired]);

  const handleClose = () => {
    setShow(false);
    clearSessionExpired();
  };

  const handleLogin = () => {
    handleClose();
    navigate('/auth');
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Sesión Expirada
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            {message}
          </p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleLogin}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              <span>Iniciar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredNotification;