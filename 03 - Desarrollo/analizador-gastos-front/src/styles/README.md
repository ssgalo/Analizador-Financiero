# Sistema de Colores del Analizador Financiero

Este sistema centraliza todos los colores de la aplicación para facilitar el mantenimiento y garantizar consistencia visual.

## 📁 Estructura de Archivos

```
src/styles/
├── colors.ts        # Definiciones de colores TypeScript
├── custom.css       # Variables CSS y clases utilitarias
└── README.md        # Esta documentación

src/hooks/
└── useColors.ts     # Hook para usar colores en componentes
```

## 🎨 Paleta de Colores

### Colores Principales
- **Teal (#14b8a6)**: Color principal de la aplicación
- **Coral (#EF5B5B)**: Para gastos y valores negativos
- **Golden (#FFBA49)**: Para metas y objetivos

### Colores de Categorías
- Alimentación: `#20A39E`
- Transporte: `#0C7489`
- Vivienda: `#FFBA49`
- Entretenimiento: `#EF5B5B`
- Compras: `#13505B`
- Salud: `#A78BFA`
- Educación: `#F59E0B`
- Servicios: `#8B5CF6`

## 🔧 Cómo Usar

### 1. En Componentes TypeScript

```tsx
import { useColors } from '../hooks/useColors';

function MiComponente() {
  const { colors, getCategoryColor, getHoverStyles } = useColors();

  return (
    <div style={{ backgroundColor: colors.primary }}>
      <Button
        style={{ backgroundColor: colors.primary }}
        {...getHoverStyles('primary')}
      >
        Mi Botón
      </Button>
    </div>
  );
}
```

### 2. En CSS con Variables

```css
.mi-elemento {
  background-color: var(--color-primary);
  color: var(--color-gray-600);
  border: 1px solid var(--color-border);
}

.mi-elemento:hover {
  background-color: var(--color-primary-hover);
}
```

### 3. Con Clases Utilitarias

```tsx
<div className="bg-teal text-white">
  <span className="text-coral">Gasto: $1,234</span>
  <span className="text-golden">Meta: $5,000</span>
</div>
```

## 🎯 Funciones Helper

### `getCategoryColor(categoryName: string)`
Obtiene el color de una categoría específica:

```tsx
const color = getCategoryColor('Alimentación'); // Returns: #20A39E
```

### `getStatusColors(status: 'success' | 'error' | 'warning' | 'info')`
Obtiene los colores para diferentes estados:

```tsx
const successColors = getStatusColors('success');
// Returns: { background: '#f0fdf4', border: '#bbf7d0', text: '#166534', icon: '#22c55e' }
```

### `getHoverStyles(type: 'primary' | 'outline' | 'danger')`
Genera estilos de hover automáticos:

```tsx
<Button {...getHoverStyles('primary')}>
  Botón Principal
</Button>

<Button {...getHoverStyles('outline')}>
  Botón Secundario
</Button>
```

## 📋 Ejemplos Prácticos

### Botón con Hover Personalizado

```tsx
function MiBoton() {
  const { getHoverStyles, colors } = useColors();

  return (
    <Button
      style={{ backgroundColor: colors.primary }}
      {...getHoverStyles('primary')}
    >
      Click me
    </Button>
  );
}
```

### Indicador de Categoría

```tsx
function CategoriaBadge({ categoria }: { categoria: string }) {
  const { getCategoryColor } = useColors();

  return (
    <span
      style={{
        backgroundColor: getCategoryColor(categoria),
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px'
      }}
    >
      {categoria}
    </span>
  );
}
```

### Estado de Éxito/Error

```tsx
function StatusMessage({ type, message }: { type: 'success' | 'error', message: string }) {
  const { getStatusColors } = useColors();
  const statusColors = getStatusColors(type);

  return (
    <div
      style={{
        backgroundColor: statusColors.background,
        border: `1px solid ${statusColors.border}`,
        color: statusColors.text,
        padding: '12px',
        borderRadius: '8px'
      }}
    >
      {message}
    </div>
  );
}
```

## 🚀 Migración de Código Existente

### Antes (colores hardcodeados):
```tsx
<Button
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = '#0f766e';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = '#14b8a6';
  }}
  style={{ backgroundColor: '#14b8a6' }}
>
```

### Después (usando el sistema):
```tsx
<Button
  style={{ backgroundColor: colors.primary }}
  {...getHoverStyles('primary')}
>
```

## 🎨 Personalización

Para agregar nuevos colores:

1. **Edita `src/styles/colors.ts`** - Agrega el color a la paleta correspondiente
2. **Actualiza `src/styles/custom.css`** - Agrega las variables CSS
3. **Extiende el hook `useColors.ts`** - Si necesitas funciones helper adicionales

## 📝 Notas de Mantenimiento

- **Todos los colores deben estar centralizados** en este sistema
- **No uses colores hardcodeados** en componentes
- **Usa las funciones helper** para consistencia
- **Las variables CSS** están disponibles para casos especiales
- **El hook `useColors`** es la forma preferida en React

## 🔄 Actualizar Colores Globalmente

Para cambiar el color principal de toda la aplicación:

1. Modifica `BRAND_COLORS.teal[500]` en `colors.ts`
2. Actualiza `--color-primary` en `custom.css`
3. Los cambios se aplicarán automáticamente en toda la app

¡Esto hace que cambiar temas o colores sea súper fácil! 🎉