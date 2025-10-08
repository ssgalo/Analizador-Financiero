import React, { useState, useEffect } from 'react';
import { X, Search, Calendar, Tag, AlertCircle } from 'lucide-react';
import { categoriasService, ingresosService, type Categoria, type OpcionesTipos } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

interface IngresosFiltrosProps {
  onFiltrosChange: (filtros: any) => void;
  filtrosActivos: any;
}

const IngresosFiltros: React.FC<IngresosFiltrosProps> = ({ onFiltrosChange, filtrosActivos }) => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [opcionesTipos, setOpcionesTipos] = useState<OpcionesTipos | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Estados del formulario
  const [filtros, setFiltros] = useState({
    categoria_id: filtrosActivos.categoria_id || '',
    tipo: filtrosActivos.tipo || '',
    estado: filtrosActivos.estado || '',
    fecha_desde: filtrosActivos.fecha_desde || '',
    fecha_hasta: filtrosActivos.fecha_hasta || '',
    monto_min: filtrosActivos.monto_min || '',
    monto_max: filtrosActivos.monto_max || '',
    descripcion: filtrosActivos.descripcion || ''
  });

  const { user } = useAuthStore();

  useEffect(() => {
    cargarDatos();
  }, [user]);

  const cargarDatos = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [categoriasData, tiposData] = await Promise.all([
        categoriasService.getCategoriasUsuario(user.id_usuario),
        ingresosService.getOpcionesTipos()
      ]);
      
      setCategorias(categoriasData);
      setOpcionesTipos(tiposData);
    } catch (error) {
      console.error('Error al cargar datos de filtros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    const nuevosFiltros = { ...filtros, [field]: value };
    setFiltros(nuevosFiltros);
    
    // Filtrar valores vacíos antes de enviar
    const filtrosLimpios = Object.fromEntries(
      Object.entries(nuevosFiltros).filter(([_, v]) => v !== '')
    );
    
    onFiltrosChange(filtrosLimpios);
  };

  const limpiarFiltros = () => {
    const filtrosVacios = {
      categoria_id: '',
      tipo: '',
      estado: '',
      fecha_desde: '',
      fecha_hasta: '',
      monto_min: '',
      monto_max: '',
      descripcion: ''
    };
    setFiltros(filtrosVacios);
    onFiltrosChange({});
  };

  const contarFiltrosActivos = () => {
    return Object.values(filtros).filter(valor => valor !== '').length;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Search className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Filtros de Búsqueda
          </h3>
          {contarFiltrosActivos() > 0 && (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
              {contarFiltrosActivos()} activo{contarFiltrosActivos() !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={limpiarFiltros}
          className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="h-4 w-4" />
          <span>Limpiar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Tag className="h-4 w-4 inline mr-1" />
            Categoría
          </label>
          <select
            value={filtros.categoria_id}
            onChange={(e) => handleInputChange('categoria_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((categoria) => (
              <option key={categoria.id_categoria} value={categoria.id_categoria}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Ingreso
          </label>
          <select
            value={filtros.tipo}
            onChange={(e) => handleInputChange('tipo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Todos los tipos</option>
            {opcionesTipos?.tipos.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <AlertCircle className="h-4 w-4 inline mr-1" />
            Estado
          </label>
          <select
            value={filtros.estado}
            onChange={(e) => handleInputChange('estado', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Todos los estados</option>
            {opcionesTipos?.estados.map((estado) => (
              <option key={estado.value} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </select>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <input
            type="text"
            value={filtros.descripcion}
            onChange={(e) => handleInputChange('descripcion', e.target.value)}
            placeholder="Buscar en descripción..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Fecha desde */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4 inline mr-1" />
            Fecha desde
          </label>
          <input
            type="date"
            value={filtros.fecha_desde}
            onChange={(e) => handleInputChange('fecha_desde', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Fecha hasta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4 inline mr-1" />
            Fecha hasta
          </label>
          <input
            type="date"
            value={filtros.fecha_hasta}
            onChange={(e) => handleInputChange('fecha_hasta', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Monto mínimo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monto mínimo
          </label>
          <input
            type="number"
            value={filtros.monto_min}
            onChange={(e) => handleInputChange('monto_min', e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Monto máximo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monto máximo
          </label>
          <input
            type="number"
            value={filtros.monto_max}
            onChange={(e) => handleInputChange('monto_max', e.target.value)}
            placeholder="Sin límite"
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Información de resultados */}
      {contarFiltrosActivos() > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            Se están aplicando {contarFiltrosActivos()} filtro{contarFiltrosActivos() !== 1 ? 's' : ''}.
            Los resultados se actualizan automáticamente.
          </p>
        </div>
      )}
    </div>
  );
};

export default IngresosFiltros;