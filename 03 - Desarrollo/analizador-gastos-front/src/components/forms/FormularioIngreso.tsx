import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Calendar, Tag, FileText } from 'lucide-react';
import { ingresosService, categoriasService, type IngresoCreate, type Categoria, type OpcionesTipos } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

interface FormularioIngresoProps {
  onClose: () => void;
  onIngresoCreado: () => void;
}

const FormularioIngreso: React.FC<FormularioIngresoProps> = ({ onClose, onIngresoCreado }) => {
  const [loading, setLoading] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [opcionesTipos, setOpcionesTipos] = useState<OpcionesTipos | null>(null);

  const { user } = useAuthStore();

  // Estados del formulario
  const [formData, setFormData] = useState<IngresoCreate>({
    descripcion: '',
    monto: 0,
    fecha: new Date().toISOString().split('T')[0],
    fuente: '',
    tipo: 'salario',
    recurrente: false,
    frecuencia: 'unica',
    id_categoria: undefined,
    notas: '',
    moneda: 'ARS'
  });

  useEffect(() => {
    cargarDatos();
  }, [user]);

  const cargarDatos = async () => {
    if (!user) return;
    
    setLoadingDatos(true);
    try {
      const [categoriasData, tiposData] = await Promise.all([
        categoriasService.getCategoriasUsuario(user.id_usuario),
        ingresosService.getOpcionesTipos()
      ]);
      
      setCategorias(categoriasData);
      setOpcionesTipos(tiposData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos del formulario');
    } finally {
      setLoadingDatos(false);
    }
  };

  const handleInputChange = (field: keyof IngresoCreate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error al cambiar datos
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || loading) return;

    // Validaciones
    if (!formData.descripcion.trim()) {
      setError('La descripción es obligatoria');
      return;
    }
    
    if (formData.monto <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Preparar datos para envío
      const datosEnvio = {
        ...formData,
        descripcion: formData.descripcion.trim(),
        fuente: formData.fuente?.trim() || undefined,
        notas: formData.notas?.trim() || undefined,
        id_categoria: formData.id_categoria || undefined
      };

      await ingresosService.createIngreso(datosEnvio);
      onIngresoCreado();
    } catch (error: any) {
      console.error('Error al crear ingreso:', error);
      setError(
        error.response?.data?.detail || 
        'Ocurrió un error al crear el ingreso. Revisa los datos e inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingDatos) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Nuevo Ingreso
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Descripción y Monto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 inline mr-1" />
                Descripción *
              </label>
              <input
                type="text"
                value={formData.descripcion}
                onChange={(e) => handleInputChange('descripcion', e.target.value)}
                placeholder="ej: Sueldo Octubre 2025"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Monto *
              </label>
              <input
                type="number"
                value={formData.monto}
                onChange={(e) => handleInputChange('monto', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Fecha y Fuente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Fecha *
              </label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => handleInputChange('fecha', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuente
              </label>
              <input
                type="text"
                value={formData.fuente}
                onChange={(e) => handleInputChange('fuente', e.target.value)}
                placeholder="ej: Empresa ABC SA"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tipo y Categoría */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Ingreso *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => handleInputChange('tipo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                {opcionesTipos?.tipos.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4 inline mr-1" />
                Categoría
              </label>
              <select
                value={formData.id_categoria || ''}
                onChange={(e) => handleInputChange('id_categoria', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Sin categoría</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id_categoria} value={categoria.id_categoria}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Recurrencia */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="recurrente"
                checked={formData.recurrente}
                onChange={(e) => handleInputChange('recurrente', e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="recurrente" className="ml-2 text-sm text-gray-700">
                Es un ingreso recurrente
              </label>
            </div>

            {formData.recurrente && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frecuencia
                </label>
                <select
                  value={formData.frecuencia}
                  onChange={(e) => handleInputChange('frecuencia', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {opcionesTipos?.frecuencias.map((frecuencia) => (
                    <option key={frecuencia.value} value={frecuencia.value}>
                      {frecuencia.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Moneda y Notas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moneda
              </label>
              <select
                value={formData.moneda}
                onChange={(e) => handleInputChange('moneda', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="ARS">ARS - Peso Argentino</option>
                <option value="USD">USD - Dólar Estadounidense</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => handleInputChange('notas', e.target.value)}
                placeholder="Observaciones adicionales..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Crear Ingreso</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioIngreso;