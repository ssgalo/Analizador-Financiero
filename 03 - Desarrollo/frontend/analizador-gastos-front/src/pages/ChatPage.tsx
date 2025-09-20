import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { MessageSquare, Send, Bot, User, Lightbulb, BarChart3, TrendingUp } from "lucide-react"

const conversationHistory = [
  {
    id: 1,
    tipo: "usuario",
    mensaje: "¿Cuánto gasté en supermercados este mes?",
    timestamp: "10:30",
  },
  {
    id: 2,
    tipo: "ia",
    mensaje: "Este mes gastaste $25,000 en supermercados. Esto representa el 37% de tus gastos totales en alimentación. Es un 12% más que el mes anterior.",
    timestamp: "10:30",
  },
  {
    id: 3,
    tipo: "usuario",
    mensaje: "¿Qué día fue mi mayor gasto en septiembre?",
    timestamp: "10:35",
  },
  {
    id: 4,
    tipo: "ia",
    mensaje: "Tu mayor gasto en septiembre fue el 15 de septiembre por $8,900 en Amazon. Fue categorizado como 'Compras' y correspondió a productos electrónicos.",
    timestamp: "10:35",
  },
]

const sugerenciasPreguntas = [
  "¿En qué categoría gasto más dinero?",
  "¿Cuáles son mis patrones de gasto semanales?",
  "¿Cómo puedo ahorrar $5,000 este mes?",
  "¿Qué comercios visito más frecuentemente?",
  "Analiza mis gastos de los últimos 3 meses",
  "¿Cuándo suelo gastar más dinero?",
]

export default function ChatPage() {
  return (
    <div className="p-6 bg-background min-h-full">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Chat con IA Financiera</h1>
          <p className="text-gray-600">
            Pregúntame cualquier cosa sobre tus gastos y recibirás análisis personalizados
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-teal" />
                  <span>Conversación</span>
                </CardTitle>
                <CardDescription>Haz preguntas sobre tus hábitos financieros</CardDescription>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {conversationHistory.map((mensaje) => (
                  <div
                    key={mensaje.id}
                    className={`flex ${mensaje.tipo === "usuario" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        mensaje.tipo === "usuario"
                          ? "bg-teal text-white"
                          : "bg-gray-100 text-gray-900 border border-gray-200"
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {mensaje.tipo === "ia" && (
                          <Bot className="w-4 h-4 mt-0.5 text-teal flex-shrink-0" />
                        )}
                        {mensaje.tipo === "usuario" && (
                          <User className="w-4 h-4 mt-0.5 text-white flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm">{mensaje.mensaje}</p>
                          <p
                            className={`text-xs mt-1 ${
                              mensaje.tipo === "usuario" ? "text-teal-100" : "text-gray-500"
                            }`}
                          >
                            {mensaje.timestamp}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>

              {/* Input */}
              <div className="border-t border-border p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Escribe tu pregunta sobre gastos..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent"
                  />
                  <Button className="bg-teal hover:bg-teal/90">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Questions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-golden" />
                  <span>Preguntas Sugeridas</span>
                </CardTitle>
                <CardDescription>Haz clic para hacer estas preguntas rápidamente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {sugerenciasPreguntas.map((pregunta, index) => (
                  <button
                    key={index}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-teal transition-colors text-sm"
                  >
                    {pregunta}
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* AI Capabilities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-teal" />
                  <span>¿Qué puedo hacer?</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="w-5 h-5 text-teal mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Análisis de Patrones</h4>
                    <p className="text-xs text-gray-600">
                      Identifico tendencias en tus gastos y hábitos de consumo
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <BarChart3 className="w-5 h-5 text-teal mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Reportes Personalizados</h4>
                    <p className="text-xs text-gray-600">Genero informes detallados sobre cualquier período</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Lightbulb className="w-5 h-5 text-golden mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Recomendaciones</h4>
                    <p className="text-xs text-gray-600">Sugiero formas de optimizar tus finanzas</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MessageSquare className="w-5 h-5 text-teal mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Consultas Naturales</h4>
                    <p className="text-xs text-gray-600">Habla conmigo como si fuera tu asesor financiero</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}