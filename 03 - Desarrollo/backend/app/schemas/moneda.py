from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


# Esquema base compartido
class MonedaBase(BaseModel):
    codigo_moneda: str = Field(..., min_length=3, max_length=3, description="Código ISO de la moneda (ARS, USD, EUR)")
    nombre: str = Field(..., min_length=1, max_length=50, description="Nombre completo de la moneda")
    simbolo: str = Field(..., min_length=1, max_length=5, description="Símbolo de la moneda")


# Esquema para crear moneda
class MonedaCreate(MonedaBase):
    activa: Optional[bool] = Field(True, description="Indica si la moneda está activa")


# Esquema para actualizar moneda
class MonedaUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=50, description="Nombre completo de la moneda")
    simbolo: Optional[str] = Field(None, min_length=1, max_length=5, description="Símbolo de la moneda")
    activa: Optional[bool] = Field(None, description="Indica si la moneda está activa")


# Esquema para respuesta de moneda
class MonedaResponse(MonedaBase):
    activa: bool = Field(..., description="Indica si la moneda está activa")
    fecha_creacion: datetime = Field(..., description="Fecha de creación de la moneda")

    class Config:
        from_attributes = True