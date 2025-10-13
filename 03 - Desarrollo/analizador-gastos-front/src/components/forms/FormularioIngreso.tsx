import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Calendar, Tag, FileText } from 'lucide-react';
import { ingresosService, categoriasService, type IngresoCreate, type Categoria, type Ingreso } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

interface FormularioIngresoProps {
  onClose: () => void;
  onIngresoCreado: () => void;
  ingreso?: Ingreso; // Prop opcional para edición
}

const FormularioIngreso: React.FC<FormularioIngresoProps> = ({ onClose, onIngresoCreado, ingreso }) => {
  const [loading, setLoading] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  // const [opcionesTipos, setOpcionesTipos] = useState<OpcionesTipos | null>(null);

  const { user } = useAuthStore();

  // Estados del formulario
  const [formData, setFormData] = useState<IngresoCreate>({
    descripcion: '',
    monto: undefined as any, // Cambiar de 0 a undefined para que el campo esté vacío
    fecha: new Date().toISOString().split('T')[0],
    fuente: 'manual', // Valor por defecto 'manual'
    tipo: 'salario', // Valor por defecto fijo
    recurrente: false, // Valor por defecto fijo
    frecuencia: 'unica', // Valor por defecto fijo
    id_categoria: undefined,
    notas: '',
    moneda: 'ARS' // Valor por defecto fijo
  });

  useEffect(() => {
    cargarDatos();
  }, [user]);

  // Nuevo useEffect para cargar datos del ingreso en modo edición
  useEffect(() => {
    if (ingreso) {
      setFormData({
        descripcion: ingreso.descripcion,
        monto: ingreso.monto,
        fecha: ingreso.fecha,
        fuente: ingreso.fuente || 'manual',
        tipo: ingreso.tipo || 'salario',
        recurrente: ingreso.recurrente || false,
        frecuencia: ingreso.frecuencia || 'unica',
        id_categoria: ingreso.id_categoria,
        notas: ingreso.notas || '',
        moneda: ingreso.moneda || 'ARS'
      });
    }
  }, [ingreso]);

  const cargarDatos = async () => {
    if (!user) return;
    
    setLoadingDatos(true);
    try {
      const categoriasData = await categoriasService.getCategorias();
      
      // Filtrar solo las categorías específicas para ingresos
      const categoriasIngresos = ['bonos', 'freelance', 'inversiones', 'regalos', 'otros', 'salario', 'ventas'];
      
      const categoriasFiltradas = categoriasData
        .filter(categoria => categoriasIngresos.includes(categoria.nombre.toLowerCase()));

      // Eliminar duplicados basándose en el nombre (case insensitive)
      const categoriasSinDuplicados = categoriasFiltradas.filter((categoria, index, array) => 
        index === array.findIndex(c => c.nombre.toLowerCase() === categoria.nombre.toLowerCase())
      );
      
      console.log('🔍 Debug - Todas las categorías para ingresos:', categoriasData.map(c => c.nombre));
      console.log('🔍 Debug - Categorías filtradas para ingresos:', categoriasFiltradas.map(c => c.nombre));
      console.log('🔍 Debug - Categorías sin duplicados para ingresos:', categoriasSinDuplicados.map(c => c.nombre));
      
      setCategorias(categoriasSinDuplicados);
      // setOpcionesTipos(tiposData);
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
    
    if (!formData.monto || formData.monto <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    if (!formData.id_categoria) {
      setError('La categoría es obligatoria');
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

      if (ingreso) {
        // Modo edición - actualizar ingreso existente
        await ingresosService.updateIngreso(ingreso.id_ingreso, datosEnvio);
      } else {
        // Modo creación - crear nuevo ingreso
        await ingresosService.createIngreso(datosEnvio);
      }
      
      onIngresoCreado();
    } catch (error: any) {
      console.error(`Error al ${ingreso ? 'actualizar' : 'crear'} ingreso:`, error);
      setError(
        error.response?.data?.detail || 
        `Ocurrió un error al ${ingreso ? 'actualizar' : 'crear'} el ingreso. Revisa los datos e inténtalo de nuevo.`
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
              {ingreso ? 'Editar Ingreso' : 'Nuevo Ingreso'}
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
          {/* Fecha y Monto */}
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

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto *
              </label>
              <DollarSign className="absolute left-3 top-9 h-4 w-4 text-gray-500" />
              <input
                type="text"
                value={formData.monto || ''}
                onChange={(e) => handleInputChange('monto', parseFloat(e.target.value.replace(',', '.')) || 0)}
                placeholder="0,00"
                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Descripción */}
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

          {/* Categoría */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría *
            </label>
            <Tag className="absolute left-3 top-9 h-4 w-4 text-gray-500" />
            <select
              value={formData.id_categoria || ''}
              onChange={(e) => handleInputChange('id_categoria', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Seleccionar categoría</option>
              {categorias
                .sort((a, b) => a.nombre.localeCompare(b.nombre)) // Ordenar alfabéticamente
                .map((categoria) => (
                <option key={categoria.id_categoria} value={categoria.id_categoria}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Notas */}
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
              className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{ingreso ? 'Actualizar Ingreso' : 'Crear Ingreso'}</span>
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