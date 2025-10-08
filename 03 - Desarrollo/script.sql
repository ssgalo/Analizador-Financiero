-- ##############################################
-- ## FASE 1: CREACIÓN DE TABLAS               ##
-- ##############################################
-- Se crean las tablas sin relaciones primero

PRINT 'Creando la tabla USUARIOS...';
CREATE TABLE USUARIOS (
    id_usuario INT PRIMARY KEY IDENTITY(1,1),
    nombre NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL UNIQUE,
    usuario NVARCHAR(50) NOT NULL UNIQUE,
    contraseña NVARCHAR(255) NOT NULL,
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    preferencias NVARCHAR(MAX),
    ultimo_login DATETIME2,
    estado NVARCHAR(20) CHECK (estado IN ('activo', 'inactivo', 'pendiente'))
);

PRINT 'Creando la tabla CATEGORIAS...';
CREATE TABLE CATEGORIAS (
    id_categoria INT PRIMARY KEY IDENTITY(1,1),
    id_usuario INT, -- FK a USUARIOS (puede ser NULL para categorías globales)
    nombre NVARCHAR(100) NOT NULL,
    descripcion NVARCHAR(255),
    es_personalizada BIT NOT NULL DEFAULT 0,
    icono NVARCHAR(50),
    color NVARCHAR(20),
    activa BIT NOT NULL DEFAULT 1
);

PRINT 'Creando la tabla ARCHIVOS_IMPORTADOS...';
CREATE TABLE ARCHIVOS_IMPORTADOS (
    id_archivo_importado INT PRIMARY KEY IDENTITY(1,1),
    id_usuario INT NOT NULL, -- FK a USUARIOS
    tipo NVARCHAR(20) CHECK (tipo IN ('pdf', 'imagen', 'csv')),
    ruta_archivo NVARCHAR(500) NOT NULL,
    fecha_importacion DATETIME2 DEFAULT GETDATE(),
    estado_procesamiento NVARCHAR(20) CHECK (estado_procesamiento IN ('pendiente', 'procesando', 'procesado', 'error')),
    resultado_ocr NVARCHAR(MAX)
);

PRINT 'Creando la tabla GASTOS...';
CREATE TABLE GASTOS (
    id_gasto INT PRIMARY KEY IDENTITY(1,1),
    id_usuario INT NOT NULL, -- FK a USUARIOS
    id_categoria INT NOT NULL, -- FK a CATEGORIAS
    id_archivo_importado INT, -- FK a ARCHIVOS_IMPORTADOS (puede ser NULL)
    fecha DATE NOT NULL,
    monto DECIMAL(18, 2) NOT NULL,
    descripcion NVARCHAR(255),
    comercio NVARCHAR(100),
    fuente NVARCHAR(20) CHECK (fuente IN ('manual', 'importado', 'integracion')),
    estado NVARCHAR(20) CHECK (estado IN ('confirmado', 'pendiente', 'eliminado')),
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    fecha_modificacion DATETIME2,
    categoria_ia_sugerida NVARCHAR(100),
    confianza_ia DECIMAL(5, 4),
    moneda NVARCHAR(10) DEFAULT 'ARS'
);

PRINT 'Creando la tabla INTEGRACIONES...';
CREATE TABLE INTEGRACIONES (
    id_integracion INT PRIMARY KEY IDENTITY(1,1),
    id_usuario INT NOT NULL, -- FK a USUARIOS
    tipo NVARCHAR(50) CHECK (tipo IN ('mercadopago', 'uala', 'banco_galicia')),
    estado NVARCHAR(20) CHECK (estado IN ('activa', 'inactiva', 'error')),
    fecha_vinculacion DATETIME2 DEFAULT GETDATE(),
    datos_credenciales NVARCHAR(MAX), -- Considerar cifrado para esto
    ultima_sincronizacion DATETIME2,
    proxima_sincronizacion DATETIME2,
    config_sincronizacion NVARCHAR(MAX)
);

PRINT 'Creando la tabla OBJETIVOS_FINANCIEROS...';
CREATE TABLE OBJETIVOS_FINANCIEROS (
    id_objetivo INT PRIMARY KEY IDENTITY(1,1),
    id_usuario INT NOT NULL, -- FK a USUARIOS
    descripcion NVARCHAR(255) NOT NULL,
    monto DECIMAL(18, 2) NOT NULL,
    fecha_inicio DATE,
    fecha_fin DATE,
    estado NVARCHAR(20) CHECK (estado IN ('en_progreso', 'completado', 'cancelado'))
);

