import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import {
  Plus,
  Filter,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Coffee,
  Car,
  Home as HomeIcon,
  Smartphone,
  ShoppingCart,
  Calendar,
} from "lucide-react"

const gastos = [
  {
    id: 1,
    fecha: "2024-01-15",
    descripcion: "Supermercado Disco",
    comercio: "Disco",
    categoria: "Alimentación",
    monto: -4500,
    fuente: "Manual",
    icon: Coffee,
    color: "#20A39E",
  },
  {
    id: 2,
    fecha: "2024-01-14",
    descripcion: "Uber al aeropuerto",
    comercio: "Uber",
    categoria: "Transporte",
    monto: -1200,
    fuente: "PDF",
    icon: Car,
    color: "#0C7489",
  },
  {
    id: 3,
    fecha: "2024-01-13",
    descripcion: "Netflix mensual",
    comercio: "Netflix",
    categoria: "Entretenimiento",
    monto: -2500,
    fuente: "Manual",
    icon: Smartphone,
    color: "#EF5B5B",
  },
  {
    id: 4,
    fecha: "2024-01-12",
    descripcion: "Compra online Amazon",
    comercio: "Amazon",
    categoria: "Compras",
    monto: -8900,
    fuente: "Imagen",
    icon: ShoppingCart,
    color: "#13505B",
  },
  {
    id: 5,
    fecha: "2024-01-10",
    descripcion: "Farmacity medicamentos",
    comercio: "Farmacity",
    categoria: "Salud",
    monto: -3200,
    fuente: "PDF",
    icon: HomeIcon,
    color: "#FFBA49",
  },
]

const filtros = [
  { id: "todos", name: "Todos", count: gastos.length },
  { id: "manual", name: "Manual", count: gastos.filter(g => g.fuente === "Manual").length },
  { id: "pdf", name: "PDF", count: gastos.filter(g => g.fuente === "PDF").length },
  { id: "imagen", name: "Imagen", count: gastos.filter(g => g.fuente === "Imagen").length },
]

export default function GastosPage() {
  return (
    <div className="p-6 bg-background min-h-full">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Mis Gastos</h1>
            <p className="text-gray-600">Gestiona todos tus movimientos financieros</p>
          </div>
          <Button className="bg-teal hover:bg-teal/90">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Gasto
          </Button>
        </div>

        {/* Filters & Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por descripción, comercio o categoría..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent"
                />
              </div>

              {/* Date Range */}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal focus:border-transparent">
                  <option>Este mes</option>
                  <option>Último mes</option>
                  <option>Últimos 3 meses</option>
                  <option>Este año</option>
                  <option>Personalizado</option>
                </select>
              </div>

              {/* Filter Button */}
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1 mt-4">
              {filtros.map((filtro) => (
                <button
                  key={filtro.id}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filtro.id === "todos"
                      ? "bg-teal text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {filtro.name} ({filtro.count})
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gastos List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista de Gastos</CardTitle>
                <CardDescription>
                  {gastos.length} gastos encontrados • Total: $
                  {Math.abs(gastos.reduce((sum, gasto) => sum + gasto.monto, 0)).toLocaleString()}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  Exportar
                </Button>
                <Button variant="outline" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {gastos.map((gasto) => {
                const IconComponent = gasto.icon
                return (
                  <div
                    key={gasto.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Icon */}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: gasto.color + "20" }}
                      >
                        <IconComponent className="w-5 h-5" style={{ color: gasto.color }} />
                      </div>

                      {/* Details */}
                      <div>
                        <h3 className="font-medium text-foreground">{gasto.descripcion}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{gasto.comercio}</span>
                          <span>•</span>
                          <span>{gasto.categoria}</span>
                          <span>•</span>
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs">{gasto.fuente}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Date */}
                      <div className="text-right text-sm text-gray-500">
                        {new Date(gasto.fecha).toLocaleDateString("es-AR")}
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <div className="font-semibold text-foreground">
                          ${Math.abs(gasto.monto).toLocaleString()}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <p className="text-sm text-gray-500">Mostrando 1-5 de 5 gastos</p>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" disabled>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}