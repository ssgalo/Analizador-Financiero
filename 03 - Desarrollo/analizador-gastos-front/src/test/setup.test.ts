/**
 * Tests básicos para validar que el entorno de testing está configurado correctamente
 */
describe('Setup de Testing', () => {
  test('debería ejecutar tests básicos', () => {
    expect(1 + 1).toBe(2);
  });

  test('debería manejar strings correctamente', () => {
    const mensaje = 'Analizador Financiero';
    expect(mensaje).toBe('Analizador Financiero');
    expect(mensaje.length).toBeGreaterThan(0);
  });

  test('debería manejar arrays', () => {
    const numeros = [1, 2, 3, 4, 5];
    expect(numeros).toHaveLength(5);
    expect(numeros).toContain(3);
  });

  test('debería manejar objetos', () => {
    const gasto = {
      id: 1,
      descripcion: 'Supermercado',
      monto: 150.50
    };

    expect(gasto).toHaveProperty('descripcion');
    expect(gasto.monto).toBe(150.50);
  });

  test('debería manejar funciones', () => {
    const calcularTotal = (gastos: number[]) => {
      return gastos.reduce((sum, gasto) => sum + gasto, 0);
    };

    const gastos = [100, 200, 150];
    const total = calcularTotal(gastos);
    
    expect(total).toBe(450);
  });
});