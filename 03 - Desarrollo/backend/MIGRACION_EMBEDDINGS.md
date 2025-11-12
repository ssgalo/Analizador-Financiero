# 🚀 Migración de Embeddings - Guía Completa

## 📋 Resumen

Este documento explica cómo migrar los **gastos e ingresos existentes** para generar sus **embeddings vectoriales** y habilitar la búsqueda semántica en el chat.

---

## 🎯 Estado Actual

### ✅ Implementado:
- Tablas de embeddings (`gastos_embeddings`, `ingresos_embeddings`)
- Servicios de embeddings, búsqueda vectorial y construcción de contexto
- Chat integrado con embeddings (con fallback a método tradicional)

### ❌ Pendiente:
- **0 embeddings generados** (de 9 gastos y 17 ingresos)
- **Chat usando método tradicional** (porque no hay embeddings para buscar)

---

## 🔧 Requisitos Previos

### 1. Deployment de Embeddings en Azure OpenAI

**IMPORTANTE:** Necesitás crear un deployment específico para embeddings.

#### Pasos:
1. Ve a **Azure OpenAI Studio** → **Deployments**
2. Click **"+ Create new deployment"**
3. Completa:
   ```
   Modelo:            text-embedding-3-small
   Versión:           1
   Deployment name:   text-embedding-3-small
   TPM Limit:         120K (o el máximo disponible)
   ```
4. Click **"Create"**

### 2. Actualizar Variables de Entorno

Editá `.env` y agregá:

```bash
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=tu_api_key
AZURE_OPENAI_ENDPOINT=https://tu-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4-deployment              # Para chat
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-small  # Para embeddings ⚠️ NUEVO
AZURE_OPENAI_API_VERSION=2024-08-01-preview
```

### 3. Reiniciar Docker

```bash
docker-compose down
docker-compose up -d
```

---

## 🚀 Ejecutar Migración

### Opción 1: Script Bash (Recomendado)

```bash
cd backend

# Dar permisos de ejecución
chmod +x scripts/migrar_embeddings.sh

# Migrar todo (gastos + ingresos)
./scripts/migrar_embeddings.sh

# Solo gastos
./scripts/migrar_embeddings.sh gasto

# Solo ingresos
./scripts/migrar_embeddings.sh ingreso

# Limitar a 5 registros (para testing)
./scripts/migrar_embeddings.sh all 5
```

### Opción 2: Script Python Directo

```bash
# Dentro del contenedor
docker exec -it analizador-backend python scripts/migrar_embeddings_existentes.py --tipo all

# Fuera del contenedor (si tenés Python local)
cd backend
python scripts/migrar_embeddings_existentes.py --tipo all
```

### Opciones del Script:

```
--tipo gasto|ingreso|all    Qué migrar (default: all)
--limite N                   Procesar solo N registros por tipo
```

---

## 📊 Ejemplo de Salida

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
📊 Gastos sin embeddings: 9

🚀 Iniciando procesamiento...

[1/9] Procesando gasto #1... ✅
[2/9] Procesando gasto #2... ✅
[3/9] Procesando gasto #3... ✅
...
[9/9] Procesando gasto #9... ✅

------------------------------------------------------------
✅ Gastos procesados: 9
✅ Embeddings creados: 9
❌ Errores: 0
------------------------------------------------------------

============================================================
🔄 MIGRANDO INGRESOS
============================================================
📊 Ingresos sin embeddings: 17

🚀 Iniciando procesamiento...

[1/17] Procesando ingreso #1... ✅
[2/17] Procesando ingreso #2... ✅
...
[17/17] Procesando ingreso #17... ✅

------------------------------------------------------------
✅ Ingresos procesados: 17
✅ Embeddings creados: 17
❌ Errores: 0
------------------------------------------------------------

============================================================
📊 RESUMEN FINAL DE MIGRACIÓN
============================================================
Gastos:
  • Procesados: 9
  • Embeddings creados: 9
  • Errores: 0

Ingresos:
  • Procesados: 17
  • Embeddings creados: 17
  • Errores: 0

Total:
  • Total procesados: 26
  • Total embeddings creados: 26
  • Total errores: 0

