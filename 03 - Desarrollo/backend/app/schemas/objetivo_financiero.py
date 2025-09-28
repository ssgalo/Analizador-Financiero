from pydantic import BaseModel
from datetime import date
from typing import Optional
from decimal import Decimal

class ObjetivoFinancieroBase(BaseModel):
    descripcion: str
    monto: Decimal
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None

class ObjetivoFinancieroCreate(ObjetivoFinancieroBase):
    id_usuario: int

class ObjetivoFinancieroUpdate(BaseModel):
    descripcion: Optional[str] = None
    monto: Optional[Decimal] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    estado: Optional[str] = None

class ObjetivoFinancieroResponse(ObjetivoFinancieroBase):
    id_objetivo: int
    id_usuario: int
    estado: Optional[str] = "en_progreso"
    
    class Config:
        from_attributes = True