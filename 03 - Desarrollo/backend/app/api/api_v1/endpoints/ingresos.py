"""
Endpoints de API para gestión de ingresos

Este módulo proporciona endpoints REST para:
- Crear nuevos ingresos
- Listar ingresos con filtros (categoría, tipo, fecha, estado)
- Obtener estadísticas de ingresos
- Actualizar ingresos existentes
- Eliminar ingresos
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from decimal import Decimal
import logging

from app.api.deps import get_db, get_current_active_user
from app.models.ingreso import Ingreso
from app.models.moneda import Moneda
from app.models.categoria import Categoria
from app.models.usuario import Usuario
from app.models.embeddings import IngresoEmbedding
from app.schemas.ingreso import IngresoCreate, IngresoUpdate, IngresoResponse, IngresoWithCategoria, IngresoStats
from app.services.embeddings_service import EmbeddingsService
from app.crud.session import SessionLocal

router = APIRouter()
logger = logging.getLogger(__name__)


# ==================== FUNCIONES AUXILIARES BACKGROUND ====================

def _generar_embedding_ingreso_background(ingreso_id: int, usuario_id: int):
    """
    Función ejecutada en background para generar embedding de un ingreso.
    
    Args:
        ingreso_id: ID del ingreso
        usuario_id: ID del usuario (para validación)
    """
    db = SessionLocal()
    try:
        embeddings_service = EmbeddingsService()
        
        # Buscar el ingreso con sus relaciones
        ingreso = db.query(Ingreso).filter(
            Ingreso.id_ingreso == ingreso_id,
            Ingreso.id_usuario == usuario_id
        ).first()
        
        if not ingreso:
            logger.warning(f"Ingreso {ingreso_id} no encontrado para generar embedding")
            return
        
        # Verificar si ya existe embedding
        existing = db.query(IngresoEmbedding).filter(
            IngresoEmbedding.ingreso_id == ingreso_id
        ).first()
        
        if existing:
            logger.info(f"Embedding ya existe para ingreso {ingreso_id}, omitiendo")
            return
        
        # Construir texto para el embedding
        ingreso_dict = {
            "descripcion": ingreso.descripcion,
            "categoria": ingreso.categoria.nombre if ingreso.categoria else None,
            "monto": ingreso.monto,
            "moneda": ingreso.moneda,
            "fecha": ingreso.fecha,
            "fuente": ingreso.fuente
        }
        
        texto = embeddings_service.build_ingreso_text(ingreso_dict)
        embedding = embeddings_service.generate_embedding(texto)
        
        if not embedding:
            logger.error(f"Error generando embedding para ingreso {ingreso_id}")
            return
        
        # Guardar embedding
        metadata = embeddings_service.build_metadata(ingreso_dict, "ingreso")
        ingreso_embedding = IngresoEmbedding(
            ingreso_id=ingreso.id_ingreso,
            embedding=embedding,
            texto_original=texto,
            metadata=metadata
        )
        
        db.add(ingreso_embedding)
        db.commit()
        logger.info(f"✅ Embedding generado exitosamente para ingreso {ingreso_id}")
        
    except Exception as e:
        logger.error(f"Error en generación de embedding para ingreso {ingreso_id}: {str(e)}")
        db.rollback()
    finally:
        db.close()


def _actualizar_embedding_ingreso_background(ingreso_id: int, usuario_id: int):
    """
    Función ejecutada en background para actualizar el embedding de un ingreso.
    
    Args:
        ingreso_id: ID del ingreso
        usuario_id: ID del usuario (para validación)
    """
    db = SessionLocal()
    try:
        embeddings_service = EmbeddingsService()
        
        # Buscar el ingreso con sus relaciones
        ingreso = db.query(Ingreso).filter(
            Ingreso.id_ingreso == ingreso_id,
            Ingreso.id_usuario == usuario_id
        ).first()
        
        if not ingreso:
            logger.warning(f"Ingreso {ingreso_id} no encontrado para actualizar embedding")
            return
        
        # Buscar embedding existente
        existing = db.query(IngresoEmbedding).filter(
            IngresoEmbedding.ingreso_id == ingreso_id
        ).first()
        
        # Construir texto actualizado
        ingreso_dict = {
            "descripcion": ingreso.descripcion,
            "categoria": ingreso.categoria.nombre if ingreso.categoria else None,
            "monto": ingreso.monto,
            "moneda": ingreso.moneda,
            "fecha": ingreso.fecha,
            "fuente": ingreso.fuente
        }
        
        texto = embeddings_service.build_ingreso_text(ingreso_dict)
        embedding = embeddings_service.generate_embedding(texto)
        
        if not embedding:
            logger.error(f"Error generando embedding para ingreso {ingreso_id}")
            return
        
        metadata = embeddings_service.build_metadata(ingreso_dict, "ingreso")
        
        if existing:
            # Actualizar existente
            existing.embedding = embedding
            existing.texto_original = texto
            existing.metadata = metadata
            logger.info(f"✅ Embedding actualizado para ingreso {ingreso_id}")
        else:
            # Crear nuevo (por si no existía)
            ingreso_embedding = IngresoEmbedding(
                ingreso_id=ingreso.id_ingreso,
                embedding=embedding,
                texto_original=texto,
                metadata=metadata
            )
            db.add(ingreso_embedding)
            logger.info(f"✅ Embedding creado para ingreso {ingreso_id} (no existía)")
        
        db.commit()
        
    except Exception as e:
        logger.error(f"Error actualizando embedding para ingreso {ingreso_id}: {str(e)}")
        db.rollback()
    finally:
        db.close()


# ==================== ENDPOINTS ====================

@router.post("/", response_model=IngresoResponse, status_code=status.HTTP_201_CREATED)
def create_ingreso(
    ingreso_in: IngresoCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Crear un nuevo ingreso
    
    Crea un ingreso asociado al usuario autenticado. Valida que la moneda
    y la categoría (si se proporciona) existan y estén activas.
    
    Args:
        ingreso_in: Datos del ingreso a crear (monto, fecha, categoría, etc.)
        db: Sesión de base de datos SQLAlchemy
        current_user: Usuario autenticado actual
        
    Returns:
        IngresoResponse: Ingreso creado con todos sus datos
        
    Raises:
        HTTPException 400: Si la moneda o categoría no son válidas
        
    Example:
        POST /api/v1/ingresos/
        {
            "monto": 50000.00,
            "descripcion": "Salario mensual",
            "fecha": "2025-10-01",
            "id_categoria": 5,
            "moneda": "ARS"
        }
    """
    # Validar que la moneda existe y está activa
    moneda = db.query(Moneda).filter(
        Moneda.codigo_moneda == ingreso_in.moneda.upper(),
        Moneda.activa == True
    ).first()
    if not moneda:
        raise HTTPException(
            status_code=400,
            detail=f"Moneda '{ingreso_in.moneda}' no válida o inactiva"
        )
    
    # Validar categoría si se proporciona
    if ingreso_in.id_categoria:
        categoria = db.query(Categoria).filter(
            Categoria.id_categoria == ingreso_in.id_categoria,
            Categoria.activa == True
        ).first()
        if not categoria:
            raise HTTPException(
                status_code=400,
                detail="Categoría no válida o inactiva"
            )
    
    # Crear ingreso asociado al usuario autenticado
    ingreso_data = ingreso_in.dict()
    ingreso_data["id_usuario"] = current_user.id_usuario
    
    # Establecer estado por defecto si no se proporciona
    if "estado" not in ingreso_data or ingreso_data["estado"] is None:
        ingreso_data["estado"] = "confirmado"
    
    db_ingreso = Ingreso(**ingreso_data)
    db.add(db_ingreso)
    db.commit()
    db.refresh(db_ingreso)
    
    # Expirar relaciones para evitar carga automática innecesaria
    db.expire(db_ingreso, ['categoria', 'usuario'])
    
    # 🚀 NUEVO: Generar embedding automáticamente en background
    background_tasks.add_task(
        _generar_embedding_ingreso_background,
        db_ingreso.id_ingreso,
        current_user.id_usuario
    )
    
    return db_ingreso

