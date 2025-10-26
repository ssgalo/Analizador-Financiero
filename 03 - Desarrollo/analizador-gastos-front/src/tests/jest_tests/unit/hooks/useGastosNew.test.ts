/**
 * Tests para el hook useGastos
 */
import { renderHook, act } from '@testing-library/react';
import { useGastos } from '@hooks/useGastos';
import { gastosService, categoriasService, authService } from '@services/api';
import type { Gasto, Categoria, User } from '@services/api';

// Mock de los servicios
jest.mock('@services/api', () => ({
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

const mockUser: User = {
  id_usuario: 1,
  nombre: 'Test User',
  email: 'test@test.com',
  usuario: 'testuser',
  estado: 'activo'
};

const mockCategoria: Categoria = {
  id_categoria: 1,
  nombre: 'Alimentación',
  descripcion: 'Gastos de comida',
  es_personalizada: false
};

const mockGasto: Gasto = {
  id_gasto: 1,
  id_usuario: 1,
  fecha: '2025-01-15',
  monto: 150.50,
  descripcion: 'Supermercado',
  comercio: 'Coto',
  id_categoria: 1,
  fuente: 'manual',
  estado: 'confirmado',
  fecha_creacion: '2025-01-15T10:00:00Z',
  fecha_modificacion: '2025-01-15T10:00:00Z',
  categoria: mockCategoria
};

describe('useGastos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockGastosService.getGastos.mockResolvedValue([]);
    mockCategoriasService.getCategorias.mockResolvedValue([]);
    mockAuthService.getStoredUser.mockReturnValue(mockUser);
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

    // Esperar a que el efecto se ejecute
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.error).toBe('Usuario no autenticado');
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
      comercio: 'Test Store',
      id_categoria: 1,
      fuente: 'manual' as const,
      id_usuario: 1
    };

    const gastoCreado = {
      ...mockGasto,
      id_gasto: 2,
      descripcion: 'Nuevo gasto',
      monto: 100
    };

    mockGastosService.createGasto.mockResolvedValue(gastoCreado);

    const { result } = renderHook(() => useGastos());

    let gastoResult: Gasto | null = null;
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

  test('debería manejar errores al crear gasto', async () => {
    const errorMessage = 'Error al crear gasto';
    mockGastosService.createGasto.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useGastos());

    const nuevoGasto = {
      descripcion: 'Nuevo gasto',
      monto: 100,
      fecha: '2025-01-16',
      comercio: 'Test Store',
      id_categoria: 1,
      fuente: 'manual' as const,
      id_usuario: 1
    };

    let gastoResult: Gasto | null = null;
    await act(async () => {
      gastoResult = await result.current.crearGasto(nuevoGasto);
    });

    expect(gastoResult).toBe(null);
  });

  test('debería manejar errores al eliminar gasto', async () => {
    mockGastosService.deleteGasto.mockRejectedValue(new Error('Error al eliminar'));

    const { result } = renderHook(() => useGastos());

    let deleteResult: boolean = true;
    await act(async () => {
      deleteResult = await result.current.eliminarGasto(1);
    });

    expect(deleteResult).toBe(false);
  });

  test('debería inicializar filtros con valores por defecto', () => {
    const { result } = renderHook(() => useGastos());

    expect(result.current.filtros).toEqual({
      fecha_desde: '',
      fecha_hasta: '',
      categoria: undefined,
      fuente: '',
      busqueda: '',
      monto_desde: undefined,
      monto_hasta: undefined
    });
  });
});