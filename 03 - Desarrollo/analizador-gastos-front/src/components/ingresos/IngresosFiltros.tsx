import React, { useState, useEffect } from 'react';
import { X, Search, Calendar, Tag, DollarSign } from 'lucide-react';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { categoriasService, type Categoria } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

interface IngresosFiltrosProps {
  onFiltrosChange: (filtros: any) => void;
  filtrosActivos: any;
}

const IngresosFiltros: React.FC<IngresosFiltrosProps> = ({ onFiltrosChange, filtrosActivos }) => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [textoBusqueda, setTextoBusqueda] = useState(filtrosActivos.busqueda || '');
  
  // Estados locales para todos los filtros (no se aplican hasta presionar "Aplicar filtros")
  const [categoriaLocal, setCategoriaLocal] = useState(filtrosActivos.categoria_id || '');
  const [fechaDesdeLocal, setFechaDesdeLocal] = useState(filtrosActivos.fecha_desde || '');
  const [fechaHastaLocal, setFechaHastaLocal] = useState(filtrosActivos.fecha_hasta || '');
  const [montoMinLocal, setMontoMinLocal] = useState(filtrosActivos.monto_min || '');
  const [montoMaxLocal, setMontoMaxLocal] = useState(filtrosActivos.monto_max || '');

  const { user } = useAuthStore();

  useEffect(() => {
    cargarDatos();
  }, [user]);

  // Sincronizar el estado local con los filtros activos del padre
  useEffect(() => {
    // Sincronizar siempre los valores de los filtros activos con los campos locales
    setCategoriaLocal(filtrosActivos.categoria?.toString() || '');
    setFechaDesdeLocal(filtrosActivos.fecha_desde || '');
    setFechaHastaLocal(filtrosActivos.fecha_hasta || '');
    setMontoMinLocal(filtrosActivos.monto_desde?.toString() || '');
    setMontoMaxLocal(filtrosActivos.monto_hasta?.toString() || '');
    setTextoBusqueda(filtrosActivos.busqueda || '');
  }, [filtrosActivos]);

  const cargarDatos = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const categoriasData = await categoriasService.getCategoriasUsuario(user.id_usuario);
      
      // Lista específica de categorías permitidas para ingresos
      const categoriasIngresos = ['bonos', 'freelance', 'inversiones', 'regalos', 'otros', 'salario', 'ventas'];
      
      // Filtrar solo las categorías de ingresos
      const categoriasFiltradas = categoriasData
        .filter(categoria => categoriasIngresos.includes(categoria.nombre.toLowerCase()));
      
      // Eliminar duplicados basándose en el nombre (case insensitive)
      const categoriasUnicas = categoriasFiltradas.filter((categoria, index, array) => 
        index === array.findIndex(c => c.nombre.toLowerCase() === categoria.nombre.toLowerCase())
      );
      
      // Ordenar alfabéticamente
      const categoriasOrdenadas = categoriasUnicas.sort((a, b) => a.nombre.localeCompare(b.nombre));
      
      setCategorias(categoriasOrdenadas);
    } catch (error) {
      console.error('Error al cargar datos de filtros:', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    // Crear objeto de filtros para enviar al hook usando estados locales
    const filtrosParaHook: any = {};
    
    // Mapear categoria_id a categoria para que el hook lo entienda
    if (categoriaLocal) {
      filtrosParaHook.categoria = parseInt(categoriaLocal);
    }
    
    // Mapear los otros campos
    if (fechaDesdeLocal) filtrosParaHook.fecha_desde = fechaDesdeLocal;
    if (fechaHastaLocal) filtrosParaHook.fecha_hasta = fechaHastaLocal;
    if (montoMinLocal) filtrosParaHook.monto_desde = parseFloat(montoMinLocal);
    if (montoMaxLocal) filtrosParaHook.monto_hasta = parseFloat(montoMaxLocal);
    if (textoBusqueda) filtrosParaHook.busqueda = textoBusqueda;
    
    onFiltrosChange(filtrosParaHook);
  };

  const limpiarTodosFiltros = () => {
    // Limpiar estados locales
    setCategoriaLocal('');
    setFechaDesdeLocal('');
    setFechaHastaLocal('');
    setMontoMinLocal('');
    setMontoMaxLocal('');
    setTextoBusqueda('');
    
    // Limpiar todos los filtros en el hook también
    onFiltrosChange({
      categoria: undefined,
      fecha_desde: undefined,
      fecha_hasta: undefined,
      monto_desde: undefined,
      monto_hasta: undefined,
      busqueda: ''
    });
  };

  const handleInputChange = (field: string, value: string) => {
    // Actualizar el estado local correspondiente
    switch (field) {
      case 'categoria_id':
        setCategoriaLocal(value);
        break;
      case 'fecha_desde':
        setFechaDesdeLocal(value);
        break;
      case 'fecha_hasta':
        setFechaHastaLocal(value);
        break;
      case 'monto_min':
        setMontoMinLocal(value);
        break;
      case 'monto_max':
        setMontoMaxLocal(value);
        break;
    }
    
    // NO aplicar filtros automáticamente - el usuario debe presionar "Aplicar filtros"
  };

  const handleMontoMinChange = (value: string) => {
    setMontoMinLocal(value);
  };

  const handleMontoMaxChange = (value: string) => {
    setMontoMaxLocal(value);
  };

  const hayFiltrosActivos = () => {
    return !!(
      filtrosActivos.categoria ||
      filtrosActivos.fecha_desde ||
      filtrosActivos.fecha_hasta ||
      filtrosActivos.monto_desde ||
      filtrosActivos.monto_hasta ||
      filtrosActivos.busqueda
    );
  };

  const realizarBusqueda = () => {
    aplicarFiltros(); // Usar aplicarFiltros en lugar de onFiltrosChange directo
  };

  const limpiarBusqueda = () => {
    setTextoBusqueda('');
    aplicarFiltros(); // Aplicar filtros sin búsqueda
  };

  const manejarEnterBusqueda = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      realizarBusqueda();
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Barra de búsqueda separada arriba */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Buscar ingresos</label>
        <div className="relative max-w-lg flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por comercio, descripción o categoría..."
              value={textoBusqueda}
              onChange={(e) => setTextoBusqueda(e.target.value)}
              onKeyDown={manejarEnterBusqueda}
              className="pl-10 pr-10 h-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
            />
            {textoBusqueda && (
              <button
                onClick={limpiarBusqueda}
                className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                title="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            onClick={realizarBusqueda}
            className="h-10 px-4 bg-teal-600 hover:bg-teal-700 text-white"
            title="Buscar"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        {filtrosActivos.busqueda && (
          <p className="text-sm text-green-600 mt-1">
            Buscando: "{filtrosActivos.busqueda}" 
            <button 
              onClick={() => onFiltrosChange({ busqueda: '' })}
              className="ml-2 text-green-600 hover:text-green-800 underline"
            >
              limpiar
            </button>
          </p>
        )}
      </div>

      {/* Filtros en una sola fila */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Filtros avanzados</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Tag className="h-4 w-4 inline mr-1" />
            Categoría
          </label>
          <select
            value={categoriaLocal}
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

        {/* Fecha desde */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4 inline mr-1" />
            Fecha desde
          </label>
          <input
            type="date"
            value={fechaDesdeLocal}
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
            value={fechaHastaLocal}
            onChange={(e) => handleInputChange('fecha_hasta', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Monto mínimo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monto mínimo
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="number"
              value={montoMinLocal}
              onChange={(e) => handleMontoMinChange(e.target.value)}
              placeholder="0,00"
              min="0"
              step="0.01"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        {/* Monto máximo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monto máximo
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="number"
              value={montoMaxLocal}
              onChange={(e) => handleMontoMaxChange(e.target.value)}
              placeholder="Sin límite"
              min="0"
              step="0.01"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 mt-4">
          <Button
            onClick={aplicarFiltros}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            Aplicar filtros
          </Button>
          {hayFiltrosActivos() && (
            <Button
              onClick={limpiarTodosFiltros}
              variant="outline"
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IngresosFiltros;