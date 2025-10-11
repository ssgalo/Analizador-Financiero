-- ##############################################
-- ## SCRIPT DE INICIALIZACIÓN POSTGRESQL      ##
-- ## Analizador Financiero                    ##
-- ##############################################

-- Configuración inicial
SET client_encoding = 'UTF8';
SET timezone = 'UTC';

-- ##############################################
-- ## FASE 1: CREACIÓN DE TABLAS               ##
-- ##############################################

-- Tabla USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    contraseña VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    preferencias TEXT,
    ultimo_login TIMESTAMP,
    estado VARCHAR(20) CHECK (estado IN ('activo', 'inactivo', 'pendiente'))
);

-- Tabla MONEDAS (debe estar antes que otras tablas que la referencien)
CREATE TABLE IF NOT EXISTS monedas (
    codigo_moneda VARCHAR(3) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    simbolo VARCHAR(5) NOT NULL,
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla CATEGORIAS
CREATE TABLE IF NOT EXISTS categorias (
    id_categoria SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    es_personalizada BOOLEAN NOT NULL DEFAULT FALSE,
    icono VARCHAR(50),
    color VARCHAR(20),
    activa BOOLEAN NOT NULL DEFAULT TRUE
);

-- Tabla ARCHIVOS_IMPORTADOS
CREATE TABLE IF NOT EXISTS archivos_importados (
    id_archivo_importado SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
    tipo VARCHAR(20) CHECK (tipo IN ('pdf', 'imagen', 'csv')),
    ruta_archivo VARCHAR(500) NOT NULL,
    fecha_importacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_procesamiento VARCHAR(20) CHECK (estado_procesamiento IN ('pendiente', 'procesando', 'procesado', 'error')),
    resultado_ocr TEXT
);

-- Tabla GASTOS
CREATE TABLE IF NOT EXISTS gastos (
    id_gasto SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
    id_categoria INTEGER NOT NULL REFERENCES categorias(id_categoria),
    id_archivo_importado INTEGER REFERENCES archivos_importados(id_archivo_importado),
    fecha DATE NOT NULL,
    monto DECIMAL(18, 2) NOT NULL,
    descripcion VARCHAR(255),
    comercio VARCHAR(100),
    fuente VARCHAR(20) CHECK (fuente IN ('manual', 'importado', 'integracion')),
    estado VARCHAR(20) CHECK (estado IN ('confirmado', 'pendiente', 'eliminado')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP,
    categoria_ia_sugerida VARCHAR(100),
    confianza_ia DECIMAL(5, 4),
    moneda VARCHAR(3) DEFAULT 'ARS' REFERENCES monedas(codigo_moneda)
);

-- Tabla INGRESOS
CREATE TABLE IF NOT EXISTS ingresos (
    id_ingreso SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
    id_categoria INTEGER REFERENCES categorias(id_categoria),
    fecha DATE NOT NULL,
    monto DECIMAL(18, 2) NOT NULL,
    descripcion VARCHAR(255),
    fuente VARCHAR(100),
    tipo VARCHAR(30) CHECK (tipo IN ('salario', 'freelance', 'inversion', 'venta', 'regalo', 'otro')),
    recurrente BOOLEAN DEFAULT FALSE,
    frecuencia VARCHAR(20) CHECK (frecuencia IN ('semanal', 'quincenal', 'mensual', 'trimestral', 'anual', 'unica')),
    estado VARCHAR(20) CHECK (estado IN ('confirmado', 'pendiente', 'cancelado')) DEFAULT 'confirmado',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    moneda VARCHAR(3) DEFAULT 'ARS' REFERENCES monedas(codigo_moneda),
    notas VARCHAR(500)
);

-- Tabla INTEGRACIONES
CREATE TABLE IF NOT EXISTS integraciones (
    id_integracion SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
    tipo VARCHAR(50) CHECK (tipo IN ('mercadopago', 'uala', 'banco_galicia')),
    estado VARCHAR(20) CHECK (estado IN ('activa', 'inactiva', 'error')),
    fecha_vinculacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    datos_credenciales TEXT,
    ultima_sincronizacion TIMESTAMP,
    proxima_sincronizacion TIMESTAMP,
    config_sincronizacion TEXT
);

-- Tabla OBJETIVOS_FINANCIEROS
CREATE TABLE IF NOT EXISTS objetivos_financieros (
    id_objetivo SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
    descripcion VARCHAR(255) NOT NULL,
    monto DECIMAL(18, 2) NOT NULL,
    fecha_inicio DATE,
    fecha_fin DATE,
    estado VARCHAR(20) CHECK (estado IN ('en_progreso', 'completado', 'cancelado'))
);

-- Tabla PRESUPUESTOS
CREATE TABLE IF NOT EXISTS presupuestos (
    id_presupuesto SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
    id_categoria INTEGER NOT NULL REFERENCES categorias(id_categoria),
    nombre VARCHAR(100) NOT NULL,
    monto_limite DECIMAL(18, 2) NOT NULL,
    periodo VARCHAR(20) CHECK (periodo IN ('semanal', 'mensual', 'anual')),
    fecha_inicio DATE NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    moneda VARCHAR(3) DEFAULT 'ARS' REFERENCES monedas(codigo_moneda)
);

-- Tabla ALERTAS
CREATE TABLE IF NOT EXISTS alertas (
    id_alerta SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
    tipo VARCHAR(50) CHECK (tipo IN ('presupuesto', 'objetivo', 'gasto_inusual')),
    mensaje VARCHAR(500) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leida BOOLEAN DEFAULT FALSE
);

-- Tabla SESIONES_CHAT
CREATE TABLE IF NOT EXISTS sesiones_chat (
    id_sesion SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
    titulo VARCHAR(100),
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_actividad TIMESTAMP
);

-- Tabla CHATS
CREATE TABLE IF NOT EXISTS chats (
    id_chat SERIAL PRIMARY KEY,
    id_sesion INTEGER NOT NULL REFERENCES sesiones_chat(id_sesion),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mensaje_usuario TEXT NOT NULL,
    respuesta_ia TEXT
);

-- Tabla REPORTES
CREATE TABLE IF NOT EXISTS reportes (
    id_reporte SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
    tipo VARCHAR(50) CHECK (tipo IN ('mensual', 'anual', 'por_categoria')),
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archivo VARCHAR(500),
    parametros TEXT
);

-- Tabla LOGS_ACTIVIDAD
CREATE TABLE IF NOT EXISTS logs_actividad (
    id_log SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo_evento VARCHAR(100) NOT NULL,
    descripcion VARCHAR(1000),
    metadatos TEXT
);

-- ##############################################
-- ## FASE 2: INSERCIÓN DE DATOS INICIALES     ##
-- ##############################################

-- Insertar monedas principales
INSERT INTO monedas (codigo_moneda, nombre, simbolo, activa) VALUES
('ARS', 'Peso Argentino', '$', TRUE),
('USD', 'Dólar Estadounidense', 'US$', TRUE),
('EUR', 'Euro', '€', TRUE),
('BRL', 'Real Brasileño', 'R$', TRUE),
('CLP', 'Peso Chileno', 'CLP$', TRUE)
ON CONFLICT (codigo_moneda) DO NOTHING;

-- Insertar categorías predeterminadas (GASTOS)
INSERT INTO categorias (nombre, descripcion, es_personalizada, id_usuario, icono, color, activa) VALUES
('Comida', 'Gastos en supermercados y restaurantes', FALSE, NULL, 'fast-food', '#FFC107', TRUE),
('Transporte', 'Gastos en transporte público, combustible, etc.', FALSE, NULL, 'train', '#03A9F4', TRUE),
('Vivienda', 'Alquiler, servicios, expensas', FALSE, NULL, 'home', '#4CAF50', TRUE),
('Entretenimiento', 'Cine, salidas, streaming', FALSE, NULL, 'game-controller', '#E91E63', TRUE),
('Salud', 'Gastos médicos, farmacia', FALSE, NULL, 'medical', '#F44336', TRUE),
('Educación', 'Cursos, libros, materiales', FALSE, NULL, 'school', '#9C27B0', TRUE),
('Ropa', 'Vestimenta y accesorios', FALSE, NULL, 'shirt', '#FF9800', TRUE),
('Tecnología', 'Electrónica, software, gadgets', FALSE, NULL, 'laptop', '#607D8B', TRUE)
ON CONFLICT DO NOTHING;

-- Insertar categorías predeterminadas (INGRESOS)
INSERT INTO categorias (nombre, descripcion, es_personalizada, id_usuario, icono, color, activa) VALUES
('Salario', 'Ingresos por trabajo en relación de dependencia', FALSE, NULL, 'briefcase', '#4CAF50', TRUE),
('Freelance', 'Ingresos por trabajos independientes', FALSE, NULL, 'laptop', '#2196F3', TRUE),
('Inversiones', 'Dividendos, intereses, ganancias de capital', FALSE, NULL, 'trending-up', '#FF9800', TRUE),
('Ventas', 'Ingresos por venta de productos o servicios', FALSE, NULL, 'shopping-bag', '#9C27B0', TRUE),
('Regalos/Bonos', 'Regalos monetarios, bonificaciones, premios', FALSE, NULL, 'gift', '#E91E63', TRUE),
('Otros Ingresos', 'Ingresos varios no categorizados', FALSE, NULL, 'plus-circle', '#607D8B', TRUE)
ON CONFLICT DO NOTHING;

-- ##############################################
-- ## FASE 3: CREACIÓN DE ÍNDICES              ##
-- ##############################################

-- Índices para GASTOS
CREATE INDEX IF NOT EXISTS idx_gastos_usuario_fecha ON gastos (id_usuario, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos (id_categoria);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_gastos_estado ON gastos (estado);

-- Índices para INGRESOS
CREATE INDEX IF NOT EXISTS idx_ingresos_usuario_fecha ON ingresos (id_usuario, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_ingresos_tipo_estado ON ingresos (tipo, estado);
CREATE INDEX IF NOT EXISTS idx_ingresos_fecha_monto ON ingresos (fecha, monto DESC);

-- Índices para PRESUPUESTOS
CREATE INDEX IF NOT EXISTS idx_presupuestos_usuario ON presupuestos (id_usuario);
CREATE INDEX IF NOT EXISTS idx_presupuestos_categoria ON presupuestos (id_categoria);

-- Índices para ALERTAS
CREATE INDEX IF NOT EXISTS idx_alertas_usuario_leida ON alertas (id_usuario, leida);

-- Índices para SESIONES_CHAT
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones_chat (id_usuario);

-- ##############################################
-- ## DATOS DE EJEMPLO (OPCIONAL)              ##
-- ##############################################

-- Insertar usuario de ejemplo (solo si no existe)
INSERT INTO usuarios (nombre, email, usuario, contraseña, fecha_creacion, preferencias, ultimo_login, estado)
VALUES ('Usuario Demo', 'demo@analizadorfinanciero.com', 'demo', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIj.dWZ0Om', CURRENT_TIMESTAMP, '{"tema": "claro", "notificaciones": true}', CURRENT_TIMESTAMP, 'activo')
ON CONFLICT (email) DO NOTHING;

-- Fin del script
SELECT 'Base de datos inicializada correctamente' AS status;

