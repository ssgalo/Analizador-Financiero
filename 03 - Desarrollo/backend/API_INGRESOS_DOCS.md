# 📊 API de Ingresos - Documentación

## 🚀 Endpoints Creados

### **1. Crear Ingreso**
```http
POST /api/v1/ingresos/
```

**Request Body:**
```json
{
  "descripcion": "Sueldo Octubre 2025",
  "monto": 850000.00,
  "fecha": "2025-10-01",
  "fuente": "Empresa ABC SA",
  "tipo": "salario",
  "recurrente": true,
  "frecuencia": "mensual",
  "id_categoria": 1,
  "notas": "Sueldo neto depositado",
  "moneda": "ARS"
}
```

**Response:** `201 Created`
```json
{
  "id_ingreso": 1,
  "id_usuario": 4,
  "descripcion": "Sueldo Octubre 2025",
  "monto": 850000.00,
  "fecha": "2025-10-01",
  "fuente": "Empresa ABC SA",
  "tipo": "salario",
  "recurrente": true,
  "frecuencia": "mensual",
  "estado": "confirmado",
  "fecha_creacion": "2025-10-06T20:30:00Z",
  "fecha_modificacion": "2025-10-06T20:30:00Z",
  "moneda": "ARS"
}
```

---

### **2. Listar Ingresos**
```http
GET /api/v1/ingresos/?skip=0&limit=100
```

**Query Parameters:**
- `skip`: Elementos a omitir (paginación)
- `limit`: Límite de elementos (máx 1000)
- `categoria_id`: Filtrar por categoría
- `tipo`: Filtrar por tipo (salario, freelance, etc.)
- `estado`: Filtrar por estado (confirmado, pendiente, cancelado)
- `fecha_desde`: Fecha desde (YYYY-MM-DD)
- `fecha_hasta`: Fecha hasta (YYYY-MM-DD)

**Response:** `200 OK`
```json
[
  {
    "id_ingreso": 1,
    "descripcion": "Sueldo Octubre 2025",
    "monto": 850000.00,
    "categoria": {
      "id_categoria": 1,
      "nombre": "Salario",
      "color": "#4CAF50",
      "icono": "briefcase"
    }
  }
]
```

---

### **3. Obtener Ingreso por ID**
```http
GET /api/v1/ingresos/{ingreso_id}
```

**Response:** `200 OK` (mismo formato que listar ingresos)

---

### **4. Actualizar Ingreso**
```http
PUT /api/v1/ingresos/{ingreso_id}
```

**Request Body:** (campos opcionales)
```json
{
  "descripcion": "Sueldo Octubre 2025 - Actualizado",
  "monto": 900000.00,
  "estado": "confirmado"
}
```

**Response:** `200 OK`

---

### **5. Eliminar Ingreso**
```http
DELETE /api/v1/ingresos/{ingreso_id}
```

**Response:** `204 No Content`

---

### **6. Estadísticas de Ingresos**
```http
GET /api/v1/ingresos/stats?año=2025&mes=10
```

**Response:** `200 OK`
```json
{
  "total_ingresos": 1220000.00,
  "cantidad_ingresos": 3,
  "promedio_ingreso": 406666.67,
  "ingresos_por_tipo": {
    "salario": {
      "total": 850000.00,
      "cantidad": 1
    },
    "freelance": {
      "total": 370000.00,
      "cantidad": 2
    }
  },
  "ingresos_por_categoria": {
    "Salario": {
      "total": 850000.00,
      "cantidad": 1
    },
    "Freelance": {
      "total": 370000.00,
      "cantidad": 2
    }
  }
}
```

---

### **7. Opciones de Tipos**
```http
GET /api/v1/ingresos/tipos/opciones
```

**Response:** `200 OK`
```json
{
  "tipos": [
    {"value": "salario", "label": "Salario"},
    {"value": "freelance", "label": "Freelance"},
    {"value": "inversion", "label": "Inversión"},
    {"value": "venta", "label": "Venta"},
    {"value": "regalo", "label": "Regalo/Bono"},
    {"value": "otro", "label": "Otro"}
  ],
  "frecuencias": [
    {"value": "unica", "label": "Única vez"},
    {"value": "semanal", "label": "Semanal"},
    {"value": "quincenal", "label": "Quincenal"},
    {"value": "mensual", "label": "Mensual"},
    {"value": "trimestral", "label": "Trimestral"},
    {"value": "anual", "label": "Anual"}
  ],
  "estados": [
    {"value": "confirmado", "label": "Confirmado"},
    {"value": "pendiente", "label": "Pendiente"},
    {"value": "cancelado", "label": "Cancelado"}
  ]
}
```

---

## 🔐 Autenticación

Todos los endpoints (excepto `/tipos/opciones`) requieren JWT Bearer token:

```http
Authorization: Bearer your-jwt-token-here
```

---

## 📋 Validaciones

### **Campos Obligatorios:**
- `descripcion`: Descripción del ingreso
- `monto`: Debe ser mayor a 0
- `fecha`: Fecha válida
- `tipo`: Uno de los tipos válidos

### **Campos Opcionales:**
- `fuente`: Origen del ingreso
- `id_categoria`: FK a categorías existentes
- `recurrente`: boolean (default: false)
- `frecuencia`: default: "unica"
- `notas`: Observaciones adicionales
- `moneda`: default: "ARS"

### **Restricciones:**
- Solo se pueden ver/modificar ingresos del usuario autenticado
- Las categorías deben estar activas
- Las monedas deben existir y estar activas

---

## 🏗️ Estructura de Base de Datos

La tabla `INGRESOS` se relaciona con:
- ✅ `USUARIOS` (id_usuario) - FK obligatoria
- ✅ `CATEGORIAS` (id_categoria) - FK opcional
- ✅ `MONEDAS` (moneda) - FK con default 'ARS'

---

## 🧪 Testing

Para probar los endpoints:

1. **Autenticarse** primero en `/api/v1/auth/login`
2. **Usar el token** en todos los requests de ingresos
3. **Verificar** que los datos se filtran por usuario automáticamente

---

**Fecha de Creación:** 2025-10-06  
**Versión:** 1.0  
**Estado:** ✅ Completado y listo para testing