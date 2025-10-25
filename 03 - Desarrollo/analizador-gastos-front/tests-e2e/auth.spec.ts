import { test, expect, type Page } from '@playwright/test';

test.describe('Authentication E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('E2E-001: Debe mostrar la página de login inicialmente', async () => {
    await expect(page).toHaveTitle(/Analizador Financiero/);
    // Usar selector que no dependa del texto con caracteres especiales
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('E2E-002: Debe permitir login con credenciales válidas', async () => {
    const email = process.env.TEST_USER_EMAIL!;
    const password = process.env.TEST_USER_PASSWORD!;

    // Completar formulario de login
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Verificar redirección al dashboard (ruta raíz "/")
    await page.waitForURL(/^http:\/\/localhost:(3000|5173)\/$/, { timeout: 10000 });
    // Verificar que estamos en el dashboard sin depender de texto
    await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible();
  });

  test('E2E-003: Debe mostrar error con credenciales inválidas', async () => {
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Verificar mensaje de error - usar first() para evitar ambigüedad
    await expect(page.locator('text=/error|inválid|incorrect/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('E2E-004: Debe validar campos requeridos', async () => {
    await page.click('button[type="submit"]');
    
    // Verificar validación HTML5 o mensajes de error
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('E2E-005: Debe permitir cerrar sesión', async () => {
    const email = process.env.TEST_USER_EMAIL!;
    const password = process.env.TEST_USER_PASSWORD!;

    // Login
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/^http:\/\/localhost:(3000|5173)\/$/);

    // Logout - usar data-testid
    const logoutButton = page.getByTestId('logout-button');
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();
    
    // Verificar que volvimos al login (sin depender de texto)
    await page.waitForTimeout(1000);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});
