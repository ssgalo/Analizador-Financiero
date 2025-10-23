import { useState, useCallback, useEffect } from 'react';
import { ingresosService, categoriasService, authService } from '../services/api';
import type { Ingreso, Categoria } from '../services/api';
import { CATEGORIAS_INGRESOS, obtenerCategoriasFaltantes } from '../utils/categoryHelpers';

/**
 * Interfaz para los filtros de ingresos
 */
interface FiltrosIngresos {
  fecha_desde?: string;
  fecha_hasta?: string;
  categoria?: number;
  tipo?: string;
  monto_desde?: number;
  monto_hasta?: number;
  busqueda?: string;
}

/**
 * Interfaz de retorno del hook useIngresos
 */
interface UseIngresosReturn {
  ingresos: Ingreso[];
  categorias: Categoria[];
  filtros: FiltrosIngresos;
  isLoading: boolean;
  error: string | null;
  totalIngresos: number;
  setFiltros: (nuevos: Partial<FiltrosIngresos>) => void;
  limpiarFiltros: () => void;
  refrescarIngresos: () => void;
  eliminarIngreso: (id: number) => Promise<boolean>;
  crearIngreso: (ingreso: any) => Promise<Ingreso | null>;
  actualizarIngreso: (id: number, datos: any) => Promise<Ingreso | null>;
}

/**
 * Estado inicial de los filtros de ingresos
 */
const filtrosIniciales: FiltrosIngresos = {
  fecha_desde: '',
  fecha_hasta: '',
  categoria: undefined,
  tipo: '',
  busqueda: '',
  monto_desde: undefined,
  monto_hasta: undefined
};

/**
 * Hook personalizado para gestionar ingresos
 * 
 * Proporciona funcionalidades para:
 * - Cargar y filtrar ingresos del usuario autenticado
 * - Gestionar categorías de ingresos
 * - Crear, actualizar y eliminar ingresos
 * - Calcular totales
 * 
 * @returns {UseIngresosReturn} Objeto con ingresos, categorías, métodos CRUD y estado de carga
 * 
 * @example
 * const { ingresos, categorias, totalIngresos, crearIngreso } = useIngresos();
 */
