/**
 * Página de Gestión de Gastos
 * 
 * Permite al usuario:
 * - Ver todos sus gastos en formato tabla
 * - Filtrar gastos por categoría, fecha, monto
 * - Crear nuevos gastos
 * - Editar gastos existentes
 * - Eliminar gastos con confirmación
 * - Ver estadísticas resumidas
 */

import { useState } from "react"
import { Button } from "../components/ui/button"
import { Plus, RefreshCw } from "lucide-react"
import { FormularioGasto } from "../components/forms/FormularioGasto"
import { GastosStats } from "../components/gastos/GastosStats"
import { GastosTabla } from "../components/gastos/GastosTabla"
import { ModalEliminarGasto } from "../components/gastos/ModalEliminarGasto"
import { useGastos } from "../hooks/useGastos"
import type { Gasto, GastoCreate, GastoUpdate } from "../services/api"

function GastosPage() {
  // Hook personalizado para gestión de gastos
  const {
    gastos,
    categorias,
    filtros,
    isLoading,
    error,
    totalGastos,
    setFiltros,
    limpiarFiltros,
    refrescarGastos,
    eliminarGasto,
    crearGasto,
    actualizarGasto
  } = useGastos();

  // Estados locales para gestión de modales y formularios
  const [gastoAEliminar, setGastoAEliminar] = useState<Gasto | null>(null);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [gastoEditar, setGastoEditar] = useState<Gasto | null>(null);

  /**
   * Abre el modal de confirmación de eliminación
   * @param gasto - Gasto que se desea eliminar
   */
  const abrirModalEliminar = (gasto: Gasto) => {
    setGastoAEliminar(gasto);
    setMostrarModalEliminar(true);
  };

  /**
   * Cierra el modal de eliminación y resetea estados
   */
  const cerrarModalEliminar = () => {
    setGastoAEliminar(null);
    setMostrarModalEliminar(false);
    setEliminando(false);
  };

  /**
   * Ejecuta la eliminación del gasto
   * Muestra loading state y maneja errores
   */
  const confirmarEliminarGasto = async () => {
    if (!gastoAEliminar) return;
    
    setEliminando(true);
    const resultado = await eliminarGasto(gastoAEliminar.id_gasto);
    
    if (resultado) {
      cerrarModalEliminar();
    } else {
      setEliminando(false);
    }
  };

  /**
   * Handler para crear un nuevo gasto
   * @param gastoData - Datos del gasto a crear
   */
  const handleCrearGasto = async (gastoData: GastoCreate) => {
    await crearGasto(gastoData);
  };

  /**
   * Handler para actualizar un gasto existente
   * @param id - ID del gasto a actualizar
   * @param gastoData - Datos actualizados del gasto
   */
  const handleActualizarGasto = async (id: number, gastoData: GastoUpdate) => {
    await actualizarGasto(id, gastoData);
  };

  /**
   * Abre el formulario en modo edición con los datos del gasto
   * @param gasto - Gasto a editar
   */
  const handleEditarGasto = (gasto: Gasto) => {
    setGastoEditar(gasto);
    setMostrarFormulario(true);
  };

  /**
   * Cierra el formulario y resetea el estado de edición
   */
  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setGastoEditar(null);
  };

  // Mostrar estado de error si hay problemas al cargar
  if (error) {
    return (
      <div className="p-6 bg-background min-h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <Button onClick={refrescarGastos} variant="outline" className="hover:bg-gray-100 transition-colors duration-200">
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
        {/* Cabecera de la Página */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Mis Gastos</h1>
            <p className="text-gray-600">
              Gestiona todos tus gastos con opciones de filtrado y edición
            </p>
          </div>
          <Button 
            onClick={() => {
              setGastoEditar(null);
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
            Nuevo Gasto
          </Button>
        </div>

        {/* Componente de Estadísticas */}
        <GastosStats 
          totalGastos={totalGastos} 
          cantidadGastos={gastos.length} 
        />

        {/* Componente de Tabla con Filtros Incorporados */}
        <GastosTabla
          gastos={gastos}
          isLoading={isLoading}
          onEditar={handleEditarGasto}
          onEliminar={abrirModalEliminar}
          categorias={categorias}
          filtros={filtros}
          onFiltrosChange={setFiltros}
          onLimpiarFiltros={limpiarFiltros}
        />
      </div>

      {/* Modal de confirmación de eliminación */}
      <ModalEliminarGasto
        isOpen={mostrarModalEliminar}
        gasto={gastoAEliminar}
        isDeleting={eliminando}
        onConfirmar={confirmarEliminarGasto}
        onCancelar={cerrarModalEliminar}
      />

      {/* Modal de formulario */}
      <FormularioGasto
        isOpen={mostrarFormulario}
        onClose={cerrarFormulario}
        onSubmit={handleCrearGasto}
        onUpdate={handleActualizarGasto}
        categorias={categorias}
        gastoEditar={gastoEditar}
        isLoading={isLoading}
      />
    </div>
  );
}

export default GastosPage