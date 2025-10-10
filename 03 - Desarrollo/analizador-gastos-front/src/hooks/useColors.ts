import { useMemo } from 'react';
import { COLORS, BRAND_COLORS, CATEGORY_COLORS, STATUS_COLORS, HOVER_COLORS, getColorByCategory, getStatusColor } from '../styles/colors';

/**
 * Hook personalizado para acceder a la paleta de colores de la aplicación
 * Proporciona una interfaz consistente para usar colores en toda la app
 */
export const useColors = () => {
  const colors = useMemo(() => ({
    // Colores principales
    primary: COLORS.PRIMARY,
    primaryHover: COLORS.PRIMARY_HOVER,
    coral: COLORS.CORAL,
    golden: COLORS.GOLDEN,

    // Colores de texto
    textPrimary: COLORS.TEXT_PRIMARY,
    textSecondary: COLORS.TEXT_SECONDARY,
    textMuted: COLORS.TEXT_MUTED,

    // Colores de fondo
    background: COLORS.BACKGROUND,
    backgroundSecondary: COLORS.BACKGROUND_SECONDARY,

    // Colores de borde
    border: COLORS.BORDER,
    borderLight: COLORS.BORDER_LIGHT,

    // Colores de hover
    hoverLight: COLORS.HOVER_LIGHT,
    hoverBorder: COLORS.HOVER_BORDER,

    // Paletas completas
    brand: BRAND_COLORS,
    category: CATEGORY_COLORS,
    status: STATUS_COLORS,
    hover: HOVER_COLORS
  }), []);

  // Funciones helper
  const getCategoryColor = (categoryName: string) => getColorByCategory(categoryName);
  const getStatusColors = (status: keyof typeof STATUS_COLORS) => getStatusColor(status);

  // Función para obtener estilos de hover inline
  const getHoverStyles = (type: 'primary' | 'outline' | 'danger' = 'outline') => {
    const baseStyles = {
      transition: 'all 0.2s ease-in-out'
    };

    const hoverHandlers = {
      onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
        const target = e.currentTarget as HTMLElement;
        
        switch (type) {
          case 'primary':
            target.style.backgroundColor = colors.hover.primaryHover;
            break;
          case 'outline':
            target.style.backgroundColor = colors.hover.outlineHover;
            target.style.borderColor = colors.hover.outlineHoverBorder;
            break;
          case 'danger':
            target.style.backgroundColor = colors.hover.dangerHover;
            break;
        }
      },
      onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
        const target = e.currentTarget as HTMLElement;
        
        switch (type) {
          case 'primary':
            target.style.backgroundColor = colors.primary;
            break;
          case 'outline':
            target.style.backgroundColor = 'transparent';
            target.style.borderColor = colors.border;
            break;
          case 'danger':
            target.style.backgroundColor = colors.coral;
            break;
        }
      }
    };

    return { ...baseStyles, ...hoverHandlers };
  };

  return {
    colors,
    getCategoryColor,
    getStatusColors,
    getHoverStyles
  };
};

export default useColors;