from typing import Optional
from datetime import date
from decimal import Decimal
from pydantic import BaseModel, Field


# Esquema base compartido
class PresupuestoBase(BaseModel):
    nombre: str = Field(..., description="Nombre del presupuesto")
    id_categoria: int = Field(..., description="ID de la categoría asociada")
    monto_limite: Decimal = Field(..., gt=0, description="Monto límite del presupuesto")
    periodo: Optional[str] = Field(None, description="Período del presupuesto (mensual, semanal, etc.)")
    fecha_inicio: date = Field(..., description="Fecha de inicio del período")
    moneda: str = Field("ARS", description="Código de moneda ISO")


# Esquema para crear presupuesto
class PresupuestoCreate(PresupuestoBase):
    id_usuario: int = Field(..., description="ID del usuario propietario del presupuesto")


# Esquema para actualizar presupuesto
class PresupuestoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, description="Nombre del presupuesto")
    id_categoria: Optional[int] = Field(None, description="ID de la categoría asociada")
    monto_limite: Optional[Decimal] = Field(None, gt=0, description="Monto límite del presupuesto")
    periodo: Optional[str] = Field(None, description="Período del presupuesto")
    fecha_inicio: Optional[date] = Field(None, description="Fecha de inicio del período")
    activo: Optional[bool] = Field(None, description="Indica si el presupuesto está activo")
    moneda: Optional[str] = Field(None, description="Código de moneda ISO")


# Esquema para respuesta de presupuesto
class PresupuestoResponse(PresupuestoBase):
    id_presupuesto: int = Field(..., description="ID único del presupuesto")
    id_usuario: int = Field(..., description="ID del usuario propietario")
    activo: bool = Field(True, description="Indica si el presupuesto está activo")
    moneda: str = Field("ARS", description="Código de moneda ISO")

    class Config:
        from_attributes = True


# Esquema para respuesta de presupuesto con progreso
class PresupuestoConProgreso(PresupuestoResponse):
    monto_gastado: Decimal = Field(..., description="Monto total gastado en el período")
    porcentaje_usado: float = Field(..., description="Porcentaje del presupuesto utilizado")
    monto_disponible: Decimal = Field(..., description="Monto disponible restante")

    class Config:
        from_attributes = True