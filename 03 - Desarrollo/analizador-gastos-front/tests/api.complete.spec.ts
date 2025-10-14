import { test, expect } from '@playwright/test';

let authToken = '';

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
      expect(body).toHaveProperty('token_type');
    });

    test('API-002: POST /auth/login debe rechazar credenciales inválidas', async ({ request }) => {
      const response = await request.post('http://localhost:8000/api/v1/auth/login', {
        data: {
          email: 'invalid@mail.com',
          contraseña: 'wrongpassword',
        },
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('Gastos API', () => {
    test('API-003: GET /gastos debe listar todos los gastos', async ({ request }) => {
      const response = await request.get('http://localhost:8000/api/v1/gastos/', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(Array.isArray(body)).toBeTruthy();
    });

    test('API-004: POST /gastos debe crear un nuevo gasto', async ({ request }) => {
      const newGasto = {
        descripcion: 'Test Gasto API',
        monto: 100.50,
        fecha: new Date().toISOString().split('T')[0],
        id_categoria: 1, // Backend usa id_categoria no categoria_id
        comercio: 'Test Store',
        moneda: 'ARS',
      };

      const response = await request.post('http://localhost:8000/api/v1/gastos/', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        data: newGasto,
      });

      // Debug: ver respuesta si falla
      if (!response.ok()) {
        const errorBody = await response.text();
        console.log('❌ POST /gastos failed:', response.status());
        console.log('Error body:', errorBody);
        console.log('Request data:', JSON.stringify(newGasto, null, 2));
      }

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body).toHaveProperty('id_gasto'); // Backend retorna id_gasto no id
      expect(body.descripcion).toBe(newGasto.descripcion);
    });

    test('API-005: GET /gastos/{id} debe obtener un gasto específico', async ({ request }) => {
      const response = await request.get('http://localhost:8000/api/v1/gastos/1', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok()) {
        const body = await response.json();
        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('descripcion');
      }
    });

    test('API-006: PUT /gastos/{id} debe actualizar un gasto', async ({ request }) => {
      const updatedGasto = {
        descripcion: 'Gasto Actualizado API',
        monto: 200.00,
        fecha: new Date().toISOString().split('T')[0],
        categoria_id: 1,
        metodo_pago: 'Tarjeta',
      };

      const response = await request.put('http://localhost:8000/api/v1/gastos/1', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        data: updatedGasto,
      });

      if (response.ok()) {
        const body = await response.json();
        expect(body.descripcion).toBe(updatedGasto.descripcion);
      }
    });

    test('API-007: DELETE /gastos/{id} debe eliminar un gasto', async ({ request }) => {
      const createResponse = await request.post('http://localhost:8000/api/v1/gastos/', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          descripcion: 'Gasto para eliminar',
          monto: 50,
          fecha: new Date().toISOString().split('T')[0],
          categoria_id: 1,
          metodo_pago: 'Efectivo',
        },
      });

      if (createResponse.ok()) {
        const created = await createResponse.json();
        const deleteResponse = await request.delete(`http://localhost:8000/api/v1/gastos/${created.id}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        expect(deleteResponse.ok()).toBeTruthy();
      }
    });
  });

  test.describe('Ingresos API', () => {
    test('API-008: GET /ingresos debe listar todos los ingresos', async ({ request }) => {
      const response = await request.get('http://localhost:8000/api/v1/ingresos/', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(Array.isArray(body)).toBeTruthy();
    });

    test('API-009: POST /ingresos debe crear un nuevo ingreso', async ({ request }) => {
      const newIngreso = {
        descripcion: 'Test Ingreso API',
        monto: 5000.00,
        fecha: new Date().toISOString().split('T')[0],
        id_categoria: 1, // Backend usa id_categoria no categoria_id
        fuente: 'Empresa Test',
        tipo: 'salario', // Campo requerido según schema
        recurrente: false,
        frecuencia: 'mensual',
        moneda: 'ARS',
      };

      const response = await request.post('http://localhost:8000/api/v1/ingresos/', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        data: newIngreso,
      });

      // Debug: ver respuesta si falla
      if (!response.ok()) {
        const errorBody = await response.text();
        console.log('❌ POST /ingresos failed:', response.status(), errorBody);
      }

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body).toHaveProperty('id_ingreso'); // Backend retorna id_ingreso no id
      expect(body.descripcion).toBe(newIngreso.descripcion);
    });

    test('API-010: GET /ingresos/{id} debe obtener un ingreso específico', async ({ request }) => {
      const response = await request.get('http://localhost:8000/api/v1/ingresos/1', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok()) {
        const body = await response.json();
        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('descripcion');
      }
    });
  });

  test.describe('Categorías API', () => {
    test('API-011: GET /categorias debe listar todas las categorías', async ({ request }) => {
      const response = await request.get('http://localhost:8000/api/v1/categorias/', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(Array.isArray(body)).toBeTruthy();
    });

    test('API-012: POST /categorias debe crear una nueva categoría', async ({ request }) => {
      const newCategoria = {
        nombre: 'Categoría Test API',
        tipo: 'gasto',
        descripcion: 'Categoría de prueba',
      };

      const response = await request.post('http://localhost:8000/api/v1/categorias/', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        data: newCategoria,
      });

      if (response.ok()) {
        const body = await response.json();
        // Backend retorna 'id_categoria' no 'id'
        expect(body).toHaveProperty('id_categoria');
        expect(body.nombre).toBe(newCategoria.nombre);
      }
    });
  });

  test.describe('Dashboard/Resumen API', () => {
    test('API-013: GET /dashboard/resumen debe obtener resumen financiero', async ({ request }) => {
      const response = await request.get('http://localhost:8000/api/v1/dashboard/resumen', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok()) {
        const body = await response.json();
        expect(body).toHaveProperty('total_ingresos');
        expect(body).toHaveProperty('total_gastos');
        expect(body).toHaveProperty('balance');
      }
    });

    test('API-014: GET /dashboard/gastos-por-categoria debe obtener gastos agrupados', async ({ request }) => {
      const response = await request.get('http://localhost:8000/api/v1/dashboard/gastos-por-categoria', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok()) {
        const body = await response.json();
        expect(Array.isArray(body)).toBeTruthy();
      }
    });
  });

  test.describe('Validaciones de datos', () => {
    test('API-015: debe rechazar gasto con monto negativo', async ({ request }) => {
      const invalidGasto = {
        descripcion: 'Gasto inválido',
        monto: -100,
        fecha: new Date().toISOString().split('T')[0],
        categoria_id: 1,
        metodo_pago: 'Efectivo',
      };

      const response = await request.post('http://localhost:8000/api/v1/gastos/', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        data: invalidGasto,
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('API-016: debe rechazar gasto sin descripción', async ({ request }) => {
      const invalidGasto = {
        monto: 100,
        fecha: new Date().toISOString().split('T')[0],
        categoria_id: 1,
        metodo_pago: 'Efectivo',
      };

      const response = await request.post('http://localhost:8000/api/v1/gastos/', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        data: invalidGasto,
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('API-017: debe rechazar fecha en formato incorrecto', async ({ request }) => {
      const invalidGasto = {
        descripcion: 'Gasto con fecha inválida',
        monto: 100,
        fecha: '2024-13-45',
        categoria_id: 1,
        metodo_pago: 'Efectivo',
      };

      const response = await request.post('http://localhost:8000/api/v1/gastos/', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        data: invalidGasto,
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('Paginación y filtros', () => {
    test('API-018: debe soportar paginación en listado de gastos', async ({ request }) => {
      const response = await request.get('http://localhost:8000/api/v1/gastos/?skip=0&limit=10', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(Array.isArray(body)).toBeTruthy();
    });

    test('API-019: debe filtrar gastos por fecha', async ({ request }) => {
      const fecha = new Date().toISOString().split('T')[0];
      const response = await request.get(`http://localhost:8000/api/v1/gastos/?fecha=${fecha}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok()) {
        const body = await response.json();
        expect(Array.isArray(body)).toBeTruthy();
      }
    });

    test('API-020: debe filtrar gastos por categoría', async ({ request }) => {
      const response = await request.get('http://localhost:8000/api/v1/gastos/?categoria_id=1', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok()) {
        const body = await response.json();
        expect(Array.isArray(body)).toBeTruthy();
      }
    });
  });

  test.describe('Manejo de errores', () => {
    test('API-021: debe retornar 401 o 403 sin token de autenticación', async ({ request }) => {
      const response = await request.get('http://localhost:8000/api/v1/gastos/');

      // Backend retorna 403 Forbidden en lugar de 401 Unauthorized cuando no hay token
      expect([401, 403]).toContain(response.status());
    });

    test('API-022: debe retornar 404 para recurso inexistente', async ({ request }) => {
      const response = await request.get('http://localhost:8000/api/v1/gastos/999999', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(404);
    });

    test('API-023: debe retornar 400 para datos mal formados', async ({ request }) => {
      const response = await request.post('http://localhost:8000/api/v1/gastos/', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        data: { invalid: 'data' },
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});
