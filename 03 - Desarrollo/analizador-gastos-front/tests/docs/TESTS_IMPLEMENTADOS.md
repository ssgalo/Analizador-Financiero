# 📋 Tests Implementados - Analizador Financiero

Esta documentación describe **todos los tests implementados** en el proyecto, organizados por categoría y con explicación de qué se prueba en cada uno.

---

## 📊 Resumen General

| Categoría | Cantidad | Archivo | Descripción |
|-----------|----------|---------|-------------|
| **Autenticación E2E** | 10 tests | `auth.e2e.spec.ts` | Login, validaciones, navegación |
| **Gastos E2E** | 13 tests | `gastos.e2e.spec.ts` | CRUD completo de gastos |
| **Ingresos E2E** | 14 tests | `ingresos.e2e.spec.ts` | CRUD completo de ingresos |
| **Dashboard E2E** | 27 tests | `dashboard.e2e.spec.ts` | Visualización, filtros, responsividad |
| **API REST** | 23 tests | `api.complete.spec.ts` | Endpoints backend, validaciones |
| **Tests Unitarios** | 16 tests | `unit.spec.ts` | Utilidades, formatters, cálculos |
| **TOTAL** | **103 tests** | 6 archivos | Cobertura completa del sistema |

---

## 🔐 Tests de Autenticación (10 tests)

**Archivo:** `tests/auth.e2e.spec.ts`

### AUTH-001: Debe mostrar la página de login
- ✅ Verifica que el título "Analizador Financiero" esté visible
- ✅ Verifica que los campos de email y contraseña existan
- ✅ Verifica que el botón de "Iniciar Sesión" esté presente

### AUTH-002: Debe autenticar usuario válido
- ✅ Completa el formulario con credenciales válidas
- ✅ Hace clic en "Iniciar Sesión"
- ✅ Verifica redirección a la página principal

### AUTH-003: Debe mostrar error con credenciales inválidas
- ✅ Intenta login con email/contraseña incorrectos
- ✅ Verifica que aparezca un mensaje de error
- ✅ Verifica que permanece en la página de login

### AUTH-004: Debe validar campo de email
- ✅ Intenta login con email en formato incorrecto
- ✅ Verifica validación HTML5 del campo email

### AUTH-005: Debe validar campos obligatorios
- ✅ Intenta hacer clic en "Iniciar Sesión" sin llenar campos
- ✅ Verifica que los campos se marquen como requeridos

### AUTH-006: Debe mostrar/ocultar contraseña con botón toggle
- ✅ Verifica que el input sea tipo "password" inicialmente
- ✅ Hace clic en el botón toggle
- ✅ Verifica que el input cambie a tipo "text"
- ⚠️ Opcional: Puede que el botón no esté implementado

### AUTH-007: Debe redirigir al dashboard después de login exitoso
- ✅ Realiza login manual completo
- ✅ Verifica redirección a la URL raíz (`/`)

### AUTH-008: Debe mantener sesión después de recargar página
- ✅ Usa sesión pre-autenticada (`storageState.json`)
- ✅ Recarga la página
- ✅ Verifica que sigue autenticado
- ✅ Verifica que puede navegar sin problemas

### AUTH-009: Debe mostrar link para registrarse
- ✅ Busca link de "Registrarse" o "Crear cuenta"
- ⚠️ Opcional: Si no existe, muestra mensaje informativo

### AUTH-010: Debe mostrar link para recuperar contraseña
- ✅ Busca link de "¿Olvidaste tu contraseña?"
- ⚠️ Opcional: Si no existe, muestra mensaje informativo

---

## 💰 Tests de Gastos (13 tests)

**Archivo:** `tests/gastos.e2e.spec.ts`

### GAS-001: Debe navegar a la página de gastos
- ✅ Hace clic en el menú "Gastos"
- ✅ Verifica que la URL contenga `/gastos`
- ✅ Verifica que se muestre el título de la página

### GAS-002: Debe mostrar el botón de agregar gasto
- ✅ Verifica que exista un botón con texto "Agregar Gasto" o similar

