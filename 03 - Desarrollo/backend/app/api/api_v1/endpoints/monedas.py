from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db
from app.models.moneda import Moneda
from app.models.gasto import Gasto
from app.models.presupuesto import Presupuesto
from app.schemas.moneda import MonedaCreate, MonedaUpdate, MonedaResponse

router = APIRouter()


@router.post("/", response_model=MonedaResponse)
def create_moneda(
    *,
    db: Session = Depends(get_db),
    moneda_in: MonedaCreate
) -> MonedaResponse:
    """
    Crear una nueva moneda.
    """
    # Verificar si ya existe una moneda con el mismo código
    existing_moneda = db.query(Moneda).filter(Moneda.codigo_moneda == moneda_in.codigo_moneda).first()
    if existing_moneda:
        raise HTTPException(
            status_code=400,
            detail="Ya existe una moneda con este código"
        )
    
    db_moneda = Moneda(**moneda_in.dict())
    db.add(db_moneda)
    db.commit()
    db.refresh(db_moneda)
    return db_moneda


@router.get("/", response_model=List[MonedaResponse])
def read_monedas(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    solo_activas: Optional[bool] = Query(True)
) -> List[MonedaResponse]:
    """
    Obtener lista de monedas con filtros opcionales.
    """
    query = db.query(Moneda)
    
    # Aplicar filtros
    if solo_activas is not None and solo_activas:
        query = query.filter(Moneda.activa == True)
    
    # Orden alfabético por código
    query = query.order_by(Moneda.codigo_moneda)
    
    monedas = query.offset(skip).limit(limit).all()
    return monedas


@router.get("/{codigo_moneda}", response_model=MonedaResponse)
def read_moneda(
    codigo_moneda: str,
    db: Session = Depends(get_db)
) -> MonedaResponse:
    """
    Obtener una moneda específica por código.
    """
    moneda = db.query(Moneda).filter(Moneda.codigo_moneda == codigo_moneda.upper()).first()
    if moneda is None:
        raise HTTPException(status_code=404, detail="Moneda no encontrada")
    return moneda


@router.put("/{codigo_moneda}", response_model=MonedaResponse)
def update_moneda(
    *,
    db: Session = Depends(get_db),
    codigo_moneda: str,
    moneda_in: MonedaUpdate
) -> MonedaResponse:
    """
    Actualizar una moneda existente.
    """
    moneda = db.query(Moneda).filter(Moneda.codigo_moneda == codigo_moneda.upper()).first()
    if moneda is None:
        raise HTTPException(status_code=404, detail="Moneda no encontrada")
    
    # Actualizar campos
    update_data = moneda_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(moneda, field, value)
    
    db.add(moneda)
    db.commit()
    db.refresh(moneda)
    return moneda


@router.delete("/{codigo_moneda}", response_model=MonedaResponse)
def delete_moneda(
    codigo_moneda: str,
    db: Session = Depends(get_db)
) -> MonedaResponse:
    """
    Eliminar una moneda (desactivarla).
    """
    moneda = db.query(Moneda).filter(Moneda.codigo_moneda == codigo_moneda.upper()).first()
    if moneda is None:
        raise HTTPException(status_code=404, detail="Moneda no encontrada")
    
    # En lugar de eliminar, desactivamos la moneda para mantener integridad referencial
    moneda.activa = False
    
    db.add(moneda)
    db.commit()
    db.refresh(moneda)
    return moneda


@router.post("/{codigo_moneda}/activar", response_model=MonedaResponse)
def activar_moneda(
    codigo_moneda: str,
    db: Session = Depends(get_db)
) -> MonedaResponse:
    """
    Reactivar una moneda desactivada.
    """
    moneda = db.query(Moneda).filter(Moneda.codigo_moneda == codigo_moneda.upper()).first()
    if moneda is None:
        raise HTTPException(status_code=404, detail="Moneda no encontrada")
    
    moneda.activa = True
    
    db.add(moneda)
    db.commit()
    db.refresh(moneda)
    return moneda


@router.get("/activas/list", response_model=List[MonedaResponse])
def read_monedas_activas(db: Session = Depends(get_db)) -> List[MonedaResponse]:
    """
    Obtener solo las monedas activas (endpoint específico para formularios).
    """
    monedas = db.query(Moneda).filter(Moneda.activa == True).order_by(Moneda.codigo_moneda).all()
    return monedas


@router.get("/{codigo_moneda}/estadisticas")
def get_estadisticas_moneda(
    codigo_moneda: str,
    db: Session = Depends(get_db)
) -> dict:
    """
    Obtener estadísticas de uso de una moneda específica.
    """
    moneda = db.query(Moneda).filter(Moneda.codigo_moneda == codigo_moneda.upper()).first()
    if not moneda:
        raise HTTPException(status_code=404, detail="Moneda no encontrada")
    
    # Contar gastos con esta moneda
    total_gastos = db.query(func.count(Gasto.id_gasto)).filter(Gasto.moneda == codigo_moneda.upper()).scalar() or 0
    
    # Contar presupuestos con esta moneda
    total_presupuestos = db.query(func.count(Presupuesto.id_presupuesto)).filter(
        Presupuesto.moneda == codigo_moneda.upper()
    ).scalar() or 0
    
    # Suma total de gastos en esta moneda
    total_monto_gastos = db.query(func.coalesce(func.sum(Gasto.monto), 0)).filter(
        Gasto.moneda == codigo_moneda.upper()
    ).scalar() or 0
    
    return {
        "moneda": moneda,
        "estadisticas": {
            "total_gastos": total_gastos,
            "total_presupuestos": total_presupuestos,
            "monto_total_gastos": float(total_monto_gastos),
            "en_uso": total_gastos > 0 or total_presupuestos > 0
        }
    }