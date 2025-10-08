from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional
from decimal import Decimal

class IngresoBase(BaseModel):
    descripcion: str
    monto: Decimal = Field(..., gt=0, description="Monto debe ser mayor a 0")
    fecha: date
    fuente: Optional[str] = None
    tipo: str = Field(..., description="Tipo de ingreso: salario, freelance, inversion, venta, regalo, otro")
    recurrente: bool = False
    frecuencia: str = Field(default="unica", description="Frecuencia: semanal, quincenal, mensual, trimestral, anual, unica")
    notas: Optional[str] = None
    moneda: str = "ARS"

class IngresoCreate(IngresoBase):
    id_categoria: Optional[int] = None

class IngresoUpdate(BaseModel):
    fecha: Optional[date] = None
    monto: Optional[Decimal] = Field(None, gt=0, description="Monto debe ser mayor a 0")
    descripcion: Optional[str] = None
    fuente: Optional[str] = None
    id_categoria: Optional[int] = None
    tipo: Optional[str] = None
    recurrente: Optional[bool] = None
    frecuencia: Optional[str] = None
    estado: Optional[str] = None
    notas: Optional[str] = None

class IngresoResponse(IngresoBase):
    id_ingreso: int
    id_usuario: int
    id_categoria: Optional[int] = None
    estado: str
    fecha_creacion: datetime
    fecha_modificacion: Optional[datetime] = None  # Permite None temporalmente
    moneda: str = "ARS"
    categoria: Optional[dict] = None  # Para incluir datos de la categoría
    
    class Config:
        from_attributes = True

# Schemas para respuestas con datos relacionados
class IngresoWithCategoria(IngresoResponse):
    categoria: Optional[dict] = None

# Schema para estadísticas
class IngresoStats(BaseModel):
    total_ingresos: Decimal
    cantidad_ingresos: int
    promedio_ingreso: Decimal
    ingresos_por_tipo: dict
    ingresos_por_categoria: dict