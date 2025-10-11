# ============================================================================
# ADAPTADOR PARA OPENAI (GPT)
# ============================================================================
# Este adaptador es para usar OpenAI directamente (no Azure)
import os
import httpx
from typing import List, Optional
from .ai_adapter import AIAdapter, ChatMessage


class OpenAIAdapter(AIAdapter):
    """
    Adaptador para OpenAI API directa.
    Permite usar GPT-4, GPT-3.5-turbo, etc.
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "gpt-4"
    ):
        """
        Inicializa el adaptador de OpenAI.
        
        Args:
            api_key: API Key de OpenAI
            model: Modelo a usar (ej: "gpt-4", "gpt-3.5-turbo")
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.model = model
        
        if not self.api_key:
            raise ValueError(
                "Se requiere OPENAI_API_KEY como variable de entorno o parámetro"
            )
        
        self.url = "https://api.openai.com/v1/chat/completions"
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
    
    async def generar_respuesta(
        self,
        mensajes: List[ChatMessage],
        contexto_adicional: Optional[str] = None,
        temperatura: float = 0.7,
        max_tokens: int = 1000
    ) -> str:
        """
        Genera una respuesta usando OpenAI.
        """
        try:
            # Preparar mensajes
            messages = []
            
            # Agregar contexto adicional si existe
            if contexto_adicional:
                messages.append({
                    "role": "system",
                    "content": contexto_adicional
                })
            
            # Agregar historial
            for msg in mensajes:
                messages.append(msg.to_dict())
            
            # Preparar payload
            payload = {
                "model": self.model,
                "messages": messages,
                "temperature": temperatura,
                "max_tokens": max_tokens
            }
            
            # Hacer petición
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.url,
                    headers=self.headers,
                    json=payload
                )
                response.raise_for_status()
                
                data = response.json()
                return data["choices"][0]["message"]["content"]
                
        except Exception as e:
            raise Exception(f"Error al generar respuesta con OpenAI: {str(e)}")
    
    async def test_conexion(self) -> bool:
        """
        Prueba la conexión con OpenAI.
        """
        try:
            test_messages = [ChatMessage(role="user", content="Test")]
            await self.generar_respuesta(test_messages, max_tokens=10)
            return True
        except Exception as e:
            print(f"Error al probar conexión con OpenAI: {str(e)}")
            return False
    
    def get_nombre_proveedor(self) -> str:
        """
        Retorna el nombre del proveedor.
        """
        return f"OpenAI ({self.model})"
