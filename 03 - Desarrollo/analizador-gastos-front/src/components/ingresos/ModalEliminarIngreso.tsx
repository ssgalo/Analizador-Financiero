import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { ingresosService, type Ingreso } from '../../services/api';

interface ModalEliminarIngresoProps {
  ingreso: Ingreso;
  onClose: () => void;
  onConfirm: () => void;
}

const ModalEliminarIngreso: React.FC<ModalEliminarIngresoProps> = ({
  ingreso,
  onClose,
  onConfirm
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleEliminar = async () => {
    setLoading(true);
    setError(null);

    try {
      await ingresosService.deleteIngreso(ingreso.id_ingreso);
      onConfirm();
    } catch (error: any) {
      console.error('Error al eliminar ingreso:', error);
      setError(
        error.response?.data?.detail || 
        'Ocurrió un error al eliminar el ingreso. Inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Eliminar Ingreso
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro de que deseas eliminar este ingreso? Esta acción no se puede deshacer.
          </p>

          {/* Detalles del ingreso */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Descripción:</span>
              <span className="text-sm text-gray-900">{ingreso.descripcion}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Monto:</span>
              <span className="text-sm font-semibold text-green-600">
                {formatCurrency(ingreso.monto)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Fecha:</span>
              <span className="text-sm text-gray-900">{formatDate(ingreso.fecha)}</span>
            </div>
            
            {ingreso.fuente && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Fuente:</span>
                <span className="text-sm text-gray-900">{ingreso.fuente}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Tipo:</span>
              <span className="text-sm text-gray-900 capitalize">
                {ingreso.tipo.replace('_', ' ')}
              </span>
            </div>
            
            {ingreso.categoria && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Categoría:</span>
                <span className="text-sm text-gray-900">{ingreso.categoria.nombre}</span>
              </div>
            )}

            {ingreso.recurrente && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Recurrencia:</span>
                <span className="text-sm text-gray-900">
                  {ingreso.frecuencia.charAt(0).toUpperCase() + ingreso.frecuencia.slice(1)}
                </span>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleEliminar}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Eliminando...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Eliminar Ingreso</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEliminarIngreso;