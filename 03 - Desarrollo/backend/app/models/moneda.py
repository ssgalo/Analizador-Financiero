from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.crud.base import Base

class Moneda(Base):
    __tablename__ = "monedas"
    
    codigo_moneda = Column(String(3), primary_key=True, index=True)  # ARS, USD, EUR
    nombre = Column(String(50), nullable=False)                      # Peso Argentino
    simbolo = Column(String(5), nullable=False)                      # $
    activa = Column(Boolean, nullable=False, default=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())