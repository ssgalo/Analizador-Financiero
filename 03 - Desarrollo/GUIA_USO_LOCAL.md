# 🚀 Guía de Uso - Analizador Financiero (Local)

## ✅ Estado Actual

Todos los servicios están corriendo correctamente:

- ✅ **PostgreSQL + pgvector** - Puerto 5432
- ✅ **Backend FastAPI** - Puerto 8000  
- ✅ **Frontend React** - Puerto 3000
- ✅ **Nginx (Proxy)** - Puerto 8080

---

## 🌐 URLs de Acceso

### Aplicación Completa (Recomendado)
```
http://localhost:8080
```
Esta URL usa Nginx como proxy y es la más cercana a producción.

### Servicios Individuales

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:3000 | Interfaz React directa |
| **Backend API** | http://localhost:8000 | API REST de FastAPI |
| **API Docs** | http://localhost:8000/docs | Documentación Swagger interactiva |
| **PostgreSQL** | localhost:5432 | Base de datos (requiere cliente SQL) |

---

## 📊 Datos Actuales en la Base de Datos

- **Gastos:** 9 registros
- **Ingresos:** 17 registros
- **Embeddings de gastos:** 0 (pendiente de generar)
- **Embeddings de ingresos:** 0 (pendiente de generar)

⚠️ **Nota:** Para usar la funcionalidad de IA con embeddings, necesitas generar los embeddings primero.

---

## 🎯 Funcionalidades Disponibles

### 1. Gestión de Gastos e Ingresos
- ✅ Crear, editar, eliminar gastos
- ✅ Crear, editar, eliminar ingresos
- ✅ Categorización automática
- ✅ Filtros por fecha, categoría, monto
- ✅ Estadísticas y gráficos

### 2. Dashboard
- ✅ Resumen financiero
- ✅ Gráficos de gastos por categoría
- ✅ Tendencias mensuales
- ✅ Balance general

### 3. IA y Análisis (Requiere Embeddings)
- ⚠️ Consultas en lenguaje natural
- ⚠️ Búsqueda semántica de transacciones
- ⚠️ Recomendaciones inteligentes

---

## 🔧 Comandos Útiles

### Ver Estado de Servicios
```bash
cd "03 - Desarrollo"
./verificar_servicios.sh
```

### Ver Logs en Tiempo Real
```bash
# Todos los servicios
docker compose logs -f

# Solo backend
docker compose logs -f backend

# Solo frontend
docker compose logs -f frontend

# Solo base de datos
docker compose logs -f postgres
```

### Reiniciar Servicios
```bash
# Reiniciar todo
docker compose restart

# Reiniciar solo backend
docker compose restart backend

# Reiniciar solo frontend
docker compose restart frontend
```

### Detener Todo
```bash
docker compose down
```

### Levantar Todo desde Cero
```bash
docker compose up -d
```

---

## 🤖 Generar Embeddings (Opcional pero Recomendado)

Para habilitar las funcionalidades de IA avanzada:

### Opción 1: Con tus Datos Reales (Requiere API Key de Azure OpenAI)

```bash
# 1. Verificar variables de entorno
docker exec analizador-backend env | grep AZURE_OPENAI

# 2. Si no están configuradas, editarlas en docker-compose.yml o .env

# 3. Generar embeddings (consumirá tokens de OpenAI)
docker exec analizador-backend python scripts/populate_embeddings.py --batch-size 50 --verbose

# 4. Verificar que se generaron
docker exec analizador-postgres psql -U unlam -d analizador_financiero -c "SELECT COUNT(*) FROM gastos_embeddings;"
```

### Opción 2: Modo de Prueba (Sin consumir API)

```bash
# Solo ver qué se procesaría
docker exec analizador-backend python scripts/populate_embeddings.py --dry-run --verbose
```

---

## 🔍 Verificar Base de Datos

### Conectar con pgAdmin o DBeaver

**Configuración de conexión:**
```
Host: localhost
Puerto: 5432
Base de datos: analizador_financiero
Usuario: unlam
Contraseña: ia-aplicada-123
```

