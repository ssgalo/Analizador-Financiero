import { useState, useEffect } from 'react';
import { mockApi } from '../services/mockApi';
import type { Gasto, Categoria, Usuario, Objetivo, RecomendacionIA } from '../services/mockApi';

interface DashboardData {
  usuario: Usuario | null;
  gastos: Gasto[];
  categorias: Categoria[];
  objetivos: Objetivo[];
  recomendaciones: RecomendacionIA[];
  estadisticas: {
    totalGastos: number;
    totalIngresos: number;
    ahorro: number;
    gastosPorCategoria: { categoria: string; total: number; color: string }[];
    tendenciaMensual: { mes: string; gastos: number; ingresos: number }[];
  } | null;
  isLoading: boolean;
  error: string | null;
}

export const useDashboard = () => {
  const [data, setData] = useState<DashboardData>({
    usuario: null,
    gastos: [],
    categorias: [],
    objetivos: [],
    recomendaciones: [],
    estadisticas: null,
    isLoading: true,
    error: null
  });

  const loadDashboardData = async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      // Cargar todos los datos en paralelo
      const [
        usuario,
        gastos,
        categorias,
        objetivos,
        recomendaciones,
        estadisticas
      ] = await Promise.all([
        mockApi.getUsuario(),
        mockApi.getGastos({ limite: 10 }), // Solo los últimos 10 para el dashboard
        mockApi.getCategorias(),
        mockApi.getObjetivos(),
        mockApi.getRecomendaciones(),
        mockApi.getEstadisticas()
      ]);

      setData({
        usuario,
        gastos,
        categorias,
        objetivos,
        recomendaciones,
        estadisticas,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }));
    }
  };

  // Función para refrescar los datos
  const refreshData = () => {
    loadDashboardData();
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadDashboardData();
  }, []);

  return {
    ...data,
    refreshData
  };
};