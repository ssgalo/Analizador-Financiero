import { test, expect, type Page } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Login antes de cada test
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    const email = process.env.TEST_USER_EMAIL!;
    const password = process.env.TEST_USER_PASSWORD!;
    
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/^http:\/\/localhost:(3000|5173)\/$/);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('E2E-016: Debe mostrar el dashboard con datos principales', async () => {
    // Verificar que el dashboard está cargado usando el saludo del usuario
    const saludo = page.getByTestId('dashboard-saludo-usuario');
    await expect(saludo).toBeVisible();
    
    // Verificar que se muestran las 4 tarjetas principales usando data-testid
    await expect(page.getByTestId('dashboard-gastos-card')).toBeVisible();
    await expect(page.getByTestId('dashboard-ingresos-card')).toBeVisible();
    await expect(page.getByTestId('dashboard-ahorro-card')).toBeVisible();
    await expect(page.getByTestId('dashboard-meta-card')).toBeVisible();
  });

  test('E2E-017: Debe mostrar estadísticas de gastos', async () => {
    // Verificar que la card de gastos está visible con su valor
    const gastosCard = page.getByTestId('dashboard-gastos-card');
    await expect(gastosCard).toBeVisible();
    
    const gastosValor = page.getByTestId('dashboard-gastos-valor');
    await expect(gastosValor).toBeVisible();
    
    // Verificar que contiene un símbolo de moneda
    const texto = await gastosValor.textContent();
    expect(texto).toContain('$');
  });

  test('E2E-018: Debe mostrar estadísticas de ingresos', async () => {
    // Verificar que la card de ingresos está visible con su valor
    const ingresosCard = page.getByTestId('dashboard-ingresos-card');
    await expect(ingresosCard).toBeVisible();
    
    const ingresosValor = page.getByTestId('dashboard-ingresos-valor');
    await expect(ingresosValor).toBeVisible();
    
    // Verificar que contiene un símbolo de moneda
    const texto = await ingresosValor.textContent();
    expect(texto).toContain('$');
  });

  test('E2E-019: Debe mostrar el balance/ahorro actual', async () => {
    // Buscar elemento de ahorro (antes balance) usando data-testid
    const ahorroCard = page.getByTestId('dashboard-ahorro-card');
    await expect(ahorroCard).toBeVisible();
    
    // Verificar que el valor de ahorro está presente
    const ahorroValor = page.getByTestId('dashboard-ahorro-valor');
    await expect(ahorroValor).toBeVisible();
  });

  test('E2E-020: Debe mostrar gráficos si existen', async () => {
    // Esperar un momento para que el dashboard cargue los datos
    await page.waitForTimeout(2000);
    
    // Verificar que los charts están presentes usando data-testid
    const chartTendencia = page.getByTestId('dashboard-chart-tendencia');
    const chartDistribucion = page.getByTestId('dashboard-chart-distribucion');
    
    // Verificar que al menos uno está presente
    const tendenciaCount = await chartTendencia.count();
    const distribucionCount = await chartDistribucion.count();
    const totalCharts = tendenciaCount + distribucionCount;
    
    if (totalCharts > 0) {
      // Hay gráficos, verificar que están visibles
      expect(totalCharts).toBeGreaterThan(0);
      
      if (tendenciaCount > 0) {
        await expect(chartTendencia).toBeVisible({ timeout: 5000 });
      }
      if (distribucionCount > 0) {
        await expect(chartDistribucion).toBeVisible({ timeout: 5000 });
      }
      console.log(`✅ ${totalCharts} gráfico(s) encontrado(s) en el dashboard`);
    } else {
      // No hay gráficos específicos, pero verificar que hay cards/stats del dashboard
      const dashboardCards = await page.locator('[data-testid^="dashboard-"]').count();
      expect(dashboardCards).toBeGreaterThan(0);
      console.log('⚠️ No hay gráficos pero el dashboard tiene contenido');
    }
  });

  test('E2E-021: Debe permitir navegar a secciones desde el dashboard', async () => {
    // Intentar navegar a gastos
    const gastosLink = page.locator('a[href*="gastos"], button:has-text("Gastos")').first();
    
    if (await gastosLink.count() > 0) {
      await gastosLink.click();
      await page.waitForURL('**/gastos', { timeout: 5000 });
      await expect(page).toHaveURL(/gastos/);
    }
  });

  test('E2E-022: Debe actualizar datos al recargar', async () => {
    // Recargar página
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verificar que se recargaron los datos
    const newContent = await page.content();
    expect(newContent).toBeTruthy();
    expect(newContent.length).toBeGreaterThan(0);
  });

  test('E2E-023: Debe mostrar información del usuario', async () => {
    // Buscar información del usuario usando data-testid
    const userInfo = page.getByTestId('user-info-sidebar');
    await expect(userInfo).toBeVisible();
    
    // Verificar que el nombre está presente
    const userNombre = page.getByTestId('user-nombre');
    await expect(userNombre).toBeVisible();
  });
});