### Comandos SQL Útiles

```bash
# Entrar a psql
docker exec -it analizador-postgres psql -U unlam -d analizador_financiero

# Ver todas las tablas
\dt

# Ver embeddings
SELECT * FROM gastos_embeddings LIMIT 5;

# Ver estadísticas
SELECT 
    (SELECT COUNT(*) FROM gastos) as total_gastos,
    (SELECT COUNT(*) FROM ingresos) as total_ingresos,
    (SELECT COUNT(*) FROM gastos_embeddings) as embeddings_gastos,
    (SELECT COUNT(*) FROM ingresos_embeddings) as embeddings_ingresos;

# Ver funciones de búsqueda vectorial
\df search_*
```

---

## 🧪 Probar la API

### Usando cURL

```bash
# Health check
curl http://localhost:8000/health

# Obtener gastos (requiere autenticación)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/gastos

# Ver documentación interactiva
# Abre en tu navegador: http://localhost:8000/docs
```

### Usando la Documentación Swagger

1. Abre http://localhost:8000/docs
2. Explora los endpoints disponibles
3. Prueba las peticiones directamente desde el navegador

---

## 🐛 Troubleshooting

### El backend muestra "unhealthy" pero funciona

Esto es normal. El healthcheck de Docker puede fallar pero el servicio funciona. Verifica con:
```bash
curl http://localhost:8000/health
```
Si responde `{"status":"healthy"}`, todo está bien.

### Frontend no carga

```bash
# Verificar logs
docker compose logs frontend

# Reconstruir el contenedor
docker compose up -d --build frontend
```

### Error de conexión a la base de datos

```bash
# Verificar que PostgreSQL está corriendo
docker compose ps postgres

# Ver logs
docker compose logs postgres

# Reiniciar
docker compose restart postgres
```

### Nginx devuelve 502 Bad Gateway

```bash
# Verificar que backend y frontend están corriendo
docker compose ps

# Reiniciar nginx
docker compose restart nginx
```

---

## 📦 Estructura de Puertos

| Puerto | Servicio | Descripción |
|--------|----------|-------------|
| **3000** | Frontend | Acceso directo a React |
| **8000** | Backend | API FastAPI |
| **8080** | Nginx | Proxy (producción-like) |
| **5432** | PostgreSQL | Base de datos |
| **443** | Nginx SSL | HTTPS (no configurado en local) |

---

## 🚀 Próximos Pasos

### Para Desarrollo
1. ✅ Aplicación corriendo localmente
2. 🔄 Generar embeddings (opcional)
3. 🧪 Probar funcionalidades
4. 📝 Agregar más datos de prueba

### Para Producción (VPS)
1. Configurar variables de entorno de producción
2. Configurar dominio y DNS
3. Setup de HTTPS con Let's Encrypt
4. Configurar backups automáticos
5. Monitoreo y logs centralizados

---

## 💡 Tips

### Agregar Datos de Prueba

Usa el frontend en http://localhost:8080 para:
1. Crear categorías de gastos/ingresos
2. Agregar gastos de ejemplo
3. Agregar ingresos de ejemplo
4. Probar filtros y búsquedas

### Simular Producción

El puerto **8080** (Nginx) es el que simula mejor el entorno de producción porque:
- Usa un proxy reverso (como en prod)
- Maneja CORS correctamente
- Sirve frontend y backend desde el mismo origen
- Permite agregar SSL fácilmente

---

## 📞 Comandos Rápidos

```bash
# Verificar todo
./verificar_servicios.sh

# Ver logs
docker compose logs -f

# Reiniciar
docker compose restart

# Detener
docker compose down

# Levantar
docker compose up -d

# Ver estado
docker compose ps

# Limpiar todo (¡cuidado! borra datos)
docker compose down -v
```

---

**¿Listo para usar?** 🎉

Abre tu navegador en **http://localhost:8080** y comienza a usar la aplicación.
