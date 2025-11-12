# 🚀 Guía de Deploy: Embeddings con Gemini + pgvector

## 📋 Resumen de Cambios

Esta rama `embeddings` implementa búsqueda semántica en el chat usando:
- **Google Gemini**: Para generar embeddings (768 dimensiones)
- **pgvector**: Extensión de PostgreSQL para búsqueda vectorial
- **Embeddings persistentes**: Tablas `gastos_embeddings` e `ingresos_embeddings`

---

## 🔧 Prerequisitos en la VPS

1. ✅ Docker y Docker Compose instalados
2. ✅ Git configurado
3. ✅ Puerto 8080 disponible
4. ✅ Al menos 2GB de RAM disponible

---

## 📝 Paso a Paso: Deploy en VPS

### **1. Conectar a la VPS**
```bash
ssh usuario@tu-vps-ip
cd /ruta/donde/esta/el-proyecto
```

### **2. Backup de la Base de Datos (IMPORTANTE)**
```bash
# Hacer backup antes de cualquier cambio
docker exec analizador-postgres pg_dump -U unlam analizador_financiero > backup_$(date +%Y%m%d_%H%M%S).sql

# O con docker compose
docker compose exec postgres pg_dump -U unlam analizador_financiero > backup_$(date +%Y%m%d_%H%M%S).sql
```

### **3. Actualizar el Código**
```bash
# Ver rama actual
git branch

# Si estás en otra rama, cambiar a embeddings
git fetch origin
git checkout embeddings
git pull origin embeddings
```

### **4. Actualizar Variables de Entorno**
```bash
# Editar el archivo .env
nano .env  # o vim .env

# Asegurarte de tener estas variables:
```

```properties
# Google Gemini - Embeddings
EMBEDDING_PROVIDER=gemini
GEMINI_API_KEY=AIzaSyA1yi0w7BJCoe8siz4eT3sYKcWErK4-Frw
EMBEDDING_DIMENSIONS=768

# Azure OpenAI - Chat (tus credenciales actualizadas)
AI_PROVIDER=azure
AZURE_OPENAI_API_KEY=6uEN5Iwi039Qpqc0XLdb9HTUwNlMSPk31hMny56pdZp6VkKNse4lJQQJ99BJACHYHv6XJ3w3AAAAACOGUVNp
AZURE_OPENAI_ENDPOINT=https://stvio-mgmg02az-eastus2.cognitiveservices.azure.com
AZURE_OPENAI_DEPLOYMENT=model-router
AZURE_OPENAI_API_VERSION=2025-01-01-preview
```

### **5. Reconstruir y Levantar Contenedores**
```bash
# Opción 1: Rebuild completo (RECOMENDADO para deploy inicial)
docker compose down
docker compose up -d --build

# Opción 2: Solo rebuild del backend (si ya tienes la DB)
docker compose up -d --build backend
```

⚠️ **IMPORTANTE**: Al hacer `docker compose up -d --build`, Docker:
- ✅ Reconstruye las imágenes (backend con nuevas dependencias)
- ✅ Ejecuta automáticamente los scripts SQL en `database/` (solo si el volumen es nuevo)
- ❌ NO re-ejecuta scripts si el volumen de PostgreSQL ya existe

---

## 🗄️ Migración de Base de Datos

### **¿Qué pasa con los scripts SQL?**

Los scripts en `database/` se ejecutan **SOLO** cuando:
1. El contenedor de PostgreSQL se crea por primera vez
2. El volumen de datos no existe

Si tu VPS **ya tiene datos**, los scripts NO se ejecutan automáticamente.

### **Opción A: Base de Datos Nueva (Volumen Limpio)**

```bash
# 1. Detener todo
docker compose down

# 2. ELIMINAR el volumen de datos (CUIDADO: ESTO BORRA TODO)
docker volume rm analizador-financiero_postgres_data

# 3. Levantar de nuevo (ejecutará todos los scripts SQL automáticamente)
docker compose up -d --build

# 4. Popular embeddings
docker exec -it analizador-backend python scripts/migrar_embeddings_existentes.py --tipo all
```

### **Opción B: Base de Datos Existente (RECOMENDADO para VPS)**

Si ya tienes datos en producción, ejecuta la migración manualmente:

