import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Edit, Trash2, Loader2, Coffee, Car, Home as HomeIcon, Smartphone, ShoppingCart, Heart, Book, Wifi, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import type { Gasto, Categoria } from "../../services/api"
import { formatCurrency, formatDisplayDate } from "../../utils/formatters"
import { GastosFiltros } from "./GastosFiltros"
import { useState, useMemo } from "react"

interface GastosTablaProps {
  gastos: Gasto[]
  isLoading: boolean
  onEditar: (gasto: Gasto) => void
  onEliminar: (gasto: Gasto) => void
  // Props para filtros
  categorias: Categoria[]
  filtros: any
  onFiltrosChange: (filtros: any) => void
  onLimpiarFiltros: () => void
}

// Mapeo de iconos por categoría
const iconMap: { [key: string]: any } = {
  'Alimentación': Coffee,
  'Transporte': Car,
  'Vivienda': HomeIcon,
  'Entretenimiento': Smartphone,
  'Compras': ShoppingCart,
  'Salud': Heart,
  'Salud y cuidado personal': Heart,
  'Educación': Book,
  'Servicios': Wifi
};

// Mapeo de colores por fuente
const fuenteColors: { [key: string]: string } = {
  'manual': 'bg-blue-100 text-blue-800',
  'PDF': 'bg-green-100 text-green-800',
  'imagen': 'bg-purple-100 text-purple-800',
  'MercadoPago': 'bg-yellow-100 text-yellow-800',
  'banco': 'bg-gray-100 text-gray-800'
};

type SortField = 'fecha' | 'comercio' | 'descripcion' | 'categoria' | 'fuente' | 'monto';
type SortOrder = 'asc' | 'desc';

