import { useState, useEffect } from 'react';
import { mockApi } from '../services/mockApi';
import { useAuth } from '../context/AuthContext';
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
  const { userName } = useAuth();
  const [data, setData] = useState<DashboardData>({
    usuario: {
      id_usuario: 1,
      nombre: userName || 'Usuario',
      email: '',
      fecha_creacion: new Date().toISOString(),
      preferencias: {},
      ultimo_login: new Date().toISOString(),
      estado: 'activo'
    },
    gastos: [],
    categorias: [],
    objetivos: [],
    recomendaciones: [],
    estadisticas: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    setData(prev => ({
      ...prev,
      usuario: {
        ...prev.usuario!,
        nombre: userName || 'Usuario'
      }
    }));
  }, [userName]);

  const loadDashboardData = async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      // Cargar todos los datos en paralelo
      const [
        gastos,
        categorias,
        objetivos,
        recomendaciones,
        estadisticas
      ] = await Promise.all([
        mockApi.getGastos({ limite: 10 }), // Solo los últimos 10 para el dashboard
        mockApi.getCategorias(),
        mockApi.getObjetivos(),
        mockApi.getRecomendaciones(),
        mockApi.getEstadisticas()
      ]);

      setData(prev => ({
        ...prev,
        gastos,
        categorias,
        objetivos,
        recomendaciones,
        estadisticas,
        isLoading: false,
        error: null
      }));
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