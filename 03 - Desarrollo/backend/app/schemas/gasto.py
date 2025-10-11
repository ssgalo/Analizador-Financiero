from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional
from decimal import Decimal

class GastoBase(BaseModel):
    descripcion: str
    monto: Decimal
    fecha: date
    comercio: Optional[str] = None
    moneda: str = "ARS"

class GastoCreate(GastoBase):
    id_categoria: Optional[int] = None
    fuente: str = "manual"

class GastoUpdate(BaseModel):
    fecha: Optional[date] = None
    monto: Optional[Decimal] = None
    descripcion: Optional[str] = None
    comercio: Optional[str] = None
    id_categoria: Optional[int] = None
    estado: Optional[str] = None

class GastoResponse(GastoBase):
    id_gasto: int
    id_usuario: int
    id_categoria: Optional[int] = None
    fuente: str
    estado: Optional[str] = "confirmado"  # Permite None y usa default
    fecha_creacion: datetime
    fecha_modificacion: Optional[datetime] = None  # ✅ Permite None temporalmente
    moneda: str = "ARS"
    
    class Config:
        from_attributes = True

# Schema para estadísticas
class GastoStats(BaseModel):
    total_gastos: Decimal
    cantidad_gastos: int
    promedio_gasto: Decimal
    gastos_por_categoria: dict