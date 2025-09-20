// Utilidades de formateo para América Latina

/**
 * Convierte una fecha del formato yyyy-mm-dd a dd/mm/yyyy
 */
export const formatDateToLocal = (dateString: string): string => {
  if (!dateString) return '';
  
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Convierte una fecha del formato dd/mm/yyyy a yyyy-mm-dd
 */
export const formatDateToISO = (localDate: string): string => {
  if (!localDate) return '';
  
  const [day, month, year] = localDate.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * Formatea un número con separador de miles (punto) y decimales (coma)
 * Ejemplo: 1234.56 -> "1.234,56"
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Formatea un número sin símbolo de moneda
 * Ejemplo: 1234.56 -> "1.234,56"
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

/**
 * Convierte un string con formato local a número
 * Ejemplo: "1.234,56" -> 1234.56
 */
export const parseLocalNumber = (localNumber: string): number => {
  if (!localNumber) return 0;
  
  // Remover separadores de miles (puntos) y reemplazar coma decimal por punto
  const normalized = localNumber
    .replace(/\./g, '') // Remover puntos (separadores de miles)
    .replace(',', '.'); // Reemplazar coma decimal por punto
  
  return parseFloat(normalized) || 0;
};

/**
 * Formatea una fecha completa para mostrar
 * Ejemplo: "2023-12-25" -> "25/12/2023"
 */
export const formatDisplayDate = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString + 'T00:00:00'); // Evitar problemas de timezone
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Obtiene la fecha actual en formato yyyy-mm-dd
 */
export const getCurrentDateISO = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Obtiene la fecha actual en formato dd/mm/yyyy
 */
export const getCurrentDateLocal = (): string => {
  return formatDateToLocal(getCurrentDateISO());
};