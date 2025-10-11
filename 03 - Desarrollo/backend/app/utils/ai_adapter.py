# ============================================================================
# ADAPTADOR ABSTRACTO PARA PROVEEDORES DE IA
# ============================================================================
# Permite cambiar entre Azure OpenAI, OpenAI, etc. sin modificar el código
from abc import ABC, abstractmethod
from typing import List, Dict, Optional


class ChatMessage:
    """Mensaje de chat"""
    def __init__(self, role: str, content: str):
        self.role = role  # 'user', 'assistant', 'system'
        self.content = content
    
    def to_dict(self) -> Dict:
        return {
            "role": self.role,
            "content": self.content
        }


class AIAdapter(ABC):
    """
    Clase abstracta para adaptadores de IA.
    Permite cambiar el proveedor de IA sin modificar el código del backend.
    """
    
    @abstractmethod
    async def generar_respuesta(
        self,
        mensajes: List[ChatMessage],
        contexto_adicional: Optional[str] = None,
        temperatura: float = 0.7,
        max_tokens: int = 1000
    ) -> str:
        """
        Genera una respuesta basada en el historial de mensajes.
        
        Args:
            mensajes: Lista de mensajes del historial
            contexto_adicional: Contexto extra (ej: datos de gastos del usuario)
            temperatura: Creatividad de la respuesta (0.0 - 1.0)
            max_tokens: Número máximo de tokens en la respuesta
            
        Returns:
            str: Respuesta generada por la IA
        """
        pass
    
    @abstractmethod
    async def test_conexion(self) -> bool:
        """
        Prueba la conexión con el servicio de IA.
        
        Returns:
            bool: True si la conexión es exitosa
        """
        pass
    
    @abstractmethod
    def get_nombre_proveedor(self) -> str:
        """
        Obtiene el nombre del proveedor de IA.
        
        Returns:
            str: Nombre del proveedor (ej: "Azure OpenAI", "OpenAI", "GPT")
        """
        pass
