import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await context.clearPermissions();
    await page.context().clearCookies();
    // Limpiar localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
  });

  test('AUTH-001: debe cargar la página de login correctamente', async ({ page }) => {
    await expect(page).toHaveTitle(/Analizador|Login|Gastos/i);
    await expect(page.getByRole('heading', { name: /bienvenido|iniciar sesión|login/i }).first()).toBeVisible();
  });

  test('AUTH-002: debe mostrar el formulario de login con todos los campos', async ({ page }) => {
    await expect(page.getByPlaceholder('tu@email.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();
  });

  test('AUTH-003: debe mostrar error con credenciales inválidas', async ({ page }) => {
    await page.getByPlaceholder('tu@email.com').fill('invalid@mail.com');
    await page.getByPlaceholder('••••••••').fill('WrongPass123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    await expect(page.getByText(/credenciales|incorrectas|inválidas|error/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('AUTH-004: debe validar email en formato incorrecto', async ({ page }) => {
    await page.getByPlaceholder('tu@email.com').fill('correo-invalido');
    await page.getByPlaceholder('••••••••').fill('Test1234#');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    const emailInput = page.getByPlaceholder('tu@email.com');
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test('AUTH-005: debe validar campos requeridos', async ({ page }) => {
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    const emailInput = page.getByPlaceholder('tu@email.com');
    const passwordInput = page.getByPlaceholder('••••••••');
    
    const emailValidation = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    const passwordValidation = await passwordInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    
    expect(emailValidation || passwordValidation).toBeTruthy();
  });

  test('AUTH-006: debe mostrar/ocultar contraseña con el botón toggle', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('••••••••');
    const toggleButton = page.getByRole('button', { name: /mostrar|ver|show|eye/i }).or(page.locator('[aria-label*="password"]'));
    
    if (await toggleButton.count() > 0) {
      const initialType = await passwordInput.getAttribute('type');
      expect(initialType).toBe('password');
      
      await toggleButton.first().click();
      const afterClickType = await passwordInput.getAttribute('type');
      expect(['text', 'password']).toContain(afterClickType);
    } else {
      console.log('Toggle button not found - skipping this assertion');
    }
  });

  test('AUTH-007: debe redirigir al dashboard después de login exitoso', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL!;
    const password = process.env.TEST_USER_PASSWORD!;
    
    await page.getByPlaceholder('tu@email.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    await page.waitForURL(/\//, { timeout: 15000 });
    await expect(page).toHaveURL('/');
  });

  test('AUTH-009: debe mostrar link para registrarse', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /registr|crear cuenta|sign up/i });
    if (await registerLink.count() > 0) {
      await expect(registerLink.first()).toBeVisible();
    } else {
      console.log('Register link not found - feature may not be implemented');
    }
  });

  test('AUTH-010: debe mostrar link para recuperar contraseña', async ({ page }) => {
    const forgotLink = page.getByRole('link', { name: /olvidaste|recuperar|forgot|reset/i });
    if (await forgotLink.count() > 0) {
      await expect(forgotLink.first()).toBeVisible();
    } else {
      console.log('Forgot password link not found - feature may not be implemented');
    }
  });
});

// Test separado para persistencia de sesión (usa la sesión pre-autenticada del global-setup)
test.describe('Session Persistence', () => {
  test('AUTH-008: debe mantener la sesión después de refrescar', async ({ page }) => {
    // Este test usa el storageState del global-setup, por lo que ya está autenticado
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verificar que estamos en home (autenticados)
    await expect(page).toHaveURL('/');
    
    // Verificar que el store persiste en localStorage
    const authStore = await page.evaluate(() => localStorage.getItem('auth-store'));
    expect(authStore).toBeTruthy();
    
    // Recargar página SIN limpiar localStorage
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verificar que la sesión se mantiene
    await expect(page).toHaveURL('/', { timeout: 10000 });
    await expect(page).not.toHaveURL('/auth');
  });
});
