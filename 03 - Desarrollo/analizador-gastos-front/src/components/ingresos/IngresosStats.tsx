import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { DollarSign, BarChart3, Calculator } from 'lucide-react';
import { formatCurrency } from "../../utils/formatters";
import type { IngresoStats } from '../../services/api';

interface IngresosStatsProps {
  estadisticas: IngresoStats;
  loading: boolean;
}

const IngresosStats: React.FC<IngresosStatsProps> = ({ estadisticas, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[...Array(3)].map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Asegurar que los valores sean números válidos
  const totalValido = typeof estadisticas.total_ingresos === 'number' && !isNaN(estadisticas.total_ingresos) ? estadisticas.total_ingresos : 0;
  const cantidadValida = typeof estadisticas.cantidad_ingresos === 'number' && !isNaN(estadisticas.cantidad_ingresos) ? estadisticas.cantidad_ingresos : 0;
  const promedioValido = typeof estadisticas.promedio_ingreso === 'number' && !isNaN(estadisticas.promedio_ingreso) ? estadisticas.promedio_ingreso : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card data-testid="ingresos-total-card" aria-label="Estadística de total de ingresos del mes">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de ingresos</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div 
            className="text-2xl font-bold"
            data-testid="ingresos-total-valor"
            aria-label={`Total de ingresos: ${formatCurrency(totalValido)} pesos`}
          >
            ${formatCurrency(totalValido)}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="ingresos-promedio-card" aria-label="Estadística de promedio por ingreso">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Promedio por Ingreso</CardTitle>
          <Calculator className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div 
            className="text-2xl font-bold"
            data-testid="ingresos-promedio-valor"
            aria-label={`Promedio por ingreso: ${formatCurrency(promedioValido)} pesos`}
          >
            ${formatCurrency(promedioValido)}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="ingresos-cantidad-card" aria-label="Estadística de cantidad total de ingresos registrados">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cantidad de ingresos</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div 
            className="text-2xl font-bold"
            data-testid="ingresos-cantidad-valor"
            aria-label={`Cantidad de ingresos: ${cantidadValida} registrados`}
          >
            {cantidadValida}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IngresosStats;