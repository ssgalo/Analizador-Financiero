import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  CreditCard, 
  TrendingUp, 
  Target, 
  BarChart3, 
  MessageSquare, 
  Upload, 
  Link as LinkIcon, 
  Settings, 
  LogOut,
  Info
} from 'lucide-react';
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
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/gastos', label: 'Gastos', icon: CreditCard },
    { path: '/ingresos', label: 'Ingresos', icon: TrendingUp },
    { path: '/chat', label: 'Chat IA', icon: MessageSquare },
    { path: '/importar', label: 'Importar', icon: Upload },
    { path: '/reportes', label: 'Reportes', icon: BarChart3 },
    { path: '/objetivos', label: 'Objetivos', icon: Target },
    { path: '/integraciones', label: 'Integraciones', icon: LinkIcon },
    { path: '/configuracion', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="bg-white shadow-lg h-screen w-64 fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        {/* Logo/Título de la aplicación */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-800">
            Analizador Financiero
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
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
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
                <IconComponent className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Botón Acerca de */}
        <div className="absolute bottom-20 left-6 right-6">
          <Link
            to="/acerca-de"
            className={`
              w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
              ${location.pathname === '/acerca-de'
                ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }
            `}
          >
            <Info className="w-5 h-5" />
            <span>Acerca de</span>
          </Link>
        </div>

        {/* Botón de logout */}
        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;