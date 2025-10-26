import { renderHook, act } from '@testing-library/react';
import { useGastos } from '@hooks/useGastos';
import * as api from '@services/api';

// Mock del servicio API
jest.mock('@services/api');
const mockedApi = api as any;

describe('useGastos Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debería inicializar con estado vacío', () => {
    const { result } = renderHook(() => useGastos());
    
    expect(result.current.gastos).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.totalGastos).toBe(0);
  });

  test('debería cargar gastos correctamente', async () => {
    const mockGastos = [
      {
        id_gasto: 1,
        descripcion: 'Supermercado',
        monto: 150.50,
        fecha: '2025-01-15',
        categoria: 'Alimentación'
      },
      {
        id_gasto: 2,
        descripcion: 'Nafta',
        monto: 80.00,
        fecha: '2025-01-14',
        categoria: 'Transporte'
      }
    ];

    mockedApi.gastosService.getGastos.mockResolvedValue({
      gastos: mockGastos,
      total: 2,
      totalMonto: 230.50
    });

    const { result } = renderHook(() => useGastos());

    await act(async () => {
      await result.current.refrescarGastos();
    });

    expect(result.current.gastos).toEqual(mockGastos);
    expect(result.current.totalGastos).toBe(2);
    expect(result.current.error).toBe(null);
  });

  test('debería manejar errores al cargar gastos', async () => {
    const errorMessage = 'Error al cargar gastos';
    mockedApi.gastosService.getGastos.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useGastos());

    await act(async () => {
      await result.current.refrescarGastos();
    });

    expect(result.current.gastos).toEqual([]);
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.isLoading).toBe(false);
  });

  test('debería aplicar filtros correctamente', async () => {
    const mockFiltros = {
      fecha_desde: '2025-01-01',
      fecha_hasta: '2025-01-31',
      categoria: 1
    };

    mockedApi.gastosService.getGastos.mockResolvedValue({
      gastos: [],
      total: 0,
      totalMonto: 0
    });

    const { result } = renderHook(() => useGastos());

    await act(async () => {
      result.current.setFiltros(mockFiltros);
    });

    expect(mockedApi.gastosService.getGastos).toHaveBeenCalledWith(mockFiltros);
    expect(result.current.filtros).toEqual(mockFiltros);
  });
});