export function GastosTabla({ 
  gastos, 
  isLoading, 
  onEditar, 
  onEliminar,
  categorias,
  filtros,
  onFiltrosChange,
  onLimpiarFiltros 
}: GastosTablaProps) {
  // Estados para ordenación
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Función para ordenar gastos
  const sortedGastos = useMemo(() => {
    const sorted = [...gastos].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'fecha':
          aValue = new Date(a.fecha).getTime();
          bValue = new Date(b.fecha).getTime();
          break;
        case 'comercio':
          aValue = a.comercio?.toLowerCase() || '';
          bValue = b.comercio?.toLowerCase() || '';
          break;
        case 'descripcion':
          aValue = a.descripcion?.toLowerCase() || '';
          bValue = b.descripcion?.toLowerCase() || '';
          break;
        case 'categoria':
          aValue = a.categoria?.nombre?.toLowerCase() || '';
          bValue = b.categoria?.nombre?.toLowerCase() || '';
          break;
        case 'fuente':
          aValue = a.fuente?.toLowerCase() || '';
          bValue = b.fuente?.toLowerCase() || '';
          break;
        case 'monto':
          aValue = a.monto;
          bValue = b.monto;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [gastos, sortField, sortOrder]);

  // Calcular gastos para la página actual
  const paginatedGastos = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedGastos.slice(startIndex, endIndex);
  }, [sortedGastos, currentPage, pageSize]);

  // Calcular total de páginas
  const totalPages = Math.ceil(sortedGastos.length / pageSize);

  // Función para cambiar ordenación
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Resetear a primera página al cambiar ordenación
  };

  // Función para cambiar tamaño de página
  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1); // Resetear a primera página al cambiar tamaño
  };

  // Funciones de navegación de páginas
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-teal mr-2" />
            <span>Cargando gastos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="gastos-tabla-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle data-testid="gastos-tabla-titulo">Lista de Gastos</CardTitle>
          </div>
        </div>
        
        {/* Filtros incorporados - siempre visibles */}
        <div className="mt-4">
          <GastosFiltros
            filtros={filtros}
            categorias={categorias}
            onFiltrosChange={onFiltrosChange}
            onLimpiarFiltros={onLimpiarFiltros}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table data-testid="gastos-tabla" aria-label="Tabla de gastos del mes actual">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="font-bold text-gray-800 bg-gray-200 border border-gray-300 rounded-lg mx-1 px-3 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full flex items-center justify-center hover:bg-gray-300"
                  onClick={() => handleSort('fecha')}
                >
                  Fecha
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="font-bold text-gray-800 bg-gray-200 border border-gray-300 rounded-lg mx-1 px-3 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full flex items-center justify-center hover:bg-gray-300"
                  onClick={() => handleSort('comercio')}
                >
                  Comercio
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="font-bold text-gray-800 bg-gray-200 border border-gray-300 rounded-lg mx-1 px-3 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full flex items-center justify-center hover:bg-gray-300"
                  onClick={() => handleSort('descripcion')}
                >
                  Descripción
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="font-bold text-gray-800 bg-gray-200 border border-gray-300 rounded-lg mx-1 px-3 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full flex items-center justify-center hover:bg-gray-300"
                  onClick={() => handleSort('categoria')}
                >
                  Categoría
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="font-bold text-gray-800 bg-gray-200 border border-gray-300 rounded-lg mx-1 px-3 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full flex items-center justify-center hover:bg-gray-300"
                  onClick={() => handleSort('fuente')}
                >
                  Fuente
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="font-bold text-gray-800 bg-gray-200 border border-gray-300 rounded-lg mx-1 px-3 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full flex items-center justify-center hover:bg-gray-300"
                  onClick={() => handleSort('monto')}
                >
                  Monto
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="font-bold text-gray-800 bg-gray-200 border border-gray-300 rounded-lg mx-1 px-3 py-2 text-center">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
        <TableBody>
          {sortedGastos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No hay gastos que coincidan con los filtros aplicados.
              </TableCell>
            </TableRow>
          ) : (
            paginatedGastos.map((gasto) => {
              const IconComponent = iconMap[gasto.categoria?.nombre || ''] || ShoppingCart;
              
              return (
                <TableRow key={gasto.id_gasto} data-testid={`gasto-row-${gasto.id_gasto}`}>
                  <TableCell className="font-medium" data-testid={`gasto-fecha-${gasto.id_gasto}`}>
                    {formatDisplayDate(gasto.fecha)}
                  </TableCell>
                  <TableCell data-testid={`gasto-comercio-${gasto.id_gasto}`}>
                    <div className="font-medium">{gasto.comercio}</div>
                  </TableCell>
                  <TableCell data-testid={`gasto-descripcion-${gasto.id_gasto}`}>
                    <div className="max-w-xs truncate" title={gasto.descripcion}>
                      {gasto.descripcion}
                    </div>
                  </TableCell>
                  <TableCell data-testid={`gasto-categoria-${gasto.id_gasto}`}>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: gasto.categoria?.color + "20" }}
                        aria-hidden="true"
                      >
                        <IconComponent 
                          className="w-3 h-3" 
                          style={{ color: gasto.categoria?.color }}
                        />
                      </div>
                      <span className="text-sm">{gasto.categoria?.nombre}</span>
                    </div>
                  </TableCell>
                  <TableCell data-testid={`gasto-fuente-${gasto.id_gasto}`}>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${fuenteColors[gasto.fuente] || 'bg-gray-100 text-gray-800'}`}>
                      {gasto.fuente}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold" data-testid={`gasto-monto-${gasto.id_gasto}`}>
                    ${formatCurrency(gasto.monto)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onEditar(gasto)}
                        data-testid={`gasto-editar-${gasto.id_gasto}`}
                        aria-label={`Editar gasto ${gasto.descripcion}`}
                        className="hover:bg-blue-100 hover:text-blue-600 transition-colors duration-200"
                        title="Editar gasto"
                      >
                        <Edit className="w-4 h-4" aria-hidden="true" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onEliminar(gasto)}
                        data-testid={`gasto-eliminar-${gasto.id_gasto}`}
                        aria-label={`Eliminar gasto ${gasto.descripcion}`}
                        className="hover:bg-red-100 hover:text-red-600 transition-colors duration-200"
                        title="Eliminar gasto"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      
      {/* Controles de paginación */}
      {sortedGastos.length > 0 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Mostrando {(currentPage - 1) * pageSize + 1} a {Math.min(currentPage * pageSize, sortedGastos.length)} de {sortedGastos.length} gastos
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Filas por página:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(e.target.value)}
              className="h-9 w-[70px] rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              aria-label="Primera página"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 px-2">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              aria-label="Última página"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      </CardContent>
    </Card>
  );
}