PRINT 'Creando la tabla PRESUPUESTOS...';
CREATE TABLE PRESUPUESTOS (
    id_presupuesto INT PRIMARY KEY IDENTITY(1,1),
    id_usuario INT NOT NULL, -- FK a USUARIOS
    id_categoria INT NOT NULL, -- FK a CATEGORIAS
    nombre NVARCHAR(100) NOT NULL,
    monto_limite DECIMAL(18, 2) NOT NULL,
    periodo NVARCHAR(20) CHECK (periodo IN ('semanal', 'mensual', 'anual')),
    fecha_inicio DATE NOT NULL,
    activo BIT DEFAULT 1
);

PRINT 'Creando la tabla ALERTAS...';
CREATE TABLE ALERTAS (
    id_alerta INT PRIMARY KEY IDENTITY(1,1),
    id_usuario INT NOT NULL, -- FK a USUARIOS
    tipo NVARCHAR(50) CHECK (tipo IN ('presupuesto', 'objetivo', 'gasto_inusual')),
    mensaje NVARCHAR(500) NOT NULL,
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    leida BIT DEFAULT 0
);

PRINT 'Creando la tabla SESIONES_CHAT...';
CREATE TABLE SESIONES_CHAT (
    id_sesion INT PRIMARY KEY IDENTITY(1,1),
    id_usuario INT NOT NULL, -- FK a USUARIOS
    titulo NVARCHAR(100),
    fecha_inicio DATETIME2 DEFAULT GETDATE(),
    fecha_ultima_actividad DATETIME2
);

PRINT 'Creando la tabla CHATS...';
CREATE TABLE CHATS (
    id_chat INT PRIMARY KEY IDENTITY(1,1),
    id_sesion INT NOT NULL, -- FK a SESIONES_CHAT
    fecha DATETIME2 DEFAULT GETDATE(),
    mensaje_usuario NVARCHAR(MAX) NOT NULL,
    respuesta_ia NVARCHAR(MAX)
);

PRINT 'Creando la tabla REPORTES...';
CREATE TABLE REPORTES (
    id_reporte INT PRIMARY KEY IDENTITY(1,1),
    id_usuario INT NOT NULL, -- FK a USUARIOS
    tipo NVARCHAR(50) CHECK (tipo IN ('mensual', 'anual', 'por_categoria')),
    fecha_generacion DATETIME2 DEFAULT GETDATE(),
    archivo NVARCHAR(500),
    parametros NVARCHAR(MAX)
);

PRINT 'Creando la tabla LOGS_ACTIVIDAD...';
CREATE TABLE LOGS_ACTIVIDAD (
    id_log INT PRIMARY KEY IDENTITY(1,1),
    id_usuario INT, -- FK a USUARIOS (puede ser NULL para eventos del sistema)
    fecha DATETIME2 DEFAULT GETDATE(),
    tipo_evento NVARCHAR(100) NOT NULL,
    descripcion NVARCHAR(1000),
    metadatos NVARCHAR(MAX)
);

-- ##############################################
-- ## FASE 2: CREACIÓN DE RELACIONES (FOREIGN KEYS) ##
-- ##############################################

PRINT 'Creando relaciones (Foreign Keys)...';
ALTER TABLE CATEGORIAS ADD CONSTRAINT FK_CATEGORIAS_USUARIOS FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario);
ALTER TABLE ARCHIVOS_IMPORTADOS ADD CONSTRAINT FK_ARCHIVOS_USUARIOS FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario);
ALTER TABLE GASTOS ADD CONSTRAINT FK_GASTOS_USUARIOS FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario);
ALTER TABLE GASTOS ADD CONSTRAINT FK_GASTOS_CATEGORIAS FOREIGN KEY (id_categoria) REFERENCES CATEGORIAS(id_categoria);
ALTER TABLE GASTOS ADD CONSTRAINT FK_GASTOS_ARCHIVOS FOREIGN KEY (id_archivo_importado) REFERENCES ARCHIVOS_IMPORTADOS(id_archivo_importado);
ALTER TABLE INTEGRACIONES ADD CONSTRAINT FK_INTEGRACIONES_USUARIOS FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario);
ALTER TABLE OBJETIVOS_FINANCIEROS ADD CONSTRAINT FK_OBJETIVOS_USUARIOS FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario);
ALTER TABLE PRESUPUESTOS ADD CONSTRAINT FK_PRESUPUESTOS_USUARIOS FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario);
ALTER TABLE PRESUPUESTOS ADD CONSTRAINT FK_PRESUPUESTOS_CATEGORIAS FOREIGN KEY (id_categoria) REFERENCES CATEGORIAS(id_categoria);
ALTER TABLE ALERTAS ADD CONSTRAINT FK_ALERTAS_USUARIOS FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario);
ALTER TABLE SESIONES_CHAT ADD CONSTRAINT FK_SESIONES_USUARIOS FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario);
ALTER TABLE CHATS ADD CONSTRAINT FK_CHATS_SESIONES FOREIGN KEY (id_sesion) REFERENCES SESIONES_CHAT(id_sesion);
ALTER TABLE REPORTES ADD CONSTRAINT FK_REPORTES_USUARIOS FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario);
ALTER TABLE LOGS_ACTIVIDAD ADD CONSTRAINT FK_LOGS_USUARIOS FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario);

