# ============================================================================
# ADAPTADOR PARA AZURE OPENAI
# ============================================================================
import os
import sys
import httpx
import logging
from typing import List, Optional
from .ai_adapter import AIAdapter, ChatMessage

logger = logging.getLogger(__name__)


class AzureOpenAIAdapter(AIAdapter):
    """
    Adaptador para Azure OpenAI Service.
    Permite usar GPT-4, GPT-3.5, etc. a través de Azure.
    """
    
    def __init__(
        self,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
        deployment_name: Optional[str] = None,
        api_version: str = "2024-02-15-preview"
    ):
        """
        Inicializa el adaptador de Azure OpenAI.
        
        Args:
            endpoint: URL del endpoint de Azure OpenAI
            api_key: API Key de Azure OpenAI
            deployment_name: Nombre del deployment (ej: "gpt-4", "gpt-35-turbo")
            api_version: Versión de la API de Azure OpenAI
        """
        self.endpoint = endpoint or os.getenv("AZURE_OPENAI_ENDPOINT")
        self.api_key = api_key or os.getenv("AZURE_OPENAI_API_KEY")
        self.deployment_name = deployment_name or os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4")
        self.api_version = api_version
        
        if not self.endpoint or not self.api_key:
            raise ValueError(
                "Se requieren AZURE_OPENAI_ENDPOINT y AZURE_OPENAI_API_KEY "
                "como variables de entorno o parámetros"
            )
        
        # Construir URL completa
        self.url = f"{self.endpoint}/openai/deployments/{self.deployment_name}/chat/completions?api-version={self.api_version}"
        
        # Headers para las peticiones
        self.headers = {
            "Content-Type": "application/json",
            "api-key": self.api_key
        }
    
    async def generar_respuesta(
        self,
        mensajes: List[ChatMessage],
        contexto_adicional: Optional[str] = None,
        temperatura: float = 0.7,
        max_tokens: int = 1000
    ) -> str:
        """
        Genera una respuesta usando Azure OpenAI.
        """
        try:
            # Preparar mensajes
            messages = []
            
            # ESTRATEGIA: Agregar contexto como system Y reforzar en el primer mensaje user
            if contexto_adicional:
                # 1. Agregar como mensaje del sistema
                messages.append({
                    "role": "system",
                    "content": contexto_adicional
                })
                print(f"\n{'='*80}", file=sys.stderr)
                print(f"[AZURE] System prompt AGREGADO ({len(contexto_adicional)} chars)", file=sys.stderr)
                print(f"[AZURE] Primeros 300 chars: {contexto_adicional[:300]}", file=sys.stderr)
                print(f"{'='*80}\n", file=sys.stderr)
                
                # 2. SI es el primer mensaje del usuario, reforzar el prompt
                if len(mensajes) == 1 and mensajes[0].role == "user":
                    # Prepend el contexto al primer mensaje del usuario
                    primer_mensaje = mensajes[0]
                    mensaje_reforzado = ChatMessage(
                        role="user",
                        content=f"{contexto_adicional}\n\n---\n\nUsuario: {primer_mensaje.content}"
                    )
                    messages.append(mensaje_reforzado.to_dict())
                    print(f"[AZURE] ⚡ REFORZADO: Contexto agregado al primer mensaje user", file=sys.stderr)
                else:
                    # Agregar mensajes normalmente
                    for msg in mensajes:
                        messages.append(msg.to_dict())
            else:
                print(f"\n⚠️ [AZURE] NO SE RECIBIÓ contexto_adicional!\n", file=sys.stderr)
                # Agregar mensajes sin contexto
                for msg in mensajes:
                    messages.append(msg.to_dict())
            
            print(f"[AZURE] Total mensajes: {len(messages)}, Primer role: {messages[0].get('role') if messages else 'VACÍO'}", file=sys.stderr)
            
            # Preparar payload
            payload = {
                "messages": messages,
                "temperature": temperatura,
                "max_tokens": max_tokens,
                "top_p": 0.95,
                "frequency_penalty": 0,
                "presence_penalty": 0
            }
            
            # Hacer petición a Azure OpenAI
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.url,
                    headers=self.headers,
                    json=payload
                )
                response.raise_for_status()
                
                # Extraer respuesta
                data = response.json()
                return data["choices"][0]["message"]["content"]
                
        except httpx.HTTPStatusError as e:
            error_detail = e.response.text
            raise Exception(f"Error en Azure OpenAI: {e.response.status_code} - {error_detail}")
        except Exception as e:
            raise Exception(f"Error al generar respuesta: {str(e)}")
    
    async def test_conexion(self) -> bool:
        """
        Prueba la conexión con Azure OpenAI.
        """
        try:
            # Hacer una petición simple para verificar la conexión
            test_messages = [
                ChatMessage(role="user", content="Test")
            ]
            await self.generar_respuesta(test_messages, max_tokens=10)
            return True
        except Exception as e:
            print(f"Error al probar conexión con Azure OpenAI: {str(e)}")
            return False
    
    def get_nombre_proveedor(self) -> str:
        """
        Retorna el nombre del proveedor.
        """
        return f"Azure OpenAI ({self.deployment_name})"