✅ ¡Migración completada exitosamente!
============================================================
```

---

## ✅ Verificación Post-Migración

### 1. Verificar Embeddings en Base de Datos

```bash
# Contar embeddings de gastos
docker exec analizador-postgres psql -U unlam -d analizador_financiero \
  -c "SELECT COUNT(*) FROM gastos_embeddings;"

# Contar embeddings de ingresos
docker exec analizador-postgres psql -U unlam -d analizador_financiero \
  -c "SELECT COUNT(*) FROM ingresos_embeddings;"
```

Deberías ver:
```
 count
-------
     9   ← Gastos
(1 row)

 count
-------
    17   ← Ingresos
(1 row)
```

### 2. Probar Chat con Embeddings

1. Ve a http://localhost:8080/chat
2. Hace una pregunta específica:
   ```
   "¿En qué gasté más dinero el mes pasado?"
   "Mostrame mis gastos de supermercado"
   "¿Cuáles son mis ingresos recurrentes?"
   ```

3. El chat ahora debería:
   - ✅ Usar búsqueda semántica (embeddings)
   - ✅ Responder con datos relevantes
   - ✅ NO caer en el fallback tradicional

### 3. Verificar Logs del Backend

```bash
docker logs analizador-backend --tail 50 -f
```

Deberías ver mensajes como:
```
✅ Búsqueda vectorial exitosa: 5 gastos, 2 ingresos
📊 Contexto construido: 847 tokens
```

En lugar de:
```
⚠️ Error en búsqueda con embeddings: ... Usando contexto tradicional.
```

---

## 🔄 Embeddings Automáticos para Nuevos Datos

Una vez migrado, los **nuevos gastos e ingresos** automáticamente generarán embeddings:

1. Usuario crea un gasto → Backend genera embedding automáticamente
2. Usuario crea un ingreso → Backend genera embedding automáticamente

**No necesitás ejecutar la migración de nuevo**, solo sirve para datos existentes.

---

## ❌ Problemas Comunes

### Error: "DeploymentNotFound" o "404"

**Causa:** No creaste el deployment de embeddings en Azure

**Solución:** Seguí los pasos de "Requisitos Previos → 1. Deployment de Embeddings"

---

### Error: "OperationNotSupportedError"

**Causa:** Estás usando `model-router` que solo soporta chat

**Solución:** Creá un deployment específico con modelo `text-embedding-3-small`

---

### Error: "AZURE_OPENAI_EMBEDDING_DEPLOYMENT not found"

**Causa:** Falta la variable de entorno

**Solución:** 
1. Agregá `AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-small` en `.env`
2. Reiniciá Docker: `docker-compose down && docker-compose up -d`

---

### Chat sigue usando método tradicional

**Diagnóstico:**
```bash
# Verificar que hay embeddings
docker exec analizador-postgres psql -U unlam -d analizador_financiero \
  -c "SELECT COUNT(*) FROM gastos_embeddings;"
```

Si muestra `0`, ejecutá la migración.

Si muestra números > 0, revisá logs del backend:
```bash
docker logs analizador-backend --tail 100
```

---

## 💰 Costos Estimados

### Migración Inicial (26 registros):
- **Tokens usados:** ~5,200 tokens (200 tokens/registro promedio)
- **Costo:** $0.0001 USD (prácticamente gratis)

### Uso Continuo:
- **Cada gasto nuevo:** ~200 tokens = $0.000004 USD
- **Cada consulta de chat:** ~300 tokens = $0.000006 USD
- **Costo mensual estimado (50 gastos + 100 consultas):** $0.001 USD

**Conclusión:** El costo es despreciable 💚

---

## 📚 Próximos Pasos

Una vez completada la migración:

1. ✅ **Testeá el chat** con preguntas específicas
2. ✅ **Verificá que use embeddings** (revisá logs)
3. ✅ **Agregá nuevos gastos** y confirmá que se generen embeddings automáticamente
4. 🎯 **Documentá** qué tipos de preguntas funcionan mejor
5. 🚀 **Optimizá** el contexto si es necesario (ajustando límites en `context_builder_service.py`)

---

## 🆘 Soporte

Si tenés problemas:
1. Revisá los logs: `docker logs analizador-backend --tail 100`
2. Verificá variables de entorno: `docker exec analizador-backend env | grep AZURE`
3. Testea el deployment manualmente (creá un script de prueba)

---

**¡Listo! 🚀 Ahora tu chat usa búsqueda semántica con embeddings.**
