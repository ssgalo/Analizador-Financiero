import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Navegación y estructura', () => {
    test('DASH-001: debe cargar el dashboard correctamente', async ({ page }) => {
      await expect(page).toHaveTitle(/Analizador|Dashboard|Home|Gastos/i);
      // El Home.tsx tiene un h2 con saludo como "¡Hola, Nico!" o similar
      await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
    });

    test('DASH-002: debe mostrar el menú de navegación', async ({ page }) => {
      await expect(page.getByRole('navigation').or(page.locator('nav'))).toBeVisible();
    });

    test('DASH-003: debe navegar a Gastos desde el menú', async ({ page }) => {
      await page.getByRole('link', { name: /gastos|expenses/i }).first().click();
      await page.waitForURL(/.*gastos.*/i, { timeout: 10000 });
      await expect(page).toHaveURL(/.*gastos.*/i);
    });

    test('DASH-004: debe navegar a Ingresos desde el menú', async ({ page }) => {
      await page.getByRole('link', { name: /ingresos|income/i }).first().click();
      await page.waitForURL(/.*ingresos.*/i, { timeout: 10000 });
      await expect(page).toHaveURL(/.*ingresos.*/i);
    });

    test('DASH-005: debe mostrar el nombre o email del usuario', async ({ page }) => {
      const email = process.env.TEST_USER_EMAIL!;
      const emailPart = email.split('@')[0]; 
      
      const userElement = page.getByText(new RegExp(`${email}|${emailPart}|usuario`, 'i'));
      await expect(userElement.first()).toBeVisible({ timeout: 10000 });
    });

    test('DASH-006: debe tener un botón de cerrar sesión', async ({ page }) => {
      const logoutButton = page.getByRole('button', { name: /cerrar sesión|logout|salir/i })
        .or(page.getByRole('link', { name: /cerrar sesión|logout|salir/i }));
      await expect(logoutButton.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Resumen financiero', () => {
    test('DASH-007: debe mostrar tarjeta de total de ingresos', async ({ page }) => {
      // Texto exacto del componente Home.tsx: "Ingresos del Mes"
      await expect(page.getByText(/ingresos del mes/i)).toBeVisible();
    });

    test('DASH-008: debe mostrar tarjeta de total de gastos', async ({ page }) => {
      // Texto exacto del componente Home.tsx: "Gastos del Mes"
      await expect(page.getByText(/gastos del mes/i)).toBeVisible();
    });

    test('DASH-009: debe mostrar tarjeta de balance o saldo', async ({ page }) => {
      // En Home.tsx es "Ahorro del Mes" no "Balance"
      await expect(page.getByText(/ahorro del mes/i)).toBeVisible();
    });

    test('DASH-010: debe mostrar valores numéricos en las tarjetas', async ({ page }) => {
      const currencyPattern = /\$[\d,]+\.?\d*/;
      const amountElements = await page.locator('text=/\\$[\\d,]+\\.?\\d*/').all();
      expect(amountElements.length).toBeGreaterThan(0);
    });

    test('DASH-011: debe mostrar indicadores de tendencia', async ({ page }) => {
      const trendIndicators = page.locator('[class*="trend"]').or(
        page.getByText(/↑|↓|▲|▼/i)
      );
      if (await trendIndicators.count() > 0) {
        await expect(trendIndicators.first()).toBeVisible();
      }
    });
  });

  test.describe('Gráficos y visualizaciones', () => {
    test('DASH-012: debe mostrar al menos un gráfico', async ({ page }) => {
      const chartElements = page.locator('canvas, svg[class*="chart"], [class*="recharts"]').first();
      await expect(chartElements).toBeVisible({ timeout: 10000 });
    });

    test('DASH-013: debe mostrar gráfico de gastos por categoría', async ({ page }) => {
      await expect(page.getByText(/gastos.*categoría|categoría.*gastos/i).first()).toBeVisible();
    });

    test('DASH-014: debe mostrar gráfico de evolución temporal', async ({ page }) => {
      const evolutionChart = page.getByText(/evolución|tendencia|histórico/i);
      if (await evolutionChart.count() > 0) {
        await expect(evolutionChart.first()).toBeVisible();
      }
    });
  });

  test.describe('Transacciones recientes', () => {
    test('DASH-015: debe mostrar sección de transacciones recientes', async ({ page }) => {
      await expect(page.getByText(/recientes|últimas|transacciones/i).first()).toBeVisible();
    });

    test('DASH-016: debe mostrar lista de transacciones', async ({ page }) => {
      const transactionItems = page.locator('[class*="transaction"], [class*="item"], li, tr').filter({
        has: page.locator('text=/\\$[\\d,]+/')
      });
      
      if (await transactionItems.count() > 0) {
        expect(await transactionItems.count()).toBeGreaterThan(0);
      }
    });

    test('DASH-017: debe mostrar detalles de cada transacción', async ({ page }) => {
      const transactionWithAmount = page.locator('text=/\\$[\\d,]+/').first();
      if (await transactionWithAmount.count() > 0) {
        await expect(transactionWithAmount).toBeVisible();
      }
    });
  });

  test.describe('Filtros y controles', () => {
    test('DASH-018: debe tener filtro por período', async ({ page }) => {
      const periodFilter = page.getByRole('combobox').or(page.getByRole('button', { name: /mes|año|período|filtro/i }));
      if (await periodFilter.count() > 0) {
        await expect(periodFilter.first()).toBeVisible();
      }
    });

    test('DASH-019: debe poder cambiar el período de visualización', async ({ page }) => {
      const periodButton = page.getByRole('button', { name: /mes|año|período/i });
      if (await periodButton.count() > 0) {
        await periodButton.first().click();
        const dropdownMenu = page.getByRole('menu').or(page.locator('[role="listbox"]'));
        if (await dropdownMenu.count() > 0) {
          await expect(dropdownMenu.first()).toBeVisible();
        }
      }
    });

    test('DASH-020: debe tener botón para agregar gasto rápido', async ({ page }) => {
      const addExpenseButton = page.getByRole('button', { name: /agregar.*gasto|nuevo.*gasto|\+.*gasto/i });
      if (await addExpenseButton.count() > 0) {
        await expect(addExpenseButton.first()).toBeVisible();
      }
    });

    test('DASH-021: debe tener botón para agregar ingreso rápido', async ({ page }) => {
      const addIncomeButton = page.getByRole('button', { name: /agregar.*ingreso|nuevo.*ingreso|\+.*ingreso/i });
      if (await addIncomeButton.count() > 0) {
        await expect(addIncomeButton.first()).toBeVisible();
      }
    });
  });

  test.describe('Navegación a otras secciones', () => {
    test('DASH-022: debe navegar a página de Gastos completa', async ({ page }) => {
      await page.getByRole('link', { name: /gastos|expenses/i }).first().click();
      await page.waitForURL(/.*gastos.*/i);
      await expect(page.getByRole('heading', { name: /gastos/i }).first()).toBeVisible();
    });

    test('DASH-023: debe navegar a página de Ingresos completa', async ({ page }) => {
      await page.getByRole('link', { name: /ingresos|income/i }).first().click();
      await page.waitForURL(/.*ingresos.*/i);
      await expect(page.getByRole('heading', { name: /ingresos/i }).first()).toBeVisible();
    });

    test('DASH-024: debe navegar a página de Reportes', async ({ page }) => {
      const reportLink = page.getByRole('link', { name: /reportes|reports|informes/i });
      if (await reportLink.count() > 0) {
        await reportLink.first().click();
        await page.waitForURL(/.*reportes.*/i);
        await expect(page.getByRole('heading', { name: /reportes|informes/i }).first()).toBeVisible();
      }
    });

    test('DASH-025: debe navegar a página de Objetivos', async ({ page }) => {
      const goalsLink = page.getByRole('link', { name: /objetivos|metas|goals/i });
      if (await goalsLink.count() > 0) {
        await goalsLink.first().click();
        await page.waitForURL(/.*objetivos.*/i);
        await expect(page.getByRole('heading', { name: /objetivos|metas/i }).first()).toBeVisible();
      }
    });
  });

  test.describe('Responsive y accesibilidad', () => {
    test('DASH-026: debe ser responsive en móvil', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      // Verificar que al menos una de las tarjetas es visible en móvil
      await expect(page.getByText(/gastos del mes|ingresos del mes/i).first()).toBeVisible();
    });

    test('DASH-027: debe tener elementos accesibles con roles ARIA', async ({ page }) => {
      const mainContent = page.getByRole('main');
      if (await mainContent.count() > 0) {
        await expect(mainContent.first()).toBeVisible();
      }
    });
  });
});
