from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.crud.base import Base

class Categoria(Base):
    __tablename__ = "categorias"
    
    id_categoria = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(255), nullable=True)
    es_personalizada = Column(Boolean, nullable=False, default=False)
    icono = Column(String(50), nullable=True)
    color = Column(String(20), nullable=True)
    activa = Column(Boolean, nullable=False, default=True)
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="categorias")
    gastos = relationship("Gasto", back_populates="categoria")
    ingresos = relationship("Ingreso", back_populates="categoria")
    presupuestos = relationship("Presupuesto", back_populates="categoria")