import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select } from "../components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { FormularioGasto } from "../components/forms/FormularioGasto"
import { DateInput } from "../components/ui/date-input"
import { MoneyInput } from "../components/ui/money-input"
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  X,
  Coffee,
  Car,
  Home as HomeIcon,
  Smartphone,
  ShoppingCart,
  Heart,
  Book,
  Wifi
} from "lucide-react"
import { useGastos } from "../hooks/useGastos"
import type { Gasto } from "../services/mockApi"
import { formatCurrency, formatDisplayDate, formatDateToLocal, formatDateToISO, parseLocalNumber } from "../utils/formatters"
import { useColors } from "../hooks/useColors"

// Mapeo de iconos por categoría
const iconMap: { [key: string]: any } = {
  'Alimentación': Coffee,
  'Transporte': Car,
  'Vivienda': HomeIcon,
  'Entretenimiento': Smartphone,
  'Compras': ShoppingCart,
  'Salud': Heart,
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

function GastosPage() {
  const {
    gastos,
    categorias,
    filtros,
    isLoading,
    error,
    totalGastos,
    setFiltros,
    limpiarFiltros,
    refrescarGastos,
    eliminarGasto,
    crearGasto,
    actualizarGasto
  } = useGastos();

  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [gastoAEliminar, setGastoAEliminar] = useState<number | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [gastoEditar, setGastoEditar] = useState<Gasto | null>(null);
  
  // Estados locales para filtros de monto en formato local
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

  const handleEliminarGasto = async (id: number) => {
    if (gastoAEliminar === id) {
      const resultado = await eliminarGasto(id);
      if (resultado) {
        setGastoAEliminar(null);
      }
    } else {
      setGastoAEliminar(id);
    }
  };

  const handleCrearGasto = async (gastoData: Omit<Gasto, 'id_gasto' | 'fecha_creacion' | 'fecha_modificacion'>) => {
    await crearGasto(gastoData);
  };

  const handleActualizarGasto = async (id: number, gastoData: Partial<Gasto>) => {
    await actualizarGasto(id, gastoData);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setGastoEditar(null);
  };

  const handleMontoDesdeChange = (value: string) => {
    setMontoDesde(value);
    const numValue = value ? parseLocalNumber(value) : undefined;
    setFiltros({ monto_desde: numValue });
  };

  const handleMontoHastaChange = (value: string) => {
    setMontoHasta(value);
    const numValue = value ? parseLocalNumber(value) : undefined;
    setFiltros({ monto_hasta: numValue });
  };

  if (error) {
    return (
      <div className="p-6 bg-background min-h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <Button onClick={refrescarGastos} variant="outline" className="hover:bg-gray-100 transition-colors duration-200">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Mis Gastos</h1>
            <p className="text-gray-600">
              Gestiona todos tus gastos con opciones de filtrado y edición
            </p>
          </div>
          <div className="flex items-center">
            <Button 
              onClick={() => {
                setGastoEditar(null);
                setMostrarFormulario(true);
              }}
              style={{
                backgroundColor: '#14b8a6',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0f766e';
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#14b8a6';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              className="transition-all duration-300 ease-in-out"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Gasto
            </Button>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Gastos</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${formatCurrency(totalGastos)}</div>
              <p className="text-xs text-muted-foreground">
                {gastos.length} transacciones
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio por Gasto</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${gastos.length > 0 ? formatCurrency(Math.round(totalGastos / gastos.length)) : '0,00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Últimos {gastos.length} gastos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Período</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date().toLocaleDateString('es-AR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())}
              </div>
              <p className="text-xs text-muted-foreground">
                Mes actual
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
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
                  onChange={(e) => setFiltros({ busqueda: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtros avanzados */}
            {mostrarFiltros && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Fila 1: Fechas y Categoría */}
                <DateInput
                  label="Fecha desde"
                  value={filtros.fecha_desde ? formatDateToLocal(filtros.fecha_desde) : ''}
                  onChange={(value) => setFiltros({ fecha_desde: value ? formatDateToISO(value) : undefined })}
                  placeholder="dd/mm/aaaa"
                />
                <DateInput
                  label="Fecha hasta"
                  value={filtros.fecha_hasta ? formatDateToLocal(filtros.fecha_hasta) : ''}
                  onChange={(value) => setFiltros({ fecha_hasta: value ? formatDateToISO(value) : undefined })}
                  placeholder="dd/mm/aaaa"
                />
                <Select
                  label="Categoría"
                  options={opcionesCategorias}
                  value={filtros.categoria?.toString() || ''}
                  onChange={(e) => setFiltros({ categoria: e.target.value ? parseInt(e.target.value) : undefined })}
                />
                
                {/* Fila 2: Montos y Fuente */}
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
                  onChange={(e) => setFiltros({ fuente: e.target.value })}
                />
              </div>
            )}

            {/* Botón limpiar filtros */}
            {(filtros.busqueda || filtros.fecha_desde || filtros.fecha_hasta || filtros.categoria || filtros.fuente) && (
              <div className="mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={limpiarFiltros} 
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

        {/* Tabla de gastos */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Gastos</CardTitle>
            <CardDescription>
              {gastos.length} gasto{gastos.length !== 1 ? 's' : ''} encontrado{gastos.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-teal mr-2" />
                <span>Cargando gastos...</span>
              </div>
            ) : gastos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No se encontraron gastos con los filtros aplicados.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Comercio</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Fuente</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gastos.map((gasto) => {
                    const IconComponent = iconMap[gasto.categoria?.nombre || ''] || ShoppingCart;
                    
                    return (
                      <TableRow key={gasto.id_gasto}>
                        <TableCell className="font-medium">
                          {formatDisplayDate(gasto.fecha)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{gasto.comercio}</div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={gasto.descripcion}>
                            {gasto.descripcion}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: gasto.categoria?.color + "20" }}
                            >
                              <IconComponent 
                                className="w-3 h-3" 
                                style={{ color: gasto.categoria?.color }}
                              />
                            </div>
                            <span className="text-sm">{gasto.categoria?.nombre}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${fuenteColors[gasto.fuente] || 'bg-gray-100 text-gray-800'}`}>
                            {gasto.fuente}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${formatCurrency(gasto.monto)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setGastoEditar(gasto);
                                setMostrarFormulario(true);
                              }}
                              className="hover:bg-blue-100 hover:text-blue-600 transition-colors duration-200"
                              title="Editar gasto"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEliminarGasto(gasto.id_gasto)}
                              className={`transition-colors duration-200 ${
                                gastoAEliminar === gasto.id_gasto 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'hover:bg-red-100 hover:text-red-600'
                              }`}
                              title={gastoAEliminar === gasto.id_gasto ? 'Confirmar eliminación' : 'Eliminar gasto'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de formulario */}
      <FormularioGasto
        isOpen={mostrarFormulario}
        onClose={cerrarFormulario}
        onSubmit={handleCrearGasto}
        onUpdate={handleActualizarGasto}
        categorias={categorias}
        gastoEditar={gastoEditar}
        isLoading={isLoading}
      />
    </div>
  )
}

export default GastosPage