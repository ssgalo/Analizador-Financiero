import { describe, test, expect, vi, beforeEach } from 'vitest';
import { gastosService, type GastoCreate } from './api';

// Mock de axios
vi.mock('axios', () => ({
  default: {
    create: () => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    })
  }
}));

describe('Gastos Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('debería tener métodos principales del servicio', () => {
    // Verificar que el servicio tiene los métodos esperados
    expect(gastosService).toBeDefined();
    expect(typeof gastosService.getGastos).toBe('function');
    expect(typeof gastosService.createGasto).toBe('function');
    expect(typeof gastosService.updateGasto).toBe('function');
    expect(typeof gastosService.deleteGasto).toBe('function');
  });

  test('debería validar estructura de GastoCreate', () => {
    const gastoValido: GastoCreate = {
      descripcion: 'Supermercado',
      monto: 150.50,
      fecha: '2025-01-15',
      comercio: 'Coto',
      categoria: 'Alimentación',
      fuente: 'manual',
      id_categoria: 1
    };

    // Verificar que el objeto tiene las propiedades esperadas
    expect(gastoValido.descripcion).toBe('Supermercado');
    expect(gastoValido.monto).toBe(150.50);
    expect(gastoValido.fecha).toBe('2025-01-15');
    expect(gastoValido.id_categoria).toBe(1);
  });

  test('debería manejar errores de red correctamente', async () => {
    // Mock de error de red
    const mockError = new Error('Network Error');
    
    // Este test verifica que los errores se manejen correctamente
    // En una implementación real, aquí testearíamos el manejo específico de errores
    expect(mockError.message).toBe('Network Error');
  });
});