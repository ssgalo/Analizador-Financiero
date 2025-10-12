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

  // Sincronizar estados locales cuando se limpien los filtros
  useEffect(() => {
    if (!filtros.monto_desde) {
      setMontoDesde('');
    }
    if (!filtros.monto_hasta) {
      setMontoHasta('');
    }
    if (!filtros.busqueda) {
      setTextoBusqueda('');
    }
  }, [filtros.monto_desde, filtros.monto_hasta, filtros.busqueda]);

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
    const numValue = value ? parseLocalNumber(value) : undefined;
    onFiltrosChange({ monto_desde: numValue });
  };

  const handleMontoHastaChange = (value: string) => {
    setMontoHasta(value);
    const numValue = value ? parseLocalNumber(value) : undefined;
    onFiltrosChange({ monto_hasta: numValue });
  };

  const realizarBusqueda = () => {
    onFiltrosChange({ busqueda: textoBusqueda });
  };

  const limpiarBusqueda = () => {
    setTextoBusqueda('');
    onFiltrosChange({ busqueda: '' });
  };

  const manejarEnterBusqueda = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      realizarBusqueda();
    }
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
            value={filtros.fecha_desde ? formatDateToLocal(filtros.fecha_desde) : ''}
            onChange={(value) => onFiltrosChange({ fecha_desde: value ? formatDateToISO(value) : undefined })}
            placeholder="dd/mm/aaaa"
            className="h-9 text-sm"
          />
        </div>

        {/* Fecha hasta */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Hasta</label>
          <DateInput
            value={filtros.fecha_hasta ? formatDateToLocal(filtros.fecha_hasta) : ''}
            onChange={(value) => onFiltrosChange({ fecha_hasta: value ? formatDateToISO(value) : undefined })}
            placeholder="dd/mm/aaaa"
            className="h-9 text-sm"
          />
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
          <Select
            options={opcionesCategorias}
            value={filtros.categoria?.toString() || ''}
            onChange={(e) => onFiltrosChange({ categoria: e.target.value ? parseInt(e.target.value) : undefined })}
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
            value={filtros.fuente || ''}
            onChange={(e) => onFiltrosChange({ fuente: e.target.value })}
            className="h-9 text-sm"
          />
        </div>
        </div>
      </div>

      {/* Botón limpiar filtros */}
      {hayFiltrosActivos && (
        <div className="flex justify-start">
          <Button 
            variant="outline" 
            onClick={onLimpiarFiltros} 
            size="sm"
            className="h-8 px-3 text-xs"
            title="Limpiar todos los filtros"
          >
            <X className="w-3 h-3 mr-1" />
            Limpiar Filtros
          </Button>
        </div>
      )}
    </div>
  );
}
