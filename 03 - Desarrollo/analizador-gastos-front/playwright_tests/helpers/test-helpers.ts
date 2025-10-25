import { Page, APIRequestContext } from '@playwright/test';

/**
 * Constantes de URLs y configuración
 */
export const API_BASE_URL = 'http://localhost:8000/api/v1';
export const FRONTEND_BASE_URL = 'http://localhost:3000';

export const API_ENDPOINTS = {
  AUTH_LOGIN: `${API_BASE_URL}/auth/login`,
  AUTH_ME: `${API_BASE_URL}/auth/me`,
  GASTOS: `${API_BASE_URL}/gastos/`,
  INGRESOS: `${API_BASE_URL}/ingresos/`,
  CATEGORIAS: `${API_BASE_URL}/categorias/`,
  MONEDAS: `${API_BASE_URL}/monedas/`,
  DASHBOARD_STATS: `${API_BASE_URL}/dashboard/stats`,
};

/**
 * Credenciales de prueba
 */
export const TEST_CREDENTIALS = {
  email: process.env.TEST_USER_EMAIL || 'nicom2@mail.com',
  password: process.env.TEST_USER_PASSWORD || 'NicoM1234#',
};

/**
 * Autentica un usuario y retorna el token de acceso
 * Intenta múltiples URLs de login para manejar diferentes configuraciones
 */
export async function authenticateUser(request: APIRequestContext): Promise<string> {
  const loginUrls = [
    API_ENDPOINTS.AUTH_LOGIN,
    'http://127.0.0.1:8000/api/v1/auth/login',
    'http://host.docker.internal:8000/api/v1/auth/login',
  ];

  for (const url of loginUrls) {
    try {
      const response = await request.post(url, {
        data: {
          email: TEST_CREDENTIALS.email,
          contraseña: TEST_CREDENTIALS.password,
        },
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });

      if (response.ok()) {
        const body = await response.json();
        return body.access_token;
      }
    } catch (error) {
      // Intentar siguiente URL
    }
  }

  throw new Error('No se pudo autenticar el usuario para las pruebas');
}

/**
 * Realiza login en la interfaz web
 */
export async function loginViaUI(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="correo" i], input[placeholder*="email" i]');
  const passwordInput = page.locator('input[type="password"]');
  const loginButton = page.locator('button[type="submit"], button:has-text("Iniciar"), button:has-text("Entrar")');

  await emailInput.fill(TEST_CREDENTIALS.email);
  await passwordInput.fill(TEST_CREDENTIALS.password);
  await loginButton.click();

  // Esperar a que la URL cambie o el dashboard aparezca
  await page.waitForURL(/\/(dashboard|home|inicio)/, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

/**
 * Obtiene una categoría válida para usar en tests
 */
export async function getTestCategory(request: APIRequestContext, authToken: string): Promise<number | null> {
  try {
    const response = await request.get(API_ENDPOINTS.CATEGORIAS, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.ok()) {
      const categorias = await response.json();
      if (categorias && categorias.length > 0) {
        return categorias[0].id_categoria;
      }
    }
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
  }
  return null;
}

/**
 * Inicializa monedas en el sistema si no existen
 */
export async function initializeCurrencies(request: APIRequestContext, authToken: string): Promise<void> {
  try {
    const response = await request.get(API_ENDPOINTS.MONEDAS, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.ok()) {
      const monedas = await response.json();
      if (!monedas || monedas.length === 0) {
        await request.post(API_ENDPOINTS.MONEDAS, {
          headers: { Authorization: `Bearer ${authToken}` },
          data: { codigo_moneda: 'ARS', nombre: 'Peso Argentino', simbolo: '$', activa: true }
        });
      }
    }
  } catch (error) {
    console.error('Error inicializando monedas:', error);
  }
}

/**
 * Navega a una sección específica del dashboard
 */
export async function navigateToSection(page: Page, section: 'gastos' | 'ingresos' | 'dashboard' | 'reportes' | 'objetivos'): Promise<void> {
  const sectionLink = page.locator(`a[href*="/${section}"], button:has-text("${section.charAt(0).toUpperCase() + section.slice(1)}")`);
  await sectionLink.first().click();
  await page.waitForURL(`**/${section}**`, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(1000);
}

/**
 * Verifica que un elemento con data-testid existe y es visible
 */
export async function expectTestIdVisible(page: Page, testId: string, timeout = 5000): Promise<void> {
  const element = page.getByTestId(testId);
  await element.waitFor({ state: 'visible', timeout });
}

/**
 * Espera a que los datos del dashboard se carguen
 */
export async function waitForDashboardLoad(page: Page): Promise<void> {
  await page.waitForTimeout(2000);
  await page.waitForSelector('[data-testid^="dashboard-"]', { timeout: 5000 }).catch(() => null);
}
