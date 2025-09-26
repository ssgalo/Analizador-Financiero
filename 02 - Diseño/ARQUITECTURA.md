# Arquitectura del Sistema - Analizador Financiero

## Visión General

La aplicación **Analizador Financiero** utiliza una arquitectura moderna de tres capas, desplegada en la nube, con separación clara entre frontend, backend y base de datos.

## Componentes Principales

### 1. **Frontend**
- **Tecnología:** React 18+ con Vite
- **Hosting:** Vercel o Netlify (plataforma gratuita)
- **Lenguaje:** JavaScript/TypeScript
- **Características:**
  - SPA (Single Page Application)
  - Interfaz responsiva y moderna
  - Comunicación con backend via REST API
  - Gestión de estado con Context API o Redux
  - Componentes reutilizables
  - Deploy automático desde Git

### 2. **Backend**
- **Plataforma:** Azure App Service
- **Containerización:** Docker
- **Tecnología:** Node.js/Express o Python/FastAPI
- **Características:**
  - API RESTful
  - Autenticación y autorización
  - Procesamiento de archivos (OCR)
  - Integración con servicios externos
  - Escalabilidad automática

### 3. **Base de Datos**
- **Tecnología:** SQL Server
- **Hosting:** Azure SQL Database (Plan gratuito)
- **Características:**
  - Base de datos relacional

### 4. **Almacenamiento de Archivos**
- **Tecnología:** Azure Blob Storage
- **Propósito:** Almacenamiento de archivos subidos (PDFs, imágenes)
- **Características:**
  - Escalabilidad automática
  - Integración nativa con Azure Cognitive Services
  - Lifecycle management para archivos antiguos
  - Cifrado y control de acceso
  - Costo-efectivo para grandes volúmenes

## Arquitectura de Despliegue

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │    │     Backend     │    │   Base de Datos │
│   React + Vite  │───▶│  Azure App      │───▶│   SQL Server    │
│                 │    │  Service        │    │                 │
│ (Vercel/Netlify)│    │  (Docker)       │    │  (Azure DB)     │
└─────────────────┘    └─────────┬───────┘    └─────────────────┘
                                 │
                                 ▼
                       ┌─────────────────┐
                       │ Azure Blob      │
                       │ Storage         │
                       │ (Archivos)      │
                       └─────────────────┘
```

## Servicios Adicionales de Azure

### **Azure Cognitive Services**
- OCR para procesamiento de documentos
- Text Analytics para clasificación inteligente
- Integración directa con Azure Blob Storage

### **Azure OpenAI**
- Chat inteligente y recomendaciones
- Procesamiento de lenguaje natural

### **Azure Blob Storage**
- Almacenamiento de archivos PDFs e imágenes subidos
- Estructura organizada por usuario y tipo de archivo
- Lifecycle policies para gestión automática de archivos antiguos

## Flujo de Datos para Procesamiento de Archivos

1. **Usuario** sube archivo desde el **Frontend React**
2. **Frontend** envía archivo al **Backend** (Azure App Service)
3. **Backend** almacena archivo en **Azure Blob Storage**
4. **Backend** procesa OCR usando **Azure Cognitive Services** desde Blob Storage
5. **Datos extraídos** se guardan en **PostgreSQL**
6. **Archivo original** se mantiene o elimina según políticas definidas

## Estructura de Almacenamiento en Blob Storage

```
analizador-financiero-storage/
├── user-uploads/
│   ├── {userId}/
│   │   ├── pdfs/
│   │   │   ├── {timestamp}-factura.pdf
│   │   │   └── {timestamp}-resumen.pdf
│   │   ├── images/
│   │   │   ├── {timestamp}-ticket.jpg
│   │   │   └── {timestamp}-recibo.png
│   │   └── processed/          # Opcional: archivos ya procesados
└── reports/
    └── {userId}/
        ├── monthly-report-{date}.pdf
        └── annual-report-{date}.xlsx
```

## Estructura de Directorios

```
Analizador-Financiero/
├── frontend/
│   └── analizador-gastos-front/     # React + Vite
├── backend/
│   ├── Dockerfile                   # Containerización
│   ├── src/
│   │   ├── services/
│   │   │   ├── blob-storage.js      # Servicio para Azure Blob
│   │   │   └── ocr-service.js       # Servicio para OCR
│   │   └── ...
│   └── requirements.txt            # Dependencias
├── database/
│   ├── migrations/                 # Scripts de DB
│   └── seed/                       # Datos iniciales
├── deploy/
│   ├── docker-compose.yml          # Para desarrollo local
│   └── azure-pipelines.yml         # CI/CD
└── docs/
    └── api/                        # Documentación API
```

## Beneficios de esta Arquitectura

- **Costo-efectivo:** Frontend gratuito, almacenamiento económico en Blob Storage
- **Escalabilidad:** Todos los componentes escalan automáticamente
- **Mantenibilidad:** Separación clara de responsabilidades
- **Seguridad:** Servicios gestionados de Azure con cifrado
- **Performance:** CDN global para frontend, procesamiento optimizado en Azure
- **Desarrollo:** Entorno local con Docker
- **CI/CD:** Deploy automático desde Git
- **Integración:** Servicios Azure nativamente integrados

## Consideraciones de Despliegue

### **Frontend (Vercel/Netlify)**
- Deploy automático desde repositorio Git
- Variables de entorno para configuración
- CDN global incluido
- HTTPS automático
- Preview deployments para testing

### **Backend (Azure)**
- Containerización con Docker
- Escalado automático basado en demanda
- Integración con Azure DevOps para CI/CD
- Variables de entorno para connection strings

### **Blob Storage**
- Containers organizados por funcionalidad
- Políticas de acceso granulares
- Lifecycle management para optimizar costos
- Integración directa con Cognitive Services

## Consideraciones de Seguridad

- HTTPS en todas las comunicaciones
- CORS configurado correctamente entre dominios
- Autenticación JWT
- Validación de entrada en backend
- Cifrado de datos sensibles en reposo y en tránsito
- Backup automático y recovery
