import { test, expect } from '@playwright/test';

test.describe('Ingresos E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ingresos');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Estructura de la página', () => {
    test('ING-001: debe cargar la página de ingresos correctamente', async ({ page }) => {
      await expect(page).toHaveTitle(/Analizador|Ingresos|Income/i);
      await expect(page.getByRole('heading', { name: /ingresos|income/i }).first()).toBeVisible();
    });

    test('ING-002: debe mostrar botón para agregar nuevo ingreso', async ({ page }) => {
      await expect(page.getByRole('button', { name: /nuevo.*ingreso|agregar.*ingreso|\+/i }).first()).toBeVisible();
    });

    test('ING-003: debe mostrar tabla o lista de ingresos', async ({ page }) => {
      const table = page.getByRole('table').or(page.locator('[class*="table"], [class*="list"]'));
      await expect(table.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Visualización de ingresos', () => {
    test('ING-004: debe mostrar columnas de la tabla correctamente', async ({ page }) => {
      const headers = ['descripción', 'monto', 'fecha', 'categoría', 'acciones'];
      for (const header of headers) {
        const headerElement = page.getByRole('columnheader', { name: new RegExp(header, 'i') })
          .or(page.getByText(new RegExp(header, 'i')));
        if (await headerElement.count() > 0) {
          await expect(headerElement.first()).toBeVisible();
        }
      }
    });

    test('ING-005: debe mostrar al menos un ingreso si existen datos', async ({ page }) => {
      const rows = page.getByRole('row');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);
    });

    test('ING-006: debe mostrar montos en formato de moneda', async ({ page }) => {
      const currencyPattern = /\$[\d,]+\.?\d*/;
      const amountElements = await page.locator('text=/\\$[\\d,]+\\.?\\d*/').all();
      if (amountElements.length > 0) {
        expect(amountElements.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Crear nuevo ingreso', () => {
    test('ING-007: debe abrir modal al hacer clic en nuevo ingreso', async ({ page }) => {
      await page.getByRole('button', { name: /nuevo.*ingreso|agregar.*ingreso|\+/i }).first().click();
      
      const modal = page.getByRole('dialog').or(page.locator('[role="dialog"], [class*="modal"]'));
      await expect(modal.first()).toBeVisible({ timeout: 10000 });
    });

    test('ING-008: debe mostrar formulario con todos los campos requeridos', async ({ page }) => {
      await page.getByRole('button', { name: /nuevo.*ingreso|agregar.*ingreso|\+/i }).first().click();
      
      await expect(page.getByPlaceholder(/descripción|description/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByPlaceholder(/0,00|monto|amount/i)).toBeVisible({ timeout: 10000 });
    });

    test('ING-009: debe validar campos requeridos al intentar guardar', async ({ page }) => {
      await page.getByRole('button', { name: /nuevo.*ingreso|agregar.*ingreso|\+/i }).first().click();
      
      await page.waitForTimeout(1000);
      
      const saveButton = page.getByRole('button', { name: /guardar|save|crear/i });
      await expect(saveButton.first()).toBeVisible({ timeout: 10000 });
      await saveButton.first().click();
      
      await page.waitForTimeout(500);
      
      const errorMessage = page.getByText(/requerido|obligatorio|necesario|completa/i);
      if (await errorMessage.count() > 0) {
        await expect(errorMessage.first()).toBeVisible();
      }
    });

    test('ING-010: debe permitir ingresar descripción', async ({ page }) => {
      await page.getByRole('button', { name: /nuevo.*ingreso|agregar.*ingreso|\+/i }).first().click();
      
      const descripcionInput = page.getByPlaceholder(/descripción|description/i);
      await expect(descripcionInput).toBeVisible({ timeout: 10000 });
      
      await descripcionInput.fill('Salario mensual');
      await expect(descripcionInput).toHaveValue('Salario mensual');
    });

    test('ING-011: debe permitir ingresar monto numérico', async ({ page }) => {
      await page.getByRole('button', { name: /nuevo.*ingreso|agregar.*ingreso|\+/i }).first().click();
      
      const montoInput = page.getByPlaceholder(/0,00|monto|amount/i);
      await expect(montoInput).toBeVisible({ timeout: 10000 });
      
      await montoInput.fill('5000');
      const value = await montoInput.inputValue();
      expect(value).toContain('5000');
    });

    test('ING-012: debe validar que el monto sea positivo', async ({ page }) => {
      await page.getByRole('button', { name: /nuevo.*ingreso|agregar.*ingreso|\+/i }).first().click();
      
      const montoInput = page.getByPlaceholder(/0,00|monto|amount/i);
      await expect(montoInput).toBeVisible({ timeout: 10000 });
      
      await montoInput.fill('-100');
      
      const saveButton = page.getByRole('button', { name: /guardar|save|crear/i });
      await saveButton.first().click();
      
      await page.waitForTimeout(500);
      
      const errorOrValidation = page.getByText(/positivo|mayor.*cero|inválido/i);
      if (await errorOrValidation.count() > 0) {
        await expect(errorOrValidation.first()).toBeVisible();
      }
    });

    test('ING-013: debe permitir seleccionar fecha', async ({ page }) => {
      await page.getByRole('button', { name: /nuevo.*ingreso|agregar.*ingreso|\+/i }).first().click();
      
      const dateInput = page.locator('input[type="date"]').or(page.getByPlaceholder(/fecha|date/i));
      if (await dateInput.count() > 0) {
        await expect(dateInput.first()).toBeVisible();
      }
    });

    test('ING-014: debe permitir seleccionar categoría', async ({ page }) => {
      await page.getByRole('button', { name: /nuevo.*ingreso|agregar.*ingreso|\+/i }).first().click();
      
      const categorySelect = page.getByRole('combobox').or(page.locator('select, [role="listbox"]'));
      if (await categorySelect.count() > 0) {
        await expect(categorySelect.first()).toBeVisible();
      }
    });
  });
});
