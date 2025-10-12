import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { Edit2, Trash2, Coffee, Car, Home as HomeIcon, Smartphone, ShoppingCart, Heart, Book, Wifi, Loader2 } from "lucide-react";
import { formatCurrency, formatDisplayDate } from "../../utils/formatters";
import type { Ingreso } from "../../services/api";
import IngresosFiltros from './IngresosFiltros';

// Mapeo de iconos por categoría
const iconMap: { [key: string]: any } = {
  'Salario': Coffee,
  'Freelance': Car,
  'Alquiler': HomeIcon,
  'Inversiones': Smartphone,
  'Ventas': ShoppingCart,
  'Bonos': Heart,
  'Otros': Book,
  'Subsidios': Wifi
};

interface Props {
  ingresos: Ingreso[];
  isLoading: boolean;
  onEditarIngreso: (ingreso: Ingreso) => void;
  onEliminarIngreso: (id: number) => void;
  // Props para filtros
  filtrosActivos: any;
  onFiltrosChange: (filtros: any) => void;
}

export const IngresosTabla = ({ 
  ingresos, 
  isLoading,
  filtrosActivos, 
  onFiltrosChange, 
  onEditarIngreso, 
  onEliminarIngreso 
}: Props) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-green-600 mr-2" />
            <span>Cargando ingresos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Lista de Ingresos
        </CardTitle>
        <IngresosFiltros 
          filtrosActivos={filtrosActivos}
          onFiltrosChange={onFiltrosChange}
        />
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="font-bold text-gray-800 bg-gray-200 border border-gray-300 rounded-lg mx-1 px-3 py-2 text-center">
                  Fecha
                </TableHead>
                <TableHead className="font-bold text-gray-800 bg-gray-200 border border-gray-300 rounded-lg mx-1 px-3 py-2 text-center">
                  Descripción
                </TableHead>
                <TableHead className="font-bold text-gray-800 bg-gray-200 border border-gray-300 rounded-lg mx-1 px-3 py-2 text-center">
                  Categoría
                </TableHead>
                <TableHead className="font-bold text-gray-800 bg-gray-200 border border-gray-300 rounded-lg mx-1 px-3 py-2 text-center">
                  Fuente
                </TableHead>
                <TableHead className="font-bold text-gray-800 bg-gray-200 border border-gray-300 rounded-lg mx-1 px-3 py-2 text-center">
                  Monto
                </TableHead>
                <TableHead className="font-bold text-gray-800 bg-gray-200 border border-gray-300 rounded-lg mx-1 px-3 py-2 text-center">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingresos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No hay ingresos para mostrar
                  </TableCell>
                </TableRow>
              ) : (
                ingresos.map((ingreso) => {
                  const IconComponent = iconMap[ingreso.categoria?.nombre || ''] || ShoppingCart;
                  
                  return (
                    <TableRow key={ingreso.id_ingreso}>
                      <TableCell className="font-medium">
                        {formatDisplayDate(ingreso.fecha)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={ingreso.descripcion}>
                          {ingreso.descripcion}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: ingreso.categoria?.color + "20" }}
                          >
                            <IconComponent 
                              className="w-3 h-3" 
                              style={{ color: ingreso.categoria?.color }}
                            />
                          </div>
                          <span className="text-sm">{ingreso.categoria?.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm text-gray-600">
                          {ingreso.fuente || 'Manual'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <span className="font-medium text-gray-900">
                          ${formatCurrency(ingreso.monto)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditarIngreso(ingreso)}
                            className="h-10 w-10 p-0 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit2 className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEliminarIngreso(ingreso.id_ingreso)}
                            className="h-10 w-10 p-0 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
