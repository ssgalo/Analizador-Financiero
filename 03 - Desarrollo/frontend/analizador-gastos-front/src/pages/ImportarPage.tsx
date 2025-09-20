import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Upload, FileText, Image, AlertCircle, CheckCircle } from "lucide-react"

const uploadHistory = [
  {
    id: 1,
    fileName: "resumen_tarjeta_junio.pdf",
    type: "PDF",
    status: "procesado",
    date: "2024-01-15",
    gastos: 8,
    monto: 45000,
  },
  {
    id: 2,
    fileName: "ticket_supermercado.jpg",
    type: "Imagen",
    status: "procesando",
    date: "2024-01-14",
    gastos: null,
    monto: null,
  },
  {
    id: 3,
    fileName: "factura_luz.pdf",
    type: "PDF",
    status: "error",
    date: "2024-01-13",
    gastos: null,
    monto: null,
  },
]

export default function ImportarPage() {
  return (
    <div className="p-6 bg-background min-h-full">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Importar Gastos</h1>
          <p className="text-gray-600">Sube archivos PDF o imágenes para extraer automáticamente tus gastos</p>
        </div>

        {/* Upload Area */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Subir Archivos</CardTitle>
            <CardDescription>
              Arrastra y suelta archivos aquí, o haz clic para seleccionar. Soportamos PDF, JPG, PNG.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-teal transition-colors">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">Arrastra archivos aquí</p>
              <p className="text-gray-500 mb-4">o</p>
              <Button className="bg-teal hover:bg-teal/90">Seleccionar Archivos</Button>
              <p className="text-xs text-gray-500 mt-4">
                Máximo 10MB por archivo • PDF, JPG, PNG permitidos
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Upload History */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Importaciones</CardTitle>
            <CardDescription>Archivos subidos recientemente y su estado de procesamiento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadHistory.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      {upload.type === "PDF" ? (
                        <FileText className="w-5 h-5 text-red-500" />
                      ) : (
                        <Image className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{upload.fileName}</h3>
                      <p className="text-sm text-gray-500">{upload.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Status */}
                    <div className="flex items-center space-x-2">
                      {upload.status === "procesado" && (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600">Procesado</span>
                        </>
                      )}
                      {upload.status === "procesando" && (
                        <>
                          <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm text-yellow-600">Procesando</span>
                        </>
                      )}
                      {upload.status === "error" && (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-600">Error</span>
                        </>
                      )}
                    </div>

                    {/* Results */}
                    {upload.status === "procesado" && (
                      <div className="text-right">
                        <p className="text-sm font-medium">{upload.gastos} gastos</p>
                        <p className="text-sm text-gray-500">${upload.monto?.toLocaleString()}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2">
                      {upload.status === "procesado" && (
                        <Button variant="outline" size="sm" className="hover:bg-gray-100 transition-colors duration-200">
                          Ver Gastos
                        </Button>
                      )}
                      {upload.status === "error" && (
                        <Button variant="outline" size="sm" className="hover:bg-gray-100 transition-colors duration-200">
                          Reintentar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Consejos para mejores resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">Para PDFs:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Usa archivos de buena calidad</li>
                  <li>• Resúmenes de tarjetas funcionan mejor</li>
                  <li>• Evita archivos escaneados de baja resolución</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Para Imágenes:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Fotografía con buena iluminación</li>
                  <li>• Asegúrate de que el texto sea legible</li>
                  <li>• Tickets y facturas son ideales</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}