from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.crud.base import Base

class Integracion(Base):
    __tablename__ = "integraciones"
    
    id_integracion = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    tipo = Column(String(50), CheckConstraint("tipo IN ('mercadopago', 'uala', 'banco_galicia')"), nullable=True)
    estado = Column(String(20), CheckConstraint("estado IN ('activa', 'inactiva', 'error')"), nullable=True)
    fecha_vinculacion = Column(DateTime(timezone=True), server_default=func.now())
    datos_credenciales = Column(Text, nullable=True)
    ultima_sincronizacion = Column(DateTime(timezone=True), nullable=True)
    proxima_sincronizacion = Column(DateTime(timezone=True), nullable=True)
    config_sincronizacion = Column(Text, nullable=True)
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="integraciones")
