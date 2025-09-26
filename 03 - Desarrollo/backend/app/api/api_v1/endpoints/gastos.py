from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api.deps import get_database
from app.models.gasto import Gasto
from app.schemas.gasto import GastoResponse, GastoCreate, GastoUpdate

router = APIRouter()

@router.post("/", response_model=GastoResponse, status_code=status.HTTP_201_CREATED)
def create_gasto(
    gasto_in: GastoCreate,
    db: Session = Depends(get_database)
):
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
    db: Session = Depends(get_database)
):
    query = db.query(Gasto)
    
    if usuario_id:
        query = query.filter(Gasto.id_usuario == usuario_id)
    if categoria_id:
        query = query.filter(Gasto.id_categoria == categoria_id)
    
    gastos = query.offset(skip).limit(limit).all()
    return gastos

@router.get("/{gasto_id}", response_model=GastoResponse)
def read_gasto(
    gasto_id: int,
    db: Session = Depends(get_database)
):
    db_gasto = db.query(Gasto).filter(Gasto.id_gasto == gasto_id).first()
    if db_gasto is None:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return db_gasto

@router.put("/{gasto_id}", response_model=GastoResponse)
def update_gasto(
    gasto_id: int,
    gasto_in: GastoUpdate,
    db: Session = Depends(get_database)
):
    db_gasto = db.query(Gasto).filter(Gasto.id_gasto == gasto_id).first()
    if db_gasto is None:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    
    update_data = gasto_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_gasto, field, value)
    
    db.commit()
    db.refresh(db_gasto)
    return db_gasto

@router.delete("/{gasto_id}")
def delete_gasto(
    gasto_id: int,
    db: Session = Depends(get_database)
):
    db_gasto = db.query(Gasto).filter(Gasto.id_gasto == gasto_id).first()
    if db_gasto is None:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    
    db.delete(db_gasto)
    db.commit()
    return {"message": "Gasto eliminado correctamente"}