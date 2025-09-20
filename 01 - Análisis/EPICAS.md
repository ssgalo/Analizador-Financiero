# Épicas del proyecto

E1 - Importación y gestión básica de gastos  
Permitir al usuario cargar gastos manualmente y desde archivos (PDF, imágenes). ABM de gastos. Visualización básica de movimientos.

E2 - Clasificación inteligente de gastos  
Implementar IA para categorizar automáticamente los gastos. Mejorar la extracción de datos con OCR y procesamiento contextual.

E3 - Integración con billeteras virtuales y bancos  
Integrar MercadoPago (API y MCP). Preparar arquitectura para sumar nuevas fuentes de datos.

E4 - Reportes y visualización avanzada  
Generar gráficos interactivos y métricas clave. Exportar informes en PDF/Excel. Dashboard principal con resumen financiero.

E5 - Chat inteligente y recomendaciones personalizadas  
Integrar chat con IA (Azure Open API). Permitir consultas avanzadas y recomendaciones automáticas.

E6 - Alertas, notificaciones y gestión de objetivos  
Sistema de alertas sobre gastos, presupuestos y vencimientos. Configuración de objetivos financieros y seguimiento.

E7 - Seguridad, usuarios y perfiles  
Implementar autenticación, cifrado y gestión de perfiles. Personalización de preferencias y categorías.

E8 - Escalabilidad y arquitectura modular  
Mejoras de arquitectura para escalar y agregar nuevas funcionalidades.

## MVP

* El MVP corresponde al desarrollo de las 3 primeras épicas

EPIC E1: Importación y gestión básica de gastos

  Feature 1.1: Importar gastos desde archivos
    - User Story 1.1.1: Como usuario, quiero importar gastos desde archivos PDF para que la app los procese y los muestre en mi listado de movimientos.
    - User Story 1.1.2: Como usuario, quiero importar gastos desde imágenes para que la app reconozca los datos y los agregue a mi historial.
    - User Story 1.1.3: Como usuario, quiero que la app me notifique si hubo errores al importar un archivo.

  Feature 1.2: ABM de gastos (Alta, Baja, Modificación)
    - User Story 1.2.1: Como usuario, quiero agregar un gasto manualmente para registrar movimientos que no estén en archivos.
    - User Story 1.2.2: Como usuario, quiero editar los datos de un gasto existente para corregir información.
    - User Story 1.2.3: Como usuario, quiero eliminar un gasto para mantener mi historial actualizado.

  Feature 1.3: Visualización básica de movimientos
    - User Story 1.3.1: Como usuario, quiero ver una lista de todos mis gastos importados y manuales.
    - User Story 1.3.2: Como usuario, quiero filtrar los gastos por fecha para analizar mis movimientos en un período específico.
    - User Story 1.3.3: Como usuario, quiero buscar gastos por nombre de comercio o descripción.

EPIC E2: Clasificación inteligente de gastos

  Feature 2.1: Clasificación automática por IA
    - User Story 2.1.1: Como usuario, quiero que la app clasifique automáticamente mis gastos en categorías relevantes al importarlos.
    - User Story 2.1.2: Como usuario, quiero ver la categoría sugerida por la IA en cada gasto.
    - User Story 2.1.3: Como usuario, quiero poder modificar la categoría sugerida por la IA si no es correcta.

  Feature 2.2: Procesamiento contextual y OCR
    - User Story 2.2.1: Como usuario, quiero que la app extraiga correctamente el monto, fecha, comercio y categoría desde archivos PDF e imágenes.
    - User Story 2.2.2: Como usuario, quiero que la app me muestre los datos extraídos antes de confirmar la importación.

EPIC E3: Integración con billeteras virtuales y bancos

  Feature 3.1: Integración con MercadoPago
    - User Story 3.1.1: Como usuario, quiero vincular mi cuenta de MercadoPago para importar automáticamente mis movimientos.
    - User Story 3.1.2: Como usuario, quiero ver los gastos de MercadoPago integrados en mi historial de la app.
    - User Story 3.1.3: Como usuario, quiero actualizar los movimientos de MercadoPago en la app de forma manual o automática.

  Feature 3.2: Arquitectura preparada para nuevas integraciones
    - User Story 3.2.1: Como desarrollador, quiero que la arquitectura permita agregar fácilmente nuevas fuentes de datos (billeteras, bancos) en el futuro.
    - User Story 3.2.2: Como usuario, quiero que la app me informe qué fuentes de datos están disponibles para integración.