from sqlalchemy import Column, Integer, String, DateTime, Text, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.crud.base import Base

class Usuario(Base):
    __tablename__ = "usuarios"
    
    id_usuario = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    usuario = Column(String(50), nullable=False, unique=True)
    contraseña = Column(String(255), nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    preferencias = Column(Text, nullable=True)
    ultimo_login = Column(DateTime(timezone=True), nullable=True)
    estado = Column(String(20), CheckConstraint("estado IN ('activo', 'inactivo', 'pendiente')"), nullable=False)
    
    # Relaciones
    categorias = relationship("Categoria", back_populates="usuario", cascade="all, delete-orphan")
    archivos_importados = relationship("ArchivoImportado", back_populates="usuario", cascade="all, delete-orphan")
    gastos = relationship("Gasto", back_populates="usuario", cascade="all, delete-orphan")
    ingresos = relationship("Ingreso", back_populates="usuario", cascade="all, delete-orphan")
    alertas = relationship("Alerta", back_populates="usuario", cascade="all, delete-orphan")
    sesiones_chat = relationship("SesionChat", back_populates="usuario", cascade="all, delete-orphan")
    integraciones = relationship("Integracion", back_populates="usuario", cascade="all, delete-orphan")
    logs_actividad = relationship("LogActividad", back_populates="usuario", cascade="all, delete-orphan")
    objetivos_financieros = relationship("ObjetivoFinanciero", back_populates="usuario", cascade="all, delete-orphan")
    presupuestos = relationship("Presupuesto", back_populates="usuario", cascade="all, delete-orphan")
    reportes = relationship("Reporte", back_populates="usuario", cascade="all, delete-orphan")