from sqlalchemy import Column, Integer, String, DateTime, Numeric, Date, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.crud.base import Base

class Ingreso(Base):
    __tablename__ = "INGRESOS"
    
    id_ingreso = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("USUARIOS.id_usuario"), nullable=False)
    id_categoria = Column(Integer, ForeignKey("CATEGORIAS.id_categoria"), nullable=True)
    fecha = Column(Date, nullable=False)
    monto = Column(Numeric(18, 2), nullable=False)
    descripcion = Column(String(255))
    fuente = Column(String(100))  # Empresa, Cliente, etc.
    tipo = Column(String(30), nullable=False)  # salario, freelance, inversion, etc.
    recurrente = Column(Boolean, default=False)
    frecuencia = Column(String(20), default="unica")  # semanal, mensual, etc.
    estado = Column(String(20), default="confirmado")  # confirmado, pendiente, cancelado
    notas = Column(String(500))
    
    # Fechas con default en Python para compatibilidad con FastAPI
    fecha_creacion = Column(
        DateTime(timezone=True), 
        default=func.now(),
        server_default=func.now(),
        nullable=False
    )
    fecha_modificacion = Column(
        DateTime(timezone=True), 
        default=func.now(),           
        server_default=func.now(),    
        onupdate=func.now(),          
        nullable=False
    )
    
    moneda = Column(String(3), ForeignKey("MONEDAS.codigo_moneda"), default="ARS")
    
    # Relaciones
    usuario = relationship("Usuario")
    categoria = relationship("Categoria")