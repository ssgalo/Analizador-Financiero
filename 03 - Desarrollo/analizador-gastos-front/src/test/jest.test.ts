/**
 * Tests básicos para verificar que Jest está funcionando correctamente
 */
describe('Configuración de Jest', () => {
  test('debería ejecutar test básico correctamente', () => {
    expect(1 + 1).toBe(2);
  });

  test('debería manejar strings', () => {
    const appName = 'Analizador Financiero';
    expect(appName).toBe('Analizador Financiero');
    expect(appName.length).toBeGreaterThan(0);
  });

  test('debería manejar objetos de gastos', () => {
    const gasto = {
      id: 1,
      descripcion: 'Supermercado',
      monto: 150.50,
      fecha: '2025-01-15',
      categoria: 'Alimentación'
    };

    expect(gasto).toHaveProperty('descripcion');
    expect(gasto.monto).toBe(150.50);
    expect(gasto.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('debería calcular totales correctamente', () => {
    const gastos = [100, 250, 75.50];
    const total = gastos.reduce((sum, gasto) => sum + gasto, 0);
    
    expect(total).toBe(425.50);
  });

  test('debería filtrar gastos por categoría', () => {
    const gastos = [
      { categoria: 'Alimentación', monto: 100 },
      { categoria: 'Transporte', monto: 50 },
      { categoria: 'Alimentación', monto: 75 }
    ];

    const gastosAlimentacion = gastos.filter(g => g.categoria === 'Alimentación');
    
    expect(gastosAlimentacion).toHaveLength(2);
    expect(gastosAlimentacion.every(g => g.categoria === 'Alimentación')).toBe(true);
  });

  test('debería validar formato de fecha', () => {
    const isValidDate = (dateString: string): boolean => {
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      return regex.test(dateString);
    };

    expect(isValidDate('2025-01-15')).toBe(true);
    expect(isValidDate('15/01/2025')).toBe(false);
    expect(isValidDate('invalid-date')).toBe(false);
  });
});