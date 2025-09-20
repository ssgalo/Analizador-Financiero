import { useState, useEffect, useCallback } from 'react';
import { mockApi } from '../services/mockApi';
import type { Gasto, Categoria } from '../services/mockApi';

interface FiltrosGastos {
  fecha_desde?: string;
  fecha_hasta?: string;
  categoria?: number;
  fuente?: string;
  busqueda?: string;
  monto_desde?: number;
  monto_hasta?: number;
}

interface UseGastosReturn {
  gastos: Gasto[];
  categorias: Categoria[];
  filtros: FiltrosGastos;
  isLoading: boolean;
  error: string | null;
  totalGastos: number;
  setFiltros: (nuevos: Partial<FiltrosGastos>) => void;
  limpiarFiltros: () => void;
  refrescarGastos: () => void;
  eliminarGasto: (id: number) => Promise<boolean>;
  crearGasto: (gasto: Omit<Gasto, 'id_gasto' | 'fecha_creacion' | 'fecha_modificacion'>) => Promise<Gasto | null>;
  actualizarGasto: (id: number, datos: Partial<Gasto>) => Promise<Gasto | null>;
}

const filtrosIniciales: FiltrosGastos = {
  fecha_desde: '',
  fecha_hasta: '',
  categoria: undefined,
  fuente: '',
  busqueda: '',
  monto_desde: undefined,
  monto_hasta: undefined
};

export const useGastos = (): UseGastosReturn => {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filtros, setFiltrosState] = useState<FiltrosGastos>(filtrosIniciales);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [gastosData, categoriasData] = await Promise.all([
        mockApi.getGastos(filtros),
        mockApi.getCategorias()
      ]);

      // Aplicar filtros locales
      let gastosFiltrados = gastosData;
      
      // Filtro de búsqueda
      if (filtros.busqueda && filtros.busqueda.trim()) {
        const termino = filtros.busqueda.toLowerCase().trim();
        gastosFiltrados = gastosFiltrados.filter(gasto => 
          gasto.comercio.toLowerCase().includes(termino) ||
          gasto.descripcion.toLowerCase().includes(termino) ||
          gasto.categoria?.nombre.toLowerCase().includes(termino)
        );
      }

      // Filtros de monto
      if (filtros.monto_desde !== undefined && filtros.monto_desde > 0) {
        gastosFiltrados = gastosFiltrados.filter(gasto => gasto.monto >= filtros.monto_desde!);
      }
      if (filtros.monto_hasta !== undefined && filtros.monto_hasta > 0) {
        gastosFiltrados = gastosFiltrados.filter(gasto => gasto.monto <= filtros.monto_hasta!);
      }

      setGastos(gastosFiltrados);
      setCategorias(categoriasData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [filtros]);

  // Cargar datos cuando cambian los filtros
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const setFiltros = useCallback((nuevosFiltros: Partial<FiltrosGastos>) => {
    setFiltrosState(prev => ({ ...prev, ...nuevosFiltros }));
  }, []);

  const limpiarFiltros = useCallback(() => {
    setFiltrosState(filtrosIniciales);
  }, []);

  const refrescarGastos = useCallback(() => {
    cargarDatos();
  }, [cargarDatos]);

  const eliminarGasto = useCallback(async (id: number): Promise<boolean> => {
    try {
      setIsLoading(true);
      const resultado = await mockApi.deleteGasto(id);
      if (resultado) {
        await cargarDatos(); // Recargar la lista
      }
      return resultado;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [cargarDatos]);

  const crearGasto = useCallback(async (
    nuevoGasto: Omit<Gasto, 'id_gasto' | 'fecha_creacion' | 'fecha_modificacion'>
  ): Promise<Gasto | null> => {
    try {
      setIsLoading(true);
      const gastoCreado = await mockApi.createGasto(nuevoGasto);
      await cargarDatos(); // Recargar la lista
      return gastoCreado;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear gasto');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [cargarDatos]);

  const actualizarGasto = useCallback(async (
    id: number, 
    datosActualizados: Partial<Gasto>
  ): Promise<Gasto | null> => {
    try {
      setIsLoading(true);
      const gastoActualizado = await mockApi.updateGasto(id, datosActualizados);
      if (gastoActualizado) {
        await cargarDatos(); // Recargar la lista
      }
      return gastoActualizado;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [cargarDatos]);

  const totalGastos = gastos.reduce((total, gasto) => total + gasto.monto, 0);

  return {
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
  };
};