export const useIngresos = (): UseIngresosReturn => {
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filtros, setFiltrosState] = useState<FiltrosIngresos>(filtrosIniciales);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Asegura que existan las categorías básicas de ingresos
   * Crea las categorías faltantes si no existen en la base de datos
   * 
   * @param categoriasExistentes - Array de categorías ya existentes
   * @returns Array de categorías recién creadas
   */
  const asegurarCategoriasIngresos = useCallback(async (categoriasExistentes: Categoria[]) => {
    // Obtener las categorías faltantes usando la utilidad
    const categoriasFaltantes = obtenerCategoriasFaltantes(categoriasExistentes, CATEGORIAS_INGRESOS);
    const categoriasCreadas: Categoria[] = [];

    // Crear cada categoría faltante
    for (const categoriaInfo of categoriasFaltantes) {
      try {
        console.log(`🏷️ Creando categoría de ingreso: ${categoriaInfo.nombre}`);
        const nuevaCategoria = await categoriasService.createCategoria({
          nombre: categoriaInfo.nombre,
          descripcion: categoriaInfo.descripcion,
          es_personalizada: false,
          color: categoriaInfo.color,
          icono: categoriaInfo.icono
        });
        categoriasCreadas.push(nuevaCategoria);
      } catch (err) {
        console.warn(`⚠️ No se pudo crear la categoría de ingreso ${categoriaInfo.nombre}:`, err);
      }
    }

    return categoriasCreadas;
  }, []);

  /**
   * Carga los datos de ingresos y categorías desde la API
   * Aplica filtros del usuario si están definidos
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

      // Preparar filtros para la API, incluyendo el ID del usuario
      const filtrosAPI: any = {
        id_usuario: user.id_usuario,
        limit: 1000
      };

      // Aplicar filtros de fecha si existen
      if (filtros.fecha_desde) {
        filtrosAPI.fecha_desde = filtros.fecha_desde;
      }
      if (filtros.fecha_hasta) {
        filtrosAPI.fecha_hasta = filtros.fecha_hasta;
      }
      if (filtros.categoria) {
        filtrosAPI.id_categoria = filtros.categoria;
      }
      if (filtros.tipo) {
        filtrosAPI.tipo = filtros.tipo;
      }

      // Cargar ingresos y categorías desde la API real
      const [ingresosData, categoriasData] = await Promise.all([
        ingresosService.getIngresos(filtrosAPI),
        categoriasService.getCategorias()
      ]);

      // Asegurar que existan las categorías básicas para ingresos
      const categoriasCreadas = await asegurarCategoriasIngresos(categoriasData);
      const todasLasCategorias = [...categoriasData, ...categoriasCreadas];
      
      // Filtrar solo las categorías específicas para ingresos
      const categoriasIngresos = ['Otros', 'Regalos', 'Bonos', 'Salario', 'Ventas', 'Freelance', 'Inversiones'];
      const categoriasFiltradas = todasLasCategorias.filter(cat => 
        categoriasIngresos.some(nombre => 
          cat.nombre.toLowerCase().trim() === nombre.toLowerCase().trim()
        )
      );

      // Eliminar duplicados basándose en el nombre (mantener el primero)
      const categoriasSinDuplicados = categoriasFiltradas.filter((cat, index, array) => 
        array.findIndex(c => c.nombre.toLowerCase().trim() === cat.nombre.toLowerCase().trim()) === index
      );
      
      // Debug: verificar los datos que vienen de la API
      console.log('🔍 Debug - Datos de ingresos desde API:', ingresosData);
      console.log('🔍 Debug - Categorías de ingresos sin duplicados:', categoriasSinDuplicados.length);
      
      // Filtrar solo ingresos confirmados
      let ingresosFiltrados = ingresosData.filter((ingreso: Ingreso) => ingreso.estado === 'confirmado');
      
      // Aplicar filtros adicionales del lado del cliente
      if (filtros.fecha_desde) {
        ingresosFiltrados = ingresosFiltrados.filter((ingreso: Ingreso) => ingreso.fecha >= filtros.fecha_desde!);
      }
      
      if (filtros.fecha_hasta) {
        ingresosFiltrados = ingresosFiltrados.filter((ingreso: Ingreso) => ingreso.fecha <= filtros.fecha_hasta!);
      }
      
      if (filtros.busqueda && filtros.busqueda.trim()) {
        const termino = filtros.busqueda.toLowerCase().trim();
        ingresosFiltrados = ingresosFiltrados.filter((ingreso: Ingreso) => 
          ingreso.descripcion.toLowerCase().includes(termino) ||
          (ingreso.fuente && ingreso.fuente.toLowerCase().includes(termino)) ||
          ingreso.categoria?.nombre.toLowerCase().includes(termino)
        );
      }

      // Filtrar por categoría
      if (filtros.categoria !== undefined && filtros.categoria !== null) {
        ingresosFiltrados = ingresosFiltrados.filter((ingreso: Ingreso) => 
          ingreso.id_categoria === filtros.categoria
        );
      }

      if (filtros.monto_desde !== undefined) {
        ingresosFiltrados = ingresosFiltrados.filter((ingreso: Ingreso) => ingreso.monto >= filtros.monto_desde!);
      }
      if (filtros.monto_hasta !== undefined) {
        ingresosFiltrados = ingresosFiltrados.filter((ingreso: Ingreso) => ingreso.monto <= filtros.monto_hasta!);
      }

      // Asegurarse de que cada ingreso tenga su categoría completa y monto como número
      const ingresosConCategorias = ingresosFiltrados.map((ingreso: Ingreso) => ({
        ...ingreso,
        monto: typeof ingreso.monto === 'string' ? parseFloat(ingreso.monto) : ingreso.monto,
        categoria: categoriasSinDuplicados.find((cat: Categoria) => cat.id_categoria === ingreso.id_categoria)
      }));

      // Ordenar por fecha descendente (más reciente primero)
      const ingresosOrdenados = ingresosConCategorias.sort((a, b) => {
        const fechaA = new Date(a.fecha).getTime();
        const fechaB = new Date(b.fecha).getTime();
        return fechaB - fechaA; // Orden descendente
      });

      setIngresos(ingresosOrdenados);
      setCategorias(categoriasSinDuplicados);
    } catch (err) {
      console.error('Error al cargar ingresos:', err);
      setError(err instanceof Error ? err.message : 'Error al conectar con la base de datos');
    } finally {
      setIsLoading(false);
    }
  }, [filtros, asegurarCategoriasIngresos]);

  const setFiltros = useCallback((nuevos: Partial<FiltrosIngresos>) => {
    setFiltrosState(prev => ({ ...prev, ...nuevos }));
  }, []);

  const limpiarFiltros = useCallback(() => {
    setFiltrosState(filtrosIniciales);
  }, []);

  const refrescarIngresos = useCallback(() => {
    cargarDatos();
  }, [cargarDatos]);

  const eliminarIngreso = useCallback(async (id: number): Promise<boolean> => {
    try {
      await ingresosService.deleteIngreso(id);
      await cargarDatos();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar ingreso');
      return false;
    }
  }, [cargarDatos]);

  const crearIngreso = useCallback(async (ingresoData: any): Promise<Ingreso | null> => {
    try {
      // Verificar si el usuario está autenticado
      const user = authService.getStoredUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Agregar el ID del usuario al ingreso
      const ingresoCompleto = {
        ...ingresoData,
        id_usuario: user.id_usuario
      };

      const ingresoCreado = await ingresosService.createIngreso(ingresoCompleto);
      await cargarDatos();
      return ingresoCreado;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear ingreso');
      return null;
    }
  }, [cargarDatos]);

  const actualizarIngreso = useCallback(async (id: number, datos: any): Promise<Ingreso | null> => {
    try {
      const ingresoActualizado = await ingresosService.updateIngreso(id, datos);
      await cargarDatos();
      return ingresoActualizado;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar ingreso');
      return null;
    }
  }, [cargarDatos]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const totalIngresos = ingresos.reduce((total, ingreso) => {
    const monto = typeof ingreso.monto === 'number' && !isNaN(ingreso.monto) ? ingreso.monto : 0;
    return total + monto;
  }, 0);

  return {
    ingresos,
    categorias,
    filtros,
    isLoading,
    error,
    totalIngresos,
    setFiltros,
    limpiarFiltros,
    refrescarIngresos,
    eliminarIngreso,
    crearIngreso,
    actualizarIngreso
  };
};