"""
Modelos de Embeddings
=====================
Modelos SQLAlchemy para las tablas de embeddings vectoriales

Autor: Sistema de Analizador Financiero
Fecha: 11 noviembre 2025
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from app.crud.base import Base


class GastoEmbedding(Base):
    """
    Modelo para almacenar embeddings vectoriales de gastos.
    
    Cada gasto tiene un embedding que representa su contenido semántico,
    permitiendo búsquedas de similitud eficientes.
    """
    __tablename__ = "gastos_embeddings"
    
    id = Column(Integer, primary_key=True, index=True)
    gasto_id = Column(
        Integer, 
        ForeignKey("gastos.id_gasto", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # Un gasto solo tiene un embedding
        index=True
    )
    embedding = Column(
        Vector(1536),  # Dimensión de text-embedding-3-small
        nullable=False
    )
    texto_original = Column(
        Text,
        nullable=False,
        comment="Texto usado para generar el embedding"
    )
    metadata_ = Column(
        "metadata",  # Nombre real de la columna en la BD
        JSONB,
        nullable=True,
        comment="Metadatos adicionales (categoría, monto, fecha, etc.)"
    )
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    
    # Relación con Gasto
    gasto = relationship("Gasto", backref="embedding")
    
    # Índices
    __table_args__ = (
        # Índice IVFFlat para búsqueda vectorial (creado en SQL)
        # Index('idx_gastos_embeddings_vector', 'embedding', postgresql_using='ivfflat'),
        
        # Índice GIN para búsqueda en metadata JSONB
        Index('idx_gastos_embeddings_metadata', 'metadata', postgresql_using='gin'),
        
        # Índice para ordenamiento por fecha
        Index('idx_gastos_embeddings_created_at', 'created_at'),
    )
    
    def __repr__(self):
        return f"<GastoEmbedding(id={self.id}, gasto_id={self.gasto_id})>"


class IngresoEmbedding(Base):
    """
    Modelo para almacenar embeddings vectoriales de ingresos.
    
    Cada ingreso tiene un embedding que representa su contenido semántico,
    permitiendo búsquedas de similitud eficientes.
    """
    __tablename__ = "ingresos_embeddings"
    
    id = Column(Integer, primary_key=True, index=True)
    ingreso_id = Column(
        Integer,
        ForeignKey("ingresos.id_ingreso", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # Un ingreso solo tiene un embedding
        index=True
    )
    embedding = Column(
        Vector(1536),  # Dimensión de text-embedding-3-small
        nullable=False
    )
    texto_original = Column(
        Text,
        nullable=False,
        comment="Texto usado para generar el embedding"
    )
    metadata_ = Column(
        "metadata",  # Nombre real de la columna en la BD
        JSONB,
        nullable=True,
        comment="Metadatos adicionales (categoría, monto, fecha, etc.)"
    )
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    
    # Relación con Ingreso
    ingreso = relationship("Ingreso", backref="embedding")
    
    # Índices
    __table_args__ = (
        # Índice IVFFlat para búsqueda vectorial (creado en SQL)
        # Index('idx_ingresos_embeddings_vector', 'embedding', postgresql_using='ivfflat'),
        
        # Índice GIN para búsqueda en metadata JSONB
        Index('idx_ingresos_embeddings_metadata', 'metadata', postgresql_using='gin'),
        
        # Índice para ordenamiento por fecha
        Index('idx_ingresos_embeddings_created_at', 'created_at'),
    )
    
    def __repr__(self):
        return f"<IngresoEmbedding(id={self.id}, ingreso_id={self.ingreso_id})>"
