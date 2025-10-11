from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.crud.base import Base

class LogActividad(Base):
    __tablename__ = "logs_actividad"
    
    id_log = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)
    fecha = Column(DateTime(timezone=True), server_default=func.now())
    tipo_evento = Column(String(100), nullable=False)
    descripcion = Column(String(1000), nullable=True)
    metadatos = Column(Text, nullable=True)
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="logs_actividad")
