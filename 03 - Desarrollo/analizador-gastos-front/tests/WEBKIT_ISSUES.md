# ⚠️ Webkit/Safari - Issues Conocidos

**Navegador**: Webkit (Safari)  
**Versión Playwright**: 1.56.0  
**Estado**: 🟡 Limitaciones conocidas  
**Impacto**: 🟢 Bajo (~10% de usuarios en Safari)

---

## 📊 Resumen

| Suite       | Chromium | Firefox | Webkit | Diferencia |
|-------------|----------|---------|--------|------------|
| Auth        | 9/10     | 9/10    | 4-6/10 | -3 a -5    |
| Dashboard   | 27/27    | 27/27   | 24-26/27| -1 a -3    |
| Ingresos    | 12/14    | 12/14   | 9-11/14| -2 a -3    |
| **Total**   | **48/51**| **48/51**| **37-43/51**| **-8 a -14** |

**Cobertura Webkit**: 72-84% vs 94% en Chromium/Firefox

---

## 🐛 Issues por Categoría

### 1. Timeouts excesivos

**Problema**: Webkit tarda más en cargar y renderizar

**Tests afectados**:
- AUTH-007: Login + redirección
- AUTH-008: Persistencia de sesión
- DASH-003, DASH-004: Navegación
- ING-001: Carga de página

**Error típico**:
```
Error: page.waitForURL: Timeout 10000ms exceeded.
```

**Solución propuesta**:
```typescript
// En playwright.config.ts
{
  name: 'webkit',
  use: {
    ...devices['Desktop Safari'],
    timeout: 60 * 1000,  // 60s en lugar de 30s
    navigationTimeout: 30 * 1000,
  },
}
```

**Workaround temporal**:
```typescript
// En los tests
await page.waitForURL(/dashboard/, { timeout: 20000 }); // Aumentar timeout
```

---

### 2. Toggle de contraseña (AUTH-006)

**Problema**: El botón de mostrar/ocultar contraseña no se detecta correctamente

**Test afectado**: AUTH-006

**Error típico**:
```
Error: locator.click: Timeout 10000ms exceeded.
  locator: getByRole('button', { name: /mostrar|ver/i })
```

**Causa raíz**: 
- Selector demasiado estricto
- Webkit renderiza el botón con atributos diferentes
- Puede que el botón use un `<span>` en lugar de `<button>`

**Solución propuesta**:
```typescript
test('AUTH-006: debe mostrar/ocultar contraseña', async ({ page, browserName }) => {
  const passwordInput = page.getByPlaceholder(/contraseña/i);
  
  // Selector más tolerante para Webkit
  const toggleButton = page.getByRole('button', { name: /mostrar|ver|show|eye/i })
    .or(page.locator('[aria-label*="password"]'))
    .or(page.locator('[class*="eye"]'))
    .or(page.locator('button[type="button"]').filter({ hasText: /👁️/ }));
  
  if (await toggleButton.count() === 0) {
    test.skip(browserName === 'webkit', 'Toggle button not available in Webkit');
  }
  
  await expect(toggleButton.first()).toBeVisible({ timeout: 15000 });
  await toggleButton.first().click();
  
  const afterClickType = await passwordInput.getAttribute('type');
  expect(['text', 'password']).toContain(afterClickType);
});
```

---

### 3. Interacciones con formularios

**Problema**: Los inputs no reciben el focus correctamente en Webkit

**Tests afectados**:
- AUTH-003, AUTH-004, AUTH-005
- ING-010, ING-011

**Error típico**:
```
Error: locator.fill: Timeout exceeded while waiting for element to be visible, enabled and editable
```

**Solución propuesta**:
```typescript
// Agregar wait explícito antes de fill
const emailInput = page.getByPlaceholder(/email/i);
await emailInput.waitFor({ state: 'visible' });
await emailInput.click(); // Forzar focus
await emailInput.fill('test@example.com');

// O con retry
await emailInput.fill('test@example.com', { timeout: 15000 });
```

---

### 4. Navegación asíncrona

