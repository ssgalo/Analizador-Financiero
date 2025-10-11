-- ========= CREACIÓN DE TABLAS =========

CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    preferencias TEXT NULL,
    ultimo_login TIMESTAMP NULL,
    estado VARCHAR(20) CHECK (estado IN ('activo', 'inactivo', 'pendiente'))
);

CREATE TABLE monedas (
    codigo_moneda VARCHAR(3) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    simbolo VARCHAR(5) NOT NULL,
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
    id_categoria SERIAL PRIMARY KEY,
    id_usuario INT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) NULL,
    es_personalizada BOOLEAN NOT NULL DEFAULT FALSE,
    icono VARCHAR(50) NULL,
    color VARCHAR(20) NULL,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE archivos_importados (
    id_archivo_importado SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    tipo VARCHAR(20) CHECK (tipo IN ('pdf', 'imagen', 'csv')),
    ruta_archivo VARCHAR(500) NOT NULL,
    fecha_importacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_procesamiento VARCHAR(20) CHECK (estado_procesamiento IN ('pendiente', 'procesando', 'procesado', 'error')),
    resultado_ocr TEXT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE gastos (
    id_gasto SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_categoria INT NOT NULL,
    id_archivo_importado INT NULL,
    fecha DATE NOT NULL,
    monto DECIMAL(18, 2) NOT NULL,
    descripcion VARCHAR(255) NULL,
    comercio VARCHAR(100) NULL,
    fuente VARCHAR(20) CHECK (fuente IN ('manual', 'importado', 'integracion')),
    estado VARCHAR(20) CHECK (estado IN ('confirmado', 'pendiente', 'eliminado')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP NULL,
    categoria_ia_sugerida VARCHAR(100) NULL,
    confianza_ia DECIMAL(5, 4) NULL,
    moneda VARCHAR(3) DEFAULT 'ARS',
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria),
    FOREIGN KEY (id_archivo_importado) REFERENCES archivos_importados(id_archivo_importado),
    FOREIGN KEY (moneda) REFERENCES monedas(codigo_moneda)
);

CREATE TABLE ingresos (
    id_ingreso SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_categoria INT NULL,
    fecha DATE NOT NULL,
    monto DECIMAL(18, 2) NOT NULL,
    descripcion VARCHAR(255) NULL,
    fuente VARCHAR(100) NULL,
    tipo VARCHAR(30) CHECK (tipo IN ('salario', 'freelance', 'inversion', 'venta', 'regalo', 'otro')),
    recurrente BOOLEAN DEFAULT FALSE,
    frecuencia VARCHAR(20) CHECK (frecuencia IN ('semanal', 'quincenal', 'mensual', 'trimestral', 'anual', 'unica')),
    estado VARCHAR(20) DEFAULT 'confirmado' CHECK (estado IN ('confirmado', 'pendiente', 'cancelado')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    moneda VARCHAR(3) DEFAULT 'ARS',
    notas VARCHAR(500) NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria),
    FOREIGN KEY (moneda) REFERENCES monedas(codigo_moneda)
);

CREATE TABLE alertas (
    id_alerta SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    tipo VARCHAR(50) CHECK (tipo IN ('presupuesto', 'objetivo', 'gasto_inusual')),
    mensaje VARCHAR(500) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leida BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE sesiones_chat (
    id_sesion SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    titulo VARCHAR(100) NULL,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_actividad TIMESTAMP NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE chats (
    id_chat SERIAL PRIMARY KEY,
    id_sesion INT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mensaje_usuario TEXT NOT NULL,
    respuesta_ia TEXT NULL,
    FOREIGN KEY (id_sesion) REFERENCES sesiones_chat(id_sesion)
);

CREATE TABLE integraciones (
    id_integracion SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    tipo VARCHAR(50) CHECK (tipo IN ('mercadopago', 'uala', 'banco_galicia')),
    estado VARCHAR(20) CHECK (estado IN ('activa', 'inactiva', 'error')),
    fecha_vinculacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    datos_credenciales TEXT NULL,
    ultima_sincronizacion TIMESTAMP NULL,
    proxima_sincronizacion TIMESTAMP NULL,
    config_sincronizacion TEXT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE logs_actividad (
    id_log SERIAL PRIMARY KEY,
    id_usuario INT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo_evento VARCHAR(100) NOT NULL,
    descripcion VARCHAR(1000) NULL,
    metadatos TEXT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE objetivos_financieros (
    id_objetivo SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    monto DECIMAL(18, 2) NOT NULL,
    fecha_inicio DATE NULL,
    fecha_fin DATE NULL,
    estado VARCHAR(20) CHECK (estado IN ('en_progreso', 'completado', 'cancelado')),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE presupuestos (
    id_presupuesto SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_categoria INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    monto_limite DECIMAL(18, 2) NOT NULL,
    periodo VARCHAR(20) CHECK (periodo IN ('semanal', 'mensual', 'anual')),
    fecha_inicio DATE NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    moneda VARCHAR(3) DEFAULT 'ARS',
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria),
    FOREIGN KEY (moneda) REFERENCES monedas(codigo_moneda)
);

CREATE TABLE reportes (
    id_reporte SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    tipo VARCHAR(50) CHECK (tipo IN ('mensual', 'anual', 'por_categoria')),
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archivo VARCHAR(500) NULL,
    parametros TEXT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- ========= CONSTRAINTS ADICIONALES (UNIQUE) =========
ALTER TABLE usuarios ADD CONSTRAINT uq_usuarios_email UNIQUE (email);
ALTER TABLE usuarios ADD CONSTRAINT uq_usuarios_usuario UNIQUE (usuario);


-- ========= INSERCIÓN DE DATOS =========!

INSERT INTO usuarios (id_usuario, nombre, email, usuario, contraseña, fecha_creacion, preferencias, ultimo_login, estado) VALUES
(1, 'Juan Pérez', 'juan.perez@example.com', 'jperez', 'hash_de_contraseña_segura', '2025-09-26 20:11:32.170000', '{"tema": "oscuro", "notificaciones": true}', '2025-09-26 20:11:32.170000', 'activo'),
(2, 'Santiago Galo', 'santi@gmail.com', 'sgalo', 'hola1234', '2025-09-28 20:42:20.113333', NULL, NULL, 'activo'),
(3, 'Santiago Galo', 'santiago@gmail.com', 'sgalo1', '$argon2id$v=19$m=102400,t=2,p=8$eM+5FwJAiLGWkjJmDKG0dg$uI0xZBZ+IaulFK1QhLtJOu0SMJ/Bo1Seh09isMJPXuc', '2025-09-28 22:39:25.326667', NULL, '2025-09-28 22:40:36.798687', 'activo'),
(4, 'Ezequiel Catania', 'eze@mail.com', 'ezecatania', '$argon2id$v=19$m=102400,t=2,p=8$F2KstZYyptSa0/p/j9Faqw$JVGCVtUcoUPXxebD+0W93+HkBT+MqYGCtM3The/rCI0', '2025-10-04 00:15:41.756667', NULL, '2025-10-10 20:04:14.786244', 'activo'),
(5, 'stefi', 'stefi@mail.com', 'stefi97', 'Domingo01', '2025-10-04 00:44:55.023333', NULL, NULL, 'activo'),
(6, 'Julian', 'jcastellana@unlam.com', 'jcastellana', '$argon2id$v=19$m=102400,t=2,p=8$H8PYey+F0Frrfa9Vak2JcQ$y3QcRp3hDM0UKg5c8V37bqzwLkOYh0KkTOqB0Ev6em0', '2025-10-04 00:46:01.986667', NULL, '2025-10-10 20:10:06.337565', 'activo'),
(7, 'NicoM', 'nicom@mail.com', 'nicom', 'Nico1234#', '2025-10-04 00:49:30.983333', NULL, NULL, 'activo'),
(8, 'nicom2', 'nicom2@mail.com', 'nicom2', '$argon2id$v=19$m=102400,t=2,p=8$wriXsjZmLMVYy9mbM+b8Hw$PsPjBUNViuGC1fxSqd5vVwAZ6fvqGw536B1toHM6+Vw', '2025-10-04 00:58:08.926667', NULL, '2025-10-10 00:18:16.383304', 'activo');

INSERT INTO monedas (codigo_moneda, nombre, simbolo, activa, fecha_creacion) VALUES
('ARS', 'Peso Argentino', '$', true, '2025-09-28 21:12:02.370000'),
('BRL', 'Real Brasileño', 'R$', true, '2025-09-28 21:12:02.370000'),
('CLP', 'Peso Chileno', 'CLP$', true, '2025-09-28 21:12:02.370000'),
('EUR', 'Euro', '€', true, '2025-09-28 21:12:02.370000'),
('USD', 'Dólar Estadounidense', 'US$', true, '2025-09-28 21:12:02.370000');

INSERT INTO categorias (id_categoria, id_usuario, nombre, descripcion, es_personalizada, icono, color, activa) VALUES
(1, NULL, 'Comida', 'Gastos en supermercados y restaurantes', false, 'fast-food', '#FFC107', true),
(2, NULL, 'Transporte', 'Gastos en transporte público, combustible, etc.', false, 'train', '#03A9F4', true),
(3, NULL, 'Vivienda', 'Alquiler, servicios, expensas', false, 'home', '#4CAF50', true),
(4, NULL, 'Entretenimiento', 'Cine, salidas, streaming', false, 'game-controller', '#E91E63', true),
(5, 1, 'Viajes', 'Gastos relacionados a viajes y vacaciones', true, 'airplane', '#FF5722', true),
(6, 2, 'Regalos', 'Gastos relacionados a regalos', false, 'string', 'string', true),
(7, NULL, 'Salario', 'Ingresos por trabajo en relación de dependencia', false, 'briefcase', '#4CAF50', true),
(8, NULL, 'Freelance', 'Ingresos por trabajos independientes', false, 'laptop', '#2196F3', true),
(9, NULL, 'Inversiones', 'Dividendos, intereses, ganancias de capital', false, 'trending-up', '#FF9800', true),
(10, NULL, 'Ventas', 'Ingresos por venta de productos o servicios', false, 'shopping-bag', '#9C27B0', true),
(11, NULL, 'Regalos/Bonos', 'Regalos monetarios, bonificaciones, premios', false, 'gift', '#E91E63', true),
(12, NULL, 'Otros Ingresos', 'Ingresos varios no categorizados', false, 'plus-circle', '#607D8B', true);

INSERT INTO archivos_importados (id_archivo_importado, id_usuario, tipo, ruta_archivo, fecha_importacion, estado_procesamiento, resultado_ocr) VALUES
(1, 1, 'pdf', '/uploads/resumen_tarjeta_092025.pdf', '2025-09-26 20:11:32.196667', 'procesado', '{"lineas": ["compra COTO...", "pago NETFLIX..."]}');

INSERT INTO gastos (id_gasto, id_usuario, id_categoria, id_archivo_importado, fecha, monto, descripcion, comercio, fuente, estado, fecha_creacion, fecha_modificacion, categoria_ia_sugerida, confianza_ia, moneda) VALUES
(1, 1, 1, NULL, '2025-09-22', 15800.50, 'Compra semanal', 'Supermercado COTO', 'manual', 'confirmado', '2025-09-26 20:11:32.206667', '2025-09-26 20:11:32.206667', 'Comida', 0.9500, 'ARS'),
(2, 1, 2, NULL, '2025-09-23', 950.00, 'Carga SUBE', 'Kiosco Estación', 'manual', 'confirmado', '2025-09-26 20:11:32.206667', '2025-09-26 20:11:32.206667', 'Transporte', 0.9900, 'ARS'),
(3, 1, 4, NULL, '2025-09-24', 3500.00, 'Entradas de cine', 'Hoyts Cinema', 'manual', 'pendiente', '2025-09-26 20:11:32.206667', '2025-09-26 20:11:32.206667', 'Entretenimiento', 0.8800, 'ARS'),
(4, 1, 1, 1, '2025-09-25', 12500.75, 'Cena con amigos', 'Restaurante La Parrilla', 'importado', 'confirmado', '2025-09-26 20:11:32.206667', '2025-09-26 20:11:32.206667', 'Comida', 0.9200, 'ARS'),
(9, 4, 1, NULL, '2025-10-06', 700.00, 'Alfajor', 'Supermercado SJ2', 'manual', 'confirmado', '2025-10-06 21:01:50.513333', '2025-10-06 21:02:01.246667', NULL, NULL, 'ARS'),
(10, 8, 3, NULL, '2025-10-08', 20000.00, 'compra test del super', 'supermercado test', 'manual', 'confirmado', '2025-10-08 23:53:24.123333', '2025-10-08 23:53:24.123333', NULL, NULL, 'ARS'),
(11, 4, 1, NULL, '2025-10-10', 12345.00, 'Asado', 'Coto', 'manual', 'confirmado', '2025-10-10 19:36:21.713333', '2025-10-10 19:36:21.713333', NULL, NULL, 'ARS');

INSERT INTO ingresos (id_ingreso, id_usuario, id_categoria, fecha, monto, descripcion, fuente, tipo, recurrente, frecuencia, estado, fecha_creacion, fecha_modificacion, moneda, notas) VALUES
(1, 1, 7, '2025-09-01', 850000.00, 'Sueldo Septiembre 2025', 'Empresa ABC SA', 'salario', true, 'mensual', 'confirmado', '2025-10-06 21:06:40.240000', '2025-10-06 21:06:40.240000', 'ARS', 'Sueldo neto depositado'),
(2, 1, 8, '2025-09-15', 125000.00, 'Proyecto web para cliente', 'Cliente XYZ', 'freelance', false, 'unica', 'confirmado', '2025-10-06 21:06:40.240000', '2025-10-06 21:06:40.240000', 'ARS', 'Desarrollo de sitio web'),
(3, 1, 7, '2025-09-30', 45000.00, 'Presentismo Septiembre', 'Empresa ABC SA', 'salario', true, 'mensual', 'confirmado', '2025-10-06 21:06:40.240000', '2025-10-06 21:06:40.240000', 'ARS', 'Bono por asistencia perfecta'),
(4, 1, 8, '2025-10-05', 200000.00, 'Consultoría IT', 'Startup DEF', 'freelance', false, 'unica', 'pendiente', '2025-10-06 21:06:40.240000', '2025-10-06 21:06:40.240000', 'ARS', 'Pendiente de confirmación de pago'),
(5, 4, 7, '2025-10-01', 950000.00, 'Sueldo Octubre 2025', 'TechCorp Solutions', 'salario', true, 'mensual', 'confirmado', '2025-10-06 21:20:06.733333', '2025-10-06 21:20:06.733333', 'ARS', 'Sueldo base + zona desfavorable'),
(6, 4, 8, '2025-10-03', 180000.00, 'Desarrollo app móvil', 'StartupTech', 'freelance', false, 'unica', 'confirmado', '2025-10-06 21:20:06.733333', '2025-10-06 21:20:06.733333', 'ARS', 'Primera fase del proyecto completada'),
(7, 4, 8, '2025-10-12', 75000.00, 'Consultoría desarrollo web', 'Pyme Local', 'freelance', false, 'unica', 'confirmado', '2025-10-06 21:20:06.733333', '2025-10-06 21:20:06.733333', 'ARS', 'Asesoramiento técnico 8 horas'),
(8, 4, 8, '2025-10-25', 120000.00, 'Mantenimiento sistema', 'Cliente Recurrente', 'freelance', true, 'mensual', 'pendiente', '2025-10-06 21:20:06.733333', '2025-10-06 21:20:06.733333', 'ARS', 'Pendiente transferencia bancaria'),
(9, 4, 9, '2025-10-05', 25000.00, 'Dividendos acciones GGAL', 'Grupo Galicia', 'inversion', false, 'unica', 'confirmado', '2025-10-06 21:20:06.733333', '2025-10-06 21:20:06.733333', 'ARS', 'Dividendos trimestrales'),
(10, 4, 9, '2025-10-15', 18500.00, 'Intereses plazo fijo', 'Banco Nación', 'inversion', true, 'mensual', 'confirmado', '2025-10-06 21:20:06.733333', '2025-10-06 21:20:06.733333', 'ARS', 'PF 30 días renovado automáticamente'),
(11, 4, 10, '2025-10-08', 45000.00, 'Venta notebook usada', 'Mercado Libre', 'venta', false, 'unica', 'confirmado', '2025-10-06 21:20:06.733333', '2025-10-06 21:20:06.733333', 'ARS', 'Lenovo ThinkPad E14 - usado 2 años'),
(12, 4, 10, '2025-10-20', 35000.00, 'Venta curso programación', 'Udemy', 'venta', false, 'unica', 'confirmado', '2025-10-06 21:20:06.733333', '2025-10-06 21:20:06.733333', 'USD', 'Regalías curso Python para principiantes'),
(13, 4, 11, '2025-10-10', 80000.00, 'Bono productividad Q3', 'TechCorp Solutions', 'regalo', false, 'unica', 'confirmado', '2025-10-06 21:20:06.733333', '2025-10-06 21:20:06.733333', 'ARS', 'Bono trimestral por cumplimiento objetivos'),
(14, 4, 12, '2025-10-28', 15000.00, 'Devolución impuestos', 'AFIP', 'otro', false, 'unica', 'confirmado', '2025-10-06 21:20:06.733333', '2025-10-06 21:20:06.733333', 'ARS', 'Devolución retenciones Ganancias 2024');

INSERT INTO alertas (id_alerta, id_usuario, tipo, mensaje, fecha_creacion, leida) VALUES
(1, 1, 'presupuesto', 'Has superado el 80% de tu presupuesto de Comida para este mes.', '2025-09-26 20:11:32.223333', false);

INSERT INTO sesiones_chat (id_sesion, id_usuario, titulo, fecha_inicio, fecha_ultima_actividad) VALUES
(1, 1, 'Gastos de Septiembre', '2025-09-26 20:11:32.230000', '2025-09-26 20:11:32.230000');

INSERT INTO chats (id_chat, id_sesion, fecha, mensaje_usuario, respuesta_ia) VALUES
(1, 1, '2025-09-26 20:11:32.233333', '¿Cuánto gasté en supermercados este mes?', 'Este mes has gastado $28,301.25 en la categoría Comida.');

INSERT INTO objetivos_financieros (id_objetivo, id_usuario, descripcion, monto, fecha_inicio, fecha_fin, estado) VALUES
(1, 1, 'Ahorrar para vacaciones de verano', 250000.00, '2025-09-01', '2025-12-20', 'en_progreso');

INSERT INTO presupuestos (id_presupuesto, id_usuario, id_categoria, nombre, monto_limite, periodo, fecha_inicio, activo, moneda) VALUES
(1, 1, 1, 'Presupuesto mensual de Supermercado', 80000.00, 'mensual', '2025-09-01', true, 'ARS');


-- ========= ACTUALIZACIÓN DE SECUENCIAS (MUY IMPORTANTE) =========
SELECT setval('usuarios_id_usuario_seq', (SELECT MAX(id_usuario) FROM usuarios));
SELECT setval('categorias_id_categoria_seq', (SELECT MAX(id_categoria) FROM categorias));
SELECT setval('archivos_importados_id_archivo_importado_seq', (SELECT MAX(id_archivo_importado) FROM archivos_importados));
SELECT setval('gastos_id_gasto_seq', (SELECT MAX(id_gasto) FROM gastos));
SELECT setval('ingresos_id_ingreso_seq', (SELECT MAX(id_ingreso) FROM ingresos));
SELECT setval('alertas_id_alerta_seq', (SELECT MAX(id_alerta) FROM alertas));
SELECT setval('sesiones_chat_id_sesion_seq', (SELECT MAX(id_sesion) FROM sesiones_chat));
SELECT setval('chats_id_chat_seq', (SELECT MAX(id_chat) FROM chats));
SELECT setval('objetivos_financieros_id_objetivo_seq', (SELECT MAX(id_objetivo) FROM objetivos_financieros));
SELECT setval('presupuestos_id_presupuesto_seq', (SELECT MAX(id_presupuesto) FROM presupuestos));