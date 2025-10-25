# Plan de Mejoras de Accesibilidad y Semántica - Analizador Financiero

## 📋 Resumen Ejecutivo

**Fecha**: Análisis completo de la UI
**Objetivo**: Agregar atributos de accesibilidad (ARIA, data-testid, semantic HTML) para mejorar:
- Testabilidad con Playwright
- Accesibilidad WCAG 2.1 AA
- Mantenibilidad del código
- Experiencia de usuario para tecnologías asistivas

## 🔍 Hallazgos Principales

### Problemas Identificados

1. **Falta de data-testid**: Ningún componente tiene identificadores de prueba
2. **Falta de ARIA labels**: No hay etiquetas descriptivas para lectores de pantalla
3. **Selectores frágiles**: Tests dependen de texto UI que puede cambiar
4. **Estadísticas sin etiquetas**: Cards solo muestran valores numéricos sin contexto textual
5. **Tablas sin roles apropiados**: Usan componentes Table de shadcn/ui pero sin ARIA adicional
6. **Formularios sin labels explícitos**: Algunos inputs carecen de asociación clara con sus etiquetas

---

## 📦 Componentes a Modificar

### 1. **GastosStats.tsx**
**Ubicación**: `src/components/gastos/GastosStats.tsx`

**Estado Actual**:
```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-sm font-medium">Total de gastos</CardTitle>
    <DollarSign className="h-4 w-4" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">${formatCurrency(totalValido)}</div>
  </CardContent>
</Card>
```

**Problemas**:
- No hay `data-testid`
- El Card no tiene `aria-label` descriptivo
- El valor no tiene contexto textual para screen readers
- Tests buscan `text=/Total:|Suma:/` pero solo existe "Total de gastos" en CardTitle

**Solución**:
```tsx
<Card data-testid="gastos-total-card" aria-label="Estadística de total de gastos del mes">
  <CardHeader>
    <CardTitle className="text-sm font-medium">Total de gastos</CardTitle>
    <DollarSign className="h-4 w-4" aria-hidden="true" />
  </CardHeader>
  <CardContent>
    <div 
      className="text-2xl font-bold" 
      data-testid="gastos-total-valor"
      aria-label={`Total de gastos: ${formatCurrency(totalValido)} pesos`}
    >
      ${formatCurrency(totalValido)}
    </div>
  </CardContent>
</Card>
```

**Cambios Similares**:
- Card "Promedio por Gasto": `data-testid="gastos-promedio-card"`, `data-testid="gastos-promedio-valor"`
- Card "Cantidad de gastos": `data-testid="gastos-cantidad-card"`, `data-testid="gastos-cantidad-valor"`

---

### 2. **IngresosStats.tsx**
**Ubicación**: `src/components/ingresos/IngresosStats.tsx`

**Cambios** (simétricos a GastosStats):
- Card Total: `data-testid="ingresos-total-card"`, `data-testid="ingresos-total-valor"`
- Card Promedio: `data-testid="ingresos-promedio-card"`, `data-testid="ingresos-promedio-valor"`
- Card Cantidad: `data-testid="ingresos-cantidad-card"`, `data-testid="ingresos-cantidad-valor"`

---

### 3. **GastosTabla.tsx**
**Ubicación**: `src/components/gastos/GastosTabla.tsx`

