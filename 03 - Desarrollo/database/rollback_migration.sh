#!/bin/bash
################################################################################
# Script: rollback_migration.sh
# Descripción: Revierte la migración de pgvector eliminando tablas y extensión
# Autor: Sistema de Analizador Financiero
# Fecha: 11 noviembre 2025
# Uso: ./database/rollback_migration.sh
################################################################################

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
CONTAINER_NAME="analizador-postgres"
DB_NAME="${DB_NAME:-analizador_financiero}"
DB_USER="${DB_USER:-unlam}"
BACKUP_DIR="$(dirname "$0")/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Función para imprimir con colores
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "$1"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
}

# Verificar que el contenedor existe
check_container() {
    print_header "VERIFICANDO CONTENEDOR"
    
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        print_error "El contenedor $CONTAINER_NAME no está corriendo"
        exit 1
    else
        print_success "Contenedor $CONTAINER_NAME está corriendo"
    fi
}

# Mostrar advertencia y pedir confirmación
show_warning() {
    print_header "⚠️  ADVERTENCIA ⚠️"
    
    echo -e "${RED}Este script eliminará:${NC}"
    echo "  - Tabla 'gastos_embeddings' y todos sus datos"
    echo "  - Tabla 'ingresos_embeddings' y todos sus datos"
    echo "  - Todas las funciones de búsqueda vectorial"
    echo "  - La extensión pgvector (si no la usan otras tablas)"
    echo ""
    
    # Mostrar cuántos embeddings se perderán
    GASTOS_COUNT=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT COUNT(*) FROM gastos_embeddings;" 2>/dev/null || echo "0")
    INGRESOS_COUNT=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT COUNT(*) FROM ingresos_embeddings;" 2>/dev/null || echo "0")
    
    print_warning "Embeddings de gastos que se perderán: $GASTOS_COUNT"
    print_warning "Embeddings de ingresos que se perderán: $INGRESOS_COUNT"
    
    echo ""
    echo -e "${YELLOW}¿Está SEGURO de que desea continuar?${NC}"
    read -p "Escriba 'SI' en mayúsculas para confirmar: " -r
    echo ""
    
    if [[ ! $REPLY == "SI" ]]; then
        print_info "Rollback cancelado"
        exit 0
    fi
}

# Crear backup de los embeddings existentes
backup_embeddings() {
    print_header "CREANDO BACKUP"
    
    mkdir -p "$BACKUP_DIR"
    
    BACKUP_FILE="$BACKUP_DIR/embeddings_backup_$TIMESTAMP.sql"
    
    print_info "Creando backup en: $BACKUP_FILE"
    
    docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" \
        --table=gastos_embeddings \
        --table=ingresos_embeddings \
        --data-only \
        > "$BACKUP_FILE" 2>/dev/null || true
    
    if [ -s "$BACKUP_FILE" ]; then
        FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        print_success "Backup creado exitosamente ($FILE_SIZE)"
        print_info "Puede restaurarlo ejecutando: psql -U $DB_USER -d $DB_NAME < $BACKUP_FILE"
    else
        print_warning "No se pudo crear backup (posiblemente las tablas están vacías)"
        rm -f "$BACKUP_FILE"
    fi
}

# Eliminar funciones de búsqueda
drop_functions() {
    print_header "ELIMINANDO FUNCIONES DE BÚSQUEDA"
    
    print_info "Eliminando funciones de búsqueda vectorial..."
    
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" <<-EOSQL 2>/dev/null || true
        DROP FUNCTION IF EXISTS search_gastos_by_vector(vector, integer, integer, real) CASCADE;
        DROP FUNCTION IF EXISTS search_ingresos_by_vector(vector, integer, integer, real) CASCADE;
        DROP FUNCTION IF EXISTS search_combined_by_vector(vector, integer, integer, real) CASCADE;
        DROP FUNCTION IF EXISTS get_embedding_stats(integer) CASCADE;
        DROP FUNCTION IF EXISTS search_gastos_with_filters(vector, integer, integer, real, jsonb) CASCADE;
        DROP FUNCTION IF EXISTS search_ingresos_with_filters(vector, integer, integer, real, jsonb) CASCADE;
EOSQL
    
    print_success "Funciones eliminadas"
}

# Eliminar índices vectoriales
drop_indexes() {
    print_header "ELIMINANDO ÍNDICES VECTORIALES"
    
    print_info "Eliminando índices IVFFlat..."
    
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" <<-EOSQL 2>/dev/null || true
        DROP INDEX IF EXISTS idx_gastos_embeddings_vector CASCADE;
        DROP INDEX IF EXISTS idx_ingresos_embeddings_vector CASCADE;
EOSQL
    
    print_success "Índices eliminados"
}

