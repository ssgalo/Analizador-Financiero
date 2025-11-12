"""
Endpoints API de Embeddings
============================
Endpoints para gestión de embeddings vectoriales

Funcionalidades:
- Generar embeddings para gastos/ingresos individuales o en lote
- Consultar estadísticas de cobertura de embeddings
- Regenerar embeddings
- Búsqueda vectorial de prueba

Autor: Sistema de Analizador Financiero
Fecha: 11 noviembre 2025
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.api.deps import get_db, get_current_user
from app.models.usuario import Usuario
from app.models.gasto import Gasto
from app.models.ingreso import Ingreso
from app.models.embeddings import GastoEmbedding, IngresoEmbedding
from app.services.embeddings_service import EmbeddingsService
from app.services.vector_search_service import VectorSearchService

logger = logging.getLogger(__name__)

router = APIRouter()


# ==================== SCHEMAS ====================

class EmbeddingGenerateRequest(BaseModel):
    """Request para generar embedding de un gasto o ingreso."""
    entity_type: str = Field(..., description="Tipo de entidad: 'gasto' o 'ingreso'")
    entity_id: int = Field(..., description="ID del gasto o ingreso")


class EmbeddingBatchGenerateRequest(BaseModel):
    """Request para generar embeddings en lote."""
    entity_type: str = Field(..., description="Tipo de entidad: 'gasto' o 'ingreso'")
    entity_ids: Optional[List[int]] = Field(None, description="IDs específicos (None = todos)")
    force_regenerate: bool = Field(False, description="Regenerar incluso si ya existe")


class EmbeddingSearchRequest(BaseModel):
    """Request para búsqueda vectorial."""
    query: str = Field(..., description="Texto de búsqueda")
    entity_type: str = Field(..., description="'gastos', 'ingresos' o 'combined'")
    limit: int = Field(10, ge=1, le=100, description="Número de resultados")
    similarity_threshold: float = Field(0.7, ge=0.0, le=1.0, description="Umbral de similitud")


class EmbeddingStatsResponse(BaseModel):
    """Response con estadísticas de embeddings."""
    gastos: dict
    ingresos: dict


# ==================== ENDPOINTS ====================

@router.post("/generate", status_code=status.HTTP_201_CREATED)
def generate_embedding(
    request: EmbeddingGenerateRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Genera un embedding para un gasto o ingreso específico.
    
    - **entity_type**: "gasto" o "ingreso"
    - **entity_id**: ID del gasto o ingreso
    """
    try:
        embeddings_service = EmbeddingsService()
        
        if request.entity_type == "gasto":
            # Buscar el gasto
            gasto = db.query(Gasto).filter(
                Gasto.id_gasto == request.entity_id,
                Gasto.id_usuario == current_user.id_usuario
            ).first()
            
            if not gasto:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Gasto no encontrado"
                )
            
            # Verificar si ya existe embedding
            existing = db.query(GastoEmbedding).filter(
                GastoEmbedding.gasto_id == gasto.id_gasto
            ).first()
            
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="El embedding ya existe. Use regenerate para actualizarlo."
                )
            
            # Construir texto y generar embedding
            gasto_dict = {
                "descripcion": gasto.descripcion,
                "categoria": gasto.categoria.nombre if gasto.categoria else None,
                "monto": gasto.monto,
                "moneda": gasto.moneda,
                "fecha": gasto.fecha,
                "comercio": gasto.comercio
            }
            
            texto = embeddings_service.build_gasto_text(gasto_dict)
            embedding = embeddings_service.generate_embedding(texto)
            
            if not embedding:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error generando embedding"
                )
            
            # Guardar en base de datos
            metadata = embeddings_service.build_metadata(gasto_dict, "gasto")
            gasto_embedding = GastoEmbedding(
                gasto_id=gasto.id_gasto,
                embedding=embedding,
                texto_original=texto,
                metadata=metadata
            )
            
            db.add(gasto_embedding)
            db.commit()
            db.refresh(gasto_embedding)
            
            return {
                "message": "Embedding generado exitosamente",
                "entity_type": "gasto",
                "entity_id": gasto.id_gasto,
                "embedding_id": gasto_embedding.id
            }
            
        elif request.entity_type == "ingreso":
            # Similar para ingresos
            ingreso = db.query(Ingreso).filter(
                Ingreso.id_ingreso == request.entity_id,
                Ingreso.id_usuario == current_user.id_usuario
            ).first()
            
            if not ingreso:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Ingreso no encontrado"
                )
            
            # Verificar si ya existe embedding
            existing = db.query(IngresoEmbedding).filter(
                IngresoEmbedding.ingreso_id == ingreso.id_ingreso
            ).first()
            
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="El embedding ya existe. Use regenerate para actualizarlo."
                )
            
            # Construir texto y generar embedding
            ingreso_dict = {
                "descripcion": ingreso.descripcion,
                "categoria": ingreso.categoria.nombre if ingreso.categoria else None,
                "monto": ingreso.monto,
                "moneda": ingreso.moneda,
                "fecha": ingreso.fecha
            }
            
            texto = embeddings_service.build_ingreso_text(ingreso_dict)
            embedding = embeddings_service.generate_embedding(texto)
            
            if not embedding:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error generando embedding"
                )
            
            # Guardar en base de datos
            metadata = embeddings_service.build_metadata(ingreso_dict, "ingreso")
            ingreso_embedding = IngresoEmbedding(
                ingreso_id=ingreso.id_ingreso,
                embedding=embedding,
                texto_original=texto,
                metadata=metadata
            )
            
            db.add(ingreso_embedding)
            db.commit()
            db.refresh(ingreso_embedding)
            
            return {
                "message": "Embedding generado exitosamente",
                "entity_type": "ingreso",
                "entity_id": ingreso.id_ingreso,
                "embedding_id": ingreso_embedding.id
            }
            
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="entity_type debe ser 'gasto' o 'ingreso'"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generando embedding: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno: {str(e)}"
        )


