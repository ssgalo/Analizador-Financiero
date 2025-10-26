import { renderHook, act, waitFor } from '@testing-library/react';
import { useGastos } from '@hooks/useGastos';
import * as api from '@services/api';

// Mock de servicios API
jest.mock('@services/api', () => ({
  gastosService: {
    getGastos: jest.fn(),
    createGasto: jest.fn(),
    updateGasto: jest.fn(),
    deleteGasto: jest.fn()
  },
  categoriasService: {
    getCategorias: jest.fn(),
    getCategoriasUsuario: jest.fn(),
    createCategoria: jest.fn()
  },
  authService: {
    getCurrentUser: jest.fn(),
    getStoredUser: jest.fn(() => ({ id_usuario: 1, nombre: 'Test User', email: 'test@test.com' }))
  }
}));

const mockedApi = api as any;

describe('useGastos Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mocks - getGastos devuelve un array directamente, no un objeto
    mockedApi.gastosService.getGastos.mockResolvedValue([]);
    mockedApi.categoriasService.getCategorias.mockResolvedValue([]);
    mockedApi.categoriasService.createCategoria.mockResolvedValue({ id_categoria: 1, nombre: 'Test', es_personalizada: false });
  });

  test('debería inicializar con estado vacío', async () => {
    const { result } = renderHook(() => useGastos());
    
    // isLoading inicia en true porque el hook carga datos automáticamente
    expect(result.current.gastos).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.totalGastos).toBe(0);
    
    // Esperar a que termine de cargar
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.error).toBe(null);
  });

  test('debería cargar gastos correctamente', async () => {
    const mockGastos = [
      {
        id_gasto: 1,
        descripcion: 'Supermercado',
        monto: 150.50,
        fecha: '2025-10-15', // Fecha del mes actual (octubre 2025)
        categoria: 'Alimentación',
        estado: 'confirmado' // Estado correcto para que pase el filtro
      },
      {
        id_gasto: 2,
        descripcion: 'Nafta',
        monto: 80.00,
        fecha: '2025-10-14', // Fecha del mes actual (octubre 2025)
        categoria: 'Transporte',
        estado: 'confirmado' // Estado correcto para que pase el filtro
      }
    ];

    // Mock que devuelve array directamente - configurado ANTES de renderizar el hook
    mockedApi.gastosService.getGastos.mockResolvedValue(mockGastos);

    // Renderizar el hook DESPUÉS de configurar el mock
    const { result } = renderHook(() => useGastos());

    // Esperar a que el useEffect inicial termine de cargar
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verificar que los gastos se cargaron
    expect(result.current.gastos).toHaveLength(2);
    expect(result.current.gastos[0]).toMatchObject({
      id_gasto: 1,
      descripcion: 'Supermercado',
      monto: 150.50,
      fecha: '2025-10-15',
      estado: 'confirmado'
    });
    expect(result.current.totalGastos).toBeGreaterThan(0);
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

    // Mock que devuelve array vacío directamente
    mockedApi.gastosService.getGastos.mockResolvedValue([]);

    const { result } = renderHook(() => useGastos());

    await act(async () => {
      result.current.setFiltros(mockFiltros);
    });

    expect(mockedApi.gastosService.getGastos).toHaveBeenCalled();
    expect(result.current.filtros).toEqual(expect.objectContaining(mockFiltros));
  });
});