import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  CreditCard, 
  TrendingUp, 
  MessageSquare, 
  Upload, 
  Settings, 
  LogOut,
  FileText,
  Target,
  Info
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import logoApp from '../../assets/logoAPP.png';

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
    { path: '/reportes', label: 'Reportes', icon: FileText },
    { path: '/objetivos', label: 'Objetivos', icon: Target },
    { path: '/acerca-de', label: 'Acerca de', icon: Info },
  ];

  return (
    <aside className="bg-white shadow-lg h-screen w-64 fixed left-0 top-0 flex flex-col">
      {/* Header con logo y usuario - no scrollea */}
      <div className="flex-shrink-0 p-6">
        {/* Logo/Título de la aplicación */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <img 
              src={logoApp} 
              alt="Logo Analizador Financiero" 
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-xl font-bold text-gray-800">
              Analizador Financiero
            </h1>
          </div>
        </div>

        {/* Información del usuario */}
        {user && (
          <div 
            className="mb-6 p-4 bg-gray-50 rounded-lg"
            data-testid="user-info-sidebar"
            aria-label="Información del usuario actual"
          >
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold"
                aria-label={`Avatar de ${user.nombre}`}
              >
                {user.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p 
                  className="text-sm font-medium text-gray-900 truncate"
                  data-testid="user-nombre"
                >
                  {user.nombre}
                </p>
                <p 
                  className="text-xs text-gray-500 truncate"
                  data-testid="user-username"
                >
                  @{user.usuario}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Menú de navegación - área con scroll */}
      <nav className="flex-1 overflow-y-auto px-6 space-y-2">
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

      {/* Footer con botones fijos - no scrollea */}
      <div className="flex-shrink-0 p-6 space-y-2 border-t border-gray-200">
        {/* Botón Configuración */}
        <Link
          to="/configuracion"
          className={`
            w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
            ${location.pathname === '/configuracion'
              ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }
          `}
        >
          <Settings className="w-5 h-5" />
          <span>Configuración</span>
        </Link>

        {/* Botón de logout */}
        <button
          onClick={handleLogout}
          data-testid="logout-button"
          aria-label="Cerrar sesión y salir de la aplicación"
          className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" aria-hidden="true" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;