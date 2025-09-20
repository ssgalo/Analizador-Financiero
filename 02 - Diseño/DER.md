# Tablas y columnas principales del Analizador Financiero

## usuarios
- **id_usuario** (PK)
- nombre
- email
- usuario
- contraseña
- fecha_creacion
- preferencias (JSON/texto)
- ultimo_login
- estado

## gastos
- **id_gasto** (PK)
- id_usuario (FK)
- fecha
- monto
- descripcion
- comercio
- id_categoria (FK)
- fuente (manual, PDF, imagen, MercadoPago, etc.)
- id_archivo_importado (FK, nullable)
- estado (activo, eliminado, pendiente)
- fecha_creacion
- fecha_modificacion

## categorias
- **id_categoria** (PK)
- nombre
- descripcion
- es_personalizada (bool)
- id_usuario (FK, nullable para categorías globales)

## archivos_importados
- **id_archivo_importado** (PK)
- id_usuario (FK)
- tipo (PDF, imagen, etc.)
- ruta_archivo
- fecha_importacion
- estado_procesamiento
- resultado_ocr (JSON/texto)

## integraciones
- **id_integracion** (PK)
- id_usuario (FK)
- tipo (MercadoPago, banco, etc.)
- estado
- fecha_vinculacion
- datos_credenciales (encriptado/JSON)

## objetivos_financieros
- **id_objetivo** (PK)
- id_usuario (FK)
- descripcion
- monto
- fecha_inicio
- fecha_fin
- estado

## alertas
- **id_alerta** (PK)
- id_usuario (FK)
- tipo (gasto, presupuesto, vencimiento, etc.)
- mensaje
- fecha_creacion
- leida (bool)

## notificaciones
- **id_notificacion** (PK)
- id_usuario (FK)
- mensaje
- fecha_envio
- leida (bool)

## reportes
- **id_reporte** (PK)
- id_usuario (FK)
- tipo
- fecha_generacion
- archivo (ruta o blob)

## chats
- **id_chat** (PK)
- id_usuario (FK)
- fecha
- mensaje_usuario
- respuesta_ia

## logs_actividad
- **id_log** (PK)
- id_usuario (FK)
- fecha
- tipo_evento
- descripcion
