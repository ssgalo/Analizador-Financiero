import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"

export default function ReportesPage() {
  return (
    <div className="p-6 bg-background min-h-full">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Reportes</h1>
          <p className="text-gray-600">Genera informes detallados de tus finanzas</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Módulo de Reportes</CardTitle>
            <CardDescription>Esta funcionalidad estará disponible próximamente</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Aquí podrás generar reportes avanzados con gráficos interactivos y exportar en PDF/Excel.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}