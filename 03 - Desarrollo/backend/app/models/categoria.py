from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text
from sqlalchemy.sql import func
from app.crud.base import Base

class Categoria(Base):
    __tablename__ = "CATEGORIAS"
    
    id_categoria = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("USUARIOS.id_usuario"), nullable=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(255))
    es_personalizada = Column(Boolean, nullable=False, default=False)
    icono = Column(String(50))
    color = Column(String(20))
    activa = Column(Boolean, nullable=False, default=True)