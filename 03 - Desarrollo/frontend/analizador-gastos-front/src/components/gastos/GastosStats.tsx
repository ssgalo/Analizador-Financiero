import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { DollarSign, FileText, Calendar } from "lucide-react"
import { formatCurrency } from "../../utils/formatters"

interface GastosStatsProps {
  totalGastos: number
  cantidadGastos: number
}

export function GastosStats({ totalGastos, cantidadGastos }: GastosStatsProps) {
  const promedioGasto = cantidadGastos > 0 ? Math.round(totalGastos / cantidadGastos) : 0;
  const mesActual = new Date().toLocaleDateString('es-AR', { month: 'long' })
    .replace(/^\w/, c => c.toUpperCase());

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Gastos</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${formatCurrency(totalGastos)}</div>
          <p className="text-xs text-muted-foreground">
            {cantidadGastos} transacciones
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
            ${formatCurrency(promedioGasto)}
          </div>
          <p className="text-xs text-muted-foreground">
            Últimos {cantidadGastos} gastos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Período</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mesActual}</div>
          <p className="text-xs text-muted-foreground">Mes actual</p>
        </CardContent>
      </Card>
    </div>
  );
}
