# ============================================================================
# FACTORY PARA ADAPTADORES DE IA
# ============================================================================
# Crea el adaptador correcto según la configuración
import os
from typing import Optional
from .ai_adapter import AIAdapter
from .azure_openai_adapter import AzureOpenAIAdapter
from .openai_adapter import OpenAIAdapter


class AIAdapterFactory:
    """
    Factory para crear adaptadores de IA.
    Permite cambiar entre proveedores fácilmente.
    """
    
    @staticmethod
    def crear_adaptador(proveedor: Optional[str] = None) -> AIAdapter:
        """
        Crea un adaptador de IA según el proveedor especificado.
        
        Args:
            proveedor: Nombre del proveedor ("azure", "openai", etc.)
                      Si es None, usa la variable de entorno AI_PROVIDER
        
        Returns:
            AIAdapter: Instancia del adaptador correspondiente
            
        Raises:
            ValueError: Si el proveedor no es válido
        """
        # Obtener proveedor de env si no se especifica
        if proveedor is None:
            proveedor = os.getenv("AI_PROVIDER", "azure").lower()
        
        proveedor = proveedor.lower()
        
        if proveedor == "azure":
            return AzureOpenAIAdapter()
        elif proveedor == "openai":
            return OpenAIAdapter()
        else:
            raise ValueError(
                f"Proveedor '{proveedor}' no soportado. "
                f"Proveedores disponibles: 'azure', 'openai'"
            )
    
    @staticmethod
    def get_proveedores_disponibles() -> list:
        """
        Retorna la lista de proveedores disponibles.
        """
        return ["azure", "openai"]


# Instancia global del adaptador
_adaptador_global: Optional[AIAdapter] = None


def obtener_adaptador_ia() -> AIAdapter:
    """
    Obtiene la instancia global del adaptador de IA.
    Si no existe, la crea usando el factory.
    
    Returns:
        AIAdapter: Instancia del adaptador de IA
    """
    global _adaptador_global
    
    if _adaptador_global is None:
        _adaptador_global = AIAdapterFactory.crear_adaptador()
    
    return _adaptador_global


def cambiar_proveedor(proveedor: str) -> AIAdapter:
    """
    Cambia el proveedor de IA en tiempo de ejecución.
    
    Args:
        proveedor: Nombre del nuevo proveedor
        
    Returns:
        AIAdapter: Nueva instancia del adaptador
    """
    global _adaptador_global
    _adaptador_global = AIAdapterFactory.crear_adaptador(proveedor)
    return _adaptador_global
