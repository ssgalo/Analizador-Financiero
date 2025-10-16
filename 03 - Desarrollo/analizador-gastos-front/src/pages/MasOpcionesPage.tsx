import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Target, Info, TrendingUp, FileText, Sparkles } from 'lucide-react';

const MasOpcionesPage: React.FC = () => {
  const navigate = useNavigate();

  const opciones = [
    {
      id: 'reportes',
      title: 'Reportes',
      description: 'Visualiza gráficos y análisis detallados de tus finanzas',
      icon: BarChart3,
      path: '/reportes',
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
    },
    {
      id: 'objetivos',
      title: 'Objetivos Financieros',
      description: 'Define y monitorea tus metas de ahorro e inversión',
      icon: Target,
      path: '/objetivos',
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
    },
    {
      id: 'acerca-de',
      title: 'Acerca de',
      description: 'Información sobre la aplicación y el equipo de desarrollo',
      icon: Info,
      path: '/acerca-de',
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
    },
  ];

  const estadisticas = [
    {
      label: 'Herramientas Disponibles',
      value: '3',
      icon: Sparkles,
      color: 'text-blue-600',
    },
    {
      label: 'Funcionalidades',
      value: 'Premium',
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      label: 'Actualizaciones',
      value: 'Continuas',
      icon: FileText,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Más Opciones
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explora herramientas adicionales para optimizar tu gestión financiera
          </p>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {estadisticas.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.label}
                    </p>
                    <p className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </p>
                  </div>
                  <IconComponent className={`w-10 h-10 ${stat.color} opacity-70`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid de opciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {opciones.map((opcion) => {
            const IconComponent = opcion.icon;
            return (
              <button
                key={opcion.id}
                onClick={() => navigate(opcion.path)}
                className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${opcion.color} ${opcion.hoverColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                {/* Content */}
                <div className="relative p-8 text-left">
                  {/* Icon */}
                  <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 group-hover:bg-white transition-colors duration-300">
                    <IconComponent className={`w-8 h-8 bg-gradient-to-br ${opcion.color} bg-clip-text text-transparent group-hover:text-white transition-colors duration-300`} />
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-white mb-3 transition-colors duration-300">
                    {opcion.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-600 group-hover:text-white/90 leading-relaxed transition-colors duration-300">
                    {opcion.description}
                  </p>
                  
                  {/* Arrow indicator */}
                  <div className="mt-6 flex items-center text-sm font-semibold">
                    <span className={`bg-gradient-to-br ${opcion.color} bg-clip-text text-transparent group-hover:text-white transition-colors duration-300`}>
                      Explorar
                    </span>
                    <svg
                      className={`ml-2 w-5 h-5 bg-gradient-to-br ${opcion.color} bg-clip-text text-transparent group-hover:text-white transition-all duration-300 group-hover:translate-x-1`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-white rounded-lg shadow-md px-8 py-4 border border-gray-200">
            <p className="text-sm text-gray-600">
              💡 <span className="font-semibold">Tip:</span> Estas herramientas te ayudarán a tener un mejor control de tus finanzas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasOpcionesPage;
