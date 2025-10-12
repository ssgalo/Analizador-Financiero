import { useState, useEffect, useCallback } from 'react';
import { gastosService, categoriasService, authService } from '../services/api';
import type { Gasto, Categoria } from '../services/api';

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
  crearGasto: (gasto: any) => Promise<Gasto | null>;
  actualizarGasto: (id: number, datos: any) => Promise<Gasto | null>;
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para asegurar que existan las categorías básicas
  const asegurarCategoriasBasicas = useCallback(async (categoriasExistentes: Categoria[]) => {
    const categoriasRequeridas = [
      { nombre: 'Otros', descripcion: 'Otros gastos', color: '#6b7280', icono: '📦' },
      { nombre: 'Comida', descripcion: 'Gastos en alimentación', color: '#f59e0b', icono: '🍽️' },
      { nombre: 'Supermercado', descripcion: 'Compras en supermercado', color: '#22c55e', icono: '🛒' },
      { nombre: 'Entretenimiento', descripcion: 'Gastos en entretenimiento', color: '#ec4899', icono: '🎮' },
      { nombre: 'Vivienda', descripcion: 'Gastos relacionados con vivienda', color: '#3b82f6', icono: '🏠' },
      { nombre: 'Transporte', descripcion: 'Gastos de transporte', color: '#ef4444', icono: '🚗' },
      { nombre: 'Suscripciones y membresías', descripcion: 'Suscripciones y membresías', color: '#8b5cf6', icono: '📱' }
    ];

    const categoriasCreadas: Categoria[] = [];

    for (const categoriaInfo of categoriasRequeridas) {
      // Verificar si la categoría ya existe (búsqueda case-insensitive)
      const categoriaExiste = categoriasExistentes.some(cat => 
        cat.nombre.toLowerCase().trim() === categoriaInfo.nombre.toLowerCase().trim()
      );

      if (!categoriaExiste) {
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
    }

    return categoriasCreadas;
  }, []);

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

      // Calcular fechas del mes actual
      const fechaActual = new Date();
      const añoActual = fechaActual.getFullYear();
      const mesActual = fechaActual.getMonth() + 1;
      const primerDiaDelMes = `${añoActual}-${mesActual.toString().padStart(2, '0')}-01`;
      const ultimoDiaDelMes = new Date(añoActual, mesActual, 0).getDate();
      const ultimoDelMes = `${añoActual}-${mesActual.toString().padStart(2, '0')}-${ultimoDiaDelMes.toString().padStart(2, '0')}`;

      console.log('📅 Debug Fechas - Octubre 2025:', {
        fechaActual: fechaActual.toISOString(),
        añoActual,
        mesActual,
        primerDiaDelMes,
        ultimoDelMes,
        ultimoDiaDelMes
      });
      // Preparar filtros para la API, incluyendo el ID del usuario y fechas del mes actual
      const filtrosAPI: any = {
        id_usuario: user.id_usuario,
        fecha_desde: primerDiaDelMes,
        fecha_hasta: ultimoDelMes,
        limit: 1000 // Límite alto para obtener todos los gastos del mes
      };

      // Aplicar filtros adicionales si existen (pero mantener el filtro del mes actual)
      if (filtros.categoria) {
        filtrosAPI.id_categoria = filtros.categoria;
      }
      // Solo aplicar filtros de fecha personalizados si están definidos y no son vacíos
      if (filtros.fecha_desde && filtros.fecha_desde.trim() !== '') {
        filtrosAPI.fecha_desde = filtros.fecha_desde;
      }
      if (filtros.fecha_hasta && filtros.fecha_hasta.trim() !== '') {
        filtrosAPI.fecha_hasta = filtros.fecha_hasta;
      }

      // Cargar gastos y categorías desde la API real
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
      
      // Filtrar solo las categorías específicas para gastos (nombres exactos)
      const categoriasGastosPermitidas = ['Otros', 'Comida', 'Supermercado', 'Entretenimiento', 'Vivienda', 'Transporte', 'Suscripciones y membresías'];
      const categoriasFiltradas = todasLasCategorias.filter(cat => 
        categoriasGastosPermitidas.some(nombre => 
          cat.nombre.toLowerCase().trim() === nombre.toLowerCase().trim()
        )
      );

      // Eliminar duplicados basándose en el nombre (mantener el primero)
      const categoriasSinDuplicados = categoriasFiltradas.filter((cat, index, array) => 
        array.findIndex(c => c.nombre.toLowerCase().trim() === cat.nombre.toLowerCase().trim()) === index
      );
      
      // Debug: verificar los datos que vienen de la API
      console.log('🔍 Debug - Todas las categorías:', todasLasCategorias.map(c => c.nombre));
      console.log('🔍 Debug - Categorías filtradas para gastos:', categoriasFiltradas.map(c => c.nombre));
      console.log('🔍 Debug - Categorías sin duplicados:', categoriasSinDuplicados.map(c => c.nombre));
      console.log('🔍 Debug - Datos de gastos desde API:', gastosData);
      console.log('🔍 Debug - Filtros aplicados:', filtros);
      console.log('🔍 Debug - Filtros API enviados:', filtrosAPI);
      console.log('🔍 Debug - Primer gasto (tipo de monto):', gastosData[0] ? { 
        monto: gastosData[0].monto, 
        tipoMonto: typeof gastosData[0].monto,
        fecha: gastosData[0].fecha
      } : 'No hay gastos');
      
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

      // Asegurarse de que cada gasto tenga su categoría completa y monto como número
      const gastosConCategorias = gastosFiltrados.map((gasto: Gasto) => ({
        ...gasto,
        monto: typeof gasto.monto === 'string' ? parseFloat(gasto.monto) : gasto.monto,
        categoria: categoriasSinDuplicados.find((cat: Categoria) => cat.id_categoria === gasto.id_categoria)
      }));

      // Ordenar por fecha descendente (más reciente primero)
      const gastosOrdenados = gastosConCategorias.sort((a, b) => {
        const fechaA = new Date(a.fecha).getTime();
        const fechaB = new Date(b.fecha).getTime();
        return fechaB - fechaA; // Orden descendente
      });

      setGastos(gastosOrdenados);
      setCategorias(categoriasSinDuplicados);
    } catch (err) {
      console.error('Error al cargar gastos:', err);
      setError(err instanceof Error ? err.message : 'Error al conectar con la base de datos');
    } finally {
      setIsLoading(false);
    }
  }, [filtros]);

  const setFiltros = useCallback((nuevos: Partial<FiltrosGastos>) => {
    setFiltrosState(prev => ({ ...prev, ...nuevos }));
  }, []);

  const limpiarFiltros = useCallback(() => {
    setFiltrosState(filtrosIniciales);
  }, []);

  const refrescarGastos = useCallback(() => {
    cargarDatos();
  }, [cargarDatos]);

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

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

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