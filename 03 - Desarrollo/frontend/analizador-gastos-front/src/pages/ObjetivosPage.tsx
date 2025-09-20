import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"

export default function ObjetivosPage() {
  return (
    <div className="p-6 bg-background min-h-full">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Objetivos Financieros</h1>
          <p className="text-gray-600">Define y sigue tus metas de ahorro</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gestión de Objetivos</CardTitle>
            <CardDescription>Crea y monitorea tus metas financieras</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Esta funcionalidad estará disponible próximamente para gestionar tus objetivos de ahorro.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}