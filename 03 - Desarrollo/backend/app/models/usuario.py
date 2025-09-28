from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.crud.base import Base

class Usuario(Base):
    __tablename__ = "USUARIOS"
    
    id_usuario = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    usuario = Column(String(50), unique=True, nullable=False, index=True)
    contraseña = Column(String(255), nullable=False)  # Aumentar longitud para hash
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    preferencias = Column(Text, nullable=True)
    ultimo_login = Column(DateTime(timezone=True), nullable=True)
    estado = Column(String(20), default="activo")