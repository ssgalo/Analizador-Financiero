from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.crud.base import Base

class Alerta(Base):
    __tablename__ = "alertas"
    
    id_alerta = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    tipo = Column(String(50), CheckConstraint("tipo IN ('presupuesto', 'objetivo', 'gasto_inusual')"), nullable=True)
    mensaje = Column(String(500), nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    leida = Column(Boolean, default=False)
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="alertas")