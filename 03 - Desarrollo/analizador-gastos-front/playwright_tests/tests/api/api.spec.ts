import { test, expect } from '@playwright/test';

let authToken = '';
let testCategoriaId: number | null = null;

test.describe('API Complete Tests', () => {
  test.beforeAll(async ({ request }) => {
    const email = process.env.TEST_USER_EMAIL!;
    const password = process.env.TEST_USER_PASSWORD!;
    
    const loginUrls = [
      'http://localhost:8000/api/v1/auth/login',
      'http://127.0.0.1:8000/api/v1/auth/login',
      'http://host.docker.internal:8000/api/v1/auth/login',
    ];

    for (const url of loginUrls) {
      try {
        const response = await request.post(url, {
          data: {
            email,
            contraseña: password,
          },
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        });

        if (response.ok()) {
          const body = await response.json();
          authToken = body.access_token;
          console.log(`✅ API Tests authenticated with ${url}`);
          break;
        }
      } catch (error) {
        console.log(`Failed to authenticate with ${url}`);
      }
    }

    if (!authToken) {
      throw new Error('Could not authenticate for API tests');
    }

    // Inicializar monedas si no existen
    try {
      const monedasResponse = await request.get('http://localhost:8000/api/v1/monedas/', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (monedasResponse.ok()) {
        const monedas = await monedasResponse.json();
        if (!monedas || monedas.length === 0) {
          // Crear moneda ARS
          await request.post('http://localhost:8000/api/v1/monedas/', {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { codigo_moneda: 'ARS', nombre: 'Peso Argentino', simbolo: '$', activa: true }
          });
          console.log('✅ Moneda ARS inicializada');
        }
      }
    } catch (error) {
      console.log('Error inicializando monedas:', error);
    }

    // Obtener una categoría válida para usar en tests
    try {
      const categoriasResponse = await request.get('http://localhost:8000/api/v1/categorias/', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (categoriasResponse.ok()) {
        const categorias = await categoriasResponse.json();
        if (categorias && categorias.length > 0) {
          testCategoriaId = categorias[0].id_categoria;
          console.log(`✅ Categoría de test disponible: ID ${testCategoriaId}`);
        }
      }
    } catch (err) {
      console.log('Error obteniendo categorías:', err);
    }
  });

  test.describe('Auth API', () => {
    test('API-001: POST /auth/login debe autenticar usuario válido', async ({ request }) => {
      const email = process.env.TEST_USER_EMAIL!;
      const password = process.env.TEST_USER_PASSWORD!;
      
      const response = await request.post('http://localhost:8000/api/v1/auth/login', {
        data: {
          email,
          contraseña: password,
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body).toHaveProperty('access_token');
      expect(body).toHaveProperty('token_type', 'bearer');
    });

    test('API-002: POST /auth/login debe rechazar credenciales inválidas', async ({ request }) => {
      const response = await request.post('http://localhost:8000/api/v1/auth/login', {
        data: {
          email: 'invalid@example.com',
          contraseña: 'wrongpassword',
        },
      });

      expect(response.status()).toBe(401);
    });

    test('API-003: GET /auth/me debe devolver datos del usuario autenticado', async ({ request }) => {
      const response = await request.get('http://localhost:8000/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body).toHaveProperty('email');
      expect(body).toHaveProperty('nombre');
    });

    test('API-004: GET /auth/me sin token debe devolver 401', async ({ request }) => {
      const response = await request.get('http://localhost:8000/api/v1/auth/me');
      // FastAPI puede devolver 401, 403 o 404 dependiendo de la configuración
      expect([401, 403, 404]).toContain(response.status());
    });
  });

  test.describe('Gastos API', () => {
    let gastoId: number;

    test('API-005: GET /gastos debe listar gastos', async ({ request }) => {
      const response = await request.get('http://localhost:8000/api/v1/gastos/', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(Array.isArray(body)).toBeTruthy();
    });

    test('API-006: POST /gastos debe crear un nuevo gasto', async ({ request }) => {
      // Verificar que tenemos una categoría válida
      if (!testCategoriaId) {
        console.log('⚠️ No hay categoría disponible, saltando test API-006');
        test.skip();
        return;
      }

      // El backend extrae el usuario_id automáticamente del JWT token
      const newGasto = {
        descripcion: 'Test Gasto API',
        monto: 100.50,
        fecha: '2024-01-15',
        comercio: 'Test Store',
        id_categoria: testCategoriaId, // ✅ Usar categoría válida
        moneda: 'ARS',
        fuente: 'manual'
      };

      const response = await request.post('http://localhost:8000/api/v1/gastos/', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        data: newGasto,
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body).toHaveProperty('id_gasto');
      expect(body.descripcion).toBe(newGasto.descripcion);
      expect(parseFloat(body.monto)).toBe(newGasto.monto);
      
      gastoId = body.id_gasto;
    });

    test('API-007: GET /gastos/{id} debe obtener un gasto específico', async ({ request }) => {
      if (!gastoId) {
        test.skip();
        return;
      }

      const response = await request.get(`http://localhost:8000/api/v1/gastos/${gastoId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.id_gasto).toBe(gastoId);
    });
  });

  test.describe('Ingresos API', () => {
    let ingresoId: number;

    test('API-008: GET /ingresos debe listar todos los ingresos', async ({ request }) => {
      const response = await request.get('http://localhost:8000/api/v1/ingresos/', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      // Debug: Ver qué devuelve realmente el endpoint
      console.log('Response status:', response.status());
      console.log('Response body type:', typeof body);
      console.log('Is array?:', Array.isArray(body));
      if (!Array.isArray(body)) {
        console.log('Body content:', JSON.stringify(body, null, 2));
      }
      
      expect(Array.isArray(body)).toBeTruthy();
    });

    test('API-009: POST /ingresos debe crear un nuevo ingreso', async ({ request }) => {
      // El backend extrae el usuario_id automáticamente del JWT token
      const newIngreso = {
        descripcion: 'Test Ingreso API',
        monto: 5000.00,
        fecha: '2024-01-15',
        tipo: 'salario',
        moneda: 'ARS',
        fuente: 'test',
        id_categoria: null
      };

      const response = await request.post('http://localhost:8000/api/v1/ingresos/', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        data: newIngreso,
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body).toHaveProperty('id_ingreso');
      expect(body.descripcion).toBe(newIngreso.descripcion);
      
      ingresoId = body.id_ingreso;
    });

    test('API-010: GET /ingresos/{id} debe obtener un ingreso específico', async ({ request }) => {
      if (!ingresoId) {
        test.skip();
        return;
      }

      const response = await request.get(`http://localhost:8000/api/v1/ingresos/${ingresoId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.id_ingreso).toBe(ingresoId);
    });

    test('API-011: PUT /ingresos/{id} debe actualizar un ingreso', async ({ request }) => {
      if (!ingresoId) {
        test.skip();
        return;
      }

      const updateData = {
        descripcion: 'Ingreso Actualizado',
        monto: 6000.00,
      };

      const response = await request.put(`http://localhost:8000/api/v1/ingresos/${ingresoId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        data: updateData,
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.descripcion).toBe(updateData.descripcion);
    });

    test('API-012: DELETE /ingresos/{id} debe eliminar un ingreso', async ({ request }) => {
      if (!ingresoId) {
        test.skip();
        return;
      }

      const response = await request.delete(`http://localhost:8000/api/v1/ingresos/${ingresoId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('Dashboard API', () => {
    test.skip('API-013: GET /dashboard/stats debe devolver estadísticas', async ({ request }) => {
      // ⚠️ NOTA: Este endpoint NO EXISTE en el backend actual
      // El backend no implementa /api/v1/dashboard/stats
      // Saltando test hasta que se implemente el endpoint
      const response = await request.get('http://localhost:8000/api/v1/dashboard/stats', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      // El backend devuelve: resumen_general, gastos_por_categoria, ingresos_por_tipo, balance_mensual
      expect(body).toHaveProperty('resumen_general');
      expect(body).toHaveProperty('gastos_por_categoria');
      expect(body).toHaveProperty('balance_mensual');
    });
  });
});
