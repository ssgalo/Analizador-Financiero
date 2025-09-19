#!/bin/bash
# Script para crear Epics 2 y 3 con Features y User Stories en Azure DevOps usando Azure CLI
# La Épica 1 ya fue creada manualmente

ORG_URL="https://dev.azure.com/ia-aplicada-unlam"
PROJECT="Analizador Financiero"

# Configuración inicial
az devops configure --defaults organization=$ORG_URL project="$PROJECT"

echo "Creando Épica 2: Clasificación inteligente de gastos..."
# EPIC 2
EPIC2_ID=$(az boards work-item create --type Epic --title "Clasificación inteligente de gastos" --description "Implementar IA para categorizar automáticamente los gastos. Mejorar la extracción de datos con OCR y procesamiento contextual." --query "id" --output tsv)
echo "Épica 2 creada con ID: $EPIC2_ID"

echo "Creando Features para Épica 2..."
# FEATURES EPIC 2
FEAT21_ID=$(az boards work-item create --type Feature --title "Clasificación automática por IA" --description "Clasificar automáticamente los gastos en categorías relevantes al importarlos." --query "id" --output tsv)
az boards work-item relation add --id $FEAT21_ID --relation-type parent --target-id $EPIC2_ID

FEAT22_ID=$(az boards work-item create --type Feature --title "Procesamiento contextual y OCR" --description "Extraer correctamente monto, fecha, comercio y categoría desde archivos PDF e imágenes." --query "id" --output tsv)
az boards work-item relation add --id $FEAT22_ID --relation-type parent --target-id $EPIC2_ID

echo "Creando Épica 3: Integración con billeteras virtuales y bancos..."
# EPIC 3
EPIC3_ID=$(az boards work-item create --type Epic --title "Integración con billeteras virtuales y bancos" --description "Integrar MercadoPago (API y MCP). Preparar arquitectura para sumar nuevas fuentes de datos." --query "id" --output tsv)
echo "Épica 3 creada con ID: $EPIC3_ID"

echo "Creando Features para Épica 3..."
# FEATURES EPIC 3
FEAT31_ID=$(az boards work-item create --type Feature --title "Integración con MercadoPago" --description "Vincular cuenta de MercadoPago para importar movimientos automáticamente." --query "id" --output tsv)
az boards work-item relation add --id $FEAT31_ID --relation-type parent --target-id $EPIC3_ID

FEAT32_ID=$(az boards work-item create --type Feature --title "Arquitectura preparada para nuevas integraciones" --description "Permitir agregar fácilmente nuevas fuentes de datos en el futuro." --query "id" --output tsv)
az boards work-item relation add --id $FEAT32_ID --relation-type parent --target-id $EPIC3_ID

echo "Creando User Stories para Feature 2.1..."
# USER STORIES FEATURE 2.1
US211_ID=$(az boards work-item create --type "User Story" --title "Clasificación automática de gastos" --description "Como usuario, quiero que la app clasifique automáticamente mis gastos en categorías relevantes al importarlos." --query "id" --output tsv)
az boards work-item relation add --id $US211_ID --relation-type parent --target-id $FEAT21_ID

US212_ID=$(az boards work-item create --type "User Story" --title "Ver categoría sugerida por IA" --description "Como usuario, quiero ver la categoría sugerida por la IA en cada gasto." --query "id" --output tsv)
az boards work-item relation add --id $US212_ID --relation-type parent --target-id $FEAT21_ID

US213_ID=$(az boards work-item create --type "User Story" --title "Modificar categoría sugerida" --description "Como usuario, quiero poder modificar la categoría sugerida por la IA si no es correcta." --query "id" --output tsv)
az boards work-item relation add --id $US213_ID --relation-type parent --target-id $FEAT21_ID

echo "Creando User Stories para Feature 2.2..."
# USER STORIES FEATURE 2.2
US221_ID=$(az boards work-item create --type "User Story" --title "Extracción de datos desde archivos" --description "Como usuario, quiero que la app extraiga correctamente el monto, fecha, comercio y categoría desde archivos PDF e imágenes." --query "id" --output tsv)
az boards work-item relation add --id $US221_ID --relation-type parent --target-id $FEAT22_ID

US222_ID=$(az boards work-item create --type "User Story" --title "Previsualización de datos extraídos" --description "Como usuario, quiero que la app me muestre los datos extraídos antes de confirmar la importación." --query "id" --output tsv)
az boards work-item relation add --id $US222_ID --relation-type parent --target-id $FEAT22_ID

echo "Creando User Stories para Feature 3.1..."
# USER STORIES FEATURE 3.1
US311_ID=$(az boards work-item create --type "User Story" --title "Vincular cuenta MercadoPago" --description "Como usuario, quiero vincular mi cuenta de MercadoPago para importar automáticamente mis movimientos." --query "id" --output tsv)
az boards work-item relation add --id $US311_ID --relation-type parent --target-id $FEAT31_ID

US312_ID=$(az boards work-item create --type "User Story" --title "Ver gastos de MercadoPago en la app" --description "Como usuario, quiero ver los gastos de MercadoPago integrados en mi historial de la app." --query "id" --output tsv)
az boards work-item relation add --id $US312_ID --relation-type parent --target-id $FEAT31_ID

US313_ID=$(az boards work-item create --type "User Story" --title "Actualizar movimientos de MercadoPago" --description "Como usuario, quiero actualizar los movimientos de MercadoPago en la app de forma manual o automática." --query "id" --output tsv)
az boards work-item relation add --id $US313_ID --relation-type parent --target-id $FEAT31_ID

echo "Creando User Stories para Feature 3.2..."
# USER STORIES FEATURE 3.2
US321_ID=$(az boards work-item create --type "User Story" --title "Arquitectura extensible para nuevas fuentes" --description "Como desarrollador, quiero que la arquitectura permita agregar fácilmente nuevas fuentes de datos (billeteras, bancos) en el futuro." --query "id" --output tsv)
az boards work-item relation add --id $US321_ID --relation-type parent --target-id $FEAT32_ID

US322_ID=$(az boards work-item create --type "User Story" --title "Informar fuentes disponibles" --description "Como usuario, quiero que la app me informe qué fuentes de datos están disponibles para integración." --query "id" --output tsv)
az boards work-item relation add --id $US322_ID --relation-type parent --target-id $FEAT32_ID

echo "¡Script completado! Se crearon las Épicas 2 y 3 con todas sus Features y User Stories."
az boards work-item create --type "User Story" --title "Arquitectura extensible para nuevas fuentes" --description "Como desarrollador, quiero que la arquitectura permita agregar fácilmente nuevas fuentes de datos (billeteras, bancos) en el futuro." --parent $FEAT32_ID
az boards work-item create --type "User Story" --title "Informar fuentes disponibles" --description "Como usuario, quiero que la app me informe qué fuentes de datos están disponibles para integración." --parent $FEAT32_ID
