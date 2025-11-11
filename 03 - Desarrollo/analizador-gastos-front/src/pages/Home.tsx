/**
 * Página principal del Dashboard
 * 
 * Muestra un resumen completo de la situación financiera del usuario:
 * - Métricas clave (gastos, ingresos, ahorro)
 * - Tendencia mensual con gráficos
 * - Distribución de gastos por categoría
 * - Acciones rápidas para gestionar finanzas
 */

import React from 'react';
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
  Target,
  Wallet,
  RefreshCw,
  Loader2
} from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { useDashboard } from "../hooks/useDashboard"
import { formatCurrency } from "../utils/formatters"
import { getCategoryIcon } from "../utils/categoryHelpers"
import { useAuthStore } from '../stores/authStore';

const Home: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    usuario, 
    estadisticas, 
    isLoading, 
    error, 
    refreshData 
  } = useDashboard();

  // Obtener nombre del mes actual
  const getNombreMesActual = (): string => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const mesActual = new Date().getMonth();
    return meses[mesActual];
  };

  // Estado de carga
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

  // Estado de error
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

  // Calcular métricas principales
  const totalGastos = estadisticas?.totalGastos || 0;
  const totalIngresos = estadisticas?.totalIngresos || 0;
  const ahorro = totalIngresos - totalGastos;
  const porcentajeAhorro = totalIngresos > 0 ? (ahorro / totalIngresos) * 100 : 0;

  return (
    <div className="p-6 bg-background min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* Sección de Bienvenida */}
        <div className="mb-8 flex items-center justify-between" data-testid="dashboard-bienvenida">
          <div>
            <h2 
              className="text-3xl font-bold text-foreground mb-2"
              data-testid="dashboard-saludo-usuario"
            >
              Bienvenido de vuelta, {usuario?.nombre || user?.nombre || 'Usuario'}
            </h2>
            <p className="text-gray-600">Aquí tienes un resumen de tu situación financiera actual</p>
          </div>
          <Button 
            onClick={refreshData} 
            variant="outline" 
            size="sm"
            data-testid="dashboard-refresh-btn"
            aria-label="Actualizar datos del dashboard"
            className="hover:bg-slate-100 hover:border-slate-300"
          >
            <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
            Actualizar
          </Button>
        </div>

        {/* Tarjetas de Métricas Clave */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="dashboard-gastos-card" aria-label="Total de gastos del mes">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gastos del Mes</CardTitle>
              <TrendingDown className="h-4 w-4 text-coral" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div 
                className="text-2xl font-bold" 
                data-testid="dashboard-gastos-valor"
                aria-label={`Gastos totales: ${formatCurrency(totalGastos)} pesos`}
              >
                ${formatCurrency(totalGastos)}
              </div>
              <p className="text-xs text-gray-600">
                {totalGastos > 0 ? (
                  <span className="text-coral">{getNombreMesActual()}</span>
                ) : (
                  <span className="text-gray-500">Sin gastos registrados</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="dashboard-ingresos-card" aria-label="Total de ingresos del mes">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
              <TrendingUp className="h-4 w-4 text-teal" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div 
                className="text-2xl font-bold" 
                data-testid="dashboard-ingresos-valor"
                aria-label={`Ingresos totales: ${formatCurrency(totalIngresos)} pesos`}
              >
                ${formatCurrency(totalIngresos)}
              </div>
              <p className="text-xs text-gray-600">
                {totalIngresos > 0 ? (
                  <span className="text-teal">{getNombreMesActual()}</span>
                ) : (
                  <span className="text-gray-500">Sin ingresos registrados</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="dashboard-ahorro-card" aria-label="Ahorro del mes (diferencia entre ingresos y gastos)">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ahorro del Mes</CardTitle>
              <Wallet className="h-4 w-4 text-golden" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div 
                className={`text-2xl font-bold ${ahorro >= 0 ? 'text-teal' : 'text-coral'}`}
                data-testid="dashboard-ahorro-valor"
                aria-label={`Ahorro: ${ahorro >= 0 ? '' : 'déficit de '}${formatCurrency(Math.abs(ahorro))} pesos`}
              >
                ${formatCurrency(Math.abs(ahorro))}
              </div>
              <p className="text-xs text-gray-600">
                {ahorro >= 0 ? `${porcentajeAhorro.toFixed(1).replace('.', ',')}% de tus ingresos` : 'Déficit este mes'}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="dashboard-meta-card" aria-label="Meta de ahorro mensual">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meta de Ahorro</CardTitle>
              <Target className="h-4 w-4 text-golden" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="dashboard-meta-valor">75%</div>
              <Progress value={75} className="mt-2" />
              <p className="text-xs text-gray-600 mt-1">$3,000 para alcanzar meta</p>
            </CardContent>
          </Card>
        </div>

        {/* Sección de Gráficos y Visualizaciones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Tendencia Mensual */}
          <Card data-testid="dashboard-chart-tendencia">
            <CardHeader>
              <CardTitle>Tendencia Mensual</CardTitle>
              <CardDescription>Comparación de ingresos vs gastos en los últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent aria-label="Gráfico de tendencia de gastos e ingresos por mes">
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

          {/* Desglose por Categorías */}
          <Card data-testid="dashboard-chart-distribucion">
            <CardHeader>
              <CardTitle>Gastos por Categoría</CardTitle>
              <CardDescription>Distribución de tus gastos este mes</CardDescription>
            </CardHeader>
            <CardContent aria-label="Distribución de gastos por categoría">
              <div className="space-y-4">
                {estadisticas?.gastosPorCategoria && estadisticas.gastosPorCategoria.length > 0 ? (
                  estadisticas.gastosPorCategoria.map((category, index) => {
                    const percentage = totalGastos > 0 ? (category.total / totalGastos) * 100 : 0;
                    // Obtener el ícono apropiado para la categoría usando la utilidad
                    const IconComponent = getCategoryIcon(category.categoria);
                    
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
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <PieChart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">Sin datos de categorías</p>
                    <p className="text-xs mt-1">Los gastos por categoría aparecerán aquí</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Distribución de Ingresos por Categoría */}
        <Card className="mt-6">
          <CardHeader>
              <CardTitle>Distribución de Ingresos por Categoría</CardTitle>
              <CardDescription>Tus ingresos organizados por categoría este mes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {estadisticas?.ingresosPorCategoria && estadisticas.ingresosPorCategoria.length > 0 ? (
                  estadisticas.ingresosPorCategoria.map((ingreso, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {ingreso.categoria}
                        </span>
                        <span className="text-xs text-gray-500">
                          {ingreso.cantidad} {ingreso.cantidad === 1 ? 'ingreso' : 'ingresos'}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        ${formatCurrency(ingreso.total)}
                      </p>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ 
                            width: `${estadisticas.totalIngresos > 0 ? (ingreso.total / estadisticas.totalIngresos) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {estadisticas.totalIngresos > 0 ? ((ingreso.total / estadisticas.totalIngresos) * 100).toFixed(1) : '0'}% del total
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <PieChart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No hay ingresos por categoría</p>
                    <p className="text-xs mt-1">Los ingresos aparecerán aquí cuando los registres</p>
                  </div>
                )}
              </div>
              <Link to="/ingresos">
                <Button variant="outline" className="w-full mt-4 bg-transparent hover:bg-slate-100 hover:border-slate-300">
                  Ver Todos los Ingresos
                </Button>
              </Link>
            </CardContent>
          </Card>

        {/* Acciones Rápidas */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Funciones más utilizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/importar">
                <Button 
                  className="w-full justify-center bg-transparent transition-all duration-200" 
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
                  className="w-full justify-center bg-transparent transition-all duration-200" 
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
                <Button className="w-full justify-center bg-transparent hover:bg-slate-100 hover:border-slate-300" variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Ver Reportes
                </Button>
              </Link>
              <Link to="/integraciones">
                <Button className="w-full justify-center bg-transparent hover:bg-slate-100 hover:border-slate-300" variant="outline">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Conectar Cuenta
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Home