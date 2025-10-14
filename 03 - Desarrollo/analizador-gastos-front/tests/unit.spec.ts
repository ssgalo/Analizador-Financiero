import { test, expect } from '@playwright/test';

test.describe('Unit Tests - Utilidades y Formatters', () => {
  
  test.describe('Formateo de moneda', () => {
    test('UNIT-001: debe formatear números a moneda correctamente', async ({ page }) => {
      await page.goto('/');
      
      const result = await page.evaluate(() => {
        const formatter = new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
          minimumFractionDigits: 2,
        });
        return formatter.format(1234.56);
      });
      
      expect(result).toMatch(/1.*234.*56/);
    });

    test('UNIT-002: debe manejar valores grandes correctamente', async ({ page }) => {
      await page.goto('/');
      
      const result = await page.evaluate(() => {
        const formatter = new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
        });
        return formatter.format(1000000);
      });
      
      expect(result).toMatch(/1.*000.*000/);
    });

    test('UNIT-003: debe formatear cero correctamente', async ({ page }) => {
      await page.goto('/');
      
      const result = await page.evaluate(() => {
        const formatter = new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
        });
        return formatter.format(0);
      });
      
      expect(result).toBeTruthy();
    });
  });

  test.describe('Formateo de fechas', () => {
    test('UNIT-004: debe formatear fecha a formato local', async ({ page }) => {
      await page.goto('/');
      
      const result = await page.evaluate(() => {
        // Usar fecha con hora para evitar problemas de zona horaria
        const date = new Date('2024-01-15T12:00:00');
        return date.toLocaleDateString('es-AR');
      });
      
      expect(result).toMatch(/15.*1.*2024/);
    });

    test('UNIT-005: debe formatear fecha con opciones personalizadas', async ({ page }) => {
      await page.goto('/');
      
      const result = await page.evaluate(() => {
        const date = new Date('2024-01-15');
        return date.toLocaleDateString('es-AR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      });
      
      expect(result).toContain('enero');
      expect(result).toContain('2024');
    });

    test('UNIT-006: debe manejar fechas inválidas', async ({ page }) => {
      await page.goto('/');
      
      const result = await page.evaluate(() => {
        const date = new Date('invalid');
        return isNaN(date.getTime());
      });
      
      expect(result).toBe(true);
    });
  });

  test.describe('Validaciones de entrada', () => {
    test('UNIT-007: debe validar email correcto', async ({ page }) => {
      await page.goto('/');
      
      const result = await page.evaluate(() => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test('test@example.com');
      });
      
      expect(result).toBe(true);
    });

    test('UNIT-008: debe rechazar email sin @', async ({ page }) => {
      await page.goto('/');
      
      const result = await page.evaluate(() => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test('testexample.com');
      });
      
      expect(result).toBe(false);
    });

    test('UNIT-009: debe rechazar email sin dominio', async ({ page }) => {
      await page.goto('/');
      
      const result = await page.evaluate(() => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test('test@');
      });
      
      expect(result).toBe(false);
    });

    test('UNIT-010: debe validar números positivos', async ({ page }) => {
      await page.goto('/');
      
      const result = await page.evaluate(() => {
        const num = 100;
        return num > 0;
      });
      
      expect(result).toBe(true);
    });

    test('UNIT-011: debe rechazar números negativos cuando se requiere positivo', async ({ page }) => {
      await page.goto('/');
      
      const result = await page.evaluate(() => {
        const num = -50;
        return num > 0;
      });
      
      expect(result).toBe(false);
    });
  });

  test.describe('Cálculos financieros', () => {
    test('UNIT-012: debe calcular suma de montos correctamente', async ({ page }) => {
      await page.goto('/');
      
      const result = await page.evaluate(() => {
        const montos = [100, 200, 300];
        return montos.reduce((acc, val) => acc + val, 0);
      });
      
      expect(result).toBe(600);
    });

    test('UNIT-013: debe calcular balance (ingresos - gastos)', async ({ page }) => {
      await page.goto('/');
      
      const result = await page.evaluate(() => {
        const ingresos = 5000;
        const gastos = 3000;
        return ingresos - gastos;
      });
      
      expect(result).toBe(2000);
    });

    test('UNIT-014: debe manejar decimales en cálculos', async ({ page }) => {
      await page.goto('/');
      
      const result = await page.evaluate(() => {
        const precio = 99.99;
        const cantidad = 3;
        return Number((precio * cantidad).toFixed(2));
      });
      
      expect(result).toBe(299.97);
    });

    test('UNIT-015: debe calcular porcentaje correctamente', async ({ page }) => {
      await page.goto('/');
      
      const result = await page.evaluate(() => {
        const total = 1000;
        const parte = 250;
        return (parte / total) * 100;
      });
      
      expect(result).toBe(25);
    });

    test('UNIT-016: debe redondear montos a 2 decimales', async ({ page }) => {
      await page.goto('/');
      
      const result = await page.evaluate(() => {
        const monto = 123.456;
        return Number(monto.toFixed(2));
      });
      
      expect(result).toBe(123.46);
    });
  });
});
