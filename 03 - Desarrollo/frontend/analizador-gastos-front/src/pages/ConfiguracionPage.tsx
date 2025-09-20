import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"

export default function ConfiguracionPage() {
  return (
    <div className="p-6 bg-background min-h-full">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Configuración</h1>
          <p className="text-gray-600">Personaliza tu experiencia en la aplicación</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuración de Usuario</CardTitle>
            <CardDescription>Personaliza categorías, preferencias y notificaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Esta funcionalidad estará disponible próximamente para personalizar tu perfil y preferencias.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}