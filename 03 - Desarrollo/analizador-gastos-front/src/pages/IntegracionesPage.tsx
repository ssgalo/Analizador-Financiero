import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"

export default function IntegracionesPage() {
  return (
    <div className="p-6 bg-background min-h-full">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Integraciones</h1>
          <p className="text-gray-600">Conecta tus cuentas bancarias y billeteras virtuales</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Integración con MercadoPago</CardTitle>
            <CardDescription>Conecta tu cuenta para importar movimientos automáticamente</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Esta funcionalidad estará disponible próximamente para sincronizar tus gastos de MercadoPago.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}