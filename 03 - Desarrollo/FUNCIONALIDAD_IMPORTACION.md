# Funcionalidad de Importación de Tickets

## Descripción General

El sistema incluye una funcionalidad de importación automática de tickets y facturas que permite extraer información financiera de documentos mediante inteligencia artificial. Esta característica facilita la carga de gastos eliminando la necesidad de ingresar manualmente los datos de cada transacción.

## Tecnología Utilizada

La funcionalidad utiliza OpenAI Vision API con el modelo gpt-4o-mini, que analiza directamente las imágenes de los documentos sin necesidad de procesamiento OCR previo. Este enfoque garantiza mayor precisión en la extracción de datos, especialmente con documentos que presentan calidad variable o formatos no estándar.

### Características del Modelo

- Modelo: gpt-4o-mini con capacidad de visión
- Nivel de detalle: Alto (configuración "high")
- Temperatura: 0.1 (optimizado para precisión)
- Tokens máximos por respuesta: 500

## Formatos Soportados

La funcionalidad acepta los siguientes formatos de archivo:

- Imágenes: JPG, JPEG, PNG, BMP, TIFF
- Documentos: PDF (se procesa la primera página)
- Tamaño máximo: 20 MB por archivo

## Información Extraída

El sistema analiza el documento y extrae automáticamente:

### Fecha
Detecta fechas en formato argentino (DD/MM/YYYY o DD/MM/YY) y las convierte al formato estándar del sistema (YYYY-MM-DD). Si no encuentra una fecha en el documento, utiliza la fecha actual.

### Monto
Identifica el total de la transacción, reconociendo el formato de números argentino donde el punto se usa como separador de miles y la coma como separador decimal (por ejemplo: 1.234,56).

### Comercio
Extrae el nombre del establecimiento o comercio que aparece en el ticket.

### Descripción
Genera automáticamente una descripción concisa del gasto basándose en los items o servicios visibles en el documento. La descripción es creada por la inteligencia artificial y no es una copia literal del texto del ticket.

### Categoría Sugerida
Propone una categoría apropiada basándose en el tipo de comercio o productos identificados. Las categorías disponibles incluyen: Comida, Transporte, Vivienda, Entretenimiento, Supermercado, Suscripciones y Otros.

### Nivel de Confianza
Asigna un valor entre 0 y 1 que indica la confianza del sistema en la precisión de los datos extraídos.

## Flujo de Uso

1. El usuario accede a la sección "Importar" y selecciona un archivo
2. El sistema envía la imagen a OpenAI Vision API para análisis
3. La API procesa el documento y devuelve los datos estructurados
4. El sistema calcula y muestra el costo del procesamiento en tokens y dólares
5. Se abre automáticamente el formulario de creación de gasto con los datos precargados
6. El usuario puede revisar y ajustar la información antes de guardar
7. El gasto se registra con el campo "fuente" marcado como "importado"

## Consideraciones de Costo

Cada documento procesado consume tokens de la API de OpenAI. El sistema calcula y muestra de manera transparente:

- Cantidad de tokens de entrada (prompt)
- Cantidad de tokens de salida (respuesta)
- Total de tokens utilizados
- Costo estimado en dólares estadounidenses

El costo aproximado por documento oscila entre 0.001 y 0.003 USD, dependiendo de la complejidad de la imagen y la cantidad de información presente.

### Precios de Referencia

- Tokens de entrada: $0.150 por millón
- Tokens de salida: $0.600 por millón

## Manejo de Errores

El sistema implementa manejo específico de errores comunes:

### Cuota Insuficiente
Si la cuenta de OpenAI no tiene saldo suficiente, el sistema muestra un mensaje informativo en español indicando el costo estimado que hubiera tenido el procesamiento y proporciona el enlace directo para recargar saldo.

### Formato No Soportado
Si se intenta cargar un archivo con formato no compatible, el sistema rechaza la operación antes de enviarla a la API.

### Tamaño Excesivo
Los archivos mayores a 20 MB son rechazados automáticamente.

## Configuración Requerida

Para utilizar esta funcionalidad es necesario:

1. Configurar una API Key válida de OpenAI en las variables de entorno del backend
2. Asegurar que la cuenta de OpenAI tenga saldo disponible
3. El backend debe tener instaladas las dependencias: openai, pillow, pdf2image

## Limitaciones

- Solo se procesa la primera página en documentos PDF de múltiples páginas
- La precisión de extracción depende de la calidad y legibilidad del documento original
- Documentos muy borrosos, rotados o con texto ilegible pueden producir resultados inexactos
- El sistema requiere conexión a internet para acceder a la API de OpenAI

## Privacidad y Seguridad

Los documentos son enviados a OpenAI para su procesamiento. Se recomienda revisar las políticas de uso de datos de OpenAI para comprender cómo se manejan las imágenes procesadas.
