from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.crud.base import Base

class Reporte(Base):
    __tablename__ = "reportes"
    
    id_reporte = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    tipo = Column(String(50), CheckConstraint("tipo IN ('mensual', 'anual', 'por_categoria')"), nullable=True)
    fecha_generacion = Column(DateTime(timezone=True), server_default=func.now())
    archivo = Column(String(500), nullable=True)
    parametros = Column(Text, nullable=True)
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="reportes")
