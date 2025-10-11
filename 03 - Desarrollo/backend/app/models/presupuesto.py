from sqlalchemy import Column, Integer, String, Date, Numeric, Boolean, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.crud.base import Base

class Presupuesto(Base):
    __tablename__ = "presupuestos"
    
    id_presupuesto = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    id_categoria = Column(Integer, ForeignKey("categorias.id_categoria"), nullable=False)
    nombre = Column(String(100), nullable=False)
    monto_limite = Column(Numeric(18, 2), nullable=False)
    periodo = Column(String(20), CheckConstraint("periodo IN ('semanal', 'mensual', 'anual')"), nullable=True)
    fecha_inicio = Column(Date, nullable=False)
    activo = Column(Boolean, default=True)
    moneda = Column(String(3), ForeignKey("monedas.codigo_moneda"), default='ARS')
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="presupuestos")
    categoria = relationship("Categoria", back_populates="presupuestos")