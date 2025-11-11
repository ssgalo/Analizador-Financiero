/**
 * Utilidades para el manejo de categorías
 * Centraliza la lógica de iconos, colores y validaciones de categorías
 */

import type { LucideIcon } from 'lucide-react';
import {
  ShoppingCart,
  Coffee,
  Car,
  Home as HomeIcon,
  Smartphone,
  Heart,
  Book,
  Wifi,
  DollarSign,
  TrendingUp,
  Briefcase,
  ShoppingBag,
  Package
} from 'lucide-react';

/**
 * Interfaz para definir información de categoría
 */
export interface CategoriaInfo {
  nombre: string;
  descripcion: string;
  color: string;
  icono: string;
}

/**
 * Categorías predefinidas para gastos
 */
export const CATEGORIAS_GASTOS: CategoriaInfo[] = [
  { nombre: 'Otros', descripcion: 'Otros gastos', color: '#6b7280', icono: '📦' },
  { nombre: 'Comida', descripcion: 'Gastos en alimentación', color: '#f59e0b', icono: '🍽️' },
  { nombre: 'Supermercado', descripcion: 'Compras en supermercado', color: '#22c55e', icono: '🛒' },
  { nombre: 'Entretenimiento', descripcion: 'Gastos en entretenimiento', color: '#ec4899', icono: '🎮' },
  { nombre: 'Vivienda', descripcion: 'Gastos relacionados a vivienda', color: '#3b82f6', icono: '🏠' },
  { nombre: 'Transporte', descripcion: 'Gastos en transporte', color: '#8b5cf6', icono: '🚗' },
  { nombre: 'Suscripciones y membresías', descripcion: 'Servicios recurrentes', color: '#ef4444', icono: '📱' },
  { nombre: 'Salud y cuidado personal', descripcion: 'Gastos médicos, farmacia, cuidado personal', color: '#10b981', icono: '🏥' }
];

/**
 * Categorías predefinidas para ingresos
 */
export const CATEGORIAS_INGRESOS: CategoriaInfo[] = [
  { nombre: 'Salario', descripcion: 'Ingresos por salario', color: '#3b82f6', icono: '💼' },
  { nombre: 'Freelance', descripcion: 'Trabajos independientes', color: '#8b5cf6', icono: '💻' },
  { nombre: 'Inversiones', descripcion: 'Rendimientos de inversiones', color: '#10b981', icono: '📈' },
  { nombre: 'Ventas', descripcion: 'Ingresos por ventas', color: '#f59e0b', icono: '🛍️' },
  { nombre: 'Otros ingresos', descripcion: 'Otros tipos de ingresos', color: '#6b7280', icono: '💰' }
];

/**
 * Mapeo de nombres de categorías a componentes de iconos de Lucide
 * Usado para mostrar iconos consistentes en toda la aplicación
 * 
 * @param categoryName - Nombre de la categoría
 * @returns Componente de icono de Lucide correspondiente
 */
export const getCategoryIcon = (categoryName: string): LucideIcon => {
  const normalizedName = categoryName.toLowerCase().trim();
  
  const iconMap: Record<string, LucideIcon> = {
    'alimentación': Coffee,
    'alimentacion': Coffee,
    'comida': Coffee,
    'transporte': Car,
    'vivienda': HomeIcon,
    'entretenimiento': Smartphone,
    'salud': Heart,
    'salud y cuidado personal': Heart,
    'educación': Book,
    'educacion': Book,
    'servicios': Wifi,
    'suscripciones y membresías': Wifi,
    'suscripciones y membresias': Wifi,
    'salario': Briefcase,
    'freelance': Briefcase,
    'inversiones': TrendingUp,
    'ventas': ShoppingBag,
    'otros': Package,
    'otros ingresos': DollarSign,
    'supermercado': ShoppingCart
  };

  return iconMap[normalizedName] || ShoppingCart;
};

/**
 * Filtra categorías permitidas según sus nombres
 * Elimina duplicados y mantiene solo las categorías con nombres válidos
 * 
 * @param categorias - Array de categorías a filtrar
 * @param nombresPermitidos - Array de nombres de categorías permitidas
 * @returns Array de categorías filtradas sin duplicados
 */
export const filtrarCategorias = <T extends { nombre: string }>(
  categorias: T[],
  nombresPermitidos: string[]
): T[] => {
  // Filtrar por nombres permitidos, asegurando que nombre existe y no es undefined
  const categoriasFiltradas = categorias.filter(cat =>
    cat && cat.nombre && nombresPermitidos.some(nombre =>
      cat.nombre.toLowerCase().trim() === nombre.toLowerCase().trim()
    )
  );

  // Eliminar duplicados basándose en el nombre (mantener el primero)
  return categoriasFiltradas.filter((cat, index, array) =>
    array.findIndex(c =>
      c && c.nombre && cat && cat.nombre &&
      c.nombre.toLowerCase().trim() === cat.nombre.toLowerCase().trim()
    ) === index
  );
};

/**
 * Verifica si una categoría existe en un array de categorías
 * 
 * @param categorias - Array de categorías existentes
 * @param nombreCategoria - Nombre de la categoría a buscar
 * @returns true si la categoría existe, false en caso contrario
 */
export const categoriaExiste = <T extends { nombre: string }>(
  categorias: T[],
  nombreCategoria: string
): boolean => {
  return categorias.some(cat =>
    cat.nombre.toLowerCase().trim() === nombreCategoria.toLowerCase().trim()
  );
};

/**
 * Obtiene las categorías faltantes comparando con una lista requerida
 * 
 * @param categoriasExistentes - Categorías que ya existen
 * @param categoriasRequeridas - Lista de categorías que deberían existir
 * @returns Array con información de las categorías faltantes
 */
export const obtenerCategoriasFaltantes = <T extends { nombre: string }>(
  categoriasExistentes: T[],
  categoriasRequeridas: CategoriaInfo[]
): CategoriaInfo[] => {
  return categoriasRequeridas.filter(catInfo =>
    !categoriaExiste(categoriasExistentes, catInfo.nombre)
  );
};