PRINT 'Tablas y relaciones creadas exitosamente.';

-- ##############################################
-- ## FASE 3: INSERCIÓN DE DATOS DE EJEMPLO    ##
-- ##############################################

PRINT 'Insertando datos de ejemplo...';

-- Primero, creamos un usuario de ejemplo.
-- El id_usuario será 1.
INSERT INTO USUARIOS (nombre, email, usuario, contraseña, fecha_creacion, preferencias, ultimo_login, estado)
VALUES ('Juan Pérez', 'juan.perez@example.com', 'jperez', 'hash_de_contraseña_segura', GETDATE(), '{"tema": "oscuro", "notificaciones": true}', GETDATE(), 'activo');
DECLARE @id_usuario_juan INT = SCOPE_IDENTITY();

-- Creamos categorías predeterminadas y una personalizada para Juan.
INSERT INTO CATEGORIAS (nombre, descripcion, es_personalizada, id_usuario, icono, color, activa)
VALUES
('Comida', 'Gastos en supermercados y restaurantes', 0, NULL, 'fast-food', '#FFC107', 1),
('Transporte', 'Gastos en transporte público, combustible, etc.', 0, NULL, 'train', '#03A9F4', 1),
('Vivienda', 'Alquiler, servicios, expensas', 0, NULL, 'home', '#4CAF50', 1),
('Entretenimiento', 'Cine, salidas, streaming', 0, NULL, 'game-controller', '#E91E63', 1),
('Viajes', 'Gastos relacionados a viajes y vacaciones', 1, @id_usuario_juan, 'airplane', '#FF5722', 1);

DECLARE @id_cat_comida INT = (SELECT id_categoria FROM CATEGORIAS WHERE nombre = 'Comida');
DECLARE @id_cat_transporte INT = (SELECT id_categoria FROM CATEGORIAS WHERE nombre = 'Transporte');
DECLARE @id_cat_entretenimiento INT = (SELECT id_categoria FROM CATEGORIAS WHERE nombre = 'Entretenimiento');

-- Creamos un archivo importado para Juan.
INSERT INTO ARCHIVOS_IMPORTADOS (id_usuario, tipo, ruta_archivo, fecha_importacion, estado_procesamiento, resultado_ocr)
VALUES (@id_usuario_juan, 'pdf', '/uploads/resumen_tarjeta_092025.pdf', GETDATE(), 'procesado', '{"lineas": ["compra COTO...", "pago NETFLIX..."]}');
DECLARE @id_archivo INT = SCOPE_IDENTITY();

-- Ahora, registramos varios gastos para Juan.
INSERT INTO GASTOS (id_usuario, id_categoria, fecha, monto, descripcion, comercio, fuente, id_archivo_importado, estado, fecha_creacion, fecha_modificacion, categoria_ia_sugerida, confianza_ia, moneda)
VALUES
(@id_usuario_juan, @id_cat_comida, '2025-09-22', 15800.50, 'Compra semanal', 'Supermercado COTO', 'manual', NULL, 'confirmado', GETDATE(), GETDATE(), 'Comida', 0.95, 'ARS'),
(@id_usuario_juan, @id_cat_transporte, '2025-09-23', 950.00, 'Carga SUBE', 'Kiosco Estación', 'manual', NULL, 'confirmado', GETDATE(), GETDATE(), 'Transporte', 0.99, 'ARS'),
(@id_usuario_juan, @id_cat_entretenimiento, '2025-09-24', 3500.00, 'Entradas de cine', 'Hoyts Cinema', 'manual', NULL, 'pendiente', GETDATE(), GETDATE(), 'Entretenimiento', 0.88, 'ARS'),
(@id_usuario_juan, @id_cat_comida, '2025-09-25', 12500.75, 'Cena con amigos', 'Restaurante La Parrilla', 'importado', @id_archivo, 'confirmado', GETDATE(), GETDATE(), 'Comida', 0.92, 'ARS');

