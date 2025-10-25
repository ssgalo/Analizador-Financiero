import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { DollarSign, FileText } from "lucide-react"
import { formatCurrency } from "../../utils/formatters"

interface GastosStatsProps {
  totalGastos: number
  cantidadGastos: number
}

export function GastosStats({ totalGastos, cantidadGastos }: GastosStatsProps) {
  // Asegurar que los valores sean números válidos
  const totalValido = typeof totalGastos === 'number' && !isNaN(totalGastos) ? totalGastos : 0;
  const cantidadValida = typeof cantidadGastos === 'number' && !isNaN(cantidadGastos) ? cantidadGastos : 0;
  
  const promedioGasto = cantidadValida > 0 ? Math.round(totalValido / cantidadValida) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card data-testid="gastos-total-card" aria-label="Estadística de total de gastos del mes">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de gastos</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div 
            className="text-2xl font-bold" 
            data-testid="gastos-total-valor"
            aria-label={`Total de gastos: ${formatCurrency(totalValido)} pesos`}
          >
            ${formatCurrency(totalValido)}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="gastos-promedio-card" aria-label="Estadística de promedio por gasto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Promedio por Gasto</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div 
            className="text-2xl font-bold"
            data-testid="gastos-promedio-valor"
            aria-label={`Promedio por gasto: ${formatCurrency(promedioGasto)} pesos`}
          >
            ${formatCurrency(promedioGasto)}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="gastos-cantidad-card" aria-label="Estadística de cantidad total de gastos registrados">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cantidad de gastos</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div 
            className="text-2xl font-bold"
            data-testid="gastos-cantidad-valor"
            aria-label={`Cantidad de gastos: ${cantidadValida} registrados`}
          >
            {cantidadValida}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
