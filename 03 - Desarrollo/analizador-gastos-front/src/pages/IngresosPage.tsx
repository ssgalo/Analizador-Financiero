import { useState } from "react"
import { Button } from "../components/ui/button"
import { Plus, RefreshCw } from "lucide-react"
import FormularioIngreso from "../components/forms/FormularioIngreso"
import IngresosStats from "../components/ingresos/IngresosStats"
import { IngresosTabla } from "../components/ingresos/IngresosTabla"
import { useIngresos } from "../hooks/useIngresos"

function IngresosPage() {
  const {
    ingresos,
    filtros,
    isLoading,
    error,
    totalIngresos,
    setFiltros,
    refrescarIngresos,
    eliminarIngreso
  } = useIngresos();

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [ingresoEditar, setIngresoEditar] = useState<any>(null);

  const handleEditarIngreso = (ingreso: any) => {
    setIngresoEditar(ingreso);
    setMostrarFormulario(true);
    // TODO: Implementar edición cuando el formulario lo soporte
    console.log('Editar ingreso:', ingreso, 'Estado actual:', ingresoEditar);
  };

  const handleEliminarIngreso = async (id: number) => {
    await eliminarIngreso(id);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setIngresoEditar(null);
  };

  const handleIngresoCreado = () => {
    refrescarIngresos();
    cerrarFormulario();
  };

  if (error) {
    return (
      <div className="p-6 bg-background min-h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <Button onClick={refrescarIngresos} variant="outline" className="hover:bg-gray-100 transition-colors duration-200">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Mis Ingresos</h1>
            <p className="text-gray-600">
              Gestiona todos tus ingresos con opciones de filtrado y edición
            </p>
          </div>
          <Button 
            onClick={() => {
              setMostrarFormulario(true);
            }}
            style={{ backgroundColor: '#14b8a6', color: 'white' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0f766e';
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#14b8a6';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            className="transition-all duration-300 ease-in-out"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Ingreso
          </Button>
        </div>

        {/* Componente de Estadísticas */}
        <IngresosStats 
          estadisticas={{
            total_ingresos: totalIngresos,
            cantidad_ingresos: ingresos.length,
            promedio_ingreso: ingresos.length > 0 ? totalIngresos / ingresos.length : 0,
            ingresos_por_tipo: {},
            ingresos_por_categoria: {}
          }}
          loading={isLoading}
        />

        {/* Componente de Tabla con Filtros Incorporados */}
        <IngresosTabla
          ingresos={ingresos}
          isLoading={isLoading}
          onEditarIngreso={handleEditarIngreso}
          onEliminarIngreso={handleEliminarIngreso}
          filtrosActivos={filtros}
          onFiltrosChange={setFiltros}
        />
      </div>

      {/* Modal de formulario */}
      {mostrarFormulario && (
        <FormularioIngreso
          onClose={cerrarFormulario}
          onIngresoCreado={handleIngresoCreado}
        />
      )}
    </div>
  );
}

export default IngresosPage