### GAS-003: Debe abrir formulario al hacer clic en agregar gasto
- ✅ Hace clic en "Agregar Gasto"
- ✅ Verifica que aparezcan campos del formulario (monto, descripción, fecha)

### GAS-004: Debe crear un nuevo gasto
- ✅ Abre el formulario de nuevo gasto
- ✅ Llena todos los campos requeridos
- ✅ Guarda el gasto
- ✅ Verifica que aparezca en la lista

### GAS-005: Debe editar un gasto existente
- ✅ Busca un gasto en la lista
- ✅ Hace clic en "Editar"
- ✅ Modifica el monto o descripción
- ✅ Guarda los cambios
- ✅ Verifica que los cambios se reflejen

### GAS-006: Debe eliminar un gasto
- ✅ Busca un gasto en la lista
- ✅ Hace clic en "Eliminar"
- ✅ Confirma la eliminación (si hay modal)
- ✅ Verifica que el gasto desaparezca de la lista

### GAS-007: Debe validar campos obligatorios al crear gasto
- ✅ Abre formulario de nuevo gasto
- ✅ Intenta guardar sin llenar campos
- ✅ Verifica mensajes de validación

### GAS-008: Debe filtrar gastos por categoría
- ✅ Selecciona una categoría del filtro
- ✅ Verifica que solo se muestren gastos de esa categoría

### GAS-009: Debe filtrar gastos por fecha
- ✅ Selecciona un rango de fechas
- ✅ Verifica que solo se muestren gastos en ese rango

### GAS-010: Debe buscar gastos por descripción
- ✅ Escribe texto en el campo de búsqueda
- ✅ Verifica que los resultados contengan ese texto

### GAS-011: Debe mostrar el monto total de gastos
- ✅ Verifica que exista un elemento mostrando el total
- ✅ Verifica que el formato sea monetario ($X,XXX.XX)

### GAS-012: Debe paginar la lista de gastos si hay muchos
- ✅ Verifica que exista paginación si hay más de 10-20 gastos
- ✅ Verifica que se pueda navegar entre páginas

### GAS-013: Debe mostrar mensaje cuando no hay gastos
- ✅ Aplica filtros que no devuelvan resultados
- ✅ Verifica mensaje "No se encontraron gastos" o similar

---

## 💵 Tests de Ingresos (14 tests)

**Archivo:** `tests/ingresos.e2e.spec.ts`

### ING-001: Debe navegar a la página de ingresos
- ✅ Hace clic en el menú "Ingresos"
- ✅ Verifica que la URL contenga `/ingresos`

### ING-002: Debe mostrar el botón de agregar ingreso
- ✅ Verifica que exista un botón "Agregar Ingreso"

### ING-003: Debe listar los ingresos existentes
- ✅ Verifica que se muestre una lista o tabla de ingresos
- ✅ Verifica que los elementos tengan descripción y monto

### ING-004: Debe mostrar los ingresos ordenados por fecha (más reciente primero)
- ✅ Verifica que el primer ingreso sea el más reciente
- ✅ Compara fechas de los primeros elementos

### ING-005: Debe mostrar el total de ingresos
- ✅ Verifica que exista un elemento con el total
- ✅ Verifica formato monetario

### ING-006: Debe filtrar ingresos por tipo (si aplica)
- ✅ Selecciona un tipo de ingreso
- ✅ Verifica que los resultados coincidan

### ING-007: Debe abrir el formulario al hacer clic en "Agregar Ingreso"
- ✅ Hace clic en el botón
- ✅ Verifica que aparezcan los campos del formulario
- ✅ Verifica labels: "Monto *", "Descripción *"

### ING-008: Debe mostrar todos los campos requeridos en el formulario
- ✅ Cuenta los inputs del formulario
- ✅ Verifica que haya al menos 4 campos

### ING-009: Debe cancelar la creación de un ingreso
- ✅ Abre el formulario
- ✅ Llena algunos campos
- ✅ Hace clic en "Cancelar"
- ✅ Verifica que el formulario se cierre sin guardar

### ING-010: Debe validar el campo descripción
- ✅ Verifica que el placeholder sea "ej: Sueldo"
- ✅ Escribe una descripción válida

