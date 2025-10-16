import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import type { LoginRequest, RegisterRequest } from '../services/api';
import logoApp from '../assets/logoAPP.png';

const AuthPage: React.FC = () => {
  const { login, register, isAuthenticated, isLoading, clearSessionExpired } = useAuthStore();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    contraseña: '',
    nombre: '',
    usuario: ''
  });
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // Limpiar sessionExpired cuando se monta el componente
  useEffect(() => {
    clearSessionExpired();
  }, [clearSessionExpired]);

  // Si ya está autenticado, redirigir
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error al escribir
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isLoginMode) {
        // Login
        const loginData: LoginRequest = {
          email: formData.email,
          contraseña: formData.contraseña
        };
        
        console.log('Intentando login con:', loginData); // Debug
        await login(loginData);
        console.log('Login exitoso'); // Debug
      } else {
        // Registro
        if (!formData.nombre || !formData.usuario) {
          throw new Error('Todos los campos son requeridos para el registro');
        }
        
        const registerData: RegisterRequest = {
          nombre: formData.nombre,
          email: formData.email,
          usuario: formData.usuario,
          contraseña: formData.contraseña
        };
        
        console.log('Intentando registro con:', registerData); // Debug
        await register(registerData);
        console.log('Registro exitoso'); // Debug
      }
    } catch (err: any) {
      console.error('Error en handleSubmit:', err); // Debug
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    setFormData({
      email: '',
      contraseña: '',
      nombre: '',
      usuario: ''
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo y título principal de la aplicación */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img 
              src={logoApp} 
              alt="Logo Analizador Financiero" 
              className="w-40 h-40 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Analizador Financiero
          </h1>
          <p className="text-gray-600 text-sm">
            Organizar tus finanzas nunca fue tan fácil
          </p>
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            {isLoginMode ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            <button
              type="button"
              onClick={toggleMode}
              className="ml-1 font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
            >
              {isLoginMode ? 'Regístrate aquí' : 'Inicia sesión aquí'}
            </button>
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!isLoginMode && (
              <>
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                    Nombre completo
                  </label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    required={!isLoginMode}
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div>
                  <label htmlFor="usuario" className="block text-sm font-medium text-gray-700">
                    Nombre de usuario
                  </label>
                  <input
                    id="usuario"
                    name="usuario"
                    type="text"
                    required={!isLoginMode}
                    value={formData.usuario}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="usuario123"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="contraseña" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="contraseña"
                name="contraseña"
                type="password"
                required
                value={formData.contraseña}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="••••••••"
              />
              {!isLoginMode && (
                <p className="mt-1 text-xs text-gray-500">
                  8-32 caracteres, debe incluir mayúsculas, minúsculas, números y símbolos
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400">❌</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isLoginMode ? 'Iniciando sesión...' : 'Creando cuenta...'}
                </div>
              ) : (
                isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta'
              )}
            </button>
          </div>
        </form>

        {/* Debug info (remover en producción) */}
        {import.meta.env.DEV && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <p><strong>Debug:</strong></p>
            <p>isLoading: {isLoading.toString()}</p>
            <p>isSubmitting: {isSubmitting.toString()}</p>
            <p>isAuthenticated: {isAuthenticated.toString()}</p>
            <p>API URL: {import.meta.env.VITE_API_URL}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;