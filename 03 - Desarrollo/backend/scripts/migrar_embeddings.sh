#!/bin/bash
# ============================================================================
# Script de Migración de Embeddings
# ============================================================================
# Wrapper para ejecutar la migración de embeddings dentro del contenedor Docker
#
# Uso:
#   ./scripts/migrar_embeddings.sh [gasto|ingreso|all] [limite]
#
# Ejemplos:
#   ./scripts/migrar_embeddings.sh                  # Migra todo
#   ./scripts/migrar_embeddings.sh gasto            # Solo gastos
#   ./scripts/migrar_embeddings.sh ingreso 10       # Solo 10 ingresos
#
# Autor: Sistema de Analizador Financiero
# Fecha: 12 noviembre 2025
# ============================================================================

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
CONTAINER_NAME="analizador-backend"
SCRIPT_PATH="scripts/migrar_embeddings_existentes.py"

# Parámetros
TIPO="${1:-all}"
LIMITE="${2:-}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🚀 MIGRACIÓN DE EMBEDDINGS - DOCKER                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar que el contenedor esté corriendo
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}❌ Error: El contenedor '$CONTAINER_NAME' no está corriendo${NC}"
    echo -e "${YELLOW}💡 Ejecuta: docker-compose up -d${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Contenedor encontrado${NC}"
echo ""

# Construir comando
CMD="python $SCRIPT_PATH --tipo $TIPO"
if [ -n "$LIMITE" ]; then
    CMD="$CMD --limite $LIMITE"
fi

echo -e "${BLUE}📋 Configuración:${NC}"
echo -e "   Tipo: ${YELLOW}$TIPO${NC}"
echo -e "   Límite: ${YELLOW}${LIMITE:-Sin límite}${NC}"
echo ""

# Preguntar confirmación
read -p "¿Continuar con la migración? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}⚠️ Migración cancelada${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}🚀 Ejecutando migración...${NC}"
echo ""

# Ejecutar script en el contenedor
docker exec -it "$CONTAINER_NAME" $CMD

# Verificar resultado
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          ✅ MIGRACIÓN COMPLETADA EXITOSAMENTE              ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Mostrar conteo de embeddings
    echo -e "${BLUE}📊 Verificando embeddings creados...${NC}"
    echo ""
    
    GASTOS_EMBEDDINGS=$(docker exec "$CONTAINER_NAME" python -c "
from app.crud.base import SessionLocal
from app.models.embeddings import GastoEmbedding
db = SessionLocal()
print(db.query(GastoEmbedding).count())
db.close()
" 2>/dev/null || echo "?")
    
    INGRESOS_EMBEDDINGS=$(docker exec "$CONTAINER_NAME" python -c "
from app.crud.base import SessionLocal
from app.models.embeddings import IngresoEmbedding
db = SessionLocal()
print(db.query(IngresoEmbedding).count())
db.close()
" 2>/dev/null || echo "?")
    
    echo -e "   Gastos con embeddings: ${GREEN}$GASTOS_EMBEDDINGS${NC}"
    echo -e "   Ingresos con embeddings: ${GREEN}$INGRESOS_EMBEDDINGS${NC}"
    echo ""
    
else
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║          ❌ ERROR EN LA MIGRACIÓN                          ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}💡 Verifica los logs arriba para más detalles${NC}"
    exit 1
fi