### ING-011: Debe validar el campo monto
- ✅ Verifica que el campo de monto sea visible
- ✅ Ingresa un valor numérico válido
- ✅ Verifica que el valor se mantenga

### ING-012: Debe mostrar error si el monto es inválido
- ✅ Ingresa monto cero o negativo
- ✅ Intenta guardar
- ✅ Verifica mensaje de error

### ING-013: Debe crear un nuevo ingreso con datos válidos
- ✅ Llena todos los campos correctamente
- ✅ Guarda el ingreso
- ✅ Verifica que aparezca en la lista

### ING-014: Debe editar un ingreso existente
- ✅ Selecciona un ingreso de la lista
- ✅ Modifica la descripción o monto
- ✅ Guarda los cambios
- ✅ Verifica que se actualice

---

## 📊 Tests de Dashboard (27 tests)

**Archivo:** `tests/dashboard.e2e.spec.ts`

### Navegación (5 tests)

#### DASH-001: Debe cargar el dashboard correctamente
- ✅ Verifica que se muestre el heading nivel 2 "Resumen Financiero"

#### DASH-002: Debe navegar a Gastos desde el menú
- ✅ Hace clic en el link "Gastos"
- ✅ Verifica redirección a `/gastos`

#### DASH-003: Debe navegar a Ingresos desde el menú
- ✅ Hace clic en el link "Ingresos"
- ✅ Verifica redirección a `/ingresos`

#### DASH-004: Debe navegar a Reportes desde el menú (si aplica)
- ✅ Busca y hace clic en "Reportes"
- ✅ Verifica redirección

#### DASH-005: Debe mostrar el nombre o email del usuario
- ✅ Busca un elemento con el email del usuario autenticado
- ✅ Verifica que sea visible

### Tarjetas de Resumen (5 tests)

#### DASH-006: Debe mostrar la tarjeta de "Ingresos del Mes"
- ✅ Verifica que exista el texto "Ingresos del Mes"
- ✅ Verifica que haya un valor monetario

#### DASH-007: Debe mostrar la tarjeta de "Gastos del Mes"
- ✅ Verifica que exista el texto "Gastos del Mes"
- ✅ Verifica que haya un valor monetario

#### DASH-008: Debe mostrar la tarjeta de "Ahorro del Mes"
- ✅ Verifica que exista el texto "Ahorro del Mes"
- ✅ Verifica el cálculo (ingresos - gastos)

#### DASH-009: Debe mostrar valores monetarios con formato correcto ($X,XXX.XX)
- ✅ Verifica formato de moneda en todas las tarjetas

#### DASH-010: Debe calcular correctamente el ahorro (Ingresos - Gastos)
- ✅ Obtiene valores de ingresos y gastos
- ✅ Calcula diferencia
- ✅ Compara con el valor mostrado

### Gráficos (5 tests)

#### DASH-011: Debe mostrar gráfico de ingresos vs gastos
- ✅ Verifica que exista un gráfico o chart
- ✅ Verifica que tenga leyenda

#### DASH-012: Debe mostrar gráfico de gastos por categoría
- ✅ Verifica gráfico de torta o barras
- ✅ Verifica que muestre categorías

#### DASH-013: Debe mostrar gráfico de evolución mensual
- ✅ Verifica gráfico de línea o barras
- ✅ Verifica que tenga datos de varios meses

#### DASH-014: Los gráficos deben ser interactivos (hover)
- ✅ Hace hover sobre elementos del gráfico
- ✅ Verifica que aparezca tooltip

#### DASH-015: Los gráficos deben actualizarse con los filtros
- ✅ Cambia filtro de fecha
- ✅ Verifica que el gráfico se actualice

### Filtros (5 tests)

#### DASH-016: Debe filtrar por mes actual
- ✅ Selecciona filtro "Mes actual"
- ✅ Verifica que solo se muestren datos del mes

#### DASH-017: Debe filtrar por mes anterior
- ✅ Selecciona filtro "Mes anterior"
- ✅ Verifica que se muestren datos del mes pasado

#### DASH-018: Debe filtrar por año actual
- ✅ Selecciona filtro "Año actual"
- ✅ Verifica que se muestren datos del año