# Eliminar tablas de embeddings
drop_tables() {
    print_header "ELIMINANDO TABLAS DE EMBEDDINGS"
    
    print_info "Eliminando tabla gastos_embeddings..."
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c \
        "DROP TABLE IF EXISTS gastos_embeddings CASCADE;" > /dev/null
    print_success "Tabla gastos_embeddings eliminada"
    
    print_info "Eliminando tabla ingresos_embeddings..."
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c \
        "DROP TABLE IF EXISTS ingresos_embeddings CASCADE;" > /dev/null
    print_success "Tabla ingresos_embeddings eliminada"
}

# Verificar si hay otras tablas usando pgvector
check_other_vector_tables() {
    print_header "VERIFICANDO OTRAS TABLAS VECTORIALES"
    
    OTHER_TABLES=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT COUNT(*) 
         FROM information_schema.columns 
         WHERE udt_name = 'vector' 
         AND table_schema = 'public';")
    
    if [ "$OTHER_TABLES" -gt 0 ]; then
        print_warning "Hay $OTHER_TABLES columnas que usan el tipo vector en otras tablas"
        print_info "NO se eliminará la extensión pgvector para no afectar otras tablas"
        return 1
    else
        print_info "No hay otras tablas usando el tipo vector"
        return 0
    fi
}

# Eliminar extensión pgvector
drop_extension() {
    print_header "ELIMINANDO EXTENSIÓN PGVECTOR"
    
    if check_other_vector_tables; then
        echo ""
        read -p "¿Desea eliminar la extensión pgvector? [y/N]: " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Eliminando extensión pgvector..."
            docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c \
                "DROP EXTENSION IF EXISTS vector CASCADE;" > /dev/null
            print_success "Extensión pgvector eliminada"
        else
            print_info "Extensión pgvector conservada"
        fi
    fi
}

# Verificar que todo se eliminó
verify_rollback() {
    print_header "VERIFICANDO ROLLBACK"
    
    # Verificar tablas
    GASTOS_EXISTS=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'gastos_embeddings';")
    
    INGRESOS_EXISTS=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'ingresos_embeddings';")
    
    if [ "$GASTOS_EXISTS" -eq 0 ] && [ "$INGRESOS_EXISTS" -eq 0 ]; then
        print_success "Tablas de embeddings eliminadas correctamente"
    else
        print_warning "Algunas tablas no se eliminaron completamente"
    fi
    
    # Verificar funciones
    FUNCTIONS_COUNT=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT COUNT(*) FROM pg_proc WHERE proname LIKE '%embedding%' OR proname LIKE '%vector%';")
    
    if [ "$FUNCTIONS_COUNT" -eq 0 ]; then
        print_success "Funciones de búsqueda eliminadas correctamente"
    else
        print_info "Quedan $FUNCTIONS_COUNT funciones relacionadas con vectores"
    fi
    
    # Verificar extensión
    PGVECTOR_EXISTS=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT COUNT(*) FROM pg_extension WHERE extname = 'vector';")
    
    if [ "$PGVECTOR_EXISTS" -eq 0 ]; then
        print_success "Extensión pgvector eliminada"
    else
        print_info "Extensión pgvector conservada"
    fi
}

# Mostrar instrucciones de recuperación
show_recovery_instructions() {
    print_header "INSTRUCCIONES DE RECUPERACIÓN"
    
    echo "Si necesita restaurar la migración de pgvector, ejecute:"
    echo ""
    echo "  ./database/migrate_pgvector.sh"
    echo ""
    
    if [ -f "$BACKUP_FILE" ]; then
        echo "Para restaurar los embeddings que se eliminaron, ejecute:"
        echo ""
        echo "  docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME < $BACKUP_FILE"
        echo "  cd backend && python generate_embeddings.py --force-regenerate"
        echo ""
    fi
}

# Mostrar resumen
show_summary() {
    print_header "RESUMEN DE ROLLBACK"
    
    echo "✅ Funciones de búsqueda: ELIMINADAS"
    echo "✅ Índices vectoriales: ELIMINADOS"
    echo "✅ Tabla gastos_embeddings: ELIMINADA"
    echo "✅ Tabla ingresos_embeddings: ELIMINADA"
    
    PGVECTOR_EXISTS=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT COUNT(*) FROM pg_extension WHERE extname = 'vector';")
    
    if [ "$PGVECTOR_EXISTS" -eq 0 ]; then
        echo "✅ Extensión pgvector: ELIMINADA"
    else
        echo "ℹ️  Extensión pgvector: CONSERVADA"
    fi
    
    echo ""
}

# Main execution
main() {
    print_header "ROLLBACK DE MIGRACIÓN PGVECTOR"
    
    check_container
    show_warning
    backup_embeddings
    drop_functions
    drop_indexes
    drop_tables
    drop_extension
    verify_rollback
    show_summary
    show_recovery_instructions
    
    print_success "🎉 Rollback completado exitosamente!"
}

# Ejecutar script principal
main
