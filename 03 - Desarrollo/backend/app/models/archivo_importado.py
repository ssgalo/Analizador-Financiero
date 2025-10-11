from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.crud.base import Base

class ArchivoImportado(Base):
    __tablename__ = "archivos_importados"
    
    id_archivo_importado = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    tipo = Column(String(20), CheckConstraint("tipo IN ('pdf', 'imagen', 'csv')"), nullable=True)
    ruta_archivo = Column(String(500), nullable=False)
    fecha_importacion = Column(DateTime(timezone=True), server_default=func.now())
    estado_procesamiento = Column(String(20), CheckConstraint("estado_procesamiento IN ('pendiente', 'procesando', 'procesado', 'error')"), nullable=True)
    resultado_ocr = Column(Text, nullable=True)
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="archivos_importados")
    gastos = relationship("Gasto", back_populates="archivo_importado")