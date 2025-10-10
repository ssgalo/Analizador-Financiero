import { useState, useEffect, useCallback } from 'react';
import { gastosService, categoriasService } from '../services/api';
import type { Gasto, Categoria, GastoCreate, GastoUpdate } from '../services/api';
import { useAuthStore } from '../stores/authStore'; // ✅ Importar Zustand store

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
  crearGasto: (gasto: GastoCreate) => Promise<Gasto | null>;
  actualizarGasto: (id: number, datos: GastoUpdate) => Promise<Gasto | null>;
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
  // ✅ Obtener usuario desde Zustand
  const { user } = useAuthStore();
  
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filtros, setFiltrosState] = useState<FiltrosGastos>(filtrosIniciales);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // ✅ Verificar usuario desde Zustand
      if (!user || !user.id_usuario) {
        console.warn('⚠️ Usuario no disponible en Zustand store:', user);
        throw new Error('Usuario no autenticado');
      }

      console.log('👤 Cargando datos para usuario:', user.nombre, '- ID:', user.id_usuario);

      // Construir filtros para el backend
      const filtrosBackend: any = {
        id_usuario: user.id_usuario,
        limit: 1000
      };

      if (filtros.fecha_desde) {
        filtrosBackend.fecha_desde = filtros.fecha_desde;
      }
      if (filtros.fecha_hasta) {
        filtrosBackend.fecha_hasta = filtros.fecha_hasta;
      }
      if (filtros.categoria) {
        filtrosBackend.id_categoria = filtros.categoria;
      }

      // Cargar gastos y categorías en paralelo
      const [gastosData, categoriasData] = await Promise.all([
        gastosService.getGastos(filtrosBackend),
        categoriasService.getCategoriasUsuario(user.id_usuario)
      ]);

      // ✅ Filtrar solo gastos confirmados (excluir eliminados y pendientes)
      let gastosFiltrados = gastosData.filter(gasto => gasto.estado === 'confirmado');
      
      // Aplicar filtros locales adicionales
      if (filtros.busqueda && filtros.busqueda.trim()) {
        const termino = filtros.busqueda.toLowerCase().trim();
        gastosFiltrados = gastosFiltrados.filter(gasto => 
          gasto.comercio.toLowerCase().includes(termino) ||
          gasto.descripcion.toLowerCase().includes(termino) ||
          gasto.categoria?.nombre.toLowerCase().includes(termino)
        );
      }

      if (filtros.fuente) {
        gastosFiltrados = gastosFiltrados.filter(gasto => gasto.fuente === filtros.fuente);
      }

      if (filtros.monto_desde !== undefined && filtros.monto_desde > 0) {
        gastosFiltrados = gastosFiltrados.filter(gasto => gasto.monto >= filtros.monto_desde!);
      }
      if (filtros.monto_hasta !== undefined && filtros.monto_hasta > 0) {
        gastosFiltrados = gastosFiltrados.filter(gasto => gasto.monto <= filtros.monto_hasta!);
      }

      setGastos(gastosFiltrados);
      setCategorias(categoriasData);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos');
    } finally {
      setIsLoading(false);
    }
  }, [filtros, user]); // ✅ Agregar user como dependencia

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
      await gastosService.deleteGasto(id);
      await cargarDatos();
      return true;
    } catch (err) {
      console.error('Error al eliminar gasto:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar gasto');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [cargarDatos]);

  const crearGasto = useCallback(async (
    nuevoGasto: GastoCreate
  ): Promise<Gasto | null> => {
    try {
      setIsLoading(true);
      const gastoCreado = await gastosService.createGasto(nuevoGasto);
      await cargarDatos();
      return gastoCreado;
    } catch (err) {
      console.error('Error al crear gasto:', err);
      setError(err instanceof Error ? err.message : 'Error al crear gasto');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [cargarDatos]);

  const actualizarGasto = useCallback(async (
    id: number, 
    datosActualizados: GastoUpdate
  ): Promise<Gasto | null> => {
    try {
      setIsLoading(true);
      const gastoActualizado = await gastosService.updateGasto(id, datosActualizados);
      await cargarDatos();
      return gastoActualizado;
    } catch (err) {
      console.error('Error al actualizar gasto:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar gasto');
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