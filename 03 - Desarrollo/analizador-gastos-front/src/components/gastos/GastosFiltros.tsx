import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Select } from "../ui/select"
import { DateInput } from "../ui/date-input"
import { MoneyInput } from "../ui/money-input"
import { Search, X } from "lucide-react"
import type { Categoria } from "../../services/api"
import { formatDateToLocal, formatDateToISO, parseLocalNumber } from "../../utils/formatters"

interface FiltrosState {
  busqueda?: string
  fecha_desde?: string
  fecha_hasta?: string
  categoria?: number
  fuente?: string
  monto_desde?: number
  monto_hasta?: number
}

interface GastosFiltrosProps {
  filtros: FiltrosState
  categorias: Categoria[]
  onFiltrosChange: (filtros: Partial<FiltrosState>) => void
  onLimpiarFiltros: () => void
}

export function GastosFiltros({ 
  filtros, 
  categorias, 
  onFiltrosChange, 
  onLimpiarFiltros 
}: GastosFiltrosProps) {
  const [montoDesde, setMontoDesde] = useState('');
  const [montoHasta, setMontoHasta] = useState('');
  const [textoBusqueda, setTextoBusqueda] = useState('');
  
  // Estados locales para todos los filtros
  const [filtrosLocales, setFiltrosLocales] = useState<FiltrosState>({
    fecha_desde: '',
    fecha_hasta: '',
    categoria: undefined,
    fuente: ''
  });

  // Solo sincronizar cuando los filtros se vacían completamente (limpieza)
  useEffect(() => {
    const estaVacio = !filtros.fecha_desde && !filtros.fecha_hasta && 
                      !filtros.categoria && !filtros.fuente && 
                      !filtros.monto_desde && !filtros.monto_hasta && 
                      !filtros.busqueda;
    
    if (estaVacio) {
      setMontoDesde('');
      setMontoHasta('');
      setTextoBusqueda('');
      setFiltrosLocales({
        fecha_desde: '',
        fecha_hasta: '',
        categoria: undefined,
        fuente: ''
      });
    }
    // NO resetear los valores de monto si hay filtros activos
  }, [filtros]);

  const opcionesCategorias = [
    { value: '', label: 'Todas las categorías' },
    ...categorias.map(cat => ({ value: cat.id_categoria.toString(), label: cat.nombre }))
  ];

  const opcionesFuentes = [
    { value: '', label: 'Todas las fuentes' },
    { value: 'manual', label: 'Manual' },
    { value: 'PDF', label: 'PDF' },
    { value: 'imagen', label: 'Imagen' },
    { value: 'MercadoPago', label: 'MercadoPago' }
  ];

  const handleMontoDesdeChange = (value: string) => {
    setMontoDesde(value);
    // No aplicar filtros inmediatamente
  };

  const handleMontoHastaChange = (value: string) => {
    setMontoHasta(value);
    // No aplicar filtros inmediatamente
  };

  const aplicarFiltros = () => {
    const filtrosParaAplicar: Partial<FiltrosState> = {
      ...filtrosLocales,
      monto_desde: montoDesde ? parseLocalNumber(montoDesde) : undefined,
      monto_hasta: montoHasta ? parseLocalNumber(montoHasta) : undefined,
      busqueda: textoBusqueda
    };
    onFiltrosChange(filtrosParaAplicar);
  };

  const handleFiltroLocalChange = (campo: keyof FiltrosState, valor: any) => {
    setFiltrosLocales(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const realizarBusqueda = () => {
    aplicarFiltros();
  };

  const limpiarBusqueda = () => {
    setTextoBusqueda('');
    // Aplicar filtros sin búsqueda
    const filtrosParaAplicar: Partial<FiltrosState> = {
      ...filtrosLocales,
      monto_desde: montoDesde ? parseLocalNumber(montoDesde) : undefined,
      monto_hasta: montoHasta ? parseLocalNumber(montoHasta) : undefined,
      busqueda: ''
    };
    onFiltrosChange(filtrosParaAplicar);
  };

  const manejarEnterBusqueda = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      realizarBusqueda();
    }
  };

  const limpiarTodosLosFiltros = () => {
    // Limpiar estados locales
    setMontoDesde('');
    setMontoHasta('');
    setTextoBusqueda('');
    setFiltrosLocales({
      fecha_desde: '',
      fecha_hasta: '',
      categoria: undefined,
      fuente: ''
    });
    // Limpiar filtros aplicados
    onLimpiarFiltros();
  };

  const hayFiltrosActivos = !!(
    filtros.busqueda || 
    filtros.fecha_desde || 
    filtros.fecha_hasta || 
    filtros.categoria || 
    filtros.fuente ||
    filtros.monto_desde ||
    filtros.monto_hasta
  );

  return (
    <div className="p-4 space-y-4">
      {/* Barra de búsqueda separada arriba */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Buscar gastos</label>
        <div className="relative max-w-lg flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por comercio, descripción o categoría..."
              value={textoBusqueda}
              onChange={(e) => setTextoBusqueda(e.target.value)}
              onKeyDown={manejarEnterBusqueda}
              className="pl-10 pr-10 h-10 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
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
        {filtros.busqueda && (
          <p className="text-sm text-teal-600 mt-1">
            Buscando: "{filtros.busqueda}" 
            <button 
              onClick={() => onFiltrosChange({ busqueda: '' })}
              className="ml-2 text-teal-600 hover:text-teal-800 underline"
            >
              Limpiar
            </button>
          </p>
        )}
      </div>

      {/* Filtros en fila compacta */}
      <div className="border-t pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">Filtros avanzados</label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 items-end">
        {/* Fecha desde */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Desde</label>
          <DateInput
            value={filtrosLocales.fecha_desde ? formatDateToLocal(filtrosLocales.fecha_desde) : ''}
            onChange={(value) => handleFiltroLocalChange('fecha_desde', value ? formatDateToISO(value) : '')}
            placeholder="dd/mm/aaaa"
            className="h-9 text-sm"
          />
        </div>

        {/* Fecha hasta */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Hasta</label>
          <DateInput
            value={filtrosLocales.fecha_hasta ? formatDateToLocal(filtrosLocales.fecha_hasta) : ''}
            onChange={(value) => handleFiltroLocalChange('fecha_hasta', value ? formatDateToISO(value) : '')}
            placeholder="dd/mm/aaaa"
            className="h-9 text-sm"
          />
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
          <Select
            options={opcionesCategorias}
            value={filtrosLocales.categoria?.toString() || ''}
            onChange={(e) => handleFiltroLocalChange('categoria', e.target.value ? parseInt(e.target.value) : undefined)}
            className="h-9 text-sm"
          />
        </div>

        {/* Monto desde */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Monto desde</label>
          <MoneyInput
            value={montoDesde}
            onChange={handleMontoDesdeChange}
            placeholder="0,00"
            className="h-9 text-sm"
          />
        </div>

        {/* Monto hasta */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Monto hasta</label>
          <MoneyInput
            value={montoHasta}
            onChange={handleMontoHastaChange}
            placeholder="0,00"
            className="h-9 text-sm"
          />
        </div>

        {/* Fuente */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Fuente</label>
          <Select
            options={opcionesFuentes}
            value={filtrosLocales.fuente || ''}
            onChange={(e) => handleFiltroLocalChange('fuente', e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        {/* Botones Aplicar y Limpiar Filtros */}
        <div className="flex gap-2">
          <Button 
            onClick={aplicarFiltros}
            className="h-9 px-4 bg-teal-600 hover:bg-teal-700 text-white text-sm"
            title="Aplicar todos los filtros"
          >
            Aplicar Filtros
          </Button>
          
          {hayFiltrosActivos && (
            <Button 
              variant="outline" 
              onClick={limpiarTodosLosFiltros} 
              className="h-9 px-3 text-sm"
              title="Limpiar todos los filtros"
            >
              <X className="w-3 h-3 mr-1" />
              Limpiar Filtros
            </Button>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