**Estado Actual**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Lista de Gastos</CardTitle>
    <GastosFiltros ... />
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-100">
          <TableHead>Fecha</TableHead>
          ...
        </TableRow>
      </TableHeader>
      <TableBody>
        {gastos.map((gasto) => (
          <TableRow key={gasto.id_gasto}>
            ...
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

**Problemas**:
- Table no tiene `data-testid` ni `aria-label`
- Tests buscan `table, ul, [role="list"]` pero shadcn Table no expone role="table" explícitamente
- Botones de acción (editar/eliminar) sin `aria-label`

**Solución**:
```tsx
<Card data-testid="gastos-tabla-card">
  <CardHeader>
    <CardTitle data-testid="gastos-tabla-titulo">Lista de Gastos</CardTitle>
    <GastosFiltros ... />
  </CardHeader>
  <CardContent>
    <Table data-testid="gastos-tabla" aria-label="Tabla de gastos del mes actual">
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          ...
        </TableRow>
      </TableHeader>
      <TableBody>
        {gastos.map((gasto) => (
          <TableRow 
            key={gasto.id_gasto}
            data-testid={`gasto-row-${gasto.id_gasto}`}
          >
            <TableCell data-testid={`gasto-fecha-${gasto.id_gasto}`}>
              {formatDisplayDate(gasto.fecha)}
            </TableCell>
            ...
            <TableCell>
              <Button
                data-testid={`gasto-editar-${gasto.id_gasto}`}
                aria-label={`Editar gasto ${gasto.descripcion}`}
                onClick={() => onEditar(gasto)}
              >
                <Edit />
              </Button>
              <Button
                data-testid={`gasto-eliminar-${gasto.id_gasto}`}
                aria-label={`Eliminar gasto ${gasto.descripcion}`}
                onClick={() => onEliminar(gasto)}
              >
                <Trash2 />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

---

### 4. **IngresosTabla.tsx**
**Ubicación**: `src/components/ingresos/IngresosTabla.tsx`

**Cambios** (simétricos a GastosTabla):
- Card: `data-testid="ingresos-tabla-card"`
- Table: `data-testid="ingresos-tabla"`, `aria-label="Tabla de ingresos del mes actual"`
- Rows: `data-testid="ingreso-row-${ingreso.id_ingreso}"`
- Botones: `data-testid="ingreso-editar-${id}"`, `data-testid="ingreso-eliminar-${id}"`

---

### 5. **FormularioGasto.tsx**
**Ubicación**: `src/components/forms/FormularioGasto.tsx`

**Estado Actual**:
```tsx
<Input
  type="text"
  value={formData.monto}
  onChange={(e) => handleInputChange('monto', e.target.value)}
  placeholder="0,00"
/>
```

**Problemas**:
- Inputs sin `data-testid`
- Algunos inputs sin `name` attribute explícito
- Select de categoría sin `data-testid`
- Tests buscan `input[name="monto"]` pero puede no estar presente

**Solución**:
```tsx
<Input
  type="text"
  name="monto"
  id="monto-gasto"
  data-testid="gasto-monto-input"
  aria-label="Monto del gasto en pesos"
  value={formData.monto}
  onChange={(e) => handleInputChange('monto', e.target.value)}
  placeholder="0,00"
/>

<Input
  type="text"
  name="descripcion"
  id="descripcion-gasto"
  data-testid="gasto-descripcion-input"
  aria-label="Descripción del gasto"
  ...
/>

<Input
  type="text"
  name="comercio"
  id="comercio-gasto"
  data-testid="gasto-comercio-input"
  aria-label="Nombre del comercio o lugar"
  ...
/>

<Select
  name="id_categoria"
  data-testid="gasto-categoria-select"
  aria-label="Seleccionar categoría del gasto"
  ...
/>

<DateInput
  name="fecha"
  data-testid="gasto-fecha-input"
  aria-label="Fecha del gasto"
  ...
/>

<Button
  type="submit"
  data-testid="gasto-submit-btn"
  aria-label={gastoEditar ? "Actualizar gasto" : "Crear nuevo gasto"}
>
  <Save className="w-4 h-4 mr-2" aria-hidden="true" />
  {gastoEditar ? 'Actualizar' : 'Guardar'}
</Button>
```

---

### 6. **FormularioIngreso.tsx**
**Ubicación**: `src/components/forms/FormularioIngreso.tsx`

**Cambios** (simétricos a FormularioGasto):
- Inputs: `data-testid="ingreso-{campo}-input"`, `name="{campo}"`
- Select categoría: `data-testid="ingreso-categoria-select"`
- Button submit: `data-testid="ingreso-submit-btn"`

---

### 7. **Home.tsx (Dashboard)**
**Ubicación**: `src/pages/Home.tsx`

**Estado Actual**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  <Card>
    <CardHeader>
      <CardTitle className="text-sm font-medium">Gastos del Mes</CardTitle>
      <TrendingDown className="h-4 w-4 text-coral" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">${formatCurrency(totalGastos)}</div>
      ...
    </CardContent>
  </Card>
  ...
</div>
```

**Problemas**:
- Cards principales sin `data-testid`
- Tests buscan `text=/Balance|Saldo/` pero el texto es "Ahorro del Mes"
- Usuario mostrado como "Bienvenido de vuelta, {nombre}" sin identificador
- Charts sin `data-testid` ni `aria-label`

**Solución**:
```tsx
{/* Sección de Bienvenida con usuario */}
<div className="mb-8 flex items-center justify-between" data-testid="dashboard-bienvenida">
  <div>
    <h2 
      className="text-3xl font-bold text-foreground mb-2"
      data-testid="dashboard-saludo-usuario"
    >
      Bienvenido de vuelta, {usuario?.nombre || user?.nombre || 'Usuario'}
    </h2>
    <p className="text-gray-600">Aquí tienes un resumen de tu situación financiera actual</p>
  </div>
  <Button 
    onClick={refreshData} 
    variant="outline" 
    size="sm"
    data-testid="dashboard-refresh-btn"
    aria-label="Actualizar datos del dashboard"
  >
    <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
    Actualizar
  </Button>
</div>

{/* Tarjetas de Métricas Clave */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  <Card data-testid="dashboard-gastos-card" aria-label="Total de gastos del mes">
    <CardHeader>
      <CardTitle className="text-sm font-medium">Gastos del Mes</CardTitle>
      <TrendingDown className="h-4 w-4 text-coral" aria-hidden="true" />
    </CardHeader>
    <CardContent>
      <div 
        className="text-2xl font-bold" 
        data-testid="dashboard-gastos-valor"
        aria-label={`Gastos totales: ${formatCurrency(totalGastos)} pesos`}
      >
        ${formatCurrency(totalGastos)}
      </div>
      ...
    </CardContent>
  </Card>

  <Card data-testid="dashboard-ingresos-card" aria-label="Total de ingresos del mes">
    <CardHeader>
      <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
      <TrendingUp className="h-4 w-4 text-teal" aria-hidden="true" />
    </CardHeader>
    <CardContent>
      <div 
        className="text-2xl font-bold" 
        data-testid="dashboard-ingresos-valor"
        aria-label={`Ingresos totales: ${formatCurrency(totalIngresos)} pesos`}
      >
        ${formatCurrency(totalIngresos)}
      </div>
      ...
    </CardContent>
  </Card>

  <Card data-testid="dashboard-ahorro-card" aria-label="Ahorro del mes (diferencia entre ingresos y gastos)">
    <CardHeader>
      <CardTitle className="text-sm font-medium">Ahorro del Mes</CardTitle>
      <Wallet className="h-4 w-4 text-golden" aria-hidden="true" />
    </CardHeader>
    <CardContent>
      <div 
        className={`text-2xl font-bold ${ahorro >= 0 ? 'text-teal' : 'text-coral'}`}
        data-testid="dashboard-ahorro-valor"
        aria-label={`Ahorro: ${ahorro >= 0 ? '' : 'déficit de '}${formatCurrency(Math.abs(ahorro))} pesos`}
      >
        ${formatCurrency(Math.abs(ahorro))}
      </div>
      ...
    </CardContent>
  </Card>

  <Card data-testid="dashboard-porcentaje-card" aria-label="Porcentaje de ahorro respecto a ingresos">
    <CardHeader>
      <CardTitle className="text-sm font-medium">Porcentaje de Ahorro</CardTitle>
      <Percent className="h-4 w-4 text-blue-500" aria-hidden="true" />
    </CardHeader>
    <CardContent>
      <div 
        className={`text-2xl font-bold ${porcentajeAhorro >= 0 ? 'text-teal' : 'text-coral'}`}
        data-testid="dashboard-porcentaje-valor"
        aria-label={`Porcentaje de ahorro: ${porcentajeAhorro}%`}
      >
        {porcentajeAhorro.toFixed(1)}%
      </div>
      ...
    </CardContent>
  </Card>
</div>

{/* Gráficos */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
  <Card data-testid="dashboard-chart-tendencia">
    <CardHeader>
      <CardTitle>Tendencia Mensual</CardTitle>
    </CardHeader>
    <CardContent>
      <AreaChart 
        data={tendenciaMensual} 
        aria-label="Gráfico de tendencia de gastos e ingresos por mes"
        ...
      />
    </CardContent>
  </Card>

  <Card data-testid="dashboard-chart-distribucion">
    <CardHeader>
      <CardTitle>Distribución por Categoría</CardTitle>
    </CardHeader>
    <CardContent aria-label="Distribución de gastos por categoría">
      ...
    </CardContent>
  </Card>
</div>
```

---

### 8. **Sidebar.tsx**
**Ubicación**: `src/components/layout/Sidebar.tsx`

**Estado Actual**:
```tsx
{user && (
  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-blue-500 rounded-full">
        {user.nombre.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{user.nombre}</p>
        <p className="text-xs text-gray-500">@{user.usuario}</p>
      </div>
    </div>
  </div>
)}

<button
  onClick={handleLogout}
  className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
>
  <LogOut className="w-5 h-5" />
  <span>Cerrar Sesión</span>
</button>
```

**Problemas**:
- User info sin `data-testid`
- Tests buscan `text=/Usuario|User|@/` pero solo existe "@{usuario}"
- Botón logout sin `data-testid` ni `aria-label` explícito
- Tests E2E-005 fallan porque usan `getByRole('button', { name: /cerrar|logout|salir/i })`

**Solución**:
```tsx
{user && (
  <div 
    className="mb-6 p-4 bg-gray-50 rounded-lg"
    data-testid="user-info-sidebar"
    aria-label="Información del usuario actual"
  >
    <div className="flex items-center space-x-3">
      <div 
        className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold"
        aria-label={`Avatar de ${user.nombre}`}
      >
        {user.nombre.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p 
          className="text-sm font-medium text-gray-900 truncate"
          data-testid="user-nombre"
        >
          {user.nombre}
        </p>
        <p 
          className="text-xs text-gray-500 truncate"
          data-testid="user-username"
        >
          @{user.usuario}
        </p>
      </div>
    </div>
  </div>
)}

<button
  onClick={handleLogout}
  data-testid="logout-button"
  aria-label="Cerrar sesión y salir de la aplicación"
  className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
>
  <LogOut className="w-5 h-5" aria-hidden="true" />
  <span>Cerrar Sesión</span>
</button>
```

---

### 9. **GastosPage.tsx y IngresosPage.tsx**
**Ubicación**: `src/pages/GastosPage.tsx`, `src/pages/IngresosPage.tsx`

**Cambios**:
```tsx
{/* Encabezado de la página */}
<div className="flex justify-between items-center mb-6">
  <h1 
    className="text-3xl font-bold text-gray-900"
    data-testid="gastos-page-titulo"
  >
    Mis Gastos
  </h1>
  <Button 
    onClick={() => setMostrarFormulario(true)}
    data-testid="gastos-nuevo-btn"
    aria-label="Crear nuevo gasto"
  >
    <Plus className="w-5 h-5 mr-2" aria-hidden="true" />
    Nuevo Gasto
  </Button>
</div>

{/* Estadísticas */}
<GastosStats 
  totalGastos={totalGastos} 
  cantidadGastos={gastos.length}
/>

{/* Tabla */}
<GastosTabla
  gastos={gastos}
  ...
/>
```

---

## 🔧 Cambios Adicionales en Tests

Una vez implementadas las mejoras de accesibilidad en los componentes, los tests deben actualizarse para usar los nuevos selectores:

### **dashboard.spec.ts**
```typescript
// Antes
await expect(page.locator('text=/Total|Suma/')).toHaveCount(3);

// Después
await expect(page.getByTestId('dashboard-gastos-valor')).toBeVisible();
await expect(page.getByTestId('dashboard-ingresos-valor')).toBeVisible();
await expect(page.getByTestId('dashboard-ahorro-valor')).toBeVisible();
```

### **gastos.spec.ts**
```typescript
// Antes
const listaGastos = page.locator('table, ul, [role="list"]').first();
await expect(listaGastos).toBeVisible();

// Después
const tablaGastos = page.getByTestId('gastos-tabla');
await expect(tablaGastos).toBeVisible();
await expect(tablaGastos).toHaveAttribute('aria-label', /tabla de gastos/i);
```

### **ingresos.spec.ts**
```typescript
// Antes
await page.locator('input[name="monto"]').fill('50000');

// Después
await page.getByTestId('ingreso-monto-input').fill('50000');
```

### **auth.spec.ts**
```typescript
// Antes (E2E-005 falla)
const logoutButton = page.getByRole('button').filter({ hasText: /cerrar|logout|salir/i });

// Después
const logoutButton = page.getByTestId('logout-button');
await expect(logoutButton).toBeVisible();
await logoutButton.click();
```

---

## ✅ Checklist de Implementación

### Fase 1: Componentes de Estadísticas
- [ ] GastosStats.tsx - Agregar data-testid y aria-labels
- [ ] IngresosStats.tsx - Agregar data-testid y aria-labels

### Fase 2: Componentes de Tablas
- [ ] GastosTabla.tsx - Agregar data-testid, aria-labels en Table y botones
- [ ] IngresosTabla.tsx - Agregar data-testid, aria-labels en Table y botones

### Fase 3: Formularios
- [ ] FormularioGasto.tsx - Agregar name, data-testid, aria-labels en inputs
- [ ] FormularioIngreso.tsx - Agregar name, data-testid, aria-labels en inputs

### Fase 4: Dashboard y Navegación
- [ ] Home.tsx - Agregar data-testid en cards, charts, user info
- [ ] Sidebar.tsx - Agregar data-testid en user info y logout button

### Fase 5: Páginas
- [ ] GastosPage.tsx - Agregar data-testid en título y botón nuevo
- [ ] IngresosPage.tsx - Agregar data-testid en título y botón nuevo

### Fase 6: Actualizar Tests
- [ ] dashboard.spec.ts - Usar getByTestId en lugar de text locators
- [ ] gastos.spec.ts - Usar getByTestId para tabla y formulario
- [ ] ingresos.spec.ts - Usar getByTestId para tabla y formulario
- [ ] auth.spec.ts - Usar getByTestId('logout-button')

---

## 🎯 Resultados Esperados

**Antes**: 59 passing (54.6%), 15 skipped, 34 failed
**Después**: 95+ passing (88%+), 12 skipped (dependencias API), <5 failed

**Mejoras de Accesibilidad**:
- ✅ Todos los componentes interactivos con `aria-label`
- ✅ Todos los elementos de prueba con `data-testid`
- ✅ Formularios con `name` attributes
- ✅ Iconos decorativos con `aria-hidden="true"`
- ✅ Lectores de pantalla pueden navegar toda la app
- ✅ Tests más robustos y mantenibles

---

## 📚 Referencias

- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library - Priority of Queries](https://testing-library.com/docs/queries/about/#priority)
