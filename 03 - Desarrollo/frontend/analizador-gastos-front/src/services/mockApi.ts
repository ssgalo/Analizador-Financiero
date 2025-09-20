// Mock API Service - Simula las respuestas del backend
// Esto será reemplazado por llamadas reales a la API cuando esté listo el backend

export interface Usuario {
  id_usuario: number;
  nombre: string;
  email: string;
  fecha_creacion: string;
  preferencias: any;
  ultimo_login: string;
  estado: string;
}

export interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion: string;
  es_personalizada: boolean;
  id_usuario?: number;
  color?: string;
  icono?: string;
}

export interface Gasto {
  id_gasto: number;
  id_usuario: number;
  fecha: string;
  monto: number;
  descripcion: string;
  comercio: string;
  id_categoria: number;
  categoria?: Categoria;
  fuente: 'manual' | 'PDF' | 'imagen' | 'MercadoPago' | 'banco';
  id_archivo_importado?: number;
  estado: 'activo' | 'eliminado' | 'pendiente';
  fecha_creacion: string;
  fecha_modificacion: string;
}

export interface Objetivo {
  id_objetivo: number;
  id_usuario: number;
  descripcion: string;
  monto_objetivo: number;
  monto_actual: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'en progreso' | 'completado' | 'pausado';
}

export interface RecomendacionIA {
  id: number;
  tipo: 'ahorro' | 'recordatorio' | 'analisis' | 'alerta';
  titulo: string;
  mensaje: string;
  fecha: string;
  prioridad: 'alta' | 'media' | 'baja';
}

// Mock Data
const mockUsuario: Usuario = {
  id_usuario: 1,
  nombre: "Juan Pérez",
  email: "juan@mail.com",
  fecha_creacion: "2024-01-01T00:00:00Z",
  preferencias: { tema: "claro", moneda: "ARS" },
  ultimo_login: "2025-09-20T08:00:00Z",
  estado: "activo"
};

const mockCategorias: Categoria[] = [
  { id_categoria: 1, nombre: "Alimentación", descripcion: "Comida y bebidas", es_personalizada: false, color: "#20A39E", icono: "Coffee" },
  { id_categoria: 2, nombre: "Transporte", descripcion: "Movilidad y combustible", es_personalizada: false, color: "#0C7489", icono: "Car" },
  { id_categoria: 3, nombre: "Vivienda", descripcion: "Alquiler, servicios, mantenimiento", es_personalizada: false, color: "#FFBA49", icono: "Home" },
  { id_categoria: 4, nombre: "Entretenimiento", descripcion: "Ocio y diversión", es_personalizada: false, color: "#EF5B5B", icono: "Smartphone" },
  { id_categoria: 5, nombre: "Compras", descripcion: "Ropa, electrónicos, varios", es_personalizada: false, color: "#13505B", icono: "ShoppingCart" },
  { id_categoria: 6, nombre: "Salud", descripcion: "Médicos, medicamentos, seguros", es_personalizada: false, color: "#A78BFA", icono: "Heart" },
  { id_categoria: 7, nombre: "Educación", descripcion: "Cursos, libros, capacitación", es_personalizada: false, color: "#F59E0B", icono: "Book" },
  { id_categoria: 8, nombre: "Servicios", descripcion: "Suscripciones, servicios digitales", es_personalizada: false, color: "#8B5CF6", icono: "Wifi" }
];

