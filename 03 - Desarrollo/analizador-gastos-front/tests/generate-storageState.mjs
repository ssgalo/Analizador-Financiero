import { chromium, request as playwrightRequest } from '@playwright/test';

async function generateStorageState() {
  const email = 'nicom2@mail.com';
  const password = 'NicoM1234#';
  
  const loginUrls = [
    'http://localhost:8000/api/v1/auth/login',
    'http://127.0.0.1:8000/api/v1/auth/login',
    'http://host.docker.internal:8000/api/v1/auth/login',
  ];

  let token = '';
  let userInfo = null;

  for (const url of loginUrls) {
    try {
      console.log(`Intentando autenticar con: ${url}`);
      
      const requestContext = await playwrightRequest.newContext();

      const response = await requestContext.post(url, {
        data: { email, contraseña: password },
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        timeout: 10000,
      });

      if (response.ok()) {
        const body = await response.json();
        token = body.access_token;
        userInfo = body.user_info || body.user || { email };
        console.log(`✅ Autenticación exitosa con ${url}`);
        await requestContext.dispose();
        break;
      }

      await requestContext.dispose();
    } catch (error) {
      console.error(`Error con ${url}:`, error.message);
    }
  }

  if (!token) {
    console.error('❌ No se pudo autenticar con ninguna URL');
    process.exit(1);
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:3000');

  await page.evaluate(
    ({ token, userInfo }) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_info', JSON.stringify(userInfo));

      const authStore = {
        state: {
          user: userInfo,
          isAuthenticated: true,
          isLoading: false,
          tokenExpiry: Date.now() + (3600 * 1000),
          sessionExpired: false
        },
        version: 0
      };
      localStorage.setItem('auth-store', JSON.stringify(authStore));
    },
    { token, userInfo }
  );

  await context.storageState({ path: 'tests/storageState.json' });
  await browser.close();

  console.log('✅ storageState.json generado correctamente');
}

generateStorageState();
