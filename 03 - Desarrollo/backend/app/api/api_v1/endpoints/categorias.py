from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.categoria import Categoria
from app.schemas.categoria import CategoriaCreate, CategoriaUpdate, CategoriaResponse

router = APIRouter()


@router.post("/", response_model=CategoriaResponse)
def create_categoria(
    *,
    db: Session = Depends(get_db),
    categoria_in: CategoriaCreate
) -> CategoriaResponse:
    """
    Crear una nueva categoría.
    """
    # Verificar si ya existe una categoría con el mismo nombre para el mismo usuario
    if categoria_in.id_usuario:  # Solo si es categoría personalizada
        existing_categoria = db.query(Categoria).filter(
            Categoria.nombre == categoria_in.nombre,
            Categoria.id_usuario == categoria_in.id_usuario
        ).first()
        if existing_categoria:
            raise HTTPException(
                status_code=400,
                detail="Ya existe una categoría con este nombre para este usuario"
            )
    
    db_categoria = Categoria(**categoria_in.dict())
    db.add(db_categoria)
    db.commit()
    db.refresh(db_categoria)
    return db_categoria


@router.get("/", response_model=List[CategoriaResponse])
def read_categorias(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    id_usuario: Optional[int] = Query(None),
    activa: Optional[bool] = Query(None)
) -> List[CategoriaResponse]:
    """
    Obtener lista de categorías con filtros opcionales.
    """
    query = db.query(Categoria)
    
    # Aplicar filtros
    if id_usuario is not None:
        # Incluir categorías del usuario específico O categorías globales (sin usuario)
        query = query.filter((Categoria.id_usuario == id_usuario) | (Categoria.id_usuario.is_(None)))
    
    if activa is not None:
        query = query.filter(Categoria.activa == activa)
    
    # Orden necesario para SQL Server con paginación
    query = query.order_by(Categoria.id_categoria)
    
    categorias = query.offset(skip).limit(limit).all()
    return categorias


@router.get("/{categoria_id}", response_model=CategoriaResponse)
def read_categoria(
    categoria_id: int,
    db: Session = Depends(get_db)
) -> CategoriaResponse:
    """
    Obtener una categoría específica por ID.
    """
    categoria = db.query(Categoria).filter(Categoria.id_categoria == categoria_id).first()
    if categoria is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return categoria


@router.put("/{categoria_id}", response_model=CategoriaResponse)
def update_categoria(
    *,
    db: Session = Depends(get_db),
    categoria_id: int,
    categoria_in: CategoriaUpdate
) -> CategoriaResponse:
    """
    Actualizar una categoría existente.
    """
    categoria = db.query(Categoria).filter(Categoria.id_categoria == categoria_id).first()
    if categoria is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    # Verificar duplicado de nombre si se está cambiando el nombre
    update_data = categoria_in.dict(exclude_unset=True)
    if "nombre" in update_data and update_data["nombre"] != categoria.nombre:
        existing_categoria = db.query(Categoria).filter(
            Categoria.nombre == update_data["nombre"],
            Categoria.id_usuario == categoria.id_usuario,
            Categoria.id_categoria != categoria_id
        ).first()
        if existing_categoria:
            raise HTTPException(
                status_code=400,
                detail="Ya existe una categoría con este nombre para este usuario"
            )
    
    # Actualizar campos
    for field, value in update_data.items():
        setattr(categoria, field, value)
    
    db.add(categoria)
    db.commit()
    db.refresh(categoria)
    return categoria


@router.delete("/{categoria_id}", response_model=CategoriaResponse)
def delete_categoria(
    categoria_id: int,
    db: Session = Depends(get_db)
) -> CategoriaResponse:
    """
    Eliminar una categoría.
    """
    categoria = db.query(Categoria).filter(Categoria.id_categoria == categoria_id).first()
    if categoria is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    db.delete(categoria)
    db.commit()
    return categoria


@router.get("/usuario/{usuario_id}", response_model=List[CategoriaResponse])
def read_categorias_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    solo_activas: bool = Query(True)
) -> List[CategoriaResponse]:
    """
    Obtener todas las categorías disponibles para un usuario específico.
    Incluye categorías personalizadas del usuario y categorías globales.
    """
    query = db.query(Categoria)
    
    # Categorías del usuario específico O categorías globales (sin usuario)
    query = query.filter((Categoria.id_usuario == usuario_id) | (Categoria.id_usuario.is_(None)))
    
    if solo_activas:
        query = query.filter(Categoria.activa == True)
    
    # Orden necesario para SQL Server con paginación
    query = query.order_by(Categoria.nombre)
    
    categorias = query.offset(skip).limit(limit).all()
    return categorias
