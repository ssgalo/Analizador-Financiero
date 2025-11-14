# FASE 3: Scripts de Migración y Población - COMPLETADA ✅

## Archivos Creados

### 1. Script de Migración (Bash)
**Archivo:** `database/migrate_pgvector.sh`
- ✅ Verifica contenedor Docker está corriendo
- ✅ Verifica que la base de datos existe
- ✅ Instala extensión pgvector
- ✅ Maneja tablas existentes con confirmación
- ✅ Aplica scripts SQL (init_pgvector.sql, create_embeddings_tables.sql, vector_search_functions.sql)
- ✅ Verifica instalación completa
- ✅ Muestra resumen con estadísticas
- ✅ Output colorizado con emojis
- ✅ Manejo de errores con set -e

**Uso:**
```bash
cd "03 - Desarrollo"
./database/migrate_pgvector.sh
```

### 2. Script de Población de Embeddings (Python)
**Archivo:** `backend/scripts/populate_embeddings.py`

**Características:**
- ✅ Generación masiva de embeddings para gastos e ingresos
- ✅ Procesamiento por lotes (batch processing)
- ✅ Modo dry-run para simulación
- ✅ Filtros por usuario, tipo de registro
- ✅ Regeneración forzada de embeddings existentes
- ✅ Logging a archivo y consola
- ✅ Progress tracking con estadísticas
- ✅ Manejo de errores y reintentos
- ✅ Commits cada N registros para evitar pérdida de datos
- ✅ Estimación de costos de API

**Opciones:**
```bash
--batch-size N          # Tamaño del lote (default: 100)
--force-regenerate      # Regenera embeddings existentes
--user-id N             # Solo usuario específico
--gastos-only           # Solo gastos
--ingresos-only         # Solo ingresos
--dry-run               # Simula sin ejecutar
--verbose               # Información detallada
```

**Uso:**
```bash
cd backend
python scripts/populate_embeddings.py --batch-size 50
python scripts/populate_embeddings.py --user-id 1 --verbose
python scripts/populate_embeddings.py --dry-run
```

### 3. Script de Testing de Migración (Python)
**Archivo:** `backend/scripts/test_migration.py`

**Tests Implementados:**
1. ✅ Test de conexión a base de datos
2. ✅ Verificación de extensión pgvector instalada
3. ✅ Verificación de tablas de embeddings creadas
4. ✅ Validación de estructura de tablas (columnas vector)
5. ✅ Verificación de índices IVFFlat
6. ✅ Validación de foreign keys
7. ✅ Verificación de funciones de búsqueda SQL
8. ✅ Test de integridad de datos (cobertura, huérfanos)
9. ✅ Test de operaciones vectoriales (distancias)

**Características:**
- ✅ Output colorizado con emojis
- ✅ Modo verbose para detalles
- ✅ Resumen final con tasa de éxito
- ✅ Exit code 0 si todo pasa, 1 si hay fallos
- ✅ Warnings para problemas no críticos

**Uso:**
```bash
cd backend
python scripts/test_migration.py
python scripts/test_migration.py --verbose
```

### 4. Script de Rollback (Bash)
**Archivo:** `database/rollback_migration.sh`

**Características:**
- ✅ Advertencia clara con confirmación obligatoria
- ✅ Backup automático de embeddings antes de eliminar
- ✅ Eliminación de funciones de búsqueda
- ✅ Eliminación de índices vectoriales
- ✅ Eliminación de tablas de embeddings
- ✅ Opción de eliminar extensión pgvector
- ✅ Verificación de otras tablas usando pgvector
- ✅ Instrucciones de recuperación
- ✅ Backup guardado en database/backups/

**Uso:**
```bash
cd "03 - Desarrollo"
./database/rollback_migration.sh
```

## Flujo de Trabajo Recomendado

### 1️⃣ Aplicar Migración
```bash
cd "03 - Desarrollo"
./database/migrate_pgvector.sh
```

### 2️⃣ Verificar Migración
```bash
cd backend
python scripts/test_migration.py --verbose
```

### 3️⃣ Poblar Embeddings
```bash
# Primero hacer dry-run para ver qué se procesará
python scripts/populate_embeddings.py --dry-run

# Luego ejecutar
python scripts/populate_embeddings.py --batch-size 100 --verbose
```

### 4️⃣ Verificar Población
```bash
python scripts/test_migration.py --verbose
```

## Manejo de Errores

### Si la migración falla
```bash
# Ver logs del contenedor
docker logs analizador-postgres

# Revisar conexión
docker exec -it analizador-postgres psql -U unlam -d analizador_financiero
```

### Si la población falla
```bash
# Ver log de población
cat populate_embeddings.log

# Reintentar con batch más pequeño
python scripts/populate_embeddings.py --batch-size 10 --verbose
```

### Si hay problemas, hacer rollback
```bash
./database/rollback_migration.sh
```

## Verificación Manual con pgAdmin

Después de completar FASE 3, puedes verificar en pgAdmin:

```sql
-- Ver cobertura de embeddings
SELECT 
    (SELECT COUNT(*) FROM gastos_embeddings) as gastos_embeddings,
    (SELECT COUNT(*) FROM gastos) as total_gastos,
    (SELECT COUNT(*) FROM ingresos_embeddings) as ingresos_embeddings,
    (SELECT COUNT(*) FROM ingresos) as total_ingresos;

-- Ver embeddings recientes
SELECT id, id_gasto, id_usuario, 
       substring(texto, 1, 100) as texto_preview,
       fecha_creacion
FROM gastos_embeddings
ORDER BY fecha_creacion DESC
LIMIT 5;
```

## Archivos de Backup

Los backups se guardan en:
```
database/backups/embeddings_backup_YYYYMMDD_HHMMSS.sql
```

Para restaurar un backup:
```bash
docker exec -i analizador-postgres psql -U unlam -d analizador_financiero < database/backups/embeddings_backup_20241111_153045.sql
```

## Logs

### populate_embeddings.log
Contiene registro detallado de:
- Registros procesados
- Errores encontrados
- Tiempos de ejecución
- Estimación de costos

### Docker logs
```bash
docker logs analizador-postgres
docker logs analizador-backend
```

## Permisos de Ejecución

Los scripts bash tienen permisos de ejecución:
```bash
chmod +x database/migrate_pgvector.sh
chmod +x database/rollback_migration.sh
```

## Próximos Pasos

Con FASE 3 completada, puedes proceder a:
- **FASE 4:** Testing de funcionalidad completa
- **FASE 5:** Deployment en VPS
- **FASE 6:** Monitoreo y optimización

---

**Fecha de Completación:** 11 noviembre 2025
**Archivos Creados:** 4 scripts (2 bash, 2 python)
**Estado:** ✅ COMPLETADA
