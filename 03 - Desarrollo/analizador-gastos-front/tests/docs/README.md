# 🧪 Documentación de Tests - Analizador Financiero# Tests - Analizador Financiero



Bienvenido a la suite de tests del Analizador Financiero. Esta documentación te guiará en todo lo que necesitas saber sobre los tests del proyecto.## 🚀 Quick Start



---### 1. Instalar dependencias



## 📚 Documentación Disponible```bash

npm install -D @playwright/test

### 1. 🚀 [COMO_EJECUTAR_TESTS.md](./COMO_EJECUTAR_TESTS.md)npx playwright install

**Guía paso a paso para ejecutar los tests**```



Si es tu primera vez o necesitas ejecutar los tests, **empieza por aquí**.### 2. Asegurar que el backend esté corriendo



**Contiene:**```bash

- ✅ Requisitos previos# Verificar backend

- ✅ Instalación de dependenciascurl http://localhost:8000/docs

- ✅ **Configuración de credenciales** (obligatorio)

- ✅ Comandos para ejecutar tests# O en Docker

- ✅ Cómo leer los resultadosdocker-compose up -d

- ✅ Solución de problemas comunes```



**Ideal para:** Cualquier persona que necesite ejecutar tests, sin importar su nivel técnico.### 3. Ejecutar todos los tests



---```bash

npx playwright test

### 2. 📋 [TESTS_IMPLEMENTADOS.md](./TESTS_IMPLEMENTADOS.md)```

**Lista completa de todos los tests con descripciones**

### 4. Ver reporte

¿Quieres saber qué se está probando exactamente? **Lee este documento**.

```bash

**Contiene:**npx playwright show-report

- 📊 103 tests organizados por categoría```

- ✅ Explicación detallada de qué prueba cada test

- ✅ Distribución: E2E, API, Unitarios---

- ✅ Cobertura de funcionalidades

## 📂 Tests Disponibles

**Categorías:**

- 🔐 Autenticación (10 tests)### E2E Tests

- 💰 Gastos (13 tests)```bash

- 💵 Ingresos (14 tests)npx playwright test auth.e2e.spec.ts         # 10 tests de autenticación

- 📊 Dashboard (27 tests)npx playwright test dashboard.e2e.spec.ts    # 27 tests de dashboard

- 🔌 API REST (23 tests)npx playwright test ingresos.e2e.spec.ts     # 14 tests de ingresos

- 🧮 Tests Unitarios (16 tests)```



**Ideal para:** Desarrolladores, QA, o cualquiera que quiera entender la cobertura de tests.### API Tests

```bash

---npx playwright test api.complete.spec.ts     # 23 tests de API REST

```

### 3. 📈 [EVOLUCION_TESTS.md](./EVOLUCION_TESTS.md)

**Cómo evolucionó el suite desde su creación hasta el 100%**### Unit Tests

```bash

¿Te interesa cómo se construyeron y mejoraron los tests? **Este documento es para ti**.npx playwright test unit.spec.ts             # 16 tests unitarios

```

**Contiene:**

- 🔄 9 fases de corrección documentadas---

- 📊 Evolución del 83.9% al 100% de aprobación

- 🔧 Problemas encontrados y sus soluciones## 🎯 Tests por Navegador

- 💡 Lecciones aprendidas

- 🎯 Mejores prácticas```bash

npx playwright test --project=chromium       # Chrome

**Ideal para:** Desarrolladores que quieran aprender sobre testing o entender decisiones técnicas.npx playwright test --project=firefox        # Firefox

npx playwright test --project=webkit         # Safari

---```



## 🎯 Inicio Rápido---



### ¿Primera vez? Sigue este orden:## 🐛 Debugging



1. **Configuración inicial:**```bash

   ```powershell# Modo UI interactivo

   # Instalar dependenciasnpx playwright test --ui

   npm install

   # Modo debug con inspector

   # Instalar navegadores de Playwrightnpx playwright test --debug

   npx playwright install

   # Ver el navegador

   # Configurar credenciales (OBLIGATORIO)npx playwright test --headed

   Copy-Item ".env.test.example" ".env.test"```

   notepad .env.test  # Editar con tus credenciales

   ```---



2. **Ejecutar tests:**## 📊 Cobertura Actual

   ```powershell

   # Todos los tests- ✅ Auth: 9/10 (90%)

   npx playwright test --project=chromium --reporter=line- ✅ Dashboard: 27/27 (100%)

   ```- ✅ Ingresos: 12/14 (86%)

- ✅ API: 23/23 (100%)

3. **Ver resultados:**- ✅ Unit: 13/16 (81%)

   - ✅ Si ves `103 passed` → Todo bien!

   - ❌ Si hay errores → Lee la sección de troubleshooting en [COMO_EJECUTAR_TESTS.md](./COMO_EJECUTAR_TESTS.md)**Total: 84/90 tests pasando (93%)**



