/**
 * Paleta de colores centralizada del Analizador Financiero
 * Todos los colores de la aplicación están definidos aquí para facilitar el mantenimiento
 */

// Colores principales de la marca
export const BRAND_COLORS = {
  // Teal - Color principal de la aplicación
  teal: {
    50: '#f0fdfa',
    100: '#ccfbf1', 
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6', // Color principal
    600: '#0d9488',
    700: '#0f766e', // Hover principal
    800: '#115e59',
    900: '#134e4a'
  },

  // Coral - Para gastos/negativos
  coral: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#EF5B5B', // Color actual usado
    800: '#991b1b',
    900: '#7f1d1d'
  },

  // Golden - Para objetivos/metas
  golden: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#FFBA49', // Color actual usado
    800: '#92400e',
    900: '#78350f'
  }
} as const;

// Colores de las categorías
export const CATEGORY_COLORS = {
  alimentacion: '#20A39E',
  transporte: '#0C7489', 
  vivienda: '#FFBA49',
  entretenimiento: '#EF5B5B',
  compras: '#13505B',
  salud: '#A78BFA',
  educacion: '#F59E0B',
  servicios: '#8B5CF6',
  default: '#666666'
} as const;

// Colores de estado
export const STATUS_COLORS = {
  success: {
    background: '#f0fdf4',
    border: '#bbf7d0',
    text: '#166534',
    icon: '#22c55e'
  },
  error: {
    background: '#fef2f2',
    border: '#fecaca', 
    text: '#dc2626',
    icon: '#ef4444'
  },
  warning: {
    background: '#fffbeb',
    border: '#fed7aa',
    text: '#ea580c',
    icon: '#f97316'
  },
  info: {
    background: '#eff6ff',
    border: '#bfdbfe',
    text: '#1d4ed8',
    icon: '#3b82f6'
  }
} as const;

// Colores neutros y de interfaz
export const UI_COLORS = {
  // Grises para fondos y textos
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  },

  // Slates para hover states
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  }
} as const;

// Colores para gráficos (compatibles con Recharts)
export const CHART_COLORS = {
  primary: '#14b8a6',
  secondary: '#EF5B5B',
  tertiary: '#FFBA49',
  quaternary: '#8B5CF6',
  expenses: '#EF5B5B',
  income: '#20A39E',
  savings: '#FFBA49'
} as const;

// Colores de hover para botones
export const HOVER_COLORS = {
  // Para botones principales (teal)
  primaryHover: '#0f766e',
  primaryHoverLight: '#0d9488',

  // Para botones outline/secondary
  outlineHover: '#f1f5f9',
  outlineHoverBorder: '#94a3b8',
  outlineHoverDark: '#e2e8f0',

  // Para botones de peligro
  dangerHover: '#dc2626',
  dangerHoverLight: '#ef4444'
} as const;

// Funciones helper para usar los colores
export const getColorByCategory = (categoryName: string): string => {
  const normalizedName = categoryName.toLowerCase().replace(/\s/g, '');
  return CATEGORY_COLORS[normalizedName as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.default;
};

export const getStatusColor = (status: keyof typeof STATUS_COLORS) => {
  return STATUS_COLORS[status];
};

// Exportar colores individuales para fácil acceso
export const COLORS = {
  // Principales
  PRIMARY: BRAND_COLORS.teal[500],
  PRIMARY_HOVER: BRAND_COLORS.teal[700],
  CORAL: BRAND_COLORS.coral[700],
  GOLDEN: BRAND_COLORS.golden[700],

  // Texto
  TEXT_PRIMARY: UI_COLORS.gray[900],
  TEXT_SECONDARY: UI_COLORS.gray[600],
  TEXT_MUTED: UI_COLORS.gray[500],

  // Fondos
  BACKGROUND: '#ffffff',
  BACKGROUND_SECONDARY: UI_COLORS.gray[50],
  
  // Bordes
  BORDER: UI_COLORS.gray[200],
  BORDER_LIGHT: UI_COLORS.gray[100],

  // Estados de hover
  HOVER_LIGHT: HOVER_COLORS.outlineHover,
  HOVER_BORDER: HOVER_COLORS.outlineHoverBorder
} as const;

export default COLORS;