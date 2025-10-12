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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de gastos</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${formatCurrency(totalValido)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Promedio por Gasto</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${formatCurrency(promedioGasto)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cantidad de gastos</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{cantidadValida}</div>
        </CardContent>
      </Card>
    </div>
  );
}
