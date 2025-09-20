-- Tabla: usuarios
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    contraseña_hash VARCHAR(255),
    fecha_creacion TIMESTAMP,
    preferencias TEXT,
    ultimo_login TIMESTAMP,
    estado VARCHAR(20)
);

INSERT INTO usuarios (nombre, email, contraseña_hash, fecha_creacion, preferencias, ultimo_login, estado) VALUES
('Juan Pérez', 'juan@mail.com', 'hash1', NOW(), '{"tema":"oscuro"}', NOW(), 'activo'),
('Ana López', 'ana@mail.com', 'hash2', NOW(), '{"tema":"claro"}', NOW(), 'activo');

-- Tabla: categorias
CREATE TABLE categorias (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(50),
    descripcion TEXT,
    es_personalizada BOOLEAN,
    id_usuario INTEGER REFERENCES usuarios(id_usuario)
);

INSERT INTO categorias (nombre, descripcion, es_personalizada, id_usuario) VALUES
('Supermercado', 'Compras en supermercados', FALSE, NULL),
('Transporte', 'Gastos de transporte', FALSE, NULL),
('Comida rápida', 'Pedidos de comida', TRUE, 1);

-- Tabla: archivos_importados
CREATE TABLE archivos_importados (
    id_archivo_importado SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    tipo VARCHAR(20),
    ruta_archivo VARCHAR(255),
    fecha_importacion TIMESTAMP,
    estado_procesamiento VARCHAR(20),
    resultado_ocr TEXT
);

INSERT INTO archivos_importados (id_usuario, tipo, ruta_archivo, fecha_importacion, estado_procesamiento, resultado_ocr) VALUES
(1, 'PDF', '/archivos/recibo1.pdf', NOW(), 'procesado', '{"monto":1200,"comercio":"Supermercado"}'),
(2, 'imagen', '/archivos/ticket2.jpg', NOW(), 'pendiente', NULL);

-- Tabla: gastos
CREATE TABLE gastos (
    id_gasto SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    fecha DATE,
    monto NUMERIC(12,2),
    descripcion TEXT,
    comercio VARCHAR(100),
    id_categoria INTEGER REFERENCES categorias(id_categoria),
    fuente VARCHAR(30),
    id_archivo_importado INTEGER REFERENCES archivos_importados(id_archivo_importado),
    estado VARCHAR(20),
    fecha_creacion TIMESTAMP,
    fecha_modificacion TIMESTAMP
);

INSERT INTO gastos (id_usuario, fecha, monto, descripcion, comercio, id_categoria, fuente, id_archivo_importado, estado, fecha_creacion, fecha_modificacion) VALUES
(1, '2025-09-01', 1200.00, 'Compra mensual', 'Supermercado', 1, 'PDF', 1, 'activo', NOW(), NOW()),
(2, '2025-09-02', 500.00, 'Taxi al aeropuerto', 'Taxi BA', 2, 'manual', NULL, 'activo', NOW(), NOW());

-- Tabla: integraciones
CREATE TABLE integraciones (
    id_integracion SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    tipo VARCHAR(30),
    estado VARCHAR(20),
    fecha_vinculacion TIMESTAMP,
    datos_credenciales TEXT
);

INSERT INTO integraciones (id_usuario, tipo, estado, fecha_vinculacion, datos_credenciales) VALUES
(1, 'MercadoPago', 'activa', NOW(), '{"token":"abc123"}');

-- Tabla: objetivos_financieros
CREATE TABLE objetivos_financieros (
    id_objetivo SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    descripcion TEXT,
    monto NUMERIC(12,2),
    fecha_inicio DATE,
    fecha_fin DATE,
    estado VARCHAR(20)
);

INSERT INTO objetivos_financieros (id_usuario, descripcion, monto, fecha_inicio, fecha_fin, estado) VALUES
(1, 'Ahorro vacaciones', 50000, '2025-01-01', '2025-12-31', 'en progreso');

-- Tabla: alertas
CREATE TABLE alertas (
    id_alerta SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    tipo VARCHAR(30),
    mensaje TEXT,
    fecha_creacion TIMESTAMP,
    leida BOOLEAN
);

INSERT INTO alertas (id_usuario, tipo, mensaje, fecha_creacion, leida) VALUES
(1, 'presupuesto', 'Superaste el presupuesto de supermercado', NOW(), FALSE);

-- Tabla: notificaciones
CREATE TABLE notificaciones (
    id_notificacion SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    mensaje TEXT,
    fecha_envio TIMESTAMP,
    leida BOOLEAN
);

INSERT INTO notificaciones (id_usuario, mensaje, fecha_envio, leida) VALUES
(2, 'Nuevo objetivo financiero creado', NOW(), FALSE);

-- Tabla: reportes
CREATE TABLE reportes (
    id_reporte SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    tipo VARCHAR(30),
    fecha_generacion TIMESTAMP,
    archivo VARCHAR(255)
);

INSERT INTO reportes (id_usuario, tipo, fecha_generacion, archivo) VALUES
(1, 'mensual', NOW(), '/reportes/reporte1.pdf');

-- Tabla: chats
CREATE TABLE chats (
    id_chat SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    fecha TIMESTAMP,
    mensaje_usuario TEXT,
    respuesta_ia TEXT
);

INSERT INTO chats (id_usuario, fecha, mensaje_usuario, respuesta_ia) VALUES
(1, NOW(), '¿Cuánto gasté en supermercados?', 'Gastaste $1200 en supermercados este mes.');

-- Tabla: logs_actividad
CREATE TABLE logs_actividad (
    id_log SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    fecha TIMESTAMP,
    tipo_evento VARCHAR(50),
    descripcion TEXT
);

INSERT INTO logs_actividad (id_usuario, fecha, tipo_evento, descripcion) VALUES
(1, NOW(), 'login', 'Inicio de sesión exitoso');
