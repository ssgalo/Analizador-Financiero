from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api.deps import get_db
from app.models.gasto import Gasto
from app.models.moneda import Moneda
from app.schemas.gasto import GastoCreate, GastoUpdate, GastoResponse

router = APIRouter()

@router.post("/", response_model=GastoResponse, status_code=status.HTTP_201_CREATED)
def create_gasto(
    gasto_in: GastoCreate,
    db: Session = Depends(get_db)
):
    """
    Crear un nuevo gasto.
    """
    # Validar que la moneda existe y está activa
    moneda = db.query(Moneda).filter(
        Moneda.codigo_moneda == gasto_in.moneda.upper(),
        Moneda.activa == True
    ).first()
    if not moneda:
        raise HTTPException(
            status_code=400,
            detail=f"Moneda '{gasto_in.moneda}' no válida o inactiva"
        )
    
    db_gasto = Gasto(**gasto_in.dict())
    db.add(db_gasto)
    db.commit()
    db.refresh(db_gasto)
    return db_gasto

@router.get("/", response_model=List[GastoResponse])
def read_gastos(
    skip: int = 0,
    limit: int = 100,
    usuario_id: Optional[int] = None,
    categoria_id: Optional[int] = None,
    moneda: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Gasto)
    
    if usuario_id:
        query = query.filter(Gasto.id_usuario == usuario_id)
    if categoria_id:
        query = query.filter(Gasto.id_categoria == categoria_id)
    if moneda:
        query = query.filter(Gasto.moneda == moneda.upper())
    
    gastos = query.order_by(Gasto.id_gasto.desc()).offset(skip).limit(limit).all()
    return gastos

@router.get("/{gasto_id}", response_model=GastoResponse)
def read_gasto(
    gasto_id: int,
    db: Session = Depends(get_db)
):
    db_gasto = db.query(Gasto).filter(Gasto.id_gasto == gasto_id).first()
    if db_gasto is None:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return db_gasto

@router.put("/{gasto_id}", response_model=GastoResponse)
def update_gasto(
    *,
    gasto_id: int,
    gasto_in: GastoUpdate,
    db: Session = Depends(get_db)
):
    db_gasto = db.query(Gasto).filter(Gasto.id_gasto == gasto_id).first()
    if db_gasto is None:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    
    update_data = gasto_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_gasto, field, value)
    
    db.add(db_gasto)
    db.commit()
    db.refresh(db_gasto)
    return db_gasto

@router.delete("/{gasto_id}", response_model=GastoResponse)
def delete_gasto(
    gasto_id: int,
    db: Session = Depends(get_db)
):
    db_gasto = db.query(Gasto).filter(Gasto.id_gasto == gasto_id).first()
    if db_gasto is None:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    
    db.delete(db_gasto)
    db.commit()
    return db_gasto