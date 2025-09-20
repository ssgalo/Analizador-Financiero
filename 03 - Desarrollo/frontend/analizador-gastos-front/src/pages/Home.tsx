import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  PieChart,
  BarChart3,
  MessageSquare,
  Upload,
  Settings,
  Bell,
  Calendar,
  Target,
  Wallet,
  ShoppingCart,
  Home as HomeIcon,
  Car,
  Coffee,
  Smartphone,
} from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

const monthlyData = [
  { month: "Ene", gastos: 45000, ingresos: 80000 },
  { month: "Feb", gastos: 52000, ingresos: 80000 },
  { month: "Mar", gastos: 48000, ingresos: 80000 },
  { month: "Abr", gastos: 61000, ingresos: 80000 },
  { month: "May", gastos: 55000, ingresos: 80000 },
  { month: "Jun", gastos: 67000, ingresos: 80000 },
]

const categoryData = [
  { name: "Alimentación", value: 25000, color: "#20A39E", icon: Coffee },
  { name: "Transporte", value: 15000, color: "#0C7489", icon: Car },
  { name: "Vivienda", value: 35000, color: "#FFBA49", icon: HomeIcon },
  { name: "Entretenimiento", value: 8000, color: "#EF5B5B", icon: Smartphone },
  { name: "Compras", value: 12000, color: "#13505B", icon: ShoppingCart },
]

const recentTransactions = [
  {
    id: 1,
    description: "Supermercado Disco",
    amount: -4500,
    category: "Alimentación",
    date: "2024-01-15",
    type: "expense",
  },
  { id: 2, description: "Sueldo", amount: 80000, category: "Ingresos", date: "2024-01-01", type: "income" },
  { id: 3, description: "Uber", amount: -1200, category: "Transporte", date: "2024-01-14", type: "expense" },
  { id: 4, description: "Netflix", amount: -2500, category: "Entretenimiento", date: "2024-01-13", type: "expense" },
]

function Home() {
  const totalGastos = 67000
  const totalIngresos = 80000
  const ahorro = totalIngresos - totalGastos
  const porcentajeAhorro = (ahorro / totalIngresos) * 100

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-teal rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-foreground">Analizador Financiero</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">JD</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Bienvenido de vuelta, Juan</h2>
          <p className="text-gray-600">Aquí tienes un resumen de tu situación financiera actual</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gastos del Mes</CardTitle>
              <TrendingDown className="h-4 w-4 text-coral" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalGastos.toLocaleString()}</div>
              <p className="text-xs text-gray-600">
                <span className="text-coral">+12%</span> vs mes anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
              <TrendingUp className="h-4 w-4 text-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalIngresos.toLocaleString()}</div>
              <p className="text-xs text-gray-600">
                <span className="text-teal">Estable</span> vs mes anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ahorro del Mes</CardTitle>
              <Wallet className="h-4 w-4 text-golden" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${ahorro.toLocaleString()}</div>
              <p className="text-xs text-gray-600">{porcentajeAhorro.toFixed(1)}% de tus ingresos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meta de Ahorro</CardTitle>
              <Target className="h-4 w-4 text-golden" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">75%</div>
              <Progress value={75} className="mt-2" />
              <p className="text-xs text-gray-600 mt-1">$3,000 para alcanzar meta</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Tendencia Mensual</CardTitle>
              <CardDescription>Comparación de ingresos vs gastos en los últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                  <XAxis dataKey="month" stroke="rgb(var(--muted-foreground))" />
                  <YAxis stroke="rgb(var(--muted-foreground))" />
                  <Area
                    type="monotone"
                    dataKey="ingresos"
                    stackId="1"
                    stroke="#20A39E"
                    fill="#20A39E"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="gastos"
                    stackId="2"
                    stroke="#EF5B5B"
                    fill="#EF5B5B"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Categoría</CardTitle>
              <CardDescription>Distribución de tus gastos este mes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryData.map((category, index) => {
                  const IconComponent = category.icon
                  const percentage = (category.value / totalGastos) * 100
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: category.color + "20" }}
                        >
                          <IconComponent className="w-4 h-4" style={{ color: category.color }} />
                        </div>
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${category.value.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">{percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>Funciones más utilizadas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Importar Gastos
              </Button>
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat con IA
              </Button>
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                Ver Reportes
              </Button>
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <CreditCard className="w-4 h-4 mr-2" />
                Conectar Cuenta
              </Button>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Transacciones Recientes</CardTitle>
              <CardDescription>Tus últimos movimientos financieros</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: transaction.type === "income" ? "#20A39E20" : "#EF5B5B20",
                        }}
                      >
                        {transaction.type === "income" ? (
                          <TrendingUp className="w-5 h-5 text-teal" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-coral" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-gray-600 flex items-center space-x-2">
                          <span>{transaction.category}</span>
                          <span>•</span>
                          <span>{transaction.date}</span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="font-semibold"
                      style={{ color: transaction.type === "income" ? "#20A39E" : undefined }}
                    >
                      {transaction.type === "income" ? "+" : ""}${Math.abs(transaction.amount).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4 bg-transparent">
                Ver Todas las Transacciones
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-teal" />
              <span>Recomendaciones de IA</span>
            </CardTitle>
            <CardDescription>Insights personalizados basados en tus hábitos de gasto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border bg-teal/20 border-teal/40">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-teal" />
                  <span className="font-medium text-teal">Oportunidad de Ahorro</span>
                </div>
                <p className="text-sm text-foreground">
                  Podrías ahorrar $3,500 reduciendo gastos en entretenimiento este mes.
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-golden/20 border-golden/40">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-4 h-4 text-golden" />
                  <span className="font-medium text-golden">Recordatorio</span>
                </div>
                <p className="text-sm text-foreground">Tu suscripción de Netflix se renueva en 3 días por $2,500.</p>
              </div>

              <div className="p-4 rounded-lg border bg-dark-blue/20 border-dark-blue/40">
                <div className="flex items-center space-x-2 mb-2">
                  <PieChart className="w-4 h-4 text-dark-blue" />
                  <span className="font-medium text-dark-blue">Análisis</span>
                </div>
                <p className="text-sm text-foreground">Tus gastos en alimentación están 15% por encima del promedio.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Home