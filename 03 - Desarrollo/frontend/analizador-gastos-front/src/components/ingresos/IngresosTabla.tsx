import React, { useState } from 'react';
import { Edit2, Trash2, MoreHorizontal, Calendar, Tag, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import type { Ingreso } from '../../services/api';
import ModalEliminarIngreso from './ModalEliminarIngreso';

interface IngresosTablaProps {
  ingresos: Ingreso[];
  loading: boolean;
  onIngresoEliminado: () => void;
  onIngresoActualizado: () => void;
}

const IngresosTabla: React.FC<IngresosTablaProps> = ({ 
  ingresos, 
  loading, 
  onIngresoEliminado, 
  onIngresoActualizado 
}) => {
  const [ingresoAEliminar, setIngresoAEliminar] = useState<Ingreso | null>(null);
  const [menuAbierto, setMenuAbierto] = useState<number | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getEstadoBadge = (estado: string) => {
    const estados = {
      confirmado: { 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle,
        label: 'Confirmado'
      },
      pendiente: { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: Clock,
        label: 'Pendiente'
      },
      cancelado: { 
        color: 'bg-red-100 text-red-800', 
        icon: AlertCircle,
        label: 'Cancelado'
      }
    };

    const estadoInfo = estados[estado as keyof typeof estados] || estados.confirmado;
    const IconComponent = estadoInfo.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${estadoInfo.color}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {estadoInfo.label}
      </span>
    );
  };

  const getTipoBadge = (tipo: string) => {
    const tipos = {
      salario: { color: 'bg-blue-100 text-blue-800', emoji: '💼' },
      freelance: { color: 'bg-purple-100 text-purple-800', emoji: '💻' },
      inversion: { color: 'bg-orange-100 text-orange-800', emoji: '📈' },
      venta: { color: 'bg-green-100 text-green-800', emoji: '🛒' },
      regalo: { color: 'bg-pink-100 text-pink-800', emoji: '🎁' },
      otro: { color: 'bg-gray-100 text-gray-800', emoji: '📋' }
    };

    const tipoInfo = tipos[tipo as keyof typeof tipos] || tipos.otro;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tipoInfo.color}`}>
        <span className="mr-1">{tipoInfo.emoji}</span>
        {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
      </span>
    );
  };

  const handleEliminarClick = (ingreso: Ingreso) => {
    setIngresoAEliminar(ingreso);
    setMenuAbierto(null);
  };

  const toggleMenu = (ingresoId: number) => {
    setMenuAbierto(menuAbierto === ingresoId ? null : ingresoId);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (ingresos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            💰
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay ingresos
          </h3>
          <p className="text-gray-500">
            No se encontraron ingresos con los filtros aplicados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Ingresos ({ingresos.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Fecha</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Tag className="h-4 w-4" />
                    <span>Categoría</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ingresos.map((ingreso) => (
                <tr key={ingreso.id_ingreso} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(ingreso.fecha)}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {ingreso.descripcion}
                      </div>
                      {ingreso.fuente && (
                        <div className="text-sm text-gray-500">
                          {ingreso.fuente}
                        </div>
                      )}
                      {ingreso.notas && (
                        <div className="text-xs text-gray-400 mt-1">
                          {ingreso.notas}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ingreso.categoria ? (
                      <span 
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: ingreso.categoria.color || '#f3f4f6',
                          color: '#1f2937'
                        }}
                      >
                        {ingreso.categoria.icono && (
                          <span className="mr-1">{ingreso.categoria.icono}</span>
                        )}
                        {ingreso.categoria.nombre}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">Sin categoría</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTipoBadge(ingreso.tipo)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getEstadoBadge(ingreso.estado)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-lg font-semibold text-green-600">
                      {formatCurrency(ingreso.monto)}
                    </span>
                    {ingreso.moneda !== 'ARS' && (
                      <span className="text-xs text-gray-500 ml-1">
                        {ingreso.moneda}
                      </span>
                    )}
                    {ingreso.recurrente && (
                      <div className="text-xs text-blue-600">
                        🔄 {ingreso.frecuencia}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={() => toggleMenu(ingreso.id_ingreso)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      
                      {menuAbierto === ingreso.id_ingreso && (
                        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                // TODO: Implementar edición
                                console.log('Editar ingreso:', ingreso.id_ingreso);
                                setMenuAbierto(null);
                              }}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Editar
                            </button>
                            <button
                              onClick={() => handleEliminarClick(ingreso)}
                              className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de eliminación */}
      {ingresoAEliminar && (
        <ModalEliminarIngreso
          ingreso={ingresoAEliminar}
          onClose={() => setIngresoAEliminar(null)}
          onConfirm={() => {
            onIngresoEliminado();
            setIngresoAEliminar(null);
          }}
        />
      )}
    </>
  );
};

export default IngresosTabla;