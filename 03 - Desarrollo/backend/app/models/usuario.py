from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.crud.base import Base

class Usuario(Base):
    __tablename__ = "USUARIOS"
    
    id_usuario = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    usuario = Column(String(50), unique=True, nullable=False)
    contraseña = Column(String(255), nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    preferencias = Column(Text)
    ultimo_login = Column(DateTime(timezone=True))
    estado = Column(String(20), default="activo")