@router.post("/generate-batch")
def generate_embeddings_batch(
    request: EmbeddingBatchGenerateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Genera embeddings en lote para múltiples gastos o ingresos.
    
    Proceso ejecutado en background para no bloquear la respuesta.
    
    - **entity_type**: "gasto" o "ingreso"
    - **entity_ids**: Lista de IDs (opcional, None = todos)
    - **force_regenerate**: Regenerar embeddings existentes
    """
    # Agregar tarea en background
    background_tasks.add_task(
        _generate_batch_background,
        db,
        current_user.id_usuario,
        request.entity_type,
        request.entity_ids,
        request.force_regenerate
    )
    
    return {
        "message": "Generación de embeddings iniciada en background",
        "entity_type": request.entity_type,
        "count": len(request.entity_ids) if request.entity_ids else "todos"
    }


@router.get("/stats", response_model=EmbeddingStatsResponse)
def get_embedding_stats(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene estadísticas de cobertura de embeddings.
    
    Retorna información sobre cuántos gastos e ingresos tienen embeddings generados.
    """
    try:
        search_service = VectorSearchService(db)
        stats = search_service.get_embedding_stats()
        
        return EmbeddingStatsResponse(
            gastos=stats.get("gastos", {}),
            ingresos=stats.get("ingresos", {})
        )
        
    except Exception as e:
        logger.error(f"Error obteniendo estadísticas: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno: {str(e)}"
        )


@router.post("/search")
def search_by_vector(
    request: EmbeddingSearchRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Realiza una búsqueda vectorial por similitud semántica.
    
    - **query**: Texto de búsqueda en lenguaje natural
    - **entity_type**: "gastos", "ingresos" o "combined"
    - **limit**: Número máximo de resultados
    - **similarity_threshold**: Umbral mínimo de similitud (0-1)
    """
    try:
        # Generar embedding de la consulta
        embeddings_service = EmbeddingsService()
        query_embedding = embeddings_service.generate_embedding(request.query)
        
        if not query_embedding:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error generando embedding de búsqueda"
            )
        
        # Realizar búsqueda vectorial
        search_service = VectorSearchService(db)
        
        if request.entity_type == "gastos":
            results = search_service.search_gastos(
                query_embedding,
                limit=request.limit,
                similarity_threshold=request.similarity_threshold
            )
            return {"gastos": results, "ingresos": []}
            
        elif request.entity_type == "ingresos":
            results = search_service.search_ingresos(
                query_embedding,
                limit=request.limit,
                similarity_threshold=request.similarity_threshold
            )
            return {"gastos": [], "ingresos": results}
            
        elif request.entity_type == "combined":
            gastos, ingresos = search_service.search_combined(
                query_embedding,
                limit=request.limit,
                similarity_threshold=request.similarity_threshold
            )
            return {"gastos": gastos, "ingresos": ingresos}
            
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="entity_type debe ser 'gastos', 'ingresos' o 'combined'"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en búsqueda vectorial: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno: {str(e)}"
        )


# ==================== FUNCIONES AUXILIARES ====================

def _generate_batch_background(
    db: Session,
    user_id: int,
    entity_type: str,
    entity_ids: Optional[List[int]],
    force_regenerate: bool
):
    """
    Función ejecutada en background para generar embeddings en lote.
    """
    try:
        embeddings_service = EmbeddingsService()
        logger.info(
            f"Iniciando generación batch: {entity_type}, "
            f"user={user_id}, force={force_regenerate}"
        )
        
        if entity_type == "gasto":
            # Obtener gastos
            query = db.query(Gasto).filter(Gasto.id_usuario == user_id)
            if entity_ids:
                query = query.filter(Gasto.id_gasto.in_(entity_ids))
            gastos = query.all()
            
            logger.info(f"Procesando {len(gastos)} gastos")
            
            for gasto in gastos:
                # Verificar si ya existe
                if not force_regenerate:
                    existing = db.query(GastoEmbedding).filter(
                        GastoEmbedding.gasto_id == gasto.id_gasto
                    ).first()
                    if existing:
                        continue
                
                # Generar embedding
                gasto_dict = {
                    "descripcion": gasto.descripcion,
                    "categoria": gasto.categoria.nombre if gasto.categoria else None,
                    "monto": gasto.monto,
                    "moneda": gasto.moneda,
                    "fecha": gasto.fecha,
                    "comercio": gasto.comercio
                }
                
                texto = embeddings_service.build_gasto_text(gasto_dict)
                embedding = embeddings_service.generate_embedding(texto)
                
                if embedding:
                    metadata = embeddings_service.build_metadata(gasto_dict, "gasto")
                    
                    if force_regenerate:
                        # Actualizar existente
                        existing = db.query(GastoEmbedding).filter(
                            GastoEmbedding.gasto_id == gasto.id_gasto
                        ).first()
                        if existing:
                            existing.embedding = embedding
                            existing.texto_original = texto
                            existing.metadata = metadata
                        else:
                            # Crear nuevo
                            gasto_embedding = GastoEmbedding(
                                gasto_id=gasto.id_gasto,
                                embedding=embedding,
                                texto_original=texto,
                                metadata=metadata
                            )
                            db.add(gasto_embedding)
                    else:
                        # Crear nuevo
                        gasto_embedding = GastoEmbedding(
                            gasto_id=gasto.id_gasto,
                            embedding=embedding,
                            texto_original=texto,
                            metadata=metadata
                        )
                        db.add(gasto_embedding)
                    
                    db.commit()
        
        elif entity_type == "ingreso":
            # Similar para ingresos
            query = db.query(Ingreso).filter(Ingreso.id_usuario == user_id)
            if entity_ids:
                query = query.filter(Ingreso.id_ingreso.in_(entity_ids))
            ingresos = query.all()
            
            logger.info(f"Procesando {len(ingresos)} ingresos")
            
            for ingreso in ingresos:
                # Verificar si ya existe
                if not force_regenerate:
                    existing = db.query(IngresoEmbedding).filter(
                        IngresoEmbedding.ingreso_id == ingreso.id_ingreso
                    ).first()
                    if existing:
                        continue
                
                # Generar embedding
                ingreso_dict = {
                    "descripcion": ingreso.descripcion,
                    "categoria": ingreso.categoria.nombre if ingreso.categoria else None,
                    "monto": ingreso.monto,
                    "moneda": ingreso.moneda,
                    "fecha": ingreso.fecha
                }
                
                texto = embeddings_service.build_ingreso_text(ingreso_dict)
                embedding = embeddings_service.generate_embedding(texto)
                
                if embedding:
                    metadata = embeddings_service.build_metadata(ingreso_dict, "ingreso")
                    
                    if force_regenerate:
                        # Actualizar existente
                        existing = db.query(IngresoEmbedding).filter(
                            IngresoEmbedding.ingreso_id == ingreso.id_ingreso
                        ).first()
                        if existing:
                            existing.embedding = embedding
                            existing.texto_original = texto
                            existing.metadata = metadata
                        else:
                            # Crear nuevo
                            ingreso_embedding = IngresoEmbedding(
                                ingreso_id=ingreso.id_ingreso,
                                embedding=embedding,
                                texto_original=texto,
                                metadata=metadata
                            )
                            db.add(ingreso_embedding)
                    else:
                        # Crear nuevo
                        ingreso_embedding = IngresoEmbedding(
                            ingreso_id=ingreso.id_ingreso,
                            embedding=embedding,
                            texto_original=texto,
                            metadata=metadata
                        )
                        db.add(ingreso_embedding)
                    
                    db.commit()
        
        logger.info("Generación batch completada exitosamente")
        
    except Exception as e:
        logger.error(f"Error en generación batch: {str(e)}")
        db.rollback()
