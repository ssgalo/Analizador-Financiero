import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  PieChart,
  BarChart3,
  MessageSquare,
  Upload,
  Calendar,
  Target,
  Wallet,
  ShoppingCart,
  Home as HomeIcon,
  Car,
  Coffee,
  Smartphone,
  Heart,
  Book,
  Wifi,
  RefreshCw,
  Loader2
} from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { useDashboard } from "../hooks/useDashboard"
import { formatCurrency, formatDisplayDate } from "../utils/formatters"





function Home() {
  const { 
    usuario, 
    gastos, 
    estadisticas, 
    recomendaciones, 
    isLoading, 
    error, 
    refreshData 
  } = useDashboard();

  if (isLoading) {
    return (
      <div className="p-6 bg-background min-h-full flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-teal" />
          <span className="text-lg">Cargando dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-background min-h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <Button onClick={refreshData} variant="outline" className="hover:bg-slate-100 hover:border-slate-300">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const totalGastos = estadisticas?.totalGastos || 0;
  const totalIngresos = estadisticas?.totalIngresos || 0;
  const ahorro = totalIngresos - totalGastos;
  const porcentajeAhorro = totalIngresos > 0 ? (ahorro / totalIngresos) * 100 : 0;

  return (
    <div className="p-6 bg-background min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Bienvenido de vuelta, {usuario?.nombre || 'Usuario'}
            </h2>
            <p className="text-gray-600">Aquí tienes un resumen de tu situación financiera actual</p>
          </div>
          <Button onClick={refreshData} variant="outline" size="sm" className="hover:bg-slate-100 hover:border-slate-300">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gastos del Mes</CardTitle>
              <TrendingDown className="h-4 w-4 text-coral" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${formatCurrency(totalGastos)}</div>
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
              <div className="text-2xl font-bold">${formatCurrency(totalIngresos)}</div>
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
              <div className="text-2xl font-bold text-{ahorro >= 0 ? 'teal' : 'coral'}">
                ${formatCurrency(Math.abs(ahorro))}
              </div>
              <p className="text-xs text-gray-600">
                {ahorro >= 0 ? `${porcentajeAhorro.toFixed(1).replace('.', ',')}% de tus ingresos` : 'Déficit este mes'}
              </p>
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
                <AreaChart data={estadisticas?.tendenciaMensual || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                  <XAxis dataKey="mes" stroke="rgb(var(--muted-foreground))" />
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
                {estadisticas?.gastosPorCategoria.map((category, index) => {
                  const percentage = totalGastos > 0 ? (category.total / totalGastos) * 100 : 0;
                  // Mapeo simple de iconos basado en el nombre de la categoría
                  let IconComponent = ShoppingCart; // icono por defecto
                  switch (category.categoria.toLowerCase()) {
                    case 'alimentación':
                      IconComponent = Coffee;
                      break;
                    case 'transporte':
                      IconComponent = Car;
                      break;
                    case 'vivienda':
                      IconComponent = HomeIcon;
                      break;
                    case 'entretenimiento':
                      IconComponent = Smartphone;
                      break;
                    case 'salud':
                      IconComponent = Heart;
                      break;
                    case 'educación':
                      IconComponent = Book;
                      break;
                    case 'servicios':
                      IconComponent = Wifi;
                      break;
                  }
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: category.color + "20" }}
                        >
                          <IconComponent className="w-4 h-4" style={{ color: category.color }} />
                        </div>
                        <span className="font-medium">{category.categoria}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${formatCurrency(category.total)}</div>
                        <div className="text-sm text-gray-600">{percentage.toFixed(1).replace('.', ',')}%</div>
                      </div>
                    </div>
                  )
                }) || []}
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
              <Link to="/importar">
                <Button 
                  className="w-full justify-start bg-transparent transition-all duration-200" 
                  variant="outline"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.borderColor = '#94a3b8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Gastos
                </Button>
              </Link>
              <Link to="/chat">
                <Button 
                  className="w-full justify-start bg-transparent transition-all duration-200" 
                  variant="outline"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.borderColor = '#94a3b8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat con IA
                </Button>
              </Link>
              <Link to="/reportes">
                <Button className="w-full justify-start bg-transparent hover:bg-slate-100 hover:border-slate-300" variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Ver Reportes
                </Button>
              </Link>
              <Link to="/integraciones">
                <Button className="w-full justify-start bg-transparent hover:bg-slate-100 hover:border-slate-300" variant="outline">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Conectar Cuenta
                </Button>
              </Link>
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
                {gastos.slice(0, 4).map((gasto) => {
                  return (
                    <div
                      key={gasto.id_gasto}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-coral/20">
                          <TrendingDown className="w-5 h-5 text-coral" />
                        </div>
                        <div>
                          <div className="font-medium">{gasto.comercio}</div>
                          <div className="text-sm text-gray-600 flex items-center space-x-2">
                            <span>{gasto.categoria?.nombre || 'Sin categoría'}</span>
                            <span>•</span>
                            <span>{formatDisplayDate(gasto.fecha)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="font-semibold text-coral">
                        -${formatCurrency(gasto.monto)}
                      </div>
                    </div>
                  )
                })}
              </div>
              <Link to="/gastos">
                <Button variant="outline" className="w-full mt-4 bg-transparent hover:bg-slate-100 hover:border-slate-300">
                  Ver Todas las Transacciones
                </Button>
              </Link>
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
              {recomendaciones.map((recomendacion) => {
                let IconComponent = PieChart;
                let colorClass = "text-blue-600";
                let bgClass = "bg-blue-50 border-blue-200";
                
                switch (recomendacion.tipo) {
                  case 'ahorro':
                    IconComponent = TrendingUp;
                    colorClass = "text-teal";
                    bgClass = "bg-teal/20 border-teal/40";
                    break;
                  case 'recordatorio':
                    IconComponent = Calendar;
                    colorClass = "text-amber-600";
                    bgClass = "bg-amber-50 border-amber-200";
                    break;
                  case 'analisis':
                    IconComponent = PieChart;
                    colorClass = "text-blue-600";
                    bgClass = "bg-blue-50 border-blue-200";
                    break;
                  case 'alerta':
                    IconComponent = TrendingDown;
                    colorClass = "text-red-600";
                    bgClass = "bg-red-50 border-red-200";
                    break;
                }

                return (
                  <div key={recomendacion.id} className={`p-4 rounded-lg border ${bgClass}`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <IconComponent className={`w-4 h-4 ${colorClass}`} />
                      <span className={`font-medium ${colorClass}`}>
                        {recomendacion.titulo}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">
                      {recomendacion.mensaje}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Home