#### DASH-019: Debe filtrar por rango de fechas personalizado
- ✅ Selecciona fecha inicial y final
- ✅ Verifica que se filtren los datos correctamente

#### DASH-020: Los filtros deben actualizar todas las secciones
- ✅ Cambia filtro
- ✅ Verifica que tarjetas, gráficos y listas se actualicen

### Últimos Movimientos (4 tests)

#### DASH-021: Debe mostrar los últimos 5 gastos
- ✅ Verifica que exista sección "Últimos Gastos"
- ✅ Verifica que muestre al menos 1 gasto reciente

#### DASH-022: Debe mostrar los últimos 5 ingresos
- ✅ Verifica que exista sección "Últimos Ingresos"
- ✅ Verifica que muestre al menos 1 ingreso reciente

#### DASH-023: Los movimientos deben estar ordenados por fecha (más reciente primero)
- ✅ Verifica orden cronológico descendente

#### DASH-024: Debe poder hacer clic en un movimiento para ver detalles
- ✅ Hace clic en un movimiento
- ✅ Verifica que abra modal o navegue a detalle

### Responsividad (3 tests)

#### DASH-025: Debe mostrarse correctamente en dispositivos móviles
- ✅ Cambia viewport a 375x667 (móvil)
- ✅ Verifica que los elementos sean visibles

#### DASH-026: Las tarjetas deben apilarse verticalmente en móvil
- ✅ Verifica que las tarjetas sean visibles en móvil
- ✅ Verifica layout vertical

#### DASH-027: El menú debe colapsar en un botón hamburguesa en móvil
- ✅ Verifica que exista botón hamburguesa
- ✅ Verifica que se pueda abrir el menú

---

## 🔌 Tests de API (23 tests)

**Archivo:** `tests/api.complete.spec.ts`

### API de Autenticación (2 tests)

#### API-001: POST /auth/login debe autenticar usuario válido
- ✅ Envía credenciales correctas
- ✅ Verifica status 200
- ✅ Verifica que retorne `access_token`

#### API-002: POST /auth/login debe rechazar credenciales inválidas
- ✅ Envía credenciales incorrectas
- ✅ Verifica status 401
- ✅ Verifica mensaje de error

### API de Gastos (5 tests)

#### API-003: GET /gastos debe listar todos los gastos
- ✅ Envía GET con token de autenticación
- ✅ Verifica status 200
- ✅ Verifica que retorne array de gastos

#### API-004: POST /gastos debe crear un nuevo gasto
- ✅ Envía POST con datos válidos
- ✅ Verifica status 201
- ✅ Verifica schema: `{id_gasto, id_categoria, comercio, moneda}`

#### API-005: GET /gastos/{id} debe obtener un gasto específico
- ✅ Envía GET con ID válido
- ✅ Verifica status 200
- ✅ Verifica que retorne el gasto correcto

#### API-006: PUT /gastos/{id} debe actualizar un gasto
- ✅ Envía PUT con datos actualizados
- ✅ Verifica status 200
- ✅ Verifica que los cambios se hayan aplicado

#### API-007: DELETE /gastos/{id} debe eliminar un gasto
- ✅ Envía DELETE con ID válido
- ✅ Verifica status 200 o 204
- ✅ Verifica que el gasto ya no exista

### API de Ingresos (5 tests)

#### API-008: GET /ingresos debe listar todos los ingresos
- ✅ Envía GET con token
- ✅ Verifica status 200
- ✅ Verifica array de ingresos

#### API-009: POST /ingresos debe crear un nuevo ingreso
- ✅ Envía POST con datos válidos
- ✅ Verifica status 201
- ✅ Verifica schema: `{id_ingreso, id_categoria, tipo, frecuencia}`

#### API-010: GET /ingresos/{id} debe obtener un ingreso específico
- ✅ Envía GET con ID válido
- ✅ Verifica status 200

#### API-011: PUT /ingresos/{id} debe actualizar un ingreso
- ✅ Envía PUT con datos actualizados
- ✅ Verifica status 200

