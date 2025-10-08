import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Edit, Trash2, Loader2, Coffee, Car, Home as HomeIcon, Smartphone, ShoppingCart, Heart, Book, Wifi } from "lucide-react"
import type { Gasto } from "../../services/api"
import { formatCurrency, formatDisplayDate } from "../../utils/formatters"

interface GastosTablaProps {
  gastos: Gasto[]
  isLoading: boolean
  onEditar: (gasto: Gasto) => void
  onEliminar: (gasto: Gasto) => void
}

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

export function GastosTabla({ gastos, isLoading, onEditar, onEliminar }: GastosTablaProps) {
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

  if (gastos.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-muted-foreground">No se encontraron gastos con los filtros aplicados.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Gastos</CardTitle>
        <CardDescription>
          {gastos.length} gasto{gastos.length !== 1 ? 's' : ''} encontrado{gastos.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                        onClick={() => onEditar(gasto)}
                        className="hover:bg-blue-100 hover:text-blue-600 transition-colors duration-200"
                        title="Editar gasto"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onEliminar(gasto)}
                        className="hover:bg-red-100 hover:text-red-600 transition-colors duration-200"
                        title="Eliminar gasto"
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
      </CardContent>
    </Card>
  );
}