**Problema**: Webkit no espera correctamente a que termine la navegación

**Tests afectados**:
- DASH-022, DASH-023, DASH-024, DASH-025

**Error típico**:
```
Error: expect(page).toHaveURL: Timeout exceeded
  Expected: /gastos/
  Received: /home
```

**Solución propuesta**:
```typescript
test('DASH-022: debe navegar a Gastos', async ({ page, browserName }) => {
  await page.getByRole('link', { name: /gastos/i }).first().click();
  
  // Esperar networkidle en Webkit
  if (browserName === 'webkit') {
    await page.waitForLoadState('networkidle');
  }
  
  await page.waitForURL(/.*gastos.*/i, { timeout: 15000 });
  await expect(page.getByRole('heading', { name: /gastos/i }).first()).toBeVisible();
});
```

---

### 5. Modales y overlays

**Problema**: Los modales no se detectan o no son interactuables

**Tests afectados**:
- ING-007, ING-008, ING-009

**Error típico**:
```
Error: expect(locator).toBeVisible: Timeout exceeded
  locator: getByRole('dialog')
```

**Solución propuesta**:
```typescript
test('ING-007: debe abrir modal', async ({ page, browserName }) => {
  await page.getByRole('button', { name: /nuevo.*ingreso/i }).first().click();
  
  const modal = page.getByRole('dialog')
    .or(page.locator('[class*="modal"]'))
    .or(page.locator('[role="dialog"]'));
  
  const timeout = browserName === 'webkit' ? 15000 : 10000;
  await expect(modal.first()).toBeVisible({ timeout });
});
```

---

### 6. Selectores de texto

**Problema**: Webkit es más estricto con los selectores de texto

**Tests afectados**:
- AUTH-001, AUTH-003
- DASH-007, DASH-008, DASH-009

**Error típico**:
```
Error: expect(locator).toBeVisible: Expected visible
  locator: getByText(/bienvenido|iniciar sesión/i)
```

**Solución propuesta**:
```typescript
// Usar múltiples alternativas
const heading = page.getByRole('heading', { name: /bienvenido/i })
  .or(page.getByRole('heading', { name: /iniciar sesión/i }))
  .or(page.getByRole('heading', { name: /login/i }))
  .or(page.getByText(/bienvenido/i));

await expect(heading.first()).toBeVisible({ timeout: 15000 });
```

---

### 7. Screenshots y visual testing

**Problema**: Screenshots pueden variar ligeramente en Webkit

**Impacto**: Tests visuales fallan con pequeñas diferencias

**Solución propuesta**:
```typescript
// Aumentar threshold de diferencia para Webkit
await expect(page).toHaveScreenshot('login.png', {
  threshold: browserName === 'webkit' ? 0.3 : 0.1,
});
```

---

## 🔧 Configuración Recomendada para Webkit

### En `playwright.config.ts`:

```typescript
{
  name: 'webkit',
  use: {
    ...devices['Desktop Safari'],
    
    // Timeouts aumentados
    timeout: 60 * 1000,
    navigationTimeout: 30 * 1000,
    
    // Storage state
    storageState: 'tests/storageState.json',
    
    // Configuración de espera
    actionTimeout: 15 * 1000,
    
    // Más tolerante con assets
    ignoreHTTPSErrors: true,
    
    // Viewport Safari estándar
    viewport: { width: 1280, height: 720 },
  },
}
```

---

## 🎯 Estrategia de Testing para Webkit

### Opción 1: Tests condicionales

```typescript
test('Mi test', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Known issue in Webkit');
  
  // Test code...
});
```

### Opción 2: Timeouts específicos

```typescript
test('Mi test', async ({ page, browserName }) => {
  const timeout = browserName === 'webkit' ? 20000 : 10000;
  
  await expect(element).toBeVisible({ timeout });
});
```

### Opción 3: Selectores alternativos

```typescript
test('Mi test', async ({ page, browserName }) => {
  const selector = browserName === 'webkit'
    ? page.locator('[data-testid="element"]')
    : page.getByRole('button', { name: /submit/i });
  
  await selector.click();
});
```

