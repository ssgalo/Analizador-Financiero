import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

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

      // Simular datos hasta conectar con el backend
      const mockUsuario: Usuario = {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        email: user.email,
        usuario: user.usuario,
        estado: user.estado
      };

      const mockGastos: Gasto[] = [
        {
          id_gasto: 1,
          comercio: 'Supermercado Carrefour',
          monto: 12500.50,
          fecha: '2024-03-15',
          categoria: { id_categoria: 1, nombre: 'Alimentación', color: '#22C55E' }
        },
        {
          id_gasto: 2,
          comercio: 'Estación YPF',
          monto: 8000.00,
          fecha: '2024-03-14',
          categoria: { id_categoria: 2, nombre: 'Transporte', color: '#3B82F6' }
        },
        {
          id_gasto: 3,
          comercio: 'Farmacia San Pablo',
          monto: 3200.75,
          fecha: '2024-03-13',
          categoria: { id_categoria: 3, nombre: 'Salud', color: '#EF4444' }
        },
        {
          id_gasto: 4,
          comercio: 'Netflix',
          monto: 2500.00,
          fecha: '2024-03-12',
          categoria: { id_categoria: 4, nombre: 'Entretenimiento', color: '#8B5CF6' }
        }
      ];

      const mockEstadisticas: Estadisticas = {
        totalGastos: 45000.00,
        totalIngresos: 120000.00,
        gastosPorCategoria: [
          { categoria: 'Alimentación', total: 18000.00, color: '#22C55E' },
          { categoria: 'Transporte', total: 12000.00, color: '#3B82F6' },
          { categoria: 'Salud', total: 5000.00, color: '#EF4444' },
          { categoria: 'Entretenimiento', total: 4000.00, color: '#8B5CF6' },
          { categoria: 'Vivienda', total: 6000.00, color: '#F59E0B' }
        ],
        tendenciaMensual: [
          { mes: 'Oct', ingresos: 110000, gastos: 42000 },
          { mes: 'Nov', ingresos: 115000, gastos: 44000 },
          { mes: 'Dic', ingresos: 118000, gastos: 47000 },
          { mes: 'Ene', ingresos: 120000, gastos: 43000 },
          { mes: 'Feb', ingresos: 119000, gastos: 45000 },
          { mes: 'Mar', ingresos: 120000, gastos: 45000 }
        ]
      };

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

      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUsuario(mockUsuario);
      setGastos(mockGastos);
      setEstadisticas(mockEstadisticas);
      setRecomendaciones(mockRecomendaciones);

    } catch (err: any) {
      console.error('Error al cargar datos del dashboard:', err);
      setError(err.message || 'Error al cargar los datos');
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