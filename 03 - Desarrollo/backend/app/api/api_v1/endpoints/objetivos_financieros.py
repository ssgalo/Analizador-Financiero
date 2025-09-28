from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.models.objetivo_financiero import ObjetivoFinanciero
from app.models.usuario import Usuario
from app.schemas.objetivo_financiero import ObjetivoFinancieroCreate, ObjetivoFinancieroUpdate, ObjetivoFinancieroResponse

router = APIRouter()


@router.post("/", response_model=ObjetivoFinancieroResponse)
def create_objetivo_financiero(
    *,
    db: Session = Depends(get_db),
    objetivo_in: ObjetivoFinancieroCreate,
    current_user: Usuario = Depends(get_current_active_user)
) -> ObjetivoFinancieroResponse:
    """
    Crear un nuevo objetivo financiero.
    """
    # Validar fechas
    if objetivo_in.fecha_fin and objetivo_in.fecha_inicio:
        if objetivo_in.fecha_fin <= objetivo_in.fecha_inicio:
            raise HTTPException(
                status_code=400,
                detail="La fecha fin debe ser posterior a la fecha inicio"
            )
    
    db_objetivo = ObjetivoFinanciero(**objetivo_in.dict())
    db.add(db_objetivo)
    db.commit()
    db.refresh(db_objetivo)
    return db_objetivo


@router.get("/", response_model=List[ObjetivoFinancieroResponse])
def read_objetivos_financieros(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    id_usuario: Optional[int] = Query(None),
    estado: Optional[str] = Query(None)
) -> List[ObjetivoFinancieroResponse]:
    """
    Obtener lista de objetivos financieros con filtros opcionales.
    """
    query = db.query(ObjetivoFinanciero)
    
    # Aplicar filtros
    if id_usuario is not None:
        query = query.filter(ObjetivoFinanciero.id_usuario == id_usuario)
    
    if estado:
        query = query.filter(ObjetivoFinanciero.estado == estado)
    
    # Orden necesario para SQL Server con paginación
    query = query.order_by(ObjetivoFinanciero.id_objetivo)
    
    objetivos = query.offset(skip).limit(limit).all()
    return objetivos


@router.get("/{objetivo_id}", response_model=ObjetivoFinancieroResponse)
def read_objetivo_financiero(
    objetivo_id: int,
    db: Session = Depends(get_db)
) -> ObjetivoFinancieroResponse:
    """
    Obtener un objetivo financiero específico por ID.
    """
    objetivo = db.query(ObjetivoFinanciero).filter(ObjetivoFinanciero.id_objetivo == objetivo_id).first()
    if objetivo is None:
        raise HTTPException(status_code=404, detail="Objetivo financiero no encontrado")
    return objetivo


@router.put("/{objetivo_id}", response_model=ObjetivoFinancieroResponse)
def update_objetivo_financiero(
    *,
    db: Session = Depends(get_db),
    objetivo_id: int,
    objetivo_in: ObjetivoFinancieroUpdate
) -> ObjetivoFinancieroResponse:
    """
    Actualizar un objetivo financiero existente.
    """
    objetivo = db.query(ObjetivoFinanciero).filter(ObjetivoFinanciero.id_objetivo == objetivo_id).first()
    if objetivo is None:
        raise HTTPException(status_code=404, detail="Objetivo financiero no encontrado")
    
    # Obtener datos de actualización
    update_data = objetivo_in.dict(exclude_unset=True)
    
    # Validar fechas si se están actualizando
    fecha_inicio = update_data.get("fecha_inicio", objetivo.fecha_inicio)
    fecha_fin = update_data.get("fecha_fin", objetivo.fecha_fin)
    
    if fecha_fin and fecha_inicio and fecha_fin <= fecha_inicio:
        raise HTTPException(
            status_code=400,
            detail="La fecha fin debe ser posterior a la fecha inicio"
        )
    
    # Actualizar campos
    for field, value in update_data.items():
        setattr(objetivo, field, value)
    
    db.add(objetivo)
    db.commit()
    db.refresh(objetivo)
    return objetivo


@router.delete("/{objetivo_id}", response_model=ObjetivoFinancieroResponse)
def delete_objetivo_financiero(
    objetivo_id: int,
    db: Session = Depends(get_db)
) -> ObjetivoFinancieroResponse:
    """
    Eliminar un objetivo financiero.
    """
    objetivo = db.query(ObjetivoFinanciero).filter(ObjetivoFinanciero.id_objetivo == objetivo_id).first()
    if objetivo is None:
        raise HTTPException(status_code=404, detail="Objetivo financiero no encontrado")
    
    db.delete(objetivo)
    db.commit()
    return objetivo


@router.get("/usuario/{usuario_id}/activos", response_model=List[ObjetivoFinancieroResponse])
def read_objetivos_activos_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
) -> List[ObjetivoFinancieroResponse]:
    """
    Obtener objetivos financieros activos de un usuario específico.
    """
    query = db.query(ObjetivoFinanciero).filter(
        ObjetivoFinanciero.id_usuario == usuario_id,
        ObjetivoFinanciero.estado == "en_progreso"
    )
    
    # Orden por fecha fin próxima primero
    query = query.order_by(ObjetivoFinanciero.fecha_fin.asc().nullslast())
    
    objetivos = query.offset(skip).limit(limit).all()
    return objetivos
