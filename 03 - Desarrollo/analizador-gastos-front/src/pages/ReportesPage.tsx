import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { gastosService, ingresosService, categoriasService } from '../services/api';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineIcon,
  RefreshCw,
  Calendar,
  CalendarDays,
  CalendarRange
} from 'lucide-react';

interface EstadisticaResumen {
  totalGastos: number;
  totalIngresos: number;
  balance: number;
  gastosPorCategoria: Array<{
    categoria: string;
    total: number;
    porcentaje: number;
  }>;
  tendenciaMensual: Array<{
    mes: string;
    gastos: number;
    ingresos: number;
    balance: number;
  }>;
}

export default function ReportesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<'semanal' | 'mensual' | 'anual'>('mensual');
  const [estadisticas, setEstadisticas] = useState<EstadisticaResumen | null>(null);

  // Colores para los gráficos
  const COLORES = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1',
    '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98'
  ];

  // Función para configurar períodos predefinidos
  const configurarPeriodo = (tipo: 'semanal' | 'mensual' | 'anual') => {
    const hoy = new Date();
    let fechaDesdeISO: string;
    let fechaHastaISO: string;

    switch (tipo) {
      case 'semanal':
        // Últimos 7 días
        const semanaAtras = new Date(hoy);
        semanaAtras.setDate(hoy.getDate() - 7);
        fechaDesdeISO = semanaAtras.toISOString().split('T')[0];
        fechaHastaISO = hoy.toISOString().split('T')[0];
        break;
        
      case 'mensual':
        // Mes actual completo
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fechaDesdeISO = inicioMes.toISOString().split('T')[0];
        fechaHastaISO = hoy.toISOString().split('T')[0];
        break;
        
      case 'anual':
        // Año actual completo
        const inicioAño = new Date(hoy.getFullYear(), 0, 1);
        fechaDesdeISO = inicioAño.toISOString().split('T')[0];
        fechaHastaISO = hoy.toISOString().split('T')[0];
        break;
    }

    setFechaDesde(fechaDesdeISO);
    setFechaHasta(fechaHastaISO);
    setPeriodoSeleccionado(tipo);


  };

  useEffect(() => {
    // Configurar período mensual por defecto
    configurarPeriodo('mensual');
  }, []);

  // Cargar datos cuando ambas fechas estén configuradas
  useEffect(() => {
    if (fechaDesde && fechaHasta) {
      const timeoutId = setTimeout(cargarDatos, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [fechaDesde, fechaHasta]);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validar fechas
      if (!fechaDesde || !fechaHasta) {
        setIsLoading(false);
        return;
      }

      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(fechaDesde) || !fechaRegex.test(fechaHasta)) {
        setError('Formato de fecha incorrecto.');
        setIsLoading(false);
        return;
      }

      // Cargar datos en paralelo
      const [gastos, ingresos, categorias] = await Promise.all([
        gastosService.getGastos({
          fecha_desde: fechaDesde,
          fecha_hasta: fechaHasta,
          limit: 1000
        }),
        ingresosService.getIngresos({
          fecha_desde: fechaDesde,
          fecha_hasta: fechaHasta,
          limit: 1000
        }),
        categoriasService.getCategorias({ limit: 100 })
      ]);

      // Procesar estadísticas
      const totalGastos = gastos.reduce((sum, gasto) => sum + (parseFloat(String(gasto.monto)) || 0), 0);
      const totalIngresos = ingresos.reduce((sum, ingreso) => sum + (parseFloat(String(ingreso.monto)) || 0), 0);
      const balance = totalIngresos - totalGastos;

      // Gastos por categoría
      const gastosPorCat: Record<string, number> = {};
      gastos.forEach(gasto => {
        const categoria = categorias.find(cat => cat.id_categoria === gasto.id_categoria);
        const nombreCat = categoria?.nombre || 'Sin categoría';
        gastosPorCat[nombreCat] = (gastosPorCat[nombreCat] || 0) + (parseFloat(String(gasto.monto)) || 0);
      });

      const gastosPorCategoria = Object.entries(gastosPorCat)
        .map(([categoria, total]) => ({
          categoria,
          total,
          porcentaje: totalGastos > 0 ? (total / totalGastos) * 100 : 0
        }))
        .sort((a, b) => b.total - a.total);

      const tendenciaMensual = await generarTendenciaMensual();

      setEstadisticas({
        totalGastos,
        totalIngresos,
        balance,
        gastosPorCategoria,
        tendenciaMensual
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al cargar los datos: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };



  const generarTendenciaMensual = async () => {
    const tendencia = [];
    const hoy = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const fechaFin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
      
      const fechaDesdeStr = fecha.toISOString().split('T')[0];
      const fechaHastaStr = fechaFin.toISOString().split('T')[0];

      try {
        const [gastosMes, ingresosMes] = await Promise.all([
          gastosService.getGastos({
            fecha_desde: fechaDesdeStr,
            fecha_hasta: fechaHastaStr,
            limit: 1000
          }),
          ingresosService.getIngresos({
            fecha_desde: fechaDesdeStr,
            fecha_hasta: fechaHastaStr,
            limit: 1000
          })
        ]);

        const totalGastosMes = gastosMes.reduce((sum, gasto) => sum + (parseFloat(String(gasto.monto)) || 0), 0);
        const totalIngresosMes = ingresosMes.reduce((sum, ingreso) => sum + (parseFloat(String(ingreso.monto)) || 0), 0);

        tendencia.push({
          mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
          gastos: totalGastosMes,
          ingresos: totalIngresosMes,
          balance: totalIngresosMes - totalGastosMes
        });
      } catch (error) {
        // Silently continue on error
      }
    }

    return tendencia;
  };

  // Funciones auxiliares
  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  };

  const formatearFechaParaMostrar = (fechaISO: string): string => {
    if (!fechaISO) return '';
    const fecha = new Date(fechaISO + 'T00:00:00');
    return fecha.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getNombrePeriodo = () => {
    const nombres = {
      semanal: 'Últimos 7 días',
      mensual: 'Este mes',
      anual: 'Este año'
    };
    return nombres[periodoSeleccionado];
  };



  const exportarDatos = () => {
    if (!estadisticas) return;
    
    try {
      const csvRows = [
        ['Tipo', 'Concepto', 'Valor'],
        ['Resumen', 'Total Ingresos', estadisticas.totalIngresos.toFixed(2)],
        ['Resumen', 'Total Gastos', estadisticas.totalGastos.toFixed(2)],
        ['Resumen', 'Balance', estadisticas.balance.toFixed(2)],
        ['', '', ''],
        ['Categoría', 'Gasto', 'Porcentaje'],
        ...estadisticas.gastosPorCategoria.map(cat => [
          cat.categoria,
          cat.total.toFixed(2),
          `${cat.porcentaje.toFixed(1)}%`
        ])
      ];

      const csvContent = '\uFEFF' + csvRows.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = `reporte-financiero-${fechaDesde}-${fechaHasta}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error al exportar el archivo CSV. Intenta nuevamente.');
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Cargando reportes...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={cargarDatos}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return <ReportesContent estadisticas={estadisticas} />;
  };

  const ReportesContent = ({ estadisticas }: { estadisticas: EstadisticaResumen | null }) => {
    if (!estadisticas) return null;

    return (
      <>
        {/* Resumen General */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatearMoneda(estadisticas.totalIngresos)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatearMoneda(estadisticas.totalGastos)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              <DollarSign className={`h-4 w-4 ${estadisticas.balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${estadisticas.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatearMoneda(estadisticas.balance)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieIcon className="w-5 h-5" />
                Gastos por Categoría
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={estadisticas.gastosPorCategoria.slice(0, 8)}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="total"
                    nameKey="categoria"
                    label={(entry: any) => `${entry.categoria}: ${entry.porcentaje.toFixed(1)}%`}
                  >
                    {estadisticas.gastosPorCategoria.slice(0, 8).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [formatearMoneda(value), name]} />
                  <Legend 
                    content={() => (
                      <ul className="flex flex-wrap justify-center gap-4 text-sm">
                        {estadisticas.gastosPorCategoria.slice(0, 8).map((item, index) => (
                          <li key={item.categoria} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-sm" 
                              style={{ backgroundColor: COLORES[index % COLORES.length] }}
                            />
                            <span>{item.categoria}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineIcon className="w-5 h-5" />
                Tendencia Mensual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={estadisticas.tendenciaMensual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [formatearMoneda(value), '']} />
                  <Legend />
                  <Line type="monotone" dataKey="ingresos" stroke="#10b981" name="Ingresos" strokeWidth={2} />
                  <Line type="monotone" dataKey="gastos" stroke="#ef4444" name="Gastos" strokeWidth={2} />
                  <Line type="monotone" dataKey="balance" stroke="#3b82f6" name="Balance" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Gastos por Categoría */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Detalle por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Categoría</th>
                    <th className="text-right py-2">Monto</th>
                    <th className="text-right py-2">Porcentaje</th>
                    <th className="text-right py-2">Gráfico</th>
                  </tr>
                </thead>
                <tbody>
                  {estadisticas.gastosPorCategoria.map((categoria, index) => (
                    <tr key={categoria.categoria} className="border-b">
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORES[index % COLORES.length] }}
                          />
                          {categoria.categoria}
                        </div>
                      </td>
                      <td className="text-right py-2">
                        {formatearMoneda(categoria.total)}
                      </td>
                      <td className="text-right py-2">
                        {categoria.porcentaje.toFixed(1)}%
                      </td>
                      <td className="text-right py-2">
                        <div className="w-full max-w-20 ml-auto">
                          <div className="h-2 rounded-full bg-gray-200">
                            <div 
                              className="h-full rounded-full"
                              style={{ 
                                width: `${categoria.porcentaje}%`,
                                backgroundColor: COLORES[index % COLORES.length]
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </>
    );
  };

  return (
    <div className="p-6 bg-background min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Reportes Financieros</h1>
            <p className="text-gray-600">Análisis detallado de tus ingresos y gastos</p>
          </div>
          
          {estadisticas && (
            <button
              type="button"
              onClick={exportarDatos}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          )}
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Período de Análisis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {[
                  { tipo: 'semanal' as const, icon: Calendar, label: 'Últimos 7 días' },
                  { tipo: 'mensual' as const, icon: CalendarDays, label: 'Este mes' },
                  { tipo: 'anual' as const, icon: CalendarRange, label: 'Este año' }
                ].map(({ tipo, icon: Icon, label }) => (
                  <button
                    key={tipo}
                    onClick={() => configurarPeriodo(tipo)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      periodoSeleccionado === tipo
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
              
              {fechaDesde && fechaHasta && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">
                      {getNombrePeriodo()}
                    </p>
                  </div>
                  <p className="text-xs text-blue-600 mt-1 ml-6">
                    {formatearFechaParaMostrar(fechaDesde)} - {formatearFechaParaMostrar(fechaHasta)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {renderContent()}
      </div>
    </div>
  );
}