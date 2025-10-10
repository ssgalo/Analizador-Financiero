import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Select } from "../ui/select"
import { DateInput } from "../ui/date-input"
import { MoneyInput } from "../ui/money-input"
import { Search, Filter, X } from "lucide-react"
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
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [montoDesde, setMontoDesde] = useState('');
  const [montoHasta, setMontoHasta] = useState('');

  const opcionesCategorias = [
    { value: '', label: 'Todas las categorías' },
    ...categorias.map(cat => ({ value: cat.id_categoria.toString(), label: cat.nombre }))
  ];

  const opcionesFuentes = [
    { value: '', label: 'Todas las fuentes' },
    { value: 'manual', label: 'Manual' },
    { value: 'PDF', label: 'PDF' },
    { value: 'imagen', label: 'Imagen' },
    { value: 'MercadoPago', label: 'MercadoPago' },
    { value: 'banco', label: 'Banco' }
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

  const hayFiltrosActivos = !!(
    filtros.busqueda || 
    filtros.fecha_desde || 
    filtros.fecha_hasta || 
    filtros.categoria || 
    filtros.fuente
  );

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Filtros y Búsqueda</CardTitle>
            <CardDescription>Encuentra gastos específicos usando los filtros</CardDescription>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.borderColor = '#94a3b8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
            className="transition-all duration-200"
          >
            <Filter className="w-4 h-4 mr-2" />
            {mostrarFiltros ? 'Ocultar' : 'Mostrar'} Filtros
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Búsqueda siempre visible */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por comercio, descripción o categoría..."
              value={filtros.busqueda || ''}
              onChange={(e) => onFiltrosChange({ busqueda: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filtros avanzados */}
        {mostrarFiltros && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DateInput
              label="Fecha desde"
              value={filtros.fecha_desde ? formatDateToLocal(filtros.fecha_desde) : ''}
              onChange={(value) => onFiltrosChange({ fecha_desde: value ? formatDateToISO(value) : undefined })}
              placeholder="dd/mm/aaaa"
            />
            <DateInput
              label="Fecha hasta"
              value={filtros.fecha_hasta ? formatDateToLocal(filtros.fecha_hasta) : ''}
              onChange={(value) => onFiltrosChange({ fecha_hasta: value ? formatDateToISO(value) : undefined })}
              placeholder="dd/mm/aaaa"
            />
            <Select
              label="Categoría"
              options={opcionesCategorias}
              value={filtros.categoria?.toString() || ''}
              onChange={(e) => onFiltrosChange({ categoria: e.target.value ? parseInt(e.target.value) : undefined })}
            />
            
            <MoneyInput
              label="Monto desde"
              value={montoDesde}
              onChange={handleMontoDesdeChange}
              placeholder="0,00"
            />
            <MoneyInput
              label="Monto hasta"
              value={montoHasta}
              onChange={handleMontoHastaChange}
              placeholder="0,00"
            />
            <Select
              label="Fuente"
              options={opcionesFuentes}
              value={filtros.fuente || ''}
              onChange={(e) => onFiltrosChange({ fuente: e.target.value })}
            />
          </div>
        )}

        {/* Botón limpiar filtros */}
        {hayFiltrosActivos && (
          <div className="mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={onLimpiarFiltros} 
              size="sm"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.borderColor = '#94a3b8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
              className="transition-all duration-200"
            >
              <X className="w-4 h-4 mr-2" />
              Limpiar Filtros
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