------



## 📊 Resumen del Suite## 🔧 Troubleshooting



| Aspecto | Detalle |### Authentication failed

|---------|---------|```bash

| **Total de tests** | 103 tests |# Regenerar auth

| **Tiempo de ejecución** | ~23 segundos |node tests/generate-storageState.mjs

| **Cobertura** | 100% funcionalidades críticas |```

| **Estado** | ✅ Todos pasando |

| **Frameworks** | Playwright + TypeScript |### Backend no responde

```bash

---# Verificar Docker

docker ps

## 🔐 Importante: Credencialesdocker-compose logs backend

```

**⚠️ Los tests requieren configuración de credenciales.**

### Tests lentos

Antes de ejecutar por primera vez:```bash

# Ejecutar solo Chromium

1. Copia `.env.test.example` a `.env.test`npx playwright test --project=chromium

2. Edita `.env.test` con tus credenciales:```

   ```env

   TEST_USER_EMAIL=tu_email@mail.com---

   TEST_USER_PASSWORD=TuContraseña123#

   ```## 📚 Documentación Completa



**Más detalles:** Ver Paso 3 en [COMO_EJECUTAR_TESTS.md](./COMO_EJECUTAR_TESTS.md#-paso-3-configurar-credenciales-de-prueba-primera-vez-solamente)Ver `tests/TESTS_GUIDE.md` para documentación completa con:

- Configuración detallada

---- Descripción de cada test

- Mejores prácticas

## 📁 Estructura de Archivos- Troubleshooting avanzado



```---

tests/

├── README.md                      ← Estás aquí (índice principal)## 🤝 Convenciones

├── COMO_EJECUTAR_TESTS.md         ← Guía de ejecución paso a paso

├── TESTS_IMPLEMENTADOS.md         ← Lista de todos los tests### Naming de tests:

├── EVOLUCION_TESTS.md             ← Historia y mejoras del suite- `{MODULE}-{NUMBER}`: ID único (ej: `AUTH-001`)

│- Descripción en español

├── auth.e2e.spec.ts               ← 10 tests de autenticación- Usar `test.describe()` para agrupar

├── gastos.e2e.spec.ts             ← 13 tests de gastos

├── ingresos.e2e.spec.ts           ← 14 tests de ingresos### Selectores:

├── dashboard.e2e.spec.ts          ← 27 tests de dashboard1. `getByRole()` - Primera opción

├── api.complete.spec.ts           ← 23 tests de API2. `getByPlaceholder()` - Para inputs

├── unit.spec.ts                   ← 16 tests unitarios3. `getByText()` - Para texto visible

│4. `locator()` - Último recurso

├── global-setup.ts                ← Setup de autenticación

└── storageState.json              ← Sesión guardada (generado)### Assertions:

``````typescript

await expect(element).toBeVisible({ timeout: 10000 });

---await page.waitForURL(/dashboard/);

```

## 🛠️ Comandos Útiles

---

```powershell

# Ejecutar todos los tests**Versión**: 2.0  

npx playwright test --project=chromium --reporter=line**Última actualización**: Octubre 2025


# Ejecutar solo tests de autenticación
npx playwright test auth.e2e.spec.ts --project=chromium --reporter=line

# Ejecutar solo tests de gastos
npx playwright test gastos.e2e.spec.ts --project=chromium --reporter=line

# Ver reporte HTML
npx playwright test --reporter=html
npx playwright show-report
```

---

## 🆘 ¿Necesitas Ayuda?

1. **¿Cómo ejecutar tests?** → [COMO_EJECUTAR_TESTS.md](./COMO_EJECUTAR_TESTS.md)
2. **¿Qué se está probando?** → [TESTS_IMPLEMENTADOS.md](./TESTS_IMPLEMENTADOS.md)
3. **¿Cómo se construyó esto?** → [EVOLUCION_TESTS.md](./EVOLUCION_TESTS.md)
4. **¿Error de credenciales?** → Ver Paso 3 en COMO_EJECUTAR_TESTS.md
5. **¿Backend no responde?** → Verificar que esté en http://localhost:8000/docs

---

## ✅ Checklist Rápido

Antes de ejecutar tests:

- [ ] Node.js instalado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Navegadores instalados (`npx playwright install`)
- [ ] **Credenciales configuradas en `.env.test`**
- [ ] Backend corriendo (http://localhost:8000/docs)
- [ ] Frontend corriendo (http://localhost:3000)

---

## 🎉 Estado Actual

**✅ Suite completo y funcional al 100%**

- 103 tests implementados
- 0 tests fallando
- ~23 segundos de ejecución
- Documentación completa

---

**Última actualización:** Octubre 2025  
**Mantenedores:** Equipo de desarrollo del Analizador Financiero
