from sqlalchemy import Column, Integer, String, Date, Numeric, Boolean, DateTime, Text, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.crud.base import Base

class Ingreso(Base):
    __tablename__ = "ingresos"
    
    id_ingreso = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    id_categoria = Column(Integer, ForeignKey("categorias.id_categoria"), nullable=True)
    fecha = Column(Date, nullable=False)
    monto = Column(Numeric(18, 2), nullable=False)
    descripcion = Column(String(255), nullable=True)
    fuente = Column(String(100), nullable=True)
    tipo = Column(String(30), CheckConstraint("tipo IN ('salario', 'freelance', 'inversion', 'venta', 'regalo', 'otro')"), nullable=True)
    recurrente = Column(Boolean, default=False)
    frecuencia = Column(String(20), CheckConstraint("frecuencia IN ('semanal', 'quincenal', 'mensual', 'trimestral', 'anual', 'unica')"), nullable=True)
    estado = Column(String(20), CheckConstraint("estado IN ('confirmado', 'pendiente', 'cancelado')"), default='confirmado')
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_modificacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    moneda = Column(String(3), ForeignKey("monedas.codigo_moneda"), default='ARS')
    notas = Column(String(500), nullable=True)
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="ingresos")
    categoria = relationship("Categoria", back_populates="ingresos")