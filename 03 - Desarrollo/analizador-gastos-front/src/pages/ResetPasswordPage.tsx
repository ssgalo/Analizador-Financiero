import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoApp from '../assets/logoAPP.png';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    token: '',
    nueva_contraseña: '',
    confirmar_contraseña: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('idle');
    setMessage('');

    // Validar que las contraseñas coincidan
    if (formData.nueva_contraseña !== formData.confirmar_contraseña) {
      setStatus('error');
      setMessage('Las contraseñas no coinciden');
      setIsSubmitting(false);
      return;
    }

    // Validar longitud
    if (formData.nueva_contraseña.length < 8) {
      setStatus('error');
      setMessage('La contraseña debe tener al menos 8 caracteres');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/usuarios/restablecer-contraseña`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          token: formData.token,
          nueva_contraseña: formData.nueva_contraseña
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('¡Contraseña restablecida correctamente! Redirigiendo al login...');
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(data.detail || 'Error al restablecer la contraseña');
      }
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      setStatus('error');
      setMessage('Error al conectar con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo y título */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img 
              src={logoApp} 
              alt="Logo Analizador Financiero" 
              className="w-32 h-32 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Restablecer Contraseña
          </h1>
          <p className="text-gray-600 text-sm">
            Ingresa tu email, el token recibido y tu nueva contraseña
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                placeholder="tu@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
              />
            </div>

            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
                Token de recuperación
              </label>
              <input
                type="text"
                id="token"
                name="token"
                value={formData.token}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                placeholder="Ingresa el token recibido"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Encontrarás este token en el correo de recuperación (o en la consola durante desarrollo)
              </p>
            </div>

            <div>
              <label htmlFor="nueva_contraseña" className="block text-sm font-medium text-gray-700 mb-1">
                Nueva contraseña
              </label>
              <input
                type="password"
                id="nueva_contraseña"
                name="nueva_contraseña"
                value={formData.nueva_contraseña}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                8-32 caracteres, debe incluir mayúsculas, minúsculas, números y símbolos
              </p>
            </div>

            <div>
              <label htmlFor="confirmar_contraseña" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar nueva contraseña
              </label>
              <input
                type="password"
                id="confirmar_contraseña"
                name="confirmar_contraseña"
                value={formData.confirmar_contraseña}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
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
                onClick={() => navigate('/auth')}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Volver al login
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
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
