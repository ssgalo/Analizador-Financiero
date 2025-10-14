﻿/// <reference types="node" />
import { request as playwrightRequest, chromium } from '@playwright/test';

async function globalSetup() {
  const email = process.env.TEST_USER_EMAIL || 'nicom2@mail.com';
  const password = process.env.TEST_USER_PASSWORD || 'NicoM1234#';

  const loginUrls = [
    process.env.TEST_API_URL || 'http://localhost:8000/api/v1/auth/login',
    'http://localhost:8000/api/v1/auth/login',
    'http://127.0.0.1:8000/api/v1/auth/login',
    'http://host.docker.internal:8000/api/v1/auth/login',
  ];

  let successfulUrl: string | null = null;
  let token = '';
  let userInfo: unknown = null;

  for (const url of loginUrls) {
    try {
      console.log(`global-setup: trying ${url}`);
      
      const requestContext = await playwrightRequest.newContext({
        ignoreHTTPSErrors: true,
      });

      const response = await requestContext.post(url, {
        data: {
          email,
          contraseña: password,
        },
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        timeout: 10000,
      });

      if (response.ok()) {
        const body = await response.json();
        token = body.access_token;
        userInfo = body.user_info || body.user || { email };
        successfulUrl = url;
        console.log(`global-setup: ✅ authenticated successfully with ${url}`);
        await requestContext.dispose();
        break;
      } else {
        const errorBody = await response.text();
        console.error(`global-setup: login failed (${response.status()}): ${errorBody}`);
      }

      await requestContext.dispose();
    } catch (error) {
      console.error(`global-setup: error with ${url}:`, error instanceof Error ? error.message : error);
    }
  }

  if (!token || !successfulUrl) {
    console.error('\n⚠️  No se pudo autenticar con ninguna URL.');
    console.error(`   Usuario: ${email}`);
    console.error('   Asegúrate de que:');
    console.error('   1. El backend está corriendo');
    console.error('   2. El usuario existe en la base de datos');
    console.error('   3. La contraseña es correcta\n');
    throw new Error('global-setup: could not authenticate');
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

  console.log('global-setup: ✅ storageState.json created');
}

export default globalSetup;
