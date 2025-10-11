from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.crud.base import Base

class SesionChat(Base):
    __tablename__ = "sesiones_chat"
    
    id_sesion = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    titulo = Column(String(100), nullable=True)
    fecha_inicio = Column(DateTime(timezone=True), server_default=func.now())
    fecha_ultima_actividad = Column(DateTime(timezone=True), nullable=True)
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="sesiones_chat")
    chats = relationship("Chat", back_populates="sesion", cascade="all, delete-orphan")