@router.get("/", response_model=List[IngresoWithCategoria])
def read_ingresos(
    skip: int = Query(0, ge=0, description="Elementos a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Límite de elementos"),
    categoria_id: Optional[int] = Query(None, description="Filtrar por categoría"),
    tipo: Optional[str] = Query(None, description="Filtrar por tipo de ingreso"),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    fecha_desde: Optional[str] = Query(None, description="Fecha desde (YYYY-MM-DD)"),
    fecha_hasta: Optional[str] = Query(None, description="Fecha hasta (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Listar ingresos del usuario autenticado
    
    Obtiene todos los ingresos del usuario con múltiples opciones de filtrado:
    categoría, tipo, estado, rango de fechas y paginación.
    
    Args:
        skip: Número de registros a omitir (para paginación)
        limit: Número máximo de registros a retornar (máx: 1000)
        categoria_id: Filtrar por categoría específica
        tipo: Filtrar por tipo de ingreso (ej: 'Salario', 'Freelance')
        estado: Filtrar por estado ('confirmado', 'pendiente', 'cancelado')
        fecha_desde: Fecha inicial del rango (formato: YYYY-MM-DD)
        fecha_hasta: Fecha final del rango (formato: YYYY-MM-DD)
        db: Sesión de base de datos
        current_user: Usuario autenticado
        
    Returns:
        List[IngresoWithCategoria]: Lista de ingresos con sus categorías
        
    Example:
        GET /api/v1/ingresos/?fecha_desde=2025-10-01&fecha_hasta=2025-10-31
    """
    # Filtrar por el usuario autenticado
    query = db.query(Ingreso).filter(Ingreso.id_usuario == current_user.id_usuario)
    
    # Aplicar filtros
    if categoria_id:
        query = query.filter(Ingreso.id_categoria == categoria_id)
    if tipo:
        query = query.filter(Ingreso.tipo == tipo)
    if estado:
        query = query.filter(Ingreso.estado == estado)
    if fecha_desde:
        query = query.filter(Ingreso.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Ingreso.fecha <= fecha_hasta)
    
    ingresos = query.order_by(Ingreso.fecha.desc()).offset(skip).limit(limit).all()
    
    # Obtener categorías para los ingresos
    categorias_ids = [ingreso.id_categoria for ingreso in ingresos if ingreso.id_categoria]
    categorias = {}
    if categorias_ids:
        categorias_query = db.query(Categoria).filter(Categoria.id_categoria.in_(categorias_ids)).all()
        categorias = {cat.id_categoria: cat for cat in categorias_query}
    
    # Agregar datos de categoría a cada ingreso
    result = []
    for ingreso in ingresos:
        categoria_info = None
        if ingreso.id_categoria and ingreso.id_categoria in categorias:
            cat = categorias[ingreso.id_categoria]
            categoria_info = {
                "id_categoria": cat.id_categoria,
                "nombre": cat.nombre,
                "color": cat.color,
                "icono": cat.icono
            }
        
        ingreso_dict = {
            "id_ingreso": ingreso.id_ingreso,
            "id_usuario": ingreso.id_usuario,
            "id_categoria": ingreso.id_categoria,
            "fecha": ingreso.fecha,
            "monto": ingreso.monto,
            "descripcion": ingreso.descripcion,
            "fuente": ingreso.fuente,
            "tipo": ingreso.tipo,
            "recurrente": ingreso.recurrente,
            "frecuencia": ingreso.frecuencia,
            "estado": ingreso.estado,
            "notas": ingreso.notas,
            "fecha_creacion": ingreso.fecha_creacion,
            "fecha_modificacion": ingreso.fecha_modificacion,
            "moneda": ingreso.moneda,
            "categoria": categoria_info
        }
        result.append(ingreso_dict)
    
    return result

@router.get("/tipos/opciones")
def get_tipos_ingreso():
    """
    Obtener las opciones válidas para tipo de ingreso.
    """
    return {
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

@router.get("/stats", response_model=IngresoStats)
def get_ingreso_stats(
    año: Optional[int] = Query(None, description="Año para estadísticas"),
    mes: Optional[int] = Query(None, ge=1, le=12, description="Mes para estadísticas"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Obtener estadísticas de ingresos del usuario.
    """
    query = db.query(Ingreso).filter(
        Ingreso.id_usuario == current_user.id_usuario,
        Ingreso.estado == "confirmado"
    )
    
    # Filtrar por año y mes si se proporcionan
    if año:
        query = query.filter(extract('year', Ingreso.fecha) == año)
    if mes:
        query = query.filter(extract('month', Ingreso.fecha) == mes)
    
    ingresos = query.all()
    
    if not ingresos:
        return IngresoStats(
            total_ingresos=Decimal('0'),
            cantidad_ingresos=0,
            promedio_ingreso=Decimal('0'),
            ingresos_por_tipo={},
            ingresos_por_categoria={}
        )
    
    # Calcular estadísticas
    total = sum(ingreso.monto for ingreso in ingresos)
    cantidad = len(ingresos)
    promedio = total / cantidad if cantidad > 0 else Decimal('0')
    
    # Agrupar por tipo
    por_tipo = {}
    for ingreso in ingresos:
        tipo = ingreso.tipo
        if tipo not in por_tipo:
            por_tipo[tipo] = {'total': Decimal('0'), 'cantidad': 0}
        por_tipo[tipo]['total'] += ingreso.monto
        por_tipo[tipo]['cantidad'] += 1
    
    # Agrupar por categoría
    por_categoria = {}
    # Obtener categorías de los ingresos
    categorias_ids = [ingreso.id_categoria for ingreso in ingresos if ingreso.id_categoria]
    categorias = {}
    if categorias_ids:
        categorias_query = db.query(Categoria).filter(Categoria.id_categoria.in_(categorias_ids)).all()
        categorias = {cat.id_categoria: cat for cat in categorias_query}
    
    for ingreso in ingresos:
        if ingreso.id_categoria and ingreso.id_categoria in categorias:
            cat_nombre = categorias[ingreso.id_categoria].nombre
            if cat_nombre not in por_categoria:
                por_categoria[cat_nombre] = {'total': Decimal('0'), 'cantidad': 0}
            por_categoria[cat_nombre]['total'] += ingreso.monto
            por_categoria[cat_nombre]['cantidad'] += 1
    
    return IngresoStats(
        total_ingresos=total,
        cantidad_ingresos=cantidad,
        promedio_ingreso=promedio,
        ingresos_por_tipo=por_tipo,
        ingresos_por_categoria=por_categoria
    )

@router.get("/{ingreso_id}", response_model=IngresoWithCategoria)
def read_ingreso(
    ingreso_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Obtener un ingreso específico por ID.
    """
    ingreso = db.query(Ingreso).filter(
        Ingreso.id_ingreso == ingreso_id,
        Ingreso.id_usuario == current_user.id_usuario
    ).first()
    
    if not ingreso:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    
    # Obtener categoría si existe
    categoria_info = None
    if ingreso.id_categoria:
        categoria = db.query(Categoria).filter(Categoria.id_categoria == ingreso.id_categoria).first()
        if categoria:
            categoria_info = {
                "id_categoria": categoria.id_categoria,
                "nombre": categoria.nombre,
                "color": categoria.color,
                "icono": categoria.icono
            }
    
    # Construir respuesta
    result = {
        "id_ingreso": ingreso.id_ingreso,
        "id_usuario": ingreso.id_usuario,
        "id_categoria": ingreso.id_categoria,
        "fecha": ingreso.fecha,
        "monto": ingreso.monto,
        "descripcion": ingreso.descripcion,
        "fuente": ingreso.fuente,
        "tipo": ingreso.tipo,
        "recurrente": ingreso.recurrente,
        "frecuencia": ingreso.frecuencia,
        "estado": ingreso.estado,
        "notas": ingreso.notas,
        "fecha_creacion": ingreso.fecha_creacion,
        "fecha_modificacion": ingreso.fecha_modificacion,
        "moneda": ingreso.moneda,
        "categoria": categoria_info
    }
    
    return result

@router.put("/{ingreso_id}", response_model=IngresoResponse)
def update_ingreso(
    ingreso_id: int,
    ingreso_update: IngresoUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Actualizar un ingreso existente.
    """
    # Buscar el ingreso
    db_ingreso = db.query(Ingreso).filter(
        Ingreso.id_ingreso == ingreso_id,
        Ingreso.id_usuario == current_user.id_usuario
    ).first()
    
    if not db_ingreso:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    
    # Validar categoría si se proporciona
    if ingreso_update.id_categoria:
        categoria = db.query(Categoria).filter(
            Categoria.id_categoria == ingreso_update.id_categoria,
            Categoria.activa == True
        ).first()
        if not categoria:
            raise HTTPException(
                status_code=400,
                detail="Categoría no válida o inactiva"
            )
    
    # Actualizar campos proporcionados
    update_data = ingreso_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_ingreso, field, value)
    
    db.commit()
    db.refresh(db_ingreso)
    
    # 🚀 NUEVO: Actualizar embedding en background
    background_tasks.add_task(
        _actualizar_embedding_ingreso_background,
        ingreso_id,
        current_user.id_usuario
    )
    
    return db_ingreso

@router.delete("/{ingreso_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ingreso(
    ingreso_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Eliminar un ingreso (hard delete).
    """
    db_ingreso = db.query(Ingreso).filter(
        Ingreso.id_ingreso == ingreso_id,
        Ingreso.id_usuario == current_user.id_usuario
    ).first()
    
    if not db_ingreso:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    
    db.delete(db_ingreso)
    db.commit()
    
    return None