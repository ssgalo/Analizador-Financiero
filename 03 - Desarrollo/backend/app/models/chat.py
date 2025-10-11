from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.crud.base import Base

class Chat(Base):
    __tablename__ = "chats"
    
    id_chat = Column(Integer, primary_key=True, index=True)
    id_sesion = Column(Integer, ForeignKey("sesiones_chat.id_sesion"), nullable=False)
    fecha = Column(DateTime(timezone=True), server_default=func.now())
    mensaje_usuario = Column(Text, nullable=False)
    respuesta_ia = Column(Text, nullable=True)
    
    # Relaciones
    sesion = relationship("SesionChat", back_populates="chats")
