from sqlalchemy import Column, Integer, String, DateTime, Numeric, Date, ForeignKey, Text
from sqlalchemy.sql import func
from app.crud.base import Base

class Gasto(Base):
    __tablename__ = "GASTOS"
    
    id_gasto = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("USUARIOS.id_usuario"), nullable=False)
    fecha = Column(Date, nullable=False)
    monto = Column(Numeric(12, 2), nullable=False)
    descripcion = Column(Text)
    comercio = Column(String(100))
    id_categoria = Column(Integer, ForeignKey("CATEGORIAS.id_categoria"))
    fuente = Column(String(30), default="manual")
    id_archivo_importado = Column(Integer)
    estado = Column(String(20), default="activo")
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_modificacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    moneda = Column(String(3), ForeignKey("MONEDAS.codigo_moneda"), default="ARS")