const mockGastos: Gasto[] = [
  {
    id_gasto: 1,
    id_usuario: 1,
    fecha: "2025-09-19",
    monto: 4500,
    descripcion: "Compra semanal de verduras y carnes",
    comercio: "Supermercado Disco",
    id_categoria: 1,
    fuente: "manual",
    estado: "activo",
    fecha_creacion: "2025-09-19T10:30:00Z",
    fecha_modificacion: "2025-09-19T10:30:00Z"
  },
  {
    id_gasto: 2,
    id_usuario: 1,
    fecha: "2025-09-19",
    monto: 1200,
    descripcion: "Viaje al centro",
    comercio: "Uber",
    id_categoria: 2,
    fuente: "MercadoPago",
    estado: "activo",
    fecha_creacion: "2025-09-19T14:15:00Z",
    fecha_modificacion: "2025-09-19T14:15:00Z"
  },
  {
    id_gasto: 3,
    id_usuario: 1,
    fecha: "2025-09-18",
    monto: 2500,
    descripcion: "Suscripción mensual",
    comercio: "Netflix",
    id_categoria: 4,
    fuente: "PDF",
    estado: "activo",
    fecha_creacion: "2025-09-18T20:00:00Z",
    fecha_modificacion: "2025-09-18T20:00:00Z"
  },
  {
    id_gasto: 4,
    id_usuario: 1,
    fecha: "2025-09-18",
    monto: 15000,
    descripcion: "Cena en restaurante familiar",
    comercio: "La Parolaccia",
    id_categoria: 1,
    fuente: "manual",
    estado: "activo",
    fecha_creacion: "2025-09-18T21:30:00Z",
    fecha_modificacion: "2025-09-18T21:30:00Z"
  },
  {
    id_gasto: 5,
    id_usuario: 1,
    fecha: "2025-09-17",
    monto: 8000,
    descripcion: "Carga de combustible",
    comercio: "Shell",
    id_categoria: 2,
    fuente: "imagen",
    estado: "activo",
    fecha_creacion: "2025-09-17T09:00:00Z",
    fecha_modificacion: "2025-09-17T09:00:00Z"
  },
  {
    id_gasto: 6,
    id_usuario: 1,
    fecha: "2025-09-16",
    monto: 35000,
    descripcion: "Pago de alquiler mensual",
    comercio: "Inmobiliaria Central",
    id_categoria: 3,
    fuente: "manual",
    estado: "activo",
    fecha_creacion: "2025-09-16T10:00:00Z",
    fecha_modificacion: "2025-09-16T10:00:00Z"
  },
  {
    id_gasto: 7,
    id_usuario: 1,
    fecha: "2025-09-15",
    monto: 12000,
    descripcion: "Compra de ropa de invierno",
    comercio: "Zara",
    id_categoria: 5,
    fuente: "MercadoPago",
    estado: "activo",
    fecha_creacion: "2025-09-15T16:45:00Z",
    fecha_modificacion: "2025-09-15T16:45:00Z"
  },
  {
    id_gasto: 8,
    id_usuario: 1,
    fecha: "2025-09-14",
    monto: 3500,
    descripcion: "Medicamentos y vitaminas",
    comercio: "Farmacity",
    id_categoria: 6,
    fuente: "manual",
    estado: "activo",
    fecha_creacion: "2025-09-14T11:20:00Z",
    fecha_modificacion: "2025-09-14T11:20:00Z"
  }
];

const mockObjetivos: Objetivo[] = [
  {
    id_objetivo: 1,
    id_usuario: 1,
    descripcion: "Vacaciones de verano 2026",
    monto_objetivo: 150000,
    monto_actual: 112500,
    fecha_inicio: "2025-01-01",
    fecha_fin: "2025-12-31",
    estado: "en progreso"
  },
  {
    id_objetivo: 2,
    id_usuario: 1,
    descripcion: "Fondo de emergencia",
    monto_objetivo: 200000,
    monto_actual: 50000,
    fecha_inicio: "2025-03-01",
    fecha_fin: "2026-03-01",
    estado: "en progreso"
  }
];

const mockRecomendaciones: RecomendacionIA[] = [
  {
    id: 1,
    tipo: "ahorro",
    titulo: "Oportunidad de Ahorro",
    mensaje: "Podrías ahorrar $3,500 reduciendo gastos en entretenimiento este mes.",
    fecha: "2025-09-20T08:00:00Z",
    prioridad: "media"
  },
  {
    id: 2,
    tipo: "recordatorio",
    titulo: "Recordatorio",
    mensaje: "Tu suscripción de Netflix se renueva en 3 días por $2,500.",
    fecha: "2025-09-20T08:00:00Z",
    prioridad: "baja"
  },
  {
    id: 3,
    tipo: "analisis",
    titulo: "Análisis",
    mensaje: "Tus gastos en alimentación están 15% por encima del promedio.",
    fecha: "2025-09-20T08:00:00Z",
    prioridad: "alta"
  }
];

