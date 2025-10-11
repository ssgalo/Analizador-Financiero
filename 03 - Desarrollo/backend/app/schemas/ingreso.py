from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional
from decimal import Decimal
from app.schemas.categoria import CategoriaResponse

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
    estado: Optional[str] = "confirmado"  # Permite None y usa default
    fecha_creacion: datetime
    fecha_modificacion: Optional[datetime] = None  # Permite None temporalmente
    moneda: str = "ARS"
    
    class Config:
        from_attributes = True
        # Excluir relaciones que no están en el schema
        fields = {'categoria': {'exclude': True}}

# Schemas para respuestas con datos relacionados
class IngresoWithCategoria(IngresoResponse):
    categoria: Optional[CategoriaResponse] = None
    
    class Config:
        from_attributes = True

# Schema para estadísticas
class IngresoStats(BaseModel):
    total_ingresos: Decimal
    cantidad_ingresos: int
    promedio_ingreso: Decimal
    ingresos_por_tipo: dict
    ingresos_por_categoria: dict