-- Creamos un presupuesto mensual de "Comida" para Juan.
INSERT INTO PRESUPUESTOS (id_usuario, id_categoria, nombre, monto_limite, periodo, fecha_inicio, activo)
VALUES (@id_usuario_juan, @id_cat_comida, 'Presupuesto mensual de Supermercado', 80000.00, 'mensual', '2025-09-01', 1);

-- Creamos un objetivo financiero para Juan.
INSERT INTO OBJETIVOS_FINANCIEROS (id_usuario, descripcion, monto, fecha_inicio, fecha_fin, estado)
VALUES (@id_usuario_juan, 'Ahorrar para vacaciones de verano', 250000.00, '2025-09-01', '2025-12-20', 'en_progreso');

-- Creamos una alerta para Juan.
INSERT INTO ALERTAS (id_usuario, tipo, mensaje, fecha_creacion, leida)
VALUES (@id_usuario_juan, 'presupuesto', 'Has superado el 80% de tu presupuesto de Comida para este mes.', GETDATE(), 0);

-- Creamos una sesión de chat y un mensaje para Juan.
INSERT INTO SESIONES_CHAT (id_usuario, titulo, fecha_inicio, fecha_ultima_actividad)
VALUES (@id_usuario_juan, 'Gastos de Septiembre', GETDATE(), GETDATE());
DECLARE @id_sesion INT = SCOPE_IDENTITY();

-- Insertamos un chat en la sesión creada.
INSERT INTO CHATS (id_sesion, fecha, mensaje_usuario, respuesta_ia)
VALUES (@id_sesion, GETDATE(), '¿Cuánto gasté en supermercados este mes?', 'Este mes has gastado $28,301.25 en la categoría Comida.');

PRINT 'Datos de ejemplo insertados correctamente.';
PRINT 'Script finalizado.';

-- NUEVO

PRINT 'Creando la tabla MONEDAS...';
CREATE TABLE MONEDAS (
    codigo_moneda NVARCHAR(3) PRIMARY KEY, -- ISO 4217: ARS, USD, EUR
    nombre NVARCHAR(50) NOT NULL,          -- Peso Argentino, Dólar Estadounidense
    simbolo NVARCHAR(5) NOT NULL,          -- $, US$, €
    activa BIT DEFAULT 1,
    fecha_creacion DATETIME2 DEFAULT GETDATE()
);

-- Insertar monedas principales
INSERT INTO MONEDAS (codigo_moneda, nombre, simbolo, activa) VALUES
('ARS', 'Peso Argentino', '$', 1),
('USD', 'Dólar Estadounidense', 'US$', 1),
('EUR', 'Euro', '€', 1),
('BRL', 'Real Brasileño', 'R$', 1),
('CLP', 'Peso Chileno', 'CLP$', 1);

-- Cambiar las columnas moneda por Foreign Keys
ALTER TABLE GASTOS 
ALTER COLUMN moneda NVARCHAR(3);

ALTER TABLE PRESUPUESTOS 
ADD moneda NVARCHAR(3) DEFAULT 'ARS';

-- Agregar las Foreign Keys
ALTER TABLE GASTOS 
ADD CONSTRAINT FK_GASTOS_MONEDAS 
FOREIGN KEY (moneda) REFERENCES MONEDAS(codigo_moneda);

ALTER TABLE PRESUPUESTOS 
ADD CONSTRAINT FK_PRESUPUESTOS_MONEDAS 
FOREIGN KEY (moneda) REFERENCES MONEDAS(codigo_moneda);

-- ##############################################
-- ## CREACIÓN DE TABLA INGRESOS               ##
-- ##############################################

PRINT 'Creando la tabla INGRESOS...';
CREATE TABLE INGRESOS (
    id_ingreso INT PRIMARY KEY IDENTITY(1,1),
    id_usuario INT NOT NULL, -- FK a USUARIOS
    id_categoria INT, -- FK a CATEGORIAS (puede ser NULL para ingresos sin categoría)
    fecha DATE NOT NULL,
    monto DECIMAL(18, 2) NOT NULL,
    descripcion NVARCHAR(255),
    fuente NVARCHAR(100), -- Sueldo, Freelance, Inversiones, Venta, etc.
    tipo NVARCHAR(30) CHECK (tipo IN ('salario', 'freelance', 'inversion', 'venta', 'regalo', 'otro')),
    recurrente BIT DEFAULT 0, -- Si es un ingreso recurrente (ej: sueldo)
    frecuencia NVARCHAR(20) CHECK (frecuencia IN ('semanal', 'quincenal', 'mensual', 'trimestral', 'anual', 'unica')),
    estado NVARCHAR(20) CHECK (estado IN ('confirmado', 'pendiente', 'cancelado')) DEFAULT 'confirmado',
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    fecha_modificacion DATETIME2 DEFAULT GETDATE(),
    moneda NVARCHAR(3) DEFAULT 'ARS',
    notas NVARCHAR(500) -- Campo adicional para observaciones
);

