import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { TrendingUp, Target, Calendar, Trash2, Plus, RefreshCw } from "lucide-react"
import { objetivosService, type ObjetivoFinancieroCreate } from '../services/api'

interface ObjetivoFinanciero {
  id_objetivo?: number
  id_usuario: number
  descripcion: string
  monto: number
  fecha_inicio: string | null
  fecha_fin: string | null
  estado: "en_progreso" | "completado" | "cancelado" | null  // ✅ Permitir null del backend
}

export default function ObjetivosPage() {
  const [objetivos, setObjetivos] = useState<ObjetivoFinanciero[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editando, setEditando] = useState(false)
  
  const [formData, setFormData] = useState<Omit<ObjetivoFinancieroCreate, 'id_usuario'> & { id_usuario?: number }>({
    descripcion: "",
    monto: 0,
    fecha_inicio: null,
    fecha_fin: null,
    id_usuario: 6
  })

  useEffect(() => {
    cargarObjetivos()
  }, [])

  const cargarObjetivos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await objetivosService.getObjetivos()
      console.log('📥 Objetivos recibidos:', data)
      setObjetivos(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(`Error al cargar objetivos: ${errorMessage}`)
      console.error('Error cargando objetivos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGuardar = async () => {
    try {
      if (!formData.descripcion || !formData.monto) {
        alert("Por favor completa todos los campos obligatorios")
        return
      }

      if (!formData.id_usuario) {
        alert("Error: No se pudo identificar el usuario")
        return
      }

      const objetoCrear: ObjetivoFinancieroCreate = {
        id_usuario: formData.id_usuario,
        descripcion: formData.descripcion,
        monto: formData.monto,
        fecha_inicio: formData.fecha_inicio || null,
        fecha_fin: formData.fecha_fin || null
      }

      console.log('📤 Enviando objetivo al backend:', objetoCrear)
      await objetivosService.createObjetivo(objetoCrear)
      
      await cargarObjetivos()
      setEditando(false)
      setFormData({
        descripcion: "",
        monto: 0,
        fecha_inicio: null,
        fecha_fin: null,
        id_usuario: 6
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar'
      console.error('Error guardando objetivo:', err)
      alert(errorMessage)
    }
  }

  const handleEliminar = async (id_objetivo: number) => {
    if (!confirm("¿Estás seguro de eliminar este objetivo?")) return
    
    try {
      await objetivosService.deleteObjetivo(id_objetivo)
      await cargarObjetivos()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar'
      console.error('Error eliminando objetivo:', err)
      alert(errorMessage)
    }
  }

  const handleCompletar = async (objetivo: ObjetivoFinanciero) => {
    try {
      await objetivosService.updateObjetivo(objetivo.id_objetivo!, { estado: "completado" })
      await cargarObjetivos()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al completar'
      console.error('Error completando objetivo:', err)
      alert(errorMessage)
    }
  }

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor)
  }

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return "Sin fecha"
    return new Date(fecha).toLocaleDateString('es-AR')
  }

  // ✅ SOLUCIÓN: Normalizar estado null a "en_progreso"
  const obtenerEstado = (estado: string | null): "en_progreso" | "completado" | "cancelado" => {
    if (!estado || estado === "null") {
      return "en_progreso"  // Default cuando el backend devuelve null
    }
    return estado as "en_progreso" | "completado" | "cancelado"
  }

  // ✅ SOLUCIÓN: Calcular estadísticas con normalización de estado
  const estadisticas = {
    activos: objetivos.filter(o => obtenerEstado(o.estado) === "en_progreso").length,
    completados: objetivos.filter(o => obtenerEstado(o.estado) === "completado").length,
    totalAhorrar: objetivos
      .filter(o => obtenerEstado(o.estado) === "en_progreso")
      .reduce((acc, o) => acc + Number(o.monto), 0)
  }

  console.log('📊 Estadísticas calculadas:', estadisticas)

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Cargando objetivos...</span>
        </div>
      )
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={cargarObjetivos}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      )
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Mis Objetivos</CardTitle>
          <CardDescription>Gestiona tus metas financieras</CardDescription>
        </CardHeader>
        <CardContent>
          {objetivos.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              Aún no has definido objetivos financieros.
              <br />
              Haz clic en "Nuevo Objetivo" para crear uno.
            </p>
          ) : (
            <div className="space-y-4">
              {objetivos.map((objetivo) => {
                const estadoNormalizado = obtenerEstado(objetivo.estado)
                
                return (
                  <div
                    key={objetivo.id_objetivo}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{objetivo.descripcion}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            {formatearMoneda(Number(objetivo.monto))}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatearFecha(objetivo.fecha_fin)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            estadoNormalizado === "en_progreso" ? "bg-blue-100 text-blue-800" :
                            estadoNormalizado === "completado" ? "bg-green-100 text-green-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {estadoNormalizado === "en_progreso" ? "En progreso" :
                             estadoNormalizado === "completado" ? "Completado" : "Cancelado"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {estadoNormalizado === "en_progreso" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCompletar(objetivo)}
                          >
                            Marcar Completado
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleEliminar(objetivo.id_objetivo!)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-6 bg-background min-h-full">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Objetivos Financieros</h1>
            <p className="text-gray-600">Define y sigue tus metas de ahorro</p>
          </div>
          <button
            onClick={() => setEditando(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Objetivo
          </button>
        </div>

        {/* ✅ Cards con estadísticas precalculadas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Objetivos Activos</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {loading ? "..." : estadisticas.activos}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total a Ahorrar</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loading ? "..." : formatearMoneda(estadisticas.totalAhorrar)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completados</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {loading ? "..." : estadisticas.completados}
              </div>
            </CardContent>
          </Card>
        </div>

        {renderContent()}

        {editando && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Nuevo Objetivo Financiero</h2>
              <p className="text-gray-600 mb-6">Define tu meta de ahorro</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <input
                    type="text"
                    placeholder="ej: Vacaciones 2025"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto ($)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_fin || ""}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setEditando(false)}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Guardar Objetivo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