```bash
# 1. Verificar que el contenedor de PostgreSQL está corriendo
docker compose ps

# 2. Ejecutar script de migración de pgvector
docker exec -it analizador-postgres psql -U unlam -d analizador_financiero -f /docker-entrypoint-initdb.d/01_init_pgvector.sql

# 3. Ejecutar script de creación de tablas de embeddings
docker exec -it analizador-postgres psql -U unlam -d analizador_financiero -f /docker-entrypoint-initdb.d/03_create_embeddings_tables.sql

# 4. Verificar que pgvector está instalado
docker exec -it analizador-postgres psql -U unlam -d analizador_financiero -c "SELECT * FROM pg_extension WHERE extname = 'vector';"

# 5. Verificar que las tablas existen
docker exec -it analizador-postgres psql -U unlam -d analizador_financiero -c "SELECT table_name FROM information_schema.tables WHERE table_name IN ('gastos_embeddings', 'ingresos_embeddings');"
```

---

## 🔄 Generar Embeddings para Datos Existentes

Una vez que la base de datos tenga pgvector y las tablas:

```bash
# 1. Verificar que el backend tiene las variables de entorno correctas
docker exec analizador-backend env | grep -E '(GEMINI|EMBEDDING)'

# 2. Ejecutar script de migración para todos los registros
docker exec -it analizador-backend python scripts/migrar_embeddings_existentes.py --tipo all

# Alternativas:
# Solo gastos:
docker exec -it analizador-backend python scripts/migrar_embeddings_existentes.py --tipo gastos --limite 50

# Solo ingresos:
docker exec -it analizador-backend python scripts/migrar_embeddings_existentes.py --tipo ingresos --limite 50
```

**Salida esperada:**
```
============================================================
🚀 SCRIPT DE MIGRACIÓN DE EMBEDDINGS
============================================================
Tipo: all
Límite: Sin límite
============================================================

============================================================
🔄 MIGRANDO GASTOS
============================================================
📊 Gastos sin embeddings: 8
🚀 Iniciando procesamiento...
[1/8] Procesando gasto #1... ✅
[2/8] Procesando gasto #2... ✅
...
------------------------------------------------------------
✅ Gastos procesados: 8
✅ Embeddings creados: 8
❌ Errores: 0
------------------------------------------------------------

✅ ¡Migración completada exitosamente!
```

---

## ✅ Verificación del Deploy

### **1. Verificar Contenedores**
```bash
docker compose ps
# Todos deben estar "Up"
```

### **2. Verificar Logs**
```bash
# Backend
docker logs analizador-backend --tail 50

# PostgreSQL
docker logs analizador-postgres --tail 50

# Debe aparecer:
# "LOG:  extension "vector" is now available"
```

### **3. Verificar Embeddings en la DB**
```bash
docker exec -it analizador-postgres psql -U unlam -d analizador_financiero -c "
SELECT 
  'gastos_embeddings' as tabla, 
  COUNT(*) as total 
FROM gastos_embeddings 
UNION ALL 
SELECT 
  'ingresos_embeddings', 
  COUNT(*) 
FROM ingresos_embeddings;
"
```

**Salida esperada:**
```
       tabla        | total 
--------------------+-------
 gastos_embeddings  |     8
 ingresos_embeddings|    17
```

### **4. Probar el Chat**
```bash
# Desde tu navegador, acceder a:
http://tu-vps-ip:8080/chat

# Enviar mensaje de prueba:
"¿En qué gasté más dinero este mes?"
```

Si ves una respuesta con datos relevantes, ¡funciona! 🎉

---

## 🐛 Troubleshooting

### **Error: "extension vector is not available"**
```bash
# Reinstalar pgvector manualmente
docker exec -it analizador-postgres bash
apt-get update && apt-get install -y postgresql-16-pgvector
exit

docker compose restart postgres
```

### **Error: "tables do not exist"**
```bash
# Copiar y ejecutar scripts manualmente
docker cp database/init_pgvector.sql analizador-postgres:/tmp/
docker cp database/create_embeddings_tables.sql analizador-postgres:/tmp/

docker exec -it analizador-postgres psql -U unlam -d analizador_financiero -f /tmp/init_pgvector.sql
docker exec -it analizador-postgres psql -U unlam -d analizador_financiero -f /tmp/create_embeddings_tables.sql
```

