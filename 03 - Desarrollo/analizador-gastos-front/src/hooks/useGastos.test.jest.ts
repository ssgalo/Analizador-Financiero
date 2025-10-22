/**
 * Tests para el hook useGastos
 */
import { renderHook, act } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import { useGastos } from './useGastos';
import { gastosService, categoriasService, authService } from '../services/api';

// Mock de los servicios
jest.mock('../services/api', () => ({
  gastosService: {
    getGastos: jest.fn(),
    createGasto: jest.fn(),
    updateGasto: jest.fn(),
    deleteGasto: jest.fn(),
  },
  categoriasService: {
    getCategorias: jest.fn(),
    createCategoria: jest.fn(),
  },
  authService: {
    getStoredUser: jest.fn(),
  },
}));

const mockGastosService = gastosService as jest.Mocked<typeof gastosService>;
const mockCategoriasService = categoriasService as jest.Mocked<typeof categoriasService>;
const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('useGastos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockGastosService.getGastos.mockResolvedValue([]);
    mockCategoriasService.getCategorias.mockResolvedValue([]);
    mockAuthService.getStoredUser.mockReturnValue({
      id: 1,
      username: 'testuser',
      email: 'test@test.com'
    });
  });

  test('debería inicializar con valores por defecto', () => {
    const { result } = renderHook(() => useGastos());

    expect(result.current.gastos).toEqual([]);
    expect(result.current.categorias).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.totalGastos).toBe(0);
  });

  test('debería manejar usuario no autenticado', async () => {
    mockAuthService.getStoredUser.mockReturnValue(null);

    const { result } = renderHook(() => useGastos());

    await waitFor(() => {
      expect(result.current.error).toBe('Usuario no autenticado');
    });
  });

  test('debería cargar gastos correctamente', async () => {
    const mockGastos = [
      {
        id: 1,
        descripcion: 'Supermercado',
        monto: 150.50,
        fecha: '2025-01-15',
        categoria_id: 1,
        usuario_id: 1,
        categoria: { id: 1, nombre: 'Alimentación' }
      },
    ];
    
    const mockCategorias = [
      { id: 1, nombre: 'Alimentación', descripcion: 'Gastos de comida' }
    ];

    mockGastosService.getGastos.mockResolvedValue(mockGastos);
    mockCategoriasService.getCategorias.mockResolvedValue(mockCategorias);

    const { result } = renderHook(() => useGastos());

    await act(async () => {
      result.current.refrescarGastos();
    });

    await waitFor(() => {
      expect(result.current.gastos).toEqual(mockGastos);
      expect(result.current.categorias).toEqual(mockCategorias);
    });
  });

  test('debería manejar errores al cargar gastos', async () => {
    const errorMessage = 'Error al cargar gastos';
    mockGastosService.getGastos.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useGastos());

    await act(async () => {
      result.current.refrescarGastos();
    });

    await waitFor(() => {
      expect(result.current.error).toContain('Error');
      expect(result.current.gastos).toEqual([]);
    });
  });

  test('debería actualizar filtros correctamente', () => {
    const { result } = renderHook(() => useGastos());

    act(() => {
      result.current.setFiltros({ categoria: 1, busqueda: 'supermercado' });
    });

    expect(result.current.filtros.categoria).toBe(1);
    expect(result.current.filtros.busqueda).toBe('supermercado');
  });

  test('debería limpiar filtros', () => {
    const { result } = renderHook(() => useGastos());

    act(() => {
      result.current.setFiltros({ categoria: 1, busqueda: 'supermercado' });
    });

    act(() => {
      result.current.limpiarFiltros();
    });

    expect(result.current.filtros.categoria).toBeUndefined();
    expect(result.current.filtros.busqueda).toBe('');
  });

  test('debería crear un gasto correctamente', async () => {
    const nuevoGasto = {
      descripcion: 'Nuevo gasto',
      monto: 100,
      fecha: '2025-01-16',
      categoria_id: 1
    };

    const gastoCreado = {
      id: 2,
      ...nuevoGasto,
      usuario_id: 1
    };

    mockGastosService.createGasto.mockResolvedValue(gastoCreado);

    const { result } = renderHook(() => useGastos());

    let gastoResult: any;
    await act(async () => {
      gastoResult = await result.current.crearGasto(nuevoGasto);
    });

    expect(mockGastosService.createGasto).toHaveBeenCalledWith(nuevoGasto);
    expect(gastoResult).toEqual(gastoCreado);
  });

  test('debería eliminar un gasto correctamente', async () => {
    mockGastosService.deleteGasto.mockResolvedValue(undefined);
    mockGastosService.getGastos.mockResolvedValue([]);

    const { result } = renderHook(() => useGastos());

    let deleteResult: boolean = false;
    await act(async () => {
      deleteResult = await result.current.eliminarGasto(1);
    });

    expect(mockGastosService.deleteGasto).toHaveBeenCalledWith(1);
    expect(deleteResult).toBe(true);
  });

  test('debería calcular el total de gastos correctamente', async () => {
    const mockGastos = [
      { id: 1, monto: 100, descripcion: 'Gasto 1' },
      { id: 2, monto: 200, descripcion: 'Gasto 2' },
      { id: 3, monto: 150.50, descripcion: 'Gasto 3' },
    ];

    mockGastosService.getGastos.mockResolvedValue(mockGastos);
    mockCategoriasService.getCategorias.mockResolvedValue([]);

    const { result } = renderHook(() => useGastos());

    await act(async () => {
      result.current.refrescarGastos();
    });

    await waitFor(() => {
      expect(result.current.totalGastos).toBe(450.50);
    });
  });
});