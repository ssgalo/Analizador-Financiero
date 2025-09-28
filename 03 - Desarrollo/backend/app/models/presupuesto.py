from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Numeric, Date
from sqlalchemy.sql import func
from app.crud.base import Base

class Presupuesto(Base):
    __tablename__ = "PRESUPUESTOS"
    
    id_presupuesto = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("USUARIOS.id_usuario"), nullable=False)
    id_categoria = Column(Integer, ForeignKey("CATEGORIAS.id_categoria"), nullable=False)
    nombre = Column(String(100), nullable=False)
    monto_limite = Column(Numeric(18, 2), nullable=False)
    periodo = Column(String(20))  # semanal, mensual, anual
    fecha_inicio = Column(Date, nullable=False)
    activo = Column(Boolean, default=True)
    moneda = Column(String(3), ForeignKey("MONEDAS.codigo_moneda"), default="ARS")