#### API-012: DELETE /ingresos/{id} debe eliminar un ingreso
- ✅ Envía DELETE con ID válido
- ✅ Verifica status 200 o 204

### API de Categorías (3 tests)

#### API-013: GET /categorias debe listar todas las categorías
- ✅ Verifica que retorne lista de categorías
- ✅ Verifica campos: `id_categoria`, `nombre`, `tipo`

#### API-014: POST /categorias debe crear una nueva categoría
- ✅ Crea categoría con nombre único
- ✅ Verifica que retorne `id_categoria`

#### API-015: GET /categorias/{id} debe obtener una categoría específica
- ✅ Verifica status 200
- ✅ Verifica que retorne la categoría correcta

### API de Dashboard/Resumen (1 test)

#### API-016: GET /dashboard/resumen debe obtener resumen financiero
- ✅ Verifica status 200
- ✅ Verifica campos: ingresos totales, gastos totales, balance

### Validaciones de Datos (4 tests)

#### API-017: Debe rechazar gasto con monto negativo
- ✅ Envía POST con monto < 0
- ✅ Verifica status 400 o 422

#### API-018: Debe rechazar ingreso con monto negativo
- ✅ Envía POST con monto < 0
- ✅ Verifica status 400 o 422

#### API-019: Debe rechazar fecha en formato incorrecto
- ✅ Envía POST con fecha inválida
- ✅ Verifica error de validación

#### API-020: Debe rechazar datos incompletos
- ✅ Envía POST sin campos requeridos
- ✅ Verifica status 400 o 422

### Manejo de Errores (3 tests)

#### API-021: Debe retornar 401 o 403 sin token de autenticación
- ✅ Envía request sin header Authorization
- ✅ Verifica status 401 o 403

#### API-022: Debe retornar 404 para recurso inexistente
- ✅ Envía GET con ID que no existe
- ✅ Verifica status 404

#### API-023: Debe retornar 400 para datos mal formados
- ✅ Envía POST con JSON inválido
- ✅ Verifica status 400

---

## 🧮 Tests Unitarios (16 tests)

**Archivo:** `tests/unit.spec.ts`

### Formatters (4 tests)

#### UNIT-001: formatCurrency debe formatear correctamente
- ✅ Prueba: `formatCurrency(1234.56)` → `"$1,234.56"`
- ✅ Prueba: `formatCurrency(0)` → `"$0.00"`
- ✅ Prueba: `formatCurrency(1000000)` → `"$1,000,000.00"`

#### UNIT-002: formatDate debe formatear fecha en formato local
- ✅ Prueba: `formatDate('2024-01-15')` → `"15/01/2024"`
- ✅ Verifica formato DD/MM/YYYY

#### UNIT-003: formatPercentage debe formatear porcentajes
- ✅ Prueba: `formatPercentage(0.25)` → `"25%"`
- ✅ Prueba: `formatPercentage(0.5)` → `"50%"`

#### UNIT-004: formatDate debe manejar correctamente zonas horarias
- ✅ Prueba con fecha con hora: `new Date('2024-01-15T12:00:00')`
- ✅ Verifica que no cambie la fecha por UTC

### Validaciones (4 tests)

#### UNIT-005: isValidEmail debe validar emails correctamente
- ✅ Prueba: `isValidEmail('test@mail.com')` → `true`
- ✅ Prueba: `isValidEmail('invalid')` → `false`
- ✅ Prueba: `isValidEmail('')` → `false`

#### UNIT-006: isValidAmount debe validar montos
- ✅ Prueba: `isValidAmount(100)` → `true`
- ✅ Prueba: `isValidAmount(0)` → `false`
- ✅ Prueba: `isValidAmount(-50)` → `false`

#### UNIT-007: isValidDate debe validar fechas
- ✅ Prueba: `isValidDate('2024-01-15')` → `true`
- ✅ Prueba: `isValidDate('invalid')` → `false`

#### UNIT-008: isValidPassword debe validar contraseñas
- ✅ Prueba longitud mínima (8 caracteres)
- ✅ Prueba que incluya mayúsculas, minúsculas, números

### Cálculos (4 tests)

