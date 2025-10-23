import { useState, useEffect, useCallback } from 'react';
import { gastosService, categoriasService, authService } from '../services/api';
import type { Gasto, Categoria } from '../services/api';
import { CATEGORIAS_GASTOS, filtrarCategorias, obtenerCategoriasFaltantes } from '../utils/categoryHelpers';
import { getRangoMesActual } from '../utils/dateHelpers';

/**
 * Interfaz para los filtros de gastos
 */
interface FiltrosGastos {
  fecha_desde?: string;
  fecha_hasta?: string;
  categoria?: number;
  fuente?: string;
  busqueda?: string;
  monto_desde?: number;
  monto_hasta?: number;
}

/**
 * Interfaz de retorno del hook useGastos
 */
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
  crearGasto: (gasto: any) => Promise<Gasto | null>;
  actualizarGasto: (id: number, datos: any) => Promise<Gasto | null>;
}

/**
 * Estado inicial de los filtros de gastos
 */
const filtrosIniciales: FiltrosGastos = {
  fecha_desde: '',
  fecha_hasta: '',
  categoria: undefined,
  fuente: '',
  busqueda: '',
  monto_desde: undefined,
  monto_hasta: undefined
};

/**
 * Hook personalizado para gestionar gastos
 * 
 * Proporciona funcionalidades para:
 * - Cargar y filtrar gastos del usuario autenticado
 * - Gestionar categorías de gastos
 * - Crear, actualizar y eliminar gastos
 * - Calcular totales y estadísticas
 * 
 * @returns {UseGastosReturn} Objeto con gastos, categorías, métodos CRUD y estado de carga
 * 
 * @example
 * const { gastos, categorias, totalGastos, crearGasto } = useGastos();
 */