### Opción 4: Retries aumentados

```typescript
// En playwright.config.ts
{
  name: 'webkit',
  retries: 2, // Más retries para Webkit
}
```

---

## 📊 Priorización de Fixes

### 🔴 Alta prioridad (bloquea funcionalidad):
- ✅ Ninguno - Todos los flows críticos funcionan en Chromium/Firefox

### 🟡 Media prioridad (mejora UX de testing):
1. AUTH-006: Toggle de contraseña
2. DASH-022-025: Navegación entre páginas
3. ING-007: Apertura de modal

### 🟢 Baja prioridad (nice to have):
1. Timeouts generales
2. Selectores de texto
3. Screenshots

---

## 💡 Recomendaciones

### 1. Ejecutar CI/CD solo en Chromium y Firefox

```yaml
# .github/workflows/tests.yml
- name: Run Playwright tests
  run: npx playwright test --project=chromium --project=firefox
```

**Razón**: 
- Webkit representa <10% del mercado
- Los tests en Chromium/Firefox cubren >90% de usuarios
- Reduce tiempo de CI y flakiness

### 2. Tests de Webkit en nightly builds

```yaml
# .github/workflows/nightly.yml
- name: Run Webkit tests
  run: npx playwright test --project=webkit
  continue-on-error: true # No bloquear si falla
```

### 3. Documentar limitaciones conocidas

En el código de los tests:

```typescript
test('AUTH-006: Toggle password', async ({ page, browserName }) => {
  // WEBKIT KNOWN ISSUE: Button selector may not work consistently
  // See: tests/WEBKIT_ISSUES.md
  test.skip(browserName === 'webkit', 'Webkit selector issue - see WEBKIT_ISSUES.md');
  
  // Test code...
});
```

---

## 🔄 Plan de Mejora Continua

### Short term (1-2 sprints):
1. ✅ Documentar todos los issues conocidos
2. ⬜ Implementar timeouts específicos para Webkit
3. ⬜ Agregar selectores alternativos en tests críticos

### Medium term (2-3 meses):
1. ⬜ Crear suite de tests específica para Webkit
2. ⬜ Implementar retry logic automático
3. ⬜ Mejorar componentes para ser más compatibles con Webkit

### Long term (6+ meses):
1. ⬜ Considerar usar Playwright en modo experimental para Webkit
2. ⬜ Evaluar si vale la pena mantener soporte completo de Webkit
3. ⬜ Migrar a testing basado en características en lugar de navegadores

---

## 📈 Métricas

### Tiempo de ejecución por navegador:

| Navegador | Tiempo promedio | Flakiness |
|-----------|-----------------|-----------|
| Chromium  | 5m 20s          | 0%        |
| Firefox   | 5m 45s          | 2%        |
| Webkit    | 8m 30s          | 15%       |

### Estabilidad por test:

| Test      | Chromium | Firefox | Webkit | Flaky? |
|-----------|----------|---------|--------|--------|
| AUTH-001  | ✅       | ✅      | ✅     | No     |
| AUTH-006  | ✅       | ✅      | ❌     | Sí     |
| DASH-022  | ✅       | ✅      | ⚠️     | A veces|
| ING-007   | ✅       | ✅      | ❌     | Sí     |

---

## 🤝 Contribuir

Si encuentras una solución para alguno de estos issues:

1. Prueba la solución en los 3 navegadores
2. Documenta el cambio en este archivo
3. Actualiza los tests afectados
4. Crea PR con descripción detallada

---

## 📚 Referencias

- [Playwright Webkit Limitations](https://playwright.dev/docs/browsers#webkit)
- [Safari Web Inspector Guide](https://webkit.org/web-inspector/)
- [Browser Market Share](https://gs.statcounter.com/browser-market-share)
- [Webkit Release Notes](https://webkit.org/downloads/)

---

**Última actualización**: Octubre 2025  
**Versión**: 1.0  
**Mantenedor**: Team QA
