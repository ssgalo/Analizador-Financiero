/**
 * Utilidades para el manejo de fechas
 * Funciones auxiliares para operaciones comunes con fechas
 */

/**
 * Obtiene el primer día del mes actual en formato yyyy-mm-dd
 * 
 * @returns String con la fecha del primer día del mes actual
 * 
 * @example
 * // Si estamos en diciembre 2023
 * getPrimerDiaMes() // returns "2023-12-01"
 */
export const getPrimerDiaMes = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return `${year}-${month.toString().padStart(2, '0')}-01`;
};

/**
 * Obtiene el último día del mes actual en formato yyyy-mm-dd
 * 
 * @returns String con la fecha del último día del mes actual
 * 
 * @example
 * // Si estamos en diciembre 2023
 * getUltimoDiaMes() // returns "2023-12-31"
 */
export const getUltimoDiaMes = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const lastDay = new Date(year, month, 0);
  return lastDay.toISOString().split('T')[0];
};

/**
 * Obtiene el rango de fechas del mes actual
 * 
 * @returns Objeto con fechaDesde y fechaHasta del mes actual
 * 
 * @example
 * getRangoMesActual()
 * // returns { fechaDesde: "2023-12-01", fechaHasta: "2023-12-31" }
 */
export const getRangoMesActual = (): { fechaDesde: string; fechaHasta: string } => {
  return {
    fechaDesde: getPrimerDiaMes(),
    fechaHasta: getUltimoDiaMes()
  };
};

/**
 * Obtiene el año y mes actuales
 * 
 * @returns Objeto con año y mes actuales
 * 
 * @example
 * getYearMonth()
 * // returns { year: 2023, month: 12 }
 */
export const getYearMonth = (): { year: number; month: number } => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1
  };
};

/**
 * Formatea un año y mes para mostrar en español
 * 
 * @param year - Año (ej: 2023)
 * @param month - Mes (1-12)
 * @returns String formateado (ej: "Diciembre 2023")
 * 
 * @example
 * formatMesAnio(2023, 12) // returns "Diciembre 2023"
 */
export const formatMesAnio = (year: number, month: number): string => {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  return `${meses[month - 1]} ${year}`;
};

/**
 * Convierte una fecha Date a formato yyyy-mm-dd
 * 
 * @param date - Objeto Date a convertir
 * @returns String en formato yyyy-mm-dd
 * 
 * @example
 * dateToISO(new Date(2023, 11, 25)) // returns "2023-12-25"
 */
export const dateToISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Verifica si una fecha está en el mes actual
 * 
 * @param fecha - Fecha en formato yyyy-mm-dd
 * @returns true si la fecha está en el mes actual, false en caso contrario
 * 
 * @example
 * // Si estamos en diciembre 2023
 * isEnMesActual("2023-12-15") // returns true
 * isEnMesActual("2023-11-15") // returns false
 */
export const isEnMesActual = (fecha: string): boolean => {
  const { year, month } = getYearMonth();
  const [fechaYear, fechaMonth] = fecha.split('-').map(Number);
  
  return fechaYear === year && fechaMonth === month;
};

/**
 * Calcula los últimos N meses desde hoy
 * 
 * @param meses - Número de meses hacia atrás
 * @returns Array de objetos con año y mes
 * 
 * @example
 * getUltimosMeses(3)
 * // returns [
 * //   { year: 2023, month: 12 },
 * //   { year: 2023, month: 11 },
 * //   { year: 2023, month: 10 }
 * // ]
 */
export const getUltimosMeses = (meses: number): Array<{ year: number; month: number }> => {
  const resultado = [];
  const now = new Date();
  
  for (let i = 0; i < meses; i++) {
    const fecha = new Date(now.getFullYear(), now.getMonth() - i, 1);
    resultado.push({
      year: fecha.getFullYear(),
      month: fecha.getMonth() + 1
    });
  }
  
  return resultado;
};