-- Agregar Foreign Keys
ALTER TABLE INGRESOS 
ADD CONSTRAINT FK_INGRESOS_USUARIOS 
FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario);

ALTER TABLE INGRESOS 
ADD CONSTRAINT FK_INGRESOS_CATEGORIAS 
FOREIGN KEY (id_categoria) REFERENCES CATEGORIAS(id_categoria);

ALTER TABLE INGRESOS 
ADD CONSTRAINT FK_INGRESOS_MONEDAS 
FOREIGN KEY (moneda) REFERENCES MONEDAS(codigo_moneda);

PRINT 'Tabla INGRESOS creada exitosamente.';

-- ##############################################
-- ## CATEGORÍAS ESPECÍFICAS PARA INGRESOS     ##
-- ##############################################

-- Insertar categorías predefinidas para ingresos
INSERT INTO CATEGORIAS (nombre, descripcion, es_personalizada, id_usuario, icono, color, activa)
VALUES
('Salario', 'Ingresos por trabajo en relación de dependencia', 0, NULL, 'briefcase', '#4CAF50', 1),
('Freelance', 'Ingresos por trabajos independientes', 0, NULL, 'laptop', '#2196F3', 1),
('Inversiones', 'Dividendos, intereses, ganancias de capital', 0, NULL, 'trending-up', '#FF9800', 1),
('Ventas', 'Ingresos por venta de productos o servicios', 0, NULL, 'shopping-bag', '#9C27B0', 1),
('Regalos/Bonos', 'Regalos monetarios, bonificaciones, premios', 0, NULL, 'gift', '#E91E63', 1),
('Otros Ingresos', 'Ingresos varios no categorizados', 0, NULL, 'plus-circle', '#607D8B', 1);

-- ##############################################
-- ## DATOS DE EJEMPLO PARA INGRESOS           ##
-- ##############################################

-- Obtener el ID de Juan (usuario de ejemplo)
DECLARE @id_usuario_juan INT = (SELECT id_usuario FROM USUARIOS WHERE email = 'juan.perez@example.com');
DECLARE @id_cat_salario INT = (SELECT id_categoria FROM CATEGORIAS WHERE nombre = 'Salario');
DECLARE @id_cat_freelance INT = (SELECT id_categoria FROM CATEGORIAS WHERE nombre = 'Freelance');

-- Insertar ingresos de ejemplo para Juan
INSERT INTO INGRESOS (id_usuario, id_categoria, fecha, monto, descripcion, fuente, tipo, recurrente, frecuencia, estado, moneda, notas)
VALUES
(@id_usuario_juan, @id_cat_salario, '2025-09-01', 850000.00, 'Sueldo Septiembre 2025', 'Empresa ABC SA', 'salario', 1, 'mensual', 'confirmado', 'ARS', 'Sueldo neto depositado'),
(@id_usuario_juan, @id_cat_freelance, '2025-09-15', 125000.00, 'Proyecto web para cliente', 'Cliente XYZ', 'freelance', 0, 'unica', 'confirmado', 'ARS', 'Desarrollo de sitio web'),
(@id_usuario_juan, @id_cat_salario, '2025-09-30', 45000.00, 'Presentismo Septiembre', 'Empresa ABC SA', 'salario', 1, 'mensual', 'confirmado', 'ARS', 'Bono por asistencia perfecta'),
(@id_usuario_juan, @id_cat_freelance, '2025-10-05', 200000.00, 'Consultoría IT', 'Startup DEF', 'freelance', 0, 'unica', 'pendiente', 'ARS', 'Pendiente de confirmación de pago');

PRINT 'Datos de ejemplo de INGRESOS insertados correctamente.';

-- ##############################################
-- ## ÍNDICES PARA OPTIMIZACIÓN                ##
-- ##############################################

-- Crear índices para mejorar el rendimiento de consultas frecuentes
CREATE INDEX IX_INGRESOS_USUARIO_FECHA ON INGRESOS (id_usuario, fecha DESC);
CREATE INDEX IX_INGRESOS_TIPO_ESTADO ON INGRESOS (tipo, estado);
CREATE INDEX IX_INGRESOS_FECHA_MONTO ON INGRESOS (fecha, monto DESC);

PRINT 'Índices de INGRESOS creados exitosamente.';
PRINT 'Tabla INGRESOS completamente configurada.';