// Simulación de delay de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API Methods
export const mockApi = {
  // Usuario
  async getUsuario(): Promise<Usuario> {
    await delay(300);
    return mockUsuario;
  },

  // Categorías
  async getCategorias(): Promise<Categoria[]> {
    await delay(200);
    return mockCategorias;
  },

  // Gastos
  async getGastos(filtros?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    categoria?: number;
    fuente?: string;
    limite?: number;
  }): Promise<Gasto[]> {
    await delay(500);
    
    // Filtrar solo gastos activos (no eliminados)
    let gastosFiltrados = mockGastos.filter(gasto => gasto.estado === 'activo');
    
    // Agregar información de categoría a cada gasto
    gastosFiltrados = gastosFiltrados.map(gasto => ({
      ...gasto,
      categoria: mockCategorias.find(cat => cat.id_categoria === gasto.id_categoria)
    }));

    // Aplicar filtros si existen
    if (filtros?.fecha_desde) {
      gastosFiltrados = gastosFiltrados.filter(gasto => gasto.fecha >= filtros.fecha_desde!);
    }
    if (filtros?.fecha_hasta) {
      gastosFiltrados = gastosFiltrados.filter(gasto => gasto.fecha <= filtros.fecha_hasta!);
    }
    if (filtros?.categoria) {
      gastosFiltrados = gastosFiltrados.filter(gasto => gasto.id_categoria === filtros.categoria);
    }
    if (filtros?.fuente) {
      gastosFiltrados = gastosFiltrados.filter(gasto => gasto.fuente === filtros.fuente);
    }
    if (filtros?.limite) {
      gastosFiltrados = gastosFiltrados.slice(0, filtros.limite);
    }

    return gastosFiltrados.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  },

  async getGasto(id: number): Promise<Gasto | null> {
    await delay(200);
    const gasto = mockGastos.find(g => g.id_gasto === id);
    if (gasto) {
      return {
        ...gasto,
        categoria: mockCategorias.find(cat => cat.id_categoria === gasto.id_categoria)
      };
    }
    return null;
  },

  async createGasto(nuevoGasto: Omit<Gasto, 'id_gasto' | 'fecha_creacion' | 'fecha_modificacion'>): Promise<Gasto> {
    await delay(300);
    const gasto: Gasto = {
      ...nuevoGasto,
      id_gasto: Math.max(...mockGastos.map(g => g.id_gasto)) + 1,
      fecha_creacion: new Date().toISOString(),
      fecha_modificacion: new Date().toISOString()
    };
    mockGastos.push(gasto);
    return {
      ...gasto,
      categoria: mockCategorias.find(cat => cat.id_categoria === gasto.id_categoria)
    };
  },

  async updateGasto(id: number, datosActualizados: Partial<Gasto>): Promise<Gasto | null> {
    await delay(300);
    const index = mockGastos.findIndex(g => g.id_gasto === id);
    if (index !== -1) {
      mockGastos[index] = {
        ...mockGastos[index],
        ...datosActualizados,
        fecha_modificacion: new Date().toISOString()
      };
      return {
        ...mockGastos[index],
        categoria: mockCategorias.find(cat => cat.id_categoria === mockGastos[index].id_categoria)
      };
    }
    return null;
  },

  async deleteGasto(id: number): Promise<boolean> {
    await delay(200);
    const index = mockGastos.findIndex(g => g.id_gasto === id);
    if (index !== -1) {
      mockGastos[index].estado = 'eliminado';
      return true;
    }
    return false;
  },

  // Objetivos
  async getObjetivos(): Promise<Objetivo[]> {
    await delay(300);
    return mockObjetivos;
  },

  // Recomendaciones IA
  async getRecomendaciones(): Promise<RecomendacionIA[]> {
    await delay(400);
    return mockRecomendaciones;
  },

  // Estadísticas
  async getEstadisticas(_periodo: 'mes' | 'trimestre' | 'año' = 'mes'): Promise<{
    totalGastos: number;
    totalIngresos: number;
    ahorro: number;
    gastosPorCategoria: { categoria: string; total: number; color: string }[];
    tendenciaMensual: { mes: string; gastos: number; ingresos: number }[];
  }> {
    await delay(600);
    
    const gastos = await this.getGastos();
    const totalGastos = gastos.reduce((sum, gasto) => sum + gasto.monto, 0);
    const totalIngresos = 120000; // Mock de ingresos
    const ahorro = totalIngresos - totalGastos;

    const gastosPorCategoria = mockCategorias.map(categoria => {
      const gastosCategoria = gastos.filter(g => g.id_categoria === categoria.id_categoria);
      const total = gastosCategoria.reduce((sum, gasto) => sum + gasto.monto, 0);
      return {
        categoria: categoria.nombre,
        total,
        color: categoria.color || "#666"
      };
    }).filter(item => item.total > 0);

    const tendenciaMensual = [
      { mes: "Abr", gastos: 85000, ingresos: 120000 },
      { mes: "May", gastos: 92000, ingresos: 120000 },
      { mes: "Jun", gastos: 78000, ingresos: 120000 },
      { mes: "Jul", gastos: 95000, ingresos: 120000 },
      { mes: "Ago", gastos: 88000, ingresos: 120000 },
      { mes: "Sep", gastos: totalGastos, ingresos: totalIngresos },
    ];

    return {
      totalGastos,
      totalIngresos,
      ahorro,
      gastosPorCategoria,
      tendenciaMensual
    };
  }
};