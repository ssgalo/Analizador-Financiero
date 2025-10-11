from sqlalchemy import Column, Integer, String, Date, Numeric, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.crud.base import Base

class ObjetivoFinanciero(Base):
    __tablename__ = "objetivos_financieros"
    
    id_objetivo = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)  # ✅ FK
    descripcion = Column(String(255), nullable=False)
    monto = Column(Numeric(18, 2), nullable=False)
    fecha_inicio = Column(Date, nullable=True)
    fecha_fin = Column(Date, nullable=True)
    estado = Column(String(20), CheckConstraint("estado IN ('en_progreso', 'completado', 'cancelado')"), nullable=True)
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="objetivos_financieros")