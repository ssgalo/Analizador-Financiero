import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { FileText, Image, AlertCircle, CheckCircle, FileUp, Sparkles } from "lucide-react";
import ImportFileModal from "../components/ImportFileModal";
import { useImportGasto, ImportedGastoData } from "../hooks/useImportGasto";

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
    status: "procesado",
    date: "2024-01-14",
    gastos: 1,
    monto: 8750,
  },
  {
    id: 3,
    fileName: "factura_luz.pdf",
    type: "PDF",
    status: "procesado",
    date: "2024-01-13",
    gastos: 1,
    monto: 12500,
  },
];

export default function ImportarPage() {
  const navigate = useNavigate();
  const { isImportModalOpen, openImportModal, closeImportModal, handleDataExtracted } = useImportGasto();
  const [processingStatus, setProcessingStatus] = useState<string>("");

  const handleImportComplete = (data: ImportedGastoData) => {
    handleDataExtracted(data);
    setProcessingStatus("success");
    
    setTimeout(() => {
      navigate('/gastos', { state: { importedData: data } });
    }, 1000);
  };

  return (
    <div className="p-6 bg-background min-h-full">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <h1 className="text-3xl font-bold text-foreground">Importar Gastos</h1>
            <Sparkles className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-gray-600">
            Sube facturas, recibos o tickets y nuestra IA extraerá automáticamente la información
          </p>
        </div>

        <Card className="mb-8 border-2 border-dashed hover:border-blue-400 transition-colors">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <FileUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Importa tu primer documento</h3>
              <p className="text-gray-600 mb-6">
                Con OpenAI Vision analizamos tus documentos con precisión en segundos
              </p>
              <Button 
                className="bg-teal hover:bg-teal/90 text-white px-8 py-6 text-lg"
                onClick={openImportModal}
              >
                <FileUp className="mr-2 h-5 w-5" />
                Subir Documento
              </Button>
              
              {processingStatus === "success" && (
                <div className="mt-4 text-green-600 font-medium">
                  ¡Documento procesado! Redirigiendo...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">IA Avanzada</h4>
                  <p className="text-sm text-gray-600">
                    OpenAI GPT-4o-mini extrae fecha, monto y concepto automáticamente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">Múltiples Formatos</h4>
                  <p className="text-sm text-gray-600">
                    Soporta JPG, PNG, PDF y más
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">Rápido y Preciso</h4>
                  <p className="text-sm text-gray-600">
                    Procesa documentos en segundos con alta precisión
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Importaciones</CardTitle>
            <CardDescription>Documentos procesados recientemente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadHistory.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-gray-50 transition-colors"
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

                    {upload.status === "procesado" && (
                      <div className="text-right">
                        <p className="text-sm font-medium">{upload.gastos} {upload.gastos === 1 ? 'gasto' : 'gastos'}</p>
                        <p className="text-sm text-gray-500">${upload.monto?.toLocaleString()}</p>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      {upload.status === "procesado" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="hover:bg-gray-100 transition-colors duration-200"
                          onClick={() => navigate('/gastos')}
                        >
                          Ver Gastos
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>💡 Consejos para mejores resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">📄 Para PDFs:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Facturas y recibos digitales funcionan mejor</li>
                  <li>• Asegúrate de que el texto sea seleccionable</li>
                  <li>• Máximo 20MB por archivo</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">📸 Para Imágenes:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Fotografía con buena iluminación</li>
                  <li>• Asegúrate de que el texto sea legible</li>
                  <li>• Evita sombras y reflejos</li>
                  <li>• Toma la foto desde arriba, directamente</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ImportFileModal
        isOpen={isImportModalOpen}
        onClose={closeImportModal}
        onDataExtracted={handleImportComplete}
      />
    </div>
  );
}