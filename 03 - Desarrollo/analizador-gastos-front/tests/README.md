# Tests - Analizador Financiero

## 🚀 Quick Start

### 1. Instalar dependencias

```bash
npm install -D @playwright/test
npx playwright install
```

### 2. Asegurar que el backend esté corriendo

```bash
# Verificar backend
curl http://localhost:8000/docs

# O en Docker
docker-compose up -d
```

### 3. Ejecutar todos los tests

```bash
npx playwright test
```

### 4. Ver reporte

```bash
npx playwright show-report
```

---

## 📂 Tests Disponibles

### E2E Tests
```bash
npx playwright test auth.e2e.spec.ts         # 10 tests de autenticación
npx playwright test dashboard.e2e.spec.ts    # 27 tests de dashboard
npx playwright test ingresos.e2e.spec.ts     # 14 tests de ingresos
```

### API Tests
```bash
npx playwright test api.complete.spec.ts     # 23 tests de API REST
```

### Unit Tests
```bash
npx playwright test unit.spec.ts             # 16 tests unitarios
```

---

## 🎯 Tests por Navegador

```bash
npx playwright test --project=chromium       # Chrome
npx playwright test --project=firefox        # Firefox
npx playwright test --project=webkit         # Safari
```

---

## 🐛 Debugging

```bash
# Modo UI interactivo
npx playwright test --ui

# Modo debug con inspector
npx playwright test --debug

# Ver el navegador
npx playwright test --headed
```

---

## 📊 Cobertura Actual

- ✅ Auth: 9/10 (90%)
- ✅ Dashboard: 27/27 (100%)
- ✅ Ingresos: 12/14 (86%)
- ✅ API: 23/23 (100%)
- ✅ Unit: 13/16 (81%)

**Total: 84/90 tests pasando (93%)**

---

## 🔧 Troubleshooting

### Authentication failed
```bash
# Regenerar auth
node tests/generate-storageState.mjs
```

### Backend no responde
```bash
# Verificar Docker
docker ps
docker-compose logs backend
```

### Tests lentos
```bash
# Ejecutar solo Chromium
npx playwright test --project=chromium
```

---

## 📚 Documentación Completa

Ver `tests/TESTS_GUIDE.md` para documentación completa con:
- Configuración detallada
- Descripción de cada test
- Mejores prácticas
- Troubleshooting avanzado

---

## 🤝 Convenciones

### Naming de tests:
- `{MODULE}-{NUMBER}`: ID único (ej: `AUTH-001`)
- Descripción en español
- Usar `test.describe()` para agrupar

### Selectores:
1. `getByRole()` - Primera opción
2. `getByPlaceholder()` - Para inputs
3. `getByText()` - Para texto visible
4. `locator()` - Último recurso

### Assertions:
```typescript
await expect(element).toBeVisible({ timeout: 10000 });
await page.waitForURL(/dashboard/);
```

---

**Versión**: 2.0  
**Última actualización**: Octubre 2025