export const useGastos = (): UseGastosReturn => {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filtros, setFiltrosState] = useState<FiltrosGastos>(filtrosIniciales);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Asegura que existan las categorías básicas de gastos
   * Crea las categorías faltantes si no existen en la base de datos
   * 
   * @param categoriasExistentes - Array de categorías ya existentes
   * @returns Array de categorías recién creadas
   */
  const asegurarCategoriasBasicas = useCallback(async (categoriasExistentes: Categoria[]) => {
    // Obtener las categorías faltantes usando la utilidad
    const categoriasFaltantes = obtenerCategoriasFaltantes(categoriasExistentes, CATEGORIAS_GASTOS);
    const categoriasCreadas: Categoria[] = [];

    // Crear cada categoría faltante
    for (const categoriaInfo of categoriasFaltantes) {
      try {
        console.log(`🏷️ Creando categoría de gasto: ${categoriaInfo.nombre}`);
        const nuevaCategoria = await categoriasService.createCategoria({
          nombre: categoriaInfo.nombre,
          descripcion: categoriaInfo.descripcion,
          es_personalizada: false,
          color: categoriaInfo.color,
          icono: categoriaInfo.icono
        });
        categoriasCreadas.push(nuevaCategoria);
      } catch (err) {
        console.warn(`⚠️ No se pudo crear la categoría ${categoriaInfo.nombre}:`, err);
      }
    }

    return categoriasCreadas;
  }, []);

  /**
   * Carga los datos de gastos y categorías desde la API
   * Aplica filtros del mes actual y filtros personalizados del usuario
   */
  const cargarDatos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Verificar si el usuario está autenticado
      const user = authService.getStoredUser();
      if (!user) {
        setError('Usuario no autenticado');
        return;
      }

      // Calcular fechas del mes actual utilizando utilidades
      const rangoMesActual = getRangoMesActual();
      const fechaActual = new Date();
      const añoActual = fechaActual.getFullYear();
      const mesActual = fechaActual.getMonth() + 1;
      
      console.log('📅 Debug Fechas - Mes actual:', {
        fechaActual: fechaActual.toISOString(),
        añoActual,
        mesActual,
        rangoCalculado: rangoMesActual
      });

      // Preparar filtros para la API
      const filtrosAPI: any = {
        id_usuario: user.id_usuario,
        fecha_desde: rangoMesActual.fechaDesde,
        fecha_hasta: rangoMesActual.fechaHasta,
        limit: 1000 // Límite alto para obtener todos los gastos del mes
      };

      // Aplicar filtros adicionales del usuario (sobrescriben el rango del mes si están definidos)
      if (filtros.categoria) {
        filtrosAPI.id_categoria = filtros.categoria;
      }
      if (filtros.fecha_desde && filtros.fecha_desde.trim()) {
        filtrosAPI.fecha_desde = filtros.fecha_desde;
      }
      if (filtros.fecha_hasta && filtros.fecha_hasta.trim()) {
        filtrosAPI.fecha_hasta = filtros.fecha_hasta;
      }

      // Cargar gastos y categorías desde la API
      const [gastosData, categoriasData] = await Promise.all([
        gastosService.getGastos(filtrosAPI),
        categoriasService.getCategorias()
      ]);

      console.log('📊 Debug API Response:', {
        totalGastosRecibidos: gastosData.length,
        primeros3Gastos: gastosData.slice(0, 3).map(g => ({
          id: g.id_gasto,
          fecha: g.fecha,
          monto: g.monto,
          estado: g.estado,
          descripcion: g.descripcion
        })),
        sumaDirectaAPI: gastosData.reduce((sum, g) => sum + (Number(g.monto) || 0), 0)
      });

      // Asegurar que existan las categorías básicas para gastos
      const categoriasCreadas = await asegurarCategoriasBasicas(categoriasData);
      const todasLasCategorias = [...categoriasData, ...categoriasCreadas];
      
      // Filtrar solo las categorías permitidas para gastos y eliminar duplicados
      const nombresPermitidos = CATEGORIAS_GASTOS.map(c => c.nombre);
      const categoriasFiltradas = filtrarCategorias(todasLasCategorias, nombresPermitidos);
      
      console.log('🔍 Debug - Categorías sin duplicados:', categoriasFiltradas.map(c => c.nombre));
      console.log('🔍 Debug - Datos de gastos desde API:', gastosData);
      console.log('🔍 Debug - Filtros aplicados:', filtros);
      console.log('🔍 Debug - Filtros API enviados:', filtrosAPI);
      
      // Filtrar solo gastos confirmados
      let gastosFiltrados = gastosData.filter((gasto: Gasto) => gasto.estado === 'confirmado');
      
      // Aplicar filtros adicionales del lado del cliente solo si están definidos
      if (filtros.fecha_desde && filtros.fecha_desde.trim() !== '') {
        gastosFiltrados = gastosFiltrados.filter((gasto: Gasto) => gasto.fecha >= filtros.fecha_desde!);
      }
      
      if (filtros.fecha_hasta && filtros.fecha_hasta.trim() !== '') {
        gastosFiltrados = gastosFiltrados.filter((gasto: Gasto) => gasto.fecha <= filtros.fecha_hasta!);
      }
      
      if (filtros.busqueda && filtros.busqueda.trim()) {
        const termino = filtros.busqueda.toLowerCase().trim();
        
        gastosFiltrados = gastosFiltrados.filter((gasto: Gasto) => {
          const comercio = (gasto.comercio || '').toLowerCase();
          const descripcion = (gasto.descripcion || '').toLowerCase();
          const categoria = (gasto.categoria?.nombre || '').toLowerCase();
          
          return comercio.includes(termino) ||
                 descripcion.includes(termino) ||
                 categoria.includes(termino);
        });
      }

      // Filtrar por categoría
      if (filtros.categoria !== undefined && filtros.categoria !== null) {
        gastosFiltrados = gastosFiltrados.filter((gasto: Gasto) => 
          gasto.id_categoria === filtros.categoria
        );
      }

      if (filtros.fuente) {
        gastosFiltrados = gastosFiltrados.filter((gasto: Gasto) => gasto.fuente === filtros.fuente);
      }

      if (filtros.monto_desde !== undefined) {
        gastosFiltrados = gastosFiltrados.filter((gasto: Gasto) => gasto.monto >= filtros.monto_desde!);
      }
      if (filtros.monto_hasta !== undefined) {
        gastosFiltrados = gastosFiltrados.filter((gasto: Gasto) => gasto.monto <= filtros.monto_hasta!);
      }

      // Debug: verificar filtrado del lado del cliente
      console.log('🔍 Debug - Gastos después del filtrado cliente:', gastosFiltrados.length, 'gastos');
      console.log('🔍 Debug - Gastos completos para análisis:', gastosFiltrados.map(g => ({
        id: g.id_gasto,
        fecha: g.fecha,
        monto: g.monto,
        tipoMonto: typeof g.monto,
        descripcion: g.descripcion,
        estado: g.estado,
        comercio: g.comercio
      })));
      
      if (filtros.fecha_desde || filtros.fecha_hasta) {
        console.log('🔍 Debug - Filtros de fecha aplicados:', {
          fecha_desde: filtros.fecha_desde,
          fecha_hasta: filtros.fecha_hasta,
          primeraFechaGasto: gastosFiltrados[0]?.fecha,
          ultimaFechaGasto: gastosFiltrados[gastosFiltrados.length - 1]?.fecha
        });
      }

      // Asignar categoría completa a cada gasto y normalizar el monto
      const gastosConCategorias = gastosFiltrados.map((gasto: Gasto) => ({
        ...gasto,
        monto: typeof gasto.monto === 'string' ? parseFloat(gasto.monto) : gasto.monto,
        categoria: categoriasFiltradas.find((cat: Categoria) => cat.id_categoria === gasto.id_categoria)
      }));

      // Ordenar por fecha descendente (más reciente primero)
      const gastosOrdenados = gastosConCategorias.sort((a, b) => {
        const fechaA = new Date(a.fecha).getTime();
        const fechaB = new Date(b.fecha).getTime();
        return fechaB - fechaA;
      });

      setGastos(gastosOrdenados);
      setCategorias(categoriasFiltradas);
    } catch (err) {
      console.error('Error al cargar gastos:', err);
      setError(err instanceof Error ? err.message : 'Error al conectar con la base de datos');
    } finally {
      setIsLoading(false);
    }
  }, [filtros, asegurarCategoriasBasicas]);

  /**
   * Actualiza los filtros de gastos
   * @param nuevos - Filtros parciales a aplicar
   */
  const setFiltros = useCallback((nuevos: Partial<FiltrosGastos>) => {
    setFiltrosState(prev => ({ ...prev, ...nuevos }));
  }, []);

  /**
   * Resetea todos los filtros a su estado inicial
   */
  const limpiarFiltros = useCallback(() => {
    setFiltrosState(filtrosIniciales);
  }, []);

  /**
   * Recarga manualmente los datos de gastos
   */
  const refrescarGastos = useCallback(() => {
    cargarDatos();
  }, [cargarDatos]);

  /**
   * Elimina un gasto por su ID
   * @param id - ID del gasto a eliminar
   * @returns Promise<boolean> - true si se eliminó correctamente, false en caso contrario
   */
  const eliminarGasto = useCallback(async (id: number): Promise<boolean> => {
    try {
      await gastosService.deleteGasto(id);
      await cargarDatos();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar gasto');
      return false;
    }
  }, [cargarDatos]);

  /**
   * Crea un nuevo gasto
   * Agrega automáticamente el ID del usuario autenticado
   * 
   * @param gastoData - Datos del gasto a crear
   * @returns Promise<Gasto | null> - Gasto creado o null si hubo error
   */
  const crearGasto = useCallback(async (gastoData: any): Promise<Gasto | null> => {
    try {
      // Verificar si el usuario está autenticado
      const user = authService.getStoredUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Agregar el ID del usuario al gasto
      const gastoCompleto = {
        ...gastoData,
        id_usuario: user.id_usuario
      };

      const gastoCreado = await gastosService.createGasto(gastoCompleto);
      await cargarDatos();
      return gastoCreado;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear gasto');
      return null;
    }
  }, [cargarDatos]);

  /**
   * Actualiza un gasto existente
   * 
   * @param id - ID del gasto a actualizar
   * @param datos - Datos parciales o completos del gasto
   * @returns Promise<Gasto | null> - Gasto actualizado o null si hubo error
   */
  const actualizarGasto = useCallback(async (id: number, datos: any): Promise<Gasto | null> => {
    try {
      const gastoActualizado = await gastosService.updateGasto(id, datos);
      await cargarDatos();
      return gastoActualizado;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar gasto');
      return null;
    }
  }, [cargarDatos]);

  // Cargar datos cuando el hook se monta o cuando cambian los filtros
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Calcular el total de gastos
  const totalGastos = gastos.reduce((total, gasto) => {
    const monto = typeof gasto.monto === 'number' && !isNaN(gasto.monto) ? gasto.monto : 0;
    return total + monto;
  }, 0);

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