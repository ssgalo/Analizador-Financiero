import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { gastosService, ingresosService } from '../services/api';

// Tipos para el dashboard
interface Usuario {
  id_usuario: number;
  nombre: string;
  email: string;
  usuario: string;
  estado: string;
}

interface Categoria {
  id_categoria: number;
  nombre: string;
  color: string;
}

interface Gasto {
  id_gasto: number;
  comercio: string;
  monto: number;
  fecha: string;
  categoria?: Categoria;
}

interface GastoPorCategoria {
  categoria: string;
  total: number;
  color: string;
}

interface TendenciaMensual {
  mes: string;
  ingresos: number;
  gastos: number;
}

interface Estadisticas {
  totalGastos: number;
  totalIngresos: number;
  gastosPorCategoria: GastoPorCategoria[];
  tendenciaMensual: TendenciaMensual[];
}

interface Recomendacion {
  id: number;
  tipo: 'ahorro' | 'recordatorio' | 'analisis' | 'alerta';
  titulo: string;
  mensaje: string;
}

interface UseDashboardReturn {
  usuario: Usuario | null;
  gastos: Gasto[];
  estadisticas: Estadisticas | null;
  recomendaciones: Recomendacion[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export const useDashboard = (): UseDashboardReturn => {
  const { user, isAuthenticated } = useAuthStore();
  
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async (): Promise<void> => {
    if (!isAuthenticated || !user) {
      setError('Usuario no autenticado');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Obtener fecha actual para filtros del mes
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).toISOString().split('T')[0];

      // Datos del usuario (ya los tenemos del store)
      const usuarioData: Usuario = {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        email: user.email,
        usuario: user.usuario,
        estado: user.estado
      };

      // Obtener gastos y estadísticas del mes actual
      const [gastosResponse, gastosStatsResponse, ingresosStatsResponse] = await Promise.all([
        // Gastos recientes (últimos 5 para mostrar en transacciones)
        gastosService.getGastos({ 
          limit: 5, 
          fecha_desde: firstDay, 
          fecha_hasta: lastDay 
        }),
        // Estadísticas de gastos del mes actual
        gastosService.getEstadisticas(year, month),
        // Estadísticas de ingresos del mes actual
        ingresosService.getEstadisticas(year, month)
      ]);

      // Procesar gastos recientes
      const gastosRecientes: Gasto[] = gastosResponse.map((gasto: any) => ({
        id_gasto: gasto.id_gasto,
        comercio: gasto.comercio || gasto.descripcion || 'Sin descripción',
        monto: parseFloat(gasto.monto),
        fecha: gasto.fecha,
        categoria: gasto.categoria ? {
          id_categoria: gasto.categoria.id_categoria,
          nombre: gasto.categoria.nombre,
          color: gasto.categoria.color || '#6B7280'
        } : undefined
      }));

      // Procesar estadísticas de gastos
      const totalGastos = parseFloat(gastosStatsResponse.total_gastos?.toString() || '0');
      const gastosPorCategoria: GastoPorCategoria[] = Object.entries(gastosStatsResponse.gastos_por_categoria || {})
        .map(([categoria, data]: [string, any]) => ({
          categoria,
          total: parseFloat(data.total?.toString() || '0'),
          color: data.color || '#6B7280'
        }))
        .sort((a, b) => b.total - a.total);

      // Procesar estadísticas de ingresos
      const totalIngresos = parseFloat(ingresosStatsResponse.total_ingresos?.toString() || '0');

      // Generar tendencia mensual (últimos 6 meses)
      const tendenciaMensual: TendenciaMensual[] = [];
      for (let i = 5; i >= 0; i--) {
        const fecha = new Date(year, month - 1 - i, 1);
        const mesAño = fecha.getFullYear();
        const mesNum = fecha.getMonth() + 1;
        const mesNombre = fecha.toLocaleDateString('es-ES', { month: 'short' });
        
        try {
          const [gastosStats, ingresosStats] = await Promise.all([
            gastosService.getEstadisticas(mesAño, mesNum),
            ingresosService.getEstadisticas(mesAño, mesNum)
          ]);
          
          tendenciaMensual.push({
            mes: mesNombre,
            gastos: parseFloat(gastosStats.total_gastos?.toString() || '0'),
            ingresos: parseFloat(ingresosStats.total_ingresos?.toString() || '0')
          });
        } catch (error) {
          // Si no hay datos para un mes, agregar con 0
          tendenciaMensual.push({
            mes: mesNombre,
            gastos: 0,
            ingresos: 0
          });
        }
      }

      // Crear objeto de estadísticas
      const estadisticasData: Estadisticas = {
        totalGastos,
        totalIngresos,
        gastosPorCategoria,
        tendenciaMensual
      };

      // Recomendaciones mock (mantenerlas como estaban por ahora)
      const mockRecomendaciones: Recomendacion[] = [
        {
          id: 1,
          tipo: 'ahorro',
          titulo: 'Gran oportunidad de ahorro',
          mensaje: 'Has gastado un 20% menos en entretenimiento este mes. ¡Sigue así para alcanzar tu meta de ahorro!'
        },
        {
          id: 2,
          tipo: 'alerta',
          titulo: 'Gasto elevado detectado',
          mensaje: 'Tus gastos en alimentación han aumentado un 15% comparado con el mes anterior.'
        },
        {
          id: 3,
          tipo: 'recordatorio',
          titulo: 'Vencimiento próximo',
          mensaje: 'Recuerda que tienes facturas de servicios por vencer en los próximos 5 días.'
        },
        {
          id: 4,
          tipo: 'analisis',
          titulo: 'Patrón identificado',
          mensaje: 'Gastas más los fines de semana. Considera planificar un presupuesto específico para esos días.'
        }
      ];

      setUsuario(usuarioData);
      setGastos(gastosRecientes);
      setEstadisticas(estadisticasData);
      setRecomendaciones(mockRecomendaciones);

    } catch (err: any) {
      console.error('Error al cargar datos del dashboard:', err);
      setError(err.message || 'Error al cargar los datos');
      
      // En caso de error, mantener datos mock básicos para que la UI no se rompa
      setUsuario({
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        email: user.email,
        usuario: user.usuario,
        estado: user.estado
      });
      setGastos([]);
      setEstadisticas({
        totalGastos: 0,
        totalIngresos: 0,
        gastosPorCategoria: [],
        tendenciaMensual: []
      });
      setRecomendaciones([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  return {
    usuario,
    gastos,
    estadisticas,
    recomendaciones,
    isLoading,
    error,
    refreshData
  };
};

export default useDashboard;