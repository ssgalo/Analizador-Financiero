import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/gastos', label: 'Gastos', icon: '💰' },
    { path: '/ingresos', label: 'Ingresos', icon: '💵' },
    { path: '/objetivos', label: 'Objetivos', icon: '🎯' },
    { path: '/reportes', label: 'Reportes', icon: '📊' },
    { path: '/chat', label: 'Chat IA', icon: '🤖' },
    { path: '/importar', label: 'Importar', icon: '📁' },
    { path: '/integraciones', label: 'Integraciones', icon: '🔗' },
    { path: '/configuracion', label: 'Configuración', icon: '⚙️' },
  ];

  return (
    <aside className="bg-white shadow-lg h-screen w-64 fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        {/* Logo/Título de la aplicación */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            💰 Analizador Financiero
          </h1>
        </div>

        {/* Información del usuario */}
        {user && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.nombre}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  @{user.usuario}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Menú de navegación */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                ${location.pathname === item.path
                  ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Botón de logout */}
        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <span className="text-lg">🚪</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;