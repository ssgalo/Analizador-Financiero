# ============================================================================
# SCHEMAS PARA CHAT CON IA
# ============================================================================
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ChatMensajeRequest(BaseModel):
    """Request para enviar un mensaje al chat"""
    mensaje: str = Field(..., description="Mensaje del usuario")
    conversacion_id: Optional[str] = Field(None, description="ID de la conversación (opcional)")
    contexto_gastos: bool = Field(True, description="Incluir contexto de gastos del usuario")
    temperatura: float = Field(0.7, description="Temperatura del modelo (0-2)")
    max_tokens: int = Field(1000, description="Máximo de tokens en la respuesta")


class ChatMensajeResponse(BaseModel):
    """Response con la respuesta del chat"""
    respuesta: str = Field(..., description="Respuesta generada por la IA")
    conversacion_id: str = Field(..., description="ID de la conversación")
    sugerencias: Optional[List[str]] = Field(None, description="Sugerencias de seguimiento")
    tokens_utilizados: int = Field(0, description="Tokens utilizados en esta respuesta")
    tokens_restantes_dia: int = Field(0, description="Tokens restantes para hoy")
    limite_diario: int = Field(0, description="Límite diario de tokens")


class ChatMensajeDetalle(BaseModel):
    """Mensaje individual en el chat"""
    id: str
    role: str  # 'user', 'assistant', 'system'
    content: str
    timestamp: datetime


class ChatConversacion(BaseModel):
    """Conversación completa del chat"""
    id: str
    titulo: str
    mensajes: List[ChatMensajeDetalle]
    fecha_creacion: datetime
    fecha_modificacion: datetime
    
    class Config:
        from_attributes = True


class ChatConversacionResumen(BaseModel):
    """Resumen de conversación para lista"""
    id: str
    titulo: str
    ultimo_mensaje: str
    fecha_creacion: str
    fecha_actualizacion: str
    cantidad_mensajes: int


class ChatConversacionCreate(BaseModel):
    """Request para crear una nueva conversación"""
    titulo: Optional[str] = Field(None, description="Título de la conversación")


class ChatProveedorInfo(BaseModel):
    """Información del proveedor de IA"""
    nombre: str
    estado: str  # 'conectado', 'desconectado', 'error'
    proveedores_disponibles: List[str]


class ChatLimitesUsuario(BaseModel):
    """Límites y uso de tokens del usuario"""
    limite_diario: int = Field(10000, description="Límite diario de tokens")
    limite_por_mensaje: int = Field(2000, description="Límite de tokens por mensaje")
    tokens_usados_hoy: int = Field(0, description="Tokens utilizados hoy")
    tokens_restantes_dia: int = Field(0, description="Tokens restantes para hoy")
    mensajes_hoy: int = Field(0, description="Cantidad de mensajes enviados hoy")
    ultimo_reset: datetime = Field(default_factory=datetime.now, description="Última vez que se reseteó el contador")


class ChatEstadisticasUso(BaseModel):
    """Estadísticas de uso del chat del usuario"""
    total_conversaciones: int
    total_mensajes: int
    tokens_utilizados_mes: int
    tokens_utilizados_semana: int
    promedio_tokens_por_mensaje: float
