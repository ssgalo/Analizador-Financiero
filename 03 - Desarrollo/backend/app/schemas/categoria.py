from pydantic import BaseModel
from typing import Optional

class CategoriaBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    es_personalizada: bool = False
    icono: Optional[str] = None
    color: Optional[str] = None

class CategoriaCreate(CategoriaBase):
    id_usuario: Optional[int] = None

class CategoriaUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    icono: Optional[str] = None
    color: Optional[str] = None
    activa: Optional[bool] = None

class CategoriaResponse(CategoriaBase):
    id_categoria: int
    id_usuario: Optional[int] = None
    activa: bool = True
    
    class Config:
        from_attributes = True