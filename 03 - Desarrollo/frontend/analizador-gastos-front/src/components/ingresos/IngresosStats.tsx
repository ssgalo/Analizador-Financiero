import React from 'react';
import { TrendingUp, DollarSign, BarChart3, Calculator } from 'lucide-react';
import type { IngresoStats } from '../../services/api';

interface IngresosStatsProps {
  estadisticas: IngresoStats;
  loading: boolean;
}

const IngresosStats: React.FC<IngresosStatsProps> = ({ estadisticas, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      title: 'Total Ingresos',
      value: formatCurrency(estadisticas.total_ingresos),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      subtitle: 'Este mes'
    },
    {
      title: 'Cantidad de Ingresos', 
      value: estadisticas.cantidad_ingresos.toString(),
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      subtitle: 'Transacciones'
    },
    {
      title: 'Promedio por Ingreso',
      value: formatCurrency(estadisticas.promedio_ingreso),
      icon: Calculator,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      subtitle: 'Por transacción'
    },
    {
      title: 'Crecimiento',
      value: '+12.5%',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      subtitle: 'vs mes anterior'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.subtitle}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <IconComponent className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Distribución por tipo */}
      {Object.keys(estadisticas.ingresos_por_tipo).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribución por Tipo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(estadisticas.ingresos_por_tipo).map(([tipo, datos]) => (
              <div key={tipo} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {tipo.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {datos.cantidad} {datos.cantidad === 1 ? 'ingreso' : 'ingresos'}
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(datos.total)}
                </p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ 
                      width: `${(datos.total / estadisticas.total_ingresos) * 100}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((datos.total / estadisticas.total_ingresos) * 100).toFixed(1)}% del total
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Distribución por categoría */}
      {Object.keys(estadisticas.ingresos_por_categoria).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribución por Categoría
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(estadisticas.ingresos_por_categoria).map(([categoria, datos]) => (
              <div key={categoria} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {categoria}
                  </span>
                  <span className="text-xs text-gray-500">
                    {datos.cantidad} {datos.cantidad === 1 ? 'ingreso' : 'ingresos'}
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(datos.total)}
                </p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ 
                      width: `${(datos.total / estadisticas.total_ingresos) * 100}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((datos.total / estadisticas.total_ingresos) * 100).toFixed(1)}% del total
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IngresosStats;