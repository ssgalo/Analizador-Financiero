from sqlalchemy import Column, Integer, String, DateTime, Numeric, Date, ForeignKey, Text
from sqlalchemy.sql import func
from app.crud.base import Base

class ObjetivoFinanciero(Base):
    __tablename__ = "OBJETIVOS_FINANCIEROS"
    
    id_objetivo = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("USUARIOS.id_usuario"), nullable=False)
    descripcion = Column(String(255), nullable=False)
    monto = Column(Numeric(18, 2), nullable=False)
    fecha_inicio = Column(Date)
    fecha_fin = Column(Date)
    estado = Column(String(20))  # en_progreso, completado, cancelado