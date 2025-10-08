import React, { useState, useEffect } from 'react';
import { Calendar, Plus, TrendingUp, Clock, Filter } from 'lucide-react';
import IngresosStats from '../components/ingresos/IngresosStats';
import IngresosFiltros from '../components/ingresos/IngresosFiltros';
import IngresosTabla from '../components/ingresos/IngresosTabla';
import FormularioIngreso from '../components/forms/FormularioIngreso';
import { ingresosService, type Ingreso, type IngresoStats } from '../services/api';
import { useAuthStore } from '../stores/authStore';

const IngresosPage: React.FC = () => {
  // Estados
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [estadisticas, setEstadisticas] = useState<IngresoStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showFiltros, setShowFiltros] = useState(false);
  const [mesActual, setMesActual] = useState(new Date().getMonth() + 1);
  const [añoActual, setAñoActual] = useState(new Date().getFullYear());
  const [filtrosActivos, setFiltrosActivos] = useState<any>({});

  const { user } = useAuthStore();

  // Cargar datos inicial
  useEffect(() => {
    if (user) {
      cargarDatos();
    }
  }, [user, mesActual, añoActual, filtrosActivos]);

  const cargarDatos = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Calcular fechas del mes
      const fechaDesde = `${añoActual}-${mesActual.toString().padStart(2, '0')}-01`;
      const ultimoDiaDelMes = new Date(añoActual, mesActual, 0).getDate();
      const fechaHasta = `${añoActual}-${mesActual.toString().padStart(2, '0')}-${ultimoDiaDelMes.toString().padStart(2, '0')}`;

      // Aplicar filtros adicionales
      const filtros = {
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        limit: 1000,
        ...filtrosActivos
      };

      const [ingresosData, statsData] = await Promise.all([
        ingresosService.getIngresos(filtros),
        ingresosService.getEstadisticas(añoActual, mesActual)
      ]);

      setIngresos(ingresosData);
      setEstadisticas(statsData);
    } catch (error) {
      console.error('Error al cargar datos de ingresos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIngresoCreado = () => {
    cargarDatos();
    setShowModal(false);
  };

  const handleIngresoEliminado = () => {
    cargarDatos();
  };

  const handleIngresoActualizado = () => {
    cargarDatos();
  };

  const handleFiltrosChange = (nuevosFiltros: any) => {
    setFiltrosActivos(nuevosFiltros);
  };

  const cambiarMes = (incremento: number) => {
    let nuevoMes = mesActual + incremento;
    let nuevoAño = añoActual;

    if (nuevoMes > 12) {
      nuevoMes = 1;
      nuevoAño += 1;
    } else if (nuevoMes < 1) {
      nuevoMes = 12;
      nuevoAño -= 1;
    }

    setMesActual(nuevoMes);
    setAñoActual(nuevoAño);
  };

  const mesNombre = new Date(añoActual, mesActual - 1).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric'
  });

  const esMesActual = mesActual === new Date().getMonth() + 1 && añoActual === new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Ingresos</h1>
                <p className="text-gray-600">Gestiona y analiza tus ingresos</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowFiltros(!showFiltros)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span>Filtros</span>
              </button>

              <button
                onClick={() => setShowModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Nuevo Ingreso</span>
              </button>
            </div>
          </div>

          {/* Navegación de mes */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => cambiarMes(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ←
              </button>
              
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900 capitalize">
                  {mesNombre}
                </h2>
                {esMesActual && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                    Actual
                  </span>
                )}
              </div>

              <button
                onClick={() => cambiarMes(1)}
                disabled={esMesActual}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Última actualización: hace unos segundos</span>
            </div>
          </div>
        </div>

        {/* Filtros */}
        {showFiltros && (
          <IngresosFiltros
            onFiltrosChange={handleFiltrosChange}
            filtrosActivos={filtrosActivos}
          />
        )}

        {/* Estadísticas */}
        {estadisticas && (
          <IngresosStats 
            estadisticas={estadisticas}
            loading={loading}
          />
        )}

        {/* Tabla de ingresos */}
        <IngresosTabla
          ingresos={ingresos}
          loading={loading}
          onIngresoEliminado={handleIngresoEliminado}
          onIngresoActualizado={handleIngresoActualizado}
        />

        {/* Modal para crear/editar ingreso */}
        {showModal && (
          <FormularioIngreso
            onClose={() => setShowModal(false)}
            onIngresoCreado={handleIngresoCreado}
          />
        )}
      </div>
    </div>
  );
};

export default IngresosPage;