### **Error: "GEMINI_API_KEY not set"**
```bash
# Verificar que el .env tiene las variables
cat .env | grep GEMINI

# Reiniciar backend
docker compose restart backend

# Verificar dentro del contenedor
docker exec analizador-backend env | grep GEMINI
```

### **Chat no responde / Respuesta en blanco**
```bash
# Ver logs en tiempo real
docker logs analizador-backend -f

# Buscar errores específicos
docker logs analizador-backend --tail 100 | grep -E "ERROR|Exception"
```

---

## 📊 Resumen de Archivos Importantes

### **Scripts SQL (se ejecutan automáticamente en DB nueva)**
```
database/
├── init_pgvector.sql              # Instala extensión pgvector
├── init.sql                       # Crea tablas principales
└── create_embeddings_tables.sql   # Crea tablas de embeddings (768 dim)
```

### **Scripts Python (se ejecutan manualmente)**
```
backend/scripts/
└── migrar_embeddings_existentes.py  # Genera embeddings para datos existentes
```

### **Servicios Modificados**
```
backend/app/services/
├── embeddings_service.py          # Multi-provider (Gemini/Azure)
├── vector_search_service.py       # Búsqueda semántica con pgvector
└── context_builder_service.py     # Construcción de contexto optimizado
```

---

## 🎯 Checklist de Deploy

- [ ] Backup de base de datos realizado
- [ ] Código actualizado desde Git (rama `embeddings`)
- [ ] Variables de entorno configuradas (`.env`)
- [ ] Contenedores reconstruidos (`docker compose up -d --build`)
- [ ] pgvector instalado en PostgreSQL
- [ ] Tablas de embeddings creadas
- [ ] Embeddings generados para datos existentes
- [ ] Chat probado y funcionando
- [ ] Logs verificados sin errores

---

## 📞 Comandos Útiles de Mantenimiento

```bash
# Ver uso de recursos
docker stats

# Limpiar imágenes antiguas
docker system prune -a

# Backup manual
docker exec analizador-postgres pg_dump -U unlam analizador_financiero | gzip > backup_$(date +%Y%m%d).sql.gz

# Restaurar backup
gunzip < backup_20251112.sql.gz | docker exec -i analizador-postgres psql -U unlam -d analizador_financiero

# Ver embeddings creados recientemente
docker exec -it analizador-postgres psql -U unlam -d analizador_financiero -c "
SELECT COUNT(*) as total, MAX(created_at) as ultimo 
FROM gastos_embeddings;
"
```

---

## 🚀 Comandos Rápidos (TL;DR)

**Deploy completo en VPS con datos existentes:**

```bash
# 1. Backup
docker exec analizador-postgres pg_dump -U unlam analizador_financiero > backup.sql

# 2. Actualizar código
git checkout embeddings && git pull

# 3. Actualizar .env (añadir variables de Gemini)
nano .env

# 4. Rebuild
docker compose down && docker compose up -d --build

# 5. Migrar pgvector (solo si DB ya existe)
docker exec -it analizador-postgres psql -U unlam -d analizador_financiero -f /docker-entrypoint-initdb.d/01_init_pgvector.sql
docker exec -it analizador-postgres psql -U unlam -d analizador_financiero -f /docker-entrypoint-initdb.d/03_create_embeddings_tables.sql

# 6. Generar embeddings
docker exec -it analizador-backend python scripts/migrar_embeddings_existentes.py --tipo all

# 7. Verificar
docker exec -it analizador-postgres psql -U unlam -d analizador_financiero -c "SELECT COUNT(*) FROM gastos_embeddings;"

# 8. Probar
# Abrir http://tu-vps:8080/chat y enviar un mensaje
```

---

## ✨ Beneficios de Esta Implementación

- 🎯 **Búsqueda Semántica**: El chat encuentra gastos/ingresos relacionados por significado, no solo por fecha
- ⚡ **Más Rápido**: Solo envía 10-15 registros relevantes vs todos los datos
- 💰 **Más Económico**: ~800 tokens de contexto vs ~15,000 del método tradicional  
- 🆓 **Gemini Gratis**: 1,500 embeddings/día sin costo
- 📊 **Persistente**: Los embeddings se guardan en DB, no se regeneran cada vez
- 🔄 **Automático**: Nuevos gastos/ingresos generan embeddings automáticamente

---

¿Tienes alguna pregunta sobre el proceso de deploy? 🚀