#### UNIT-009: calculateBalance debe calcular correctamente
- ✅ Prueba: `calculateBalance(5000, 3000)` → `2000`
- ✅ Prueba con valores decimales

#### UNIT-010: calculatePercentage debe calcular porcentajes
- ✅ Prueba: `calculatePercentage(50, 200)` → `25`
- ✅ Prueba: `calculatePercentage(100, 100)` → `100`

#### UNIT-011: sumArray debe sumar arrays de números
- ✅ Prueba: `sumArray([1, 2, 3, 4, 5])` → `15`
- ✅ Prueba: `sumArray([])` → `0`

#### UNIT-012: averageArray debe calcular promedio
- ✅ Prueba: `averageArray([10, 20, 30])` → `20`
- ✅ Prueba: `averageArray([])` → `0`

### Utilidades (4 tests)

#### UNIT-013: truncateText debe recortar texto largo
- ✅ Prueba: `truncateText('texto muy largo...', 10)` → `"texto muy..."`
- ✅ Prueba texto corto no se recorta

#### UNIT-014: capitalizeFirst debe capitalizar primera letra
- ✅ Prueba: `capitalizeFirst('hola')` → `"Hola"`
- ✅ Prueba: `capitalizeFirst('MUNDO')` → `"MUNDO"`

#### UNIT-015: sortByDate debe ordenar por fecha
- ✅ Prueba ordenamiento de array de objetos con fecha
- ✅ Verifica orden descendente (más reciente primero)

#### UNIT-016: groupByCategory debe agrupar elementos
- ✅ Prueba agrupación de gastos/ingresos por categoría
- ✅ Verifica estructura del objeto resultante

---

## 🎯 Cobertura de Funcionalidades

### ✅ Funcionalidades Completamente Cubiertas

| Funcionalidad | E2E | API | Unit | Total |
|---------------|-----|-----|------|-------|
| Autenticación | 10 | 2 | 2 | 14 tests |
| CRUD Gastos | 13 | 5 | - | 18 tests |
| CRUD Ingresos | 14 | 5 | - | 19 tests |
| Dashboard | 27 | 1 | - | 28 tests |
| Validaciones | - | 4 | 4 | 8 tests |
| Cálculos | - | - | 4 | 4 tests |
| Formatters | - | - | 4 | 4 tests |
| Utilidades | - | - | 4 | 4 tests |
| Manejo de Errores | - | 3 | - | 3 tests |
| **TOTAL** | **64** | **20** | **18** | **103** |

---

## 📝 Notas Importantes

### 🔐 Credenciales de Prueba
Todos los tests requieren configurar el archivo `.env.test`:
```env
TEST_USER_EMAIL=tu_email@mail.com
TEST_USER_PASSWORD=TuPassword123#
```

### ⚠️ Tests Opcionales
Algunos tests verifican funcionalidades que pueden no estar implementadas:
- **AUTH-006:** Botón toggle de contraseña
- **AUTH-009:** Link de registro
- **AUTH-010:** Link de recuperar contraseña

Si estas funcionalidades no existen, los tests muestran un mensaje informativo y continúan.

### 🎨 Selectores Dinámicos
Los tests usan selectores robustos:
- Por rol ARIA: `getByRole('button', { name: 'Agregar' })`
- Por texto (regex): `getByText(/agregar|añadir/i)`
- Por placeholder: `getByPlaceholder('Ingresa el monto')`
- Por posición cuando es necesario: `.nth(1)`

### 🔄 Estado Compartido
- `global-setup.ts` realiza login una vez y guarda el token en `storageState.json`
- Los tests E2E reutilizan esta sesión para mayor velocidad
- Los tests de API realizan su propio login en el `beforeAll`

---

## 📚 Documentación Relacionada

- **[COMO_EJECUTAR_TESTS.md](./COMO_EJECUTAR_TESTS.md)** - Guía paso a paso para ejecutar tests
- **[EVOLUCION_TESTS.md](./EVOLUCION_TESTS.md)** - Cómo evolucionó el suite desde 83.9% hasta 100%

---

**Última actualización:** Octubre 2025  
**Total de tests:** 103 tests funcionales ✅  
**Estado:** Suite completo y funcional al 100%
