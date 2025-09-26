from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional
from decimal import Decimal

class GastoBase(BaseModel):
    fecha: date
    monto: Decimal = Field(..., decimal_places=2)
    descripcion: Optional[str] = None
    comercio: Optional[str] = None

class GastoCreate(GastoBase):
    id_usuario: int
    id_categoria: Optional[int] = None
    fuente: str = "manual"

class GastoUpdate(BaseModel):
    fecha: Optional[date] = None
    monto: Optional[Decimal] = Field(None, decimal_places=2)
    descripcion: Optional[str] = None
    comercio: Optional[str] = None
    id_categoria: Optional[int] = None
    estado: Optional[str] = None

class GastoResponse(GastoBase):
    id_gasto: int
    id_usuario: int
    id_categoria: Optional[int] = None
    fuente: str
    estado: str
    fecha_creacion: datetime
    fecha_modificacion: datetime
    moneda: str = "ARS"
    
    class Config:
        from_attributes = True