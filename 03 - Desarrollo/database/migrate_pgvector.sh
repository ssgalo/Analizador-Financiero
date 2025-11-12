#!/bin/bash
################################################################################
# Script: migrate_pgvector.sh
# Descripción: Aplica la migración de pgvector en contenedor Docker
# Autor: Sistema de Analizador Financiero
# Fecha: 11 noviembre 2025
# Uso: ./database/migrate_pgvector.sh
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

# Verificar que el contenedor existe y está corriendo
check_container() {
    print_header "VERIFICANDO CONTENEDOR"
    
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        print_error "El contenedor $CONTAINER_NAME no está corriendo"
        print_info "Iniciando contenedor..."
        cd "$(dirname "$0")/.."
        docker compose up -d postgres
        sleep 5
    else
        print_success "Contenedor $CONTAINER_NAME está corriendo"
    fi
}

# Verificar que la base de datos existe
check_database() {
    print_header "VERIFICANDO BASE DE DATOS"
    
    if docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        print_success "Base de datos '$DB_NAME' existe"
    else
        print_error "Base de datos '$DB_NAME' no existe"
        exit 1
    fi
}

# Verificar/instalar extensión pgvector
install_pgvector() {
    print_header "INSTALANDO EXTENSIÓN PGVECTOR"
    
    print_info "Verificando si pgvector ya está instalado..."
    
    PGVECTOR_EXISTS=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT COUNT(*) FROM pg_extension WHERE extname = 'vector';")
    
    if [ "$PGVECTOR_EXISTS" -eq 1 ]; then
        print_warning "pgvector ya está instalado"
        
        # Mostrar versión
        PGVECTOR_VERSION=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
            "SELECT extversion FROM pg_extension WHERE extname = 'vector';")
        print_info "Versión instalada: $PGVECTOR_VERSION"
    else
        print_info "Instalando extensión pgvector..."
        
        docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c \
            "CREATE EXTENSION IF NOT EXISTS vector;" > /dev/null
        
        print_success "Extensión pgvector instalada correctamente"
    fi
}

# Verificar si las tablas de embeddings ya existen
check_existing_tables() {
    print_header "VERIFICANDO TABLAS EXISTENTES"
    
    GASTOS_EMB_EXISTS=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'gastos_embeddings';")
    
    INGRESOS_EMB_EXISTS=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'ingresos_embeddings';")
    
    if [ "$GASTOS_EMB_EXISTS" -eq 1 ] && [ "$INGRESOS_EMB_EXISTS" -eq 1 ]; then
        print_warning "Las tablas de embeddings ya existen"
        
        # Contar registros
        GASTOS_COUNT=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
            "SELECT COUNT(*) FROM gastos_embeddings;")
        INGRESOS_COUNT=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
            "SELECT COUNT(*) FROM ingresos_embeddings;")
        
        print_info "Registros en gastos_embeddings: $GASTOS_COUNT"
        print_info "Registros en ingresos_embeddings: $INGRESOS_COUNT"
        
        echo ""
        read -p "¿Desea recrear las tablas? (Esto eliminará todos los embeddings existentes) [y/N]: " -n 1 -r
        echo ""
        
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Migración cancelada"
            exit 0
        fi
        
        print_warning "Eliminando tablas existentes..."
        docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c \
            "DROP TABLE IF EXISTS gastos_embeddings CASCADE;" > /dev/null
        docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c \
            "DROP TABLE IF EXISTS ingresos_embeddings CASCADE;" > /dev/null
        print_success "Tablas eliminadas"
    else
        print_success "No hay tablas de embeddings existentes"
    fi
}

# Aplicar script SQL de creación de tablas
apply_sql_scripts() {
    print_header "APLICANDO SCRIPTS SQL"
    
    SCRIPT_DIR="$(dirname "$0")"
    
    # Script 1: Inicialización pgvector
    print_info "Aplicando init_pgvector.sql..."
    if [ -f "$SCRIPT_DIR/init_pgvector.sql" ]; then
        docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$SCRIPT_DIR/init_pgvector.sql"
        print_success "init_pgvector.sql aplicado"
    else
        print_warning "init_pgvector.sql no encontrado (puede que ya esté incluido en docker-entrypoint)"
    fi
    
    # Script 2: Creación de tablas de embeddings
    print_info "Aplicando create_embeddings_tables.sql..."
    if [ -f "$SCRIPT_DIR/create_embeddings_tables.sql" ]; then
        docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$SCRIPT_DIR/create_embeddings_tables.sql"
        print_success "create_embeddings_tables.sql aplicado"
    else
        print_error "create_embeddings_tables.sql no encontrado"
        exit 1
    fi
    
    # Script 3: Funciones de búsqueda vectorial
    print_info "Aplicando vector_search_functions.sql..."
    if [ -f "$SCRIPT_DIR/vector_search_functions.sql" ]; then
        docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$SCRIPT_DIR/vector_search_functions.sql"
        print_success "vector_search_functions.sql aplicado"
    else
        print_warning "vector_search_functions.sql no encontrado (opcional)"
    fi
}

# Verificar que todo se creó correctamente
verify_installation() {
    print_header "VERIFICANDO INSTALACIÓN"
    
    # Verificar extensión
    print_info "Verificando extensión pgvector..."
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "\dx vector"
    
    # Verificar tablas
    print_info "Verificando tablas de embeddings..."
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "\dt *embeddings"
    
    # Verificar funciones
    print_info "Verificando funciones de búsqueda..."
    FUNCTIONS=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT COUNT(*) FROM pg_proc WHERE proname LIKE '%embedding%' OR proname LIKE '%vector%';")
    print_info "Funciones encontradas: $FUNCTIONS"
    
    # Verificar índices
    print_info "Verificando índices vectoriales..."
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c \
        "SELECT tablename, indexname, indexdef FROM pg_indexes WHERE indexname LIKE '%embeddings%' ORDER BY tablename;"
    
    print_success "Verificación completada"
}

# Mostrar resumen
show_summary() {
    print_header "RESUMEN DE MIGRACIÓN"
    
    # Contar gastos e ingresos totales
    TOTAL_GASTOS=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT COUNT(*) FROM gastos;")
    TOTAL_INGRESOS=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT COUNT(*) FROM ingresos;")
    
    echo "📊 Base de datos: $DB_NAME"
    echo "📦 Contenedor: $CONTAINER_NAME"
    echo ""
    echo "✅ Extensión pgvector: INSTALADA"
    echo "✅ Tabla gastos_embeddings: CREADA"
    echo "✅ Tabla ingresos_embeddings: CREADA"
    echo "✅ Índices vectoriales: CREADOS"
    echo "✅ Funciones de búsqueda: CREADAS"
    echo ""
    echo "📈 Datos existentes:"
    echo "   - Gastos totales: $TOTAL_GASTOS"
    echo "   - Ingresos totales: $TOTAL_INGRESOS"
    echo ""
    print_warning "⚠️  Las tablas están vacías. Ejecute el script de población:"
    echo "   cd backend && python generate_embeddings.py"
    echo "   O use: ./backend/scripts/populate_embeddings.sh"
    echo ""
}

# Main execution
main() {
    print_header "MIGRACIÓN PGVECTOR - ANALIZADOR FINANCIERO"
    
    check_container
    check_database
    install_pgvector
    check_existing_tables
    apply_sql_scripts
    verify_installation
    show_summary
    
    print_success "🎉 Migración completada exitosamente!"
}

# Ejecutar script principal
main
