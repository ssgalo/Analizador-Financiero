# 🧪 Testing Unitario con Jest - Analizador Financiero

Documentación completa de tests unitarios para el frontend del Analizador Financiero.

---

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración del Entorno](#configuración-del-entorno)
3. [Ejecución de Tests](#ejecución-de-tests)
4. [Catálogo de Tests](#catálogo-de-tests)
5. [Estructura del Proyecto](#estructura-del-proyecto)
6. [Convenciones y Buenas Prácticas](#convenciones-y-buenas-prácticas)

---

## 🔧 Requisitos Previos

### Software Necesario

| Software | Versión Mínima | Propósito |
|----------|----------------|-----------|
| **Node.js** | v18.0.0+ | Runtime de JavaScript |
| **npm** | v9.0.0+ | Gestor de paquetes |
| **Git** | v2.30.0+ | Control de versiones |

### Dependencias del Proyecto

Los tests utilizan las siguientes tecnologías:

- **Jest** `29.7.0` - Framework de testing
- **ts-jest** `29.1.1` - Preset de TypeScript para Jest
- **@testing-library/react** `16.0.1` - Utilidades para testear React
- **@testing-library/jest-dom** `6.1.4` - Matchers adicionales para DOM
- **@testing-library/user-event** `14.5.1` - Simulación de eventos de usuario
- **jsdom** - Entorno de navegador simulado

---

## ⚙️ Configuración del Entorno

### 1. Instalar Dependencias

Desde la raíz del proyecto frontend:

```powershell
cd "03 - Desarrollo/analizador-gastos-front"
npm install
```

### 2. Verificar Configuración

Asegúrate de que existen estos archivos:

- ✅ `jest.config.json` - Configuración de Jest
- ✅ `src/tests/jest_tests/setup/setup.ts` - Archivo de setup global

### 3. Variables de Entorno

Los tests utilizan variables de entorno mockeadas. Están configuradas en `setup.ts`:

```typescript
import.meta.env = {
  VITE_API_URL: 'http://localhost:8000',
  VITE_API_VERSION: 'v1',
  VITE_TOKEN_KEY: 'auth_token',
  VITE_USER_KEY: 'user_info'
}
```

---

## ▶️ Ejecución de Tests

### Comandos Básicos

#### Ejecutar Todos los Tests

```powershell
npm test
```

#### Modo Watch (Re-ejecuta en cambios)

```powershell
npm run test:watch
```

#### Con Cobertura de Código

```powershell
npm run test:coverage
```

### Comandos Avanzados

#### Ejecutar un Archivo Específico

```powershell
npm test -- src/tests/jest_tests/unit/hooks/useGastos.test.ts
```

#### Ejecutar Tests por Patrón

```powershell
# Solo tests de hooks
npm test -- --testPathPattern=hooks

# Solo tests de servicios
npm test -- --testPathPattern=services

# Solo tests de componentes
npm test -- --testPathPattern=components
```

#### Modo Verbose (Salida Detallada)

```powershell
npm test -- --verbose
```

#### Ver Solo Fallos

```powershell
npm test -- --onlyFailures
```

#### Actualizar Snapshots

```powershell
npm test -- --updateSnapshot
```

### Opciones de Filtrado

```powershell
# Ejecutar tests que contengan "gasto" en el nombre
npm test -- --testNamePattern="gasto"

# Ejecutar un test suite específico
npm test -- --testNamePattern="useGastos Hook"
```

---

## 📊 Catálogo de Tests

### 🔧 Tests de Setup (11 tests)

#### `setup/setup.test.ts` (5 tests)

| Test | Descripción |
|------|-------------|
| `debería ejecutar tests básicos` | Valida operaciones matemáticas básicas |
| `debería manejar strings correctamente` | Verifica manipulación de strings |
| `debería manejar arrays` | Comprueba operaciones con arrays |
| `debería manejar objetos` | Valida trabajo con objetos |
| `debería manejar funciones` | Verifica ejecución de funciones |

**Propósito:** Verificar que el entorno de testing está configurado correctamente.

#### `setup/jest.test.ts` (6 tests)

| Test | Descripción |
|------|-------------|
| `debería ejecutar test básico correctamente` | Valida configuración básica de Jest |
| `debería manejar strings` | Comprueba operaciones de string |
| `debería manejar objetos de gastos` | Valida estructura de objetos de dominio |
| `debería calcular totales correctamente` | Verifica cálculos matemáticos |
| `debería filtrar gastos por categoría` | Comprueba lógica de filtrado |
| `debería validar formato de fecha` | Verifica formato YYYY-MM-DD |

**Propósito:** Validar que Jest puede ejecutar tests del dominio de la aplicación.

---

### 🔌 Tests de Servicios (3 tests)

#### `unit/services/api.test.ts`

| Test | Descripción |
|------|-------------|
| `debería importar el módulo api correctamente` | Verifica que el módulo se importa sin errores |
| `debería tener la estructura correcta del servicio` | Valida estructura de `gastosService` |
| `debería exportar todos los servicios necesarios` | Comprueba exportación de servicios |

**Propósito:** Verificar la estructura y disponibilidad de los servicios de API.

**Servicios Testeados:**
- `gastosService` - CRUD de gastos
- `categoriasService` - Gestión de categorías
- `authService` - Autenticación

---

### 🪝 Tests de Hooks (17+ tests)

#### `unit/hooks/useGastos.test.ts`

| Test | Descripción |
|------|-------------|
| `debería inicializar con estado vacío` | Valida estado inicial del hook |
| `debería manejar errores de autenticación` | Comprueba manejo de usuario no autenticado |
| `debería actualizar filtros correctamente` | Verifica actualización de filtros |
| `debería limpiar filtros` | Comprueba reset de filtros |

**Propósito:** Validar el hook principal de gestión de gastos.

**Funcionalidades Testeadas:**
- Estado inicial
- Autenticación
- Filtros (fecha, categoría, búsqueda, monto)
- CRUD de gastos
- Gestión de categorías
- Manejo de errores

#### `unit/hooks/useGastosNew.test.ts` (9 tests)

| Test | Descripción |
|------|-------------|
| `debería inicializar con valores por defecto` | Valida inicialización del hook |
| `debería manejar usuario no autenticado` | Comprueba caso sin usuario |
| `debería actualizar filtros correctamente` | Verifica cambio de filtros |
| `debería limpiar filtros` | Comprueba reset de filtros |
| `debería crear un gasto correctamente` | Valida creación de gasto |
| `debería eliminar un gasto correctamente` | Verifica eliminación |
| `debería manejar errores al crear gasto` | Comprueba manejo de errores en creación |
| `debería manejar errores al eliminar gasto` | Verifica manejo de errores en eliminación |
| `debería inicializar filtros con valores por defecto` | Valida estado inicial de filtros |

**Propósito:** Tests de la versión refactorizada del hook `useGastos`.

**Mocks Utilizados:**
- `gastosService.getGastos()`
- `gastosService.createGasto()`
- `gastosService.deleteGasto()`
- `categoriasService.getCategorias()`
- `authService.getStoredUser()`

---

### 🎨 Tests de Componentes (Tests pendientes)

#### `unit/components/gastos/GastosFiltros.test.tsx`

| Test | Descripción | Estado |
|------|-------------|--------|
| `debería renderizar todos los campos de filtro` | Verifica presencia de inputs | ⚠️ Pendiente |
| `debería permitir escribir en el campo de búsqueda` | Valida input de búsqueda | ⚠️ Pendiente |
| `debería aplicar filtros al hacer clic en el botón` | Comprueba aplicación de filtros | ⚠️ Pendiente |
| `debería limpiar filtros` | Verifica botón de limpiar | ⚠️ Pendiente |
| `debería renderizar opciones de categorías` | Valida dropdown de categorías | ⚠️ Pendiente |

**Propósito:** Validar el componente de filtros de gastos.

**Características Testeadas:**
- Renderizado de campos
- Interacción del usuario
- Callbacks (`onFiltrosChange`, `onLimpiarFiltros`)
- Manejo de categorías

**Estado Actual:** Tests con errores de configuración (import de React, tipos de TypeScript).

---

## 📁 Estructura del Proyecto

```
src/tests/jest_tests/
├── setup/                          # Configuración y tests de setup
│   ├── setup.ts                   # Setup global de Jest
│   ├── setup.test.ts              # Tests de configuración (5)
│   └── jest.test.ts               # Tests básicos de Jest (6)
├── unit/                          # Tests unitarios
│   ├── hooks/                     # Tests de React Hooks
│   │   ├── useGastos.test.ts     # Hook principal de gastos
│   │   └── useGastosNew.test.ts  # Hook refactorizado (9)
│   ├── services/                  # Tests de servicios
│   │   └── api.test.ts           # Servicios de API (3)
│   └── components/                # Tests de componentes
│       └── gastos/
│           └── GastosFiltros.test.tsx  # Componente de filtros
└── TESTING.md                     # Este documento
```

### Archivos de Configuración

```
03 - Desarrollo/analizador-gastos-front/
├── jest.config.json               # Configuración principal de Jest
├── tsconfig.json                  # Configuración de TypeScript
└── package.json                   # Scripts de npm y dependencias
```

---

## 🎯 Convenciones y Buenas Prácticas

### Nomenclatura de Archivos

- **Tests:** `*.test.ts` o `*.test.tsx`
- **Ubicación:** Carpeta `unit/` organizada por tipo (hooks, services, components)
- **Nombres descriptivos:** `useGastos.test.ts` (no `test1.ts`)

### Estructura de un Test

```typescript
import { renderHook, act } from '@testing-library/react';
import { miHook } from '@hooks/miHook';

describe('miHook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debería hacer algo específico', () => {
    const { result } = renderHook(() => miHook());
    
    expect(result.current.valor).toBe(esperado);
  });
});
```

### Mocking de Servicios

```typescript
// Mock del módulo completo
jest.mock('@services/api', () => ({
  gastosService: {
    getGastos: jest.fn(),
    createGasto: jest.fn(),
  }
}));

// Uso en el test
const mockGastosService = gastosService as jest.Mocked<typeof gastosService>;
mockGastosService.getGastos.mockResolvedValue(datos);
```

### Matchers Comunes

```typescript
// Igualdad
expect(valor).toBe(esperado);
expect(objeto).toEqual({ prop: 'valor' });

// Booleanos
expect(valor).toBeTruthy();
expect(valor).toBeFalsy();

// Arrays
expect(array).toHaveLength(5);
expect(array).toContain(elemento);

// DOM (con @testing-library/jest-dom)
expect(elemento).toBeInTheDocument();
expect(input).toHaveValue('texto');

// Funciones
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveBeenCalledTimes(3);
```

### Aliases de Importación

El proyecto usa aliases de TypeScript para imports limpios:

```typescript
// ✅ Correcto
import { useGastos } from '@hooks/useGastos';
import { api } from '@services/api';
import { Button } from '@components/ui/Button';

// ❌ Evitar
import { useGastos } from '../../../hooks/useGastos';
```

### Testing de Hooks Async

```typescript
test('debería manejar operación async', async () => {
  const { result, waitForNextUpdate } = renderHook(() => miHook());
  
  act(() => {
    result.current.fetchData();
  });
  
  await waitForNextUpdate();
  
  expect(result.current.data).toBeDefined();
});
```

---

## 📈 Estado Actual de Tests

### Resumen General

| Categoría | Tests | Pasando | Fallando | Estado |
|-----------|-------|---------|----------|--------|
| **Setup** | 11 | 11 | 0 | ✅ 100% |
| **Servicios** | 3 | 3 | 0 | ✅ 100% |
| **Hooks** | 13+ | ~8 | ~5 | ⚠️ 62% |
| **Componentes** | 5+ | 0 | 5+ | ❌ 0% |
| **TOTAL** | ~29 | ~22 | ~7 | ⚠️ 76% |

### Problemas Conocidos

#### 1. Tests de Hooks con Warnings de React
**Archivos afectados:** `useGastos.test.ts`, `useGastosNew.test.ts`

**Problema:**
```
Warning: An update to TestComponent inside a test was not wrapped in act(...)
```

**Causa:** Actualizaciones de estado asíncronas no envueltas en `act()`.

**Solución pendiente:** Envolver actualizaciones en `waitFor()` o `act()`.

#### 2. Tests de Componentes con Errores de Import
**Archivo afectado:** `GastosFiltros.test.tsx`

**Problema:**
```typescript
ReferenceError: React is not defined
```

**Causa:** Falta import explícito de React en archivos `.tsx` con Jest.

**Solución pendiente:** Agregar `import React from 'react'` o configurar JSX transform.

#### 3. Problema con `import.meta.env`
**Archivos afectados:** Código que importa `api.ts`

**Problema:** `import.meta` no es compatible con CommonJS en Jest.

**Solución actual:** Configurado en `setup.ts` con mock global.

---

## 🔍 Debugging de Tests

### Ver Salida Detallada

```powershell
npm test -- --verbose --no-coverage
```

### Ejecutar un Solo Test

```powershell
npm test -- --testNamePattern="debería inicializar"
```

### Modo Watch con Filtros

```powershell
npm run test:watch
# Luego presionar 'p' y escribir el nombre del archivo
```

### Ver Cobertura de un Archivo

```powershell
npm run test:coverage -- src/tests/jest_tests/unit/hooks/useGastos.test.ts
```

---

## � Migración de Vitest a Jest

### Contexto Histórico

**Fecha de migración:** Octubre 2025  
**Motivo:** Unificación del framework de testing y mejor integración con el ecosistema React

Originalmente, el proyecto tenía una configuración mixta con **Vitest** instalado pero no completamente implementado. Se decidió migrar completamente a **Jest** por las siguientes razones:

- ✅ Mejor ecosistema y soporte comunitario para React
- ✅ Integración superior con React Testing Library
- ✅ Configuración más simple y madura
- ✅ Mayor cantidad de recursos y documentación

### Principales Diferencias: Vitest vs Jest

#### Imports y Globals

| Aspecto | Vitest | Jest |
|---------|--------|------|
| **Imports de framework** | `import { describe, test, expect } from 'vitest'` | No necesario (globals automáticos) |
| **Funciones de mocking** | `vi.fn()`, `vi.mock()` | `jest.fn()`, `jest.mock()` |
| **Limpiar mocks** | `vi.clearAllMocks()` | `jest.clearAllMocks()` |
| **Timers** | `vi.useFakeTimers()` | `jest.useFakeTimers()` |

#### Configuración

| Aspecto | Vitest | Jest |
|---------|--------|------|
| **Archivo config** | `vitest.config.ts` | `jest.config.json` |
| **Entorno DOM** | Auto-detecta | Requiere `testEnvironment: "jsdom"` |
| **Import.meta.env** | Soporte nativo | Requiere polyfill en setup |
| **ESM** | Soporte nativo | Requiere configuración ts-jest |

### Cambios Aplicados en la Migración

#### 1. Configuración de Jest (`jest.config.json`)

```json
{
  "preset": "ts-jest",
  "testEnvironment": "jsdom",
  "setupFilesAfterEnv": ["<rootDir>/src/tests/jest_tests/setup/setup.ts"],
  "transform": {
    "^.+\\.(ts|tsx)$": ["ts-jest", {
      "tsconfig": {
        "jsx": "react",
        "esModuleInterop": true,
        "module": "esnext"
      },
      "isolatedModules": true,
      "diagnostics": {
        "ignoreCodes": [1343, 2339]  // import.meta.env
      }
    }]
  },
  "moduleNameMapper": {
    "\\.(css|less|scss)$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@components/(.*)$": "<rootDir>/src/components/$1"
  }
}
```

#### 2. Mock de import.meta.env (setup.ts)

Vitest tiene soporte nativo para `import.meta.env`, pero Jest no. Se agregó un polyfill:

```typescript
// src/tests/jest_tests/setup/setup.ts
Object.defineProperty(globalThis, 'import.meta', {
  value: {
    env: {
      VITE_API_URL: 'http://localhost:8000',
      VITE_API_VERSION: 'v1',
      VITE_TOKEN_KEY: 'auth_token',
      VITE_USER_KEY: 'user_info'
    }
  }
});
```

#### 3. Conversión de Tests

**Ejemplo: Cambios en archivos de test**

```typescript
// ❌ ANTES (Vitest)
import { describe, test, expect, vi, beforeEach } from 'vitest';

describe('Mi Test', () => {
  const mockFn = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  test('debería funcionar', () => {
    expect(mockFn).toHaveBeenCalled();
  });
});

// ✅ DESPUÉS (Jest)
// No se necesitan imports de framework

describe('Mi Test', () => {
  const mockFn = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('debería funcionar', () => {
    expect(mockFn).toHaveBeenCalled();
  });
});
```

#### 4. Mocking de Módulos

**Problema con import.meta en servicios:**

```typescript
// ❌ ANTES - Causaba error TS1343
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

// ✅ SOLUCIÓN - Mock del módulo completo
jest.mock('@services/api', () => ({
  gastosService: {
    getGastos: jest.fn(),
    createGasto: jest.fn(),
    updateGasto: jest.fn(),
    deleteGasto: jest.fn()
  }
}));
```

### Problemas Resueltos

#### 1. Error: TS1343 - import.meta.env

**Síntoma:**
```
error TS1343: The 'import.meta' meta-property is only allowed 
when the '--module' option is 'es2020', 'es2022', 'esnext'
```

**Solución:**
- Agregar polyfill en `setup.ts`
- Configurar `diagnostics.ignoreCodes: [1343, 2339]` en jest.config.json
- Mockear módulos que usan `import.meta.env`

#### 2. React no definido en componentes

**Síntoma:**
```
'React' refers to a UMD global, but the current file is a module.
```

**Solución:**
```typescript
import React from 'react';  // Agregar import explícito en tests
```

#### 3. Tests de Playwright ejecutándose con Jest

**Síntoma:**
Jest intentaba ejecutar los tests E2E de Playwright

**Solución:**
```json
"testPathIgnorePatterns": [
  "/node_modules/",
  "/playwright_tests/",  // ⬅️ Excluir tests E2E
  "/dist/",
  "/build/"
]
```

### Resultados de la Migración

| Métrica | Antes (Vitest) | Después (Jest) |
|---------|----------------|----------------|
| **Framework** | Vitest (instalado, no configurado) | Jest 29.7.0 |
| **Tests funcionando** | 0 (configuración incompleta) | 22/29 (76%) |
| **Tiempo de ejecución** | N/A | ~4-6 segundos |
| **Entorno de test** | No configurado | jsdom |
| **Cobertura de código** | No disponible | Configurada |

### Archivos Eliminados Post-Migración

- ❌ `vitest.config.ts` - Ya no necesario
- ❌ `VITEST_TO_JEST_MIGRATION.md` - Información consolidada aquí
- ❌ `TEST_RESULTS.md` - Resultados obsoletos

### Lecciones Aprendidas

1. **import.meta.env requiere polyfills** en Jest - no hay soporte nativo
2. **ts-jest necesita configuración explícita** de `diagnostics.ignoreCodes` para trabajar con sintaxis moderna
3. **Separar tests E2E de unit tests** es crítico para evitar colisiones de configuración
4. **Module aliases** simplifican imports después de reorganizar estructura
5. **jsdom es obligatorio** para tests de componentes React en Jest

### Comandos Útiles Post-Migración

```powershell
# Verificar que no hay rastros de Vitest
npm list vitest

# Ejecutar solo tests de Jest (excluyendo Playwright)
npm test

# Ver configuración de Jest
npm test -- --showConfig
```

---

## �🚀 Próximos Pasos

### Tests Pendientes de Crear

- [ ] `useIngresos.test.ts` - Hook de gestión de ingresos
- [ ] `useDashboard.test.ts` - Hook de datos del dashboard
- [ ] `useColors.test.ts` - Hook de gestión de colores
- [ ] Tests de componentes UI (`Button`, `Modal`, etc.)
- [ ] Tests de utilidades (`formatters.ts`, `dateHelpers.ts`)
- [ ] Tests de stores (`authStore.ts`)

### Mejoras Requeridas

1. **Envolver actualizaciones async** en `act()` o `waitFor()`
2. **Configurar JSX transform** para componentes React
3. **Aumentar cobertura** de código (objetivo: 80%+)
4. **Agregar tests de integración** entre hooks y servicios
5. **Snapshots** para componentes visuales complejos

---

## 📚 Referencias

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

---

**Última actualización:** Octubre 2025  
**Versión de Jest:** 29.7.0  
**Mantenedor:** Equipo Analizador Financiero
