from sqlalchemy import Column, Integer, String, Date, Numeric, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.crud.base import Base

class Gasto(Base):
    __tablename__ = "gastos"
    
    id_gasto = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    id_categoria = Column(Integer, ForeignKey("categorias.id_categoria"), nullable=False)
    id_archivo_importado = Column(Integer, ForeignKey("archivos_importados.id_archivo_importado"), nullable=True)
    fecha = Column(Date, nullable=False)
    monto = Column(Numeric(18, 2), nullable=False)
    descripcion = Column(String(255), nullable=True)
    comercio = Column(String(100), nullable=True)
    fuente = Column(String(20), CheckConstraint("fuente IN ('manual', 'importado', 'integracion')"), nullable=True)
    estado = Column(String(20), CheckConstraint("estado IN ('confirmado', 'pendiente', 'eliminado')"), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_modificacion = Column(DateTime(timezone=True), nullable=True)
    categoria_ia_sugerida = Column(String(100), nullable=True)
    confianza_ia = Column(Numeric(5, 4), nullable=True)
    moneda = Column(String(3), ForeignKey("monedas.codigo_moneda"), default='ARS')
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="gastos")
    categoria = relationship("Categoria", back_populates="gastos")
    archivo_importado = relationship("ArchivoImportado", back_populates="gastos")