"""
Servicio de Embeddings
======================
Genera embeddings vectoriales usando Azure OpenAI o Google Gemini

Responsabilidades:
- Generar embeddings de texto usando Azure OpenAI o Gemini
- Procesar texto para optimizar la calidad de embeddings
- Manejar errores y reintentos en llamadas a la API
- Calcular costos de embeddings

Autor: Sistema de Analizador Financiero
Fecha: 12 noviembre 2025
"""

import os
import logging
from typing import List, Optional, Dict, Any
import time

logger = logging.getLogger(__name__)


class EmbeddingsService:
    """
    Servicio para generar embeddings vectoriales usando Azure OpenAI o Google Gemini.
    
    Soporta múltiples proveedores:
    - Azure OpenAI: text-embedding-3-small (1536 dimensiones)
    - Google Gemini: text-embedding-004 (768 dimensiones)
    """
    
    def __init__(self):
        """
        Inicializa el cliente según el proveedor configurado.
        
        Variables de entorno:
        - EMBEDDING_PROVIDER: "azure" o "gemini" (default: azure)
        
        Para Azure OpenAI:
        - AZURE_OPENAI_API_KEY
        - AZURE_OPENAI_ENDPOINT
        - AZURE_OPENAI_EMBEDDING_DEPLOYMENT
        
        Para Gemini:
        - GEMINI_API_KEY
        """
        self.provider = os.getenv("EMBEDDING_PROVIDER", "azure").lower()
        
        if self.provider == "gemini":
            self._init_gemini()
        else:
            self._init_azure()
        
        logger.info(f"EmbeddingsService inicializado con proveedor: {self.provider}")
    
    def _init_azure(self):
        """Inicializa cliente de Azure OpenAI"""
        from openai import AzureOpenAI
        
        self.api_key = os.getenv("AZURE_OPENAI_API_KEY")
        self.endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        self.deployment = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT", "text-embedding-3-small")
        
        if not self.api_key or not self.endpoint:
            raise ValueError(
                "Variables de entorno AZURE_OPENAI_API_KEY y AZURE_OPENAI_ENDPOINT son requeridas"
            )
        
        self.client = AzureOpenAI(
            api_key=self.api_key,
            api_version="2024-02-01",
            azure_endpoint=self.endpoint
        )
        
        self.model_name = "text-embedding-3-small"
        self.embedding_dimensions = 1536
        self.max_tokens = 8191
        self.cost_per_1m_tokens = 0.02
    
    def _init_gemini(self):
        """Inicializa cliente de Google Gemini"""
        import google.generativeai as genai
        
        self.api_key = os.getenv("GEMINI_API_KEY")
        
        if not self.api_key:
            raise ValueError("Variable de entorno GEMINI_API_KEY es requerida")
        
        genai.configure(api_key=self.api_key)
        
        self.model_name = "models/text-embedding-004"
        self.embedding_dimensions = 768
        self.max_tokens = 2048
        self.cost_per_1m_tokens = 0.0  # Gemini es gratis (con límites)
    
    def generate_embedding(
        self, 
        text: str,
        retry_count: int = 3,
        retry_delay: float = 1.0
    ) -> Optional[List[float]]:
        """
        Genera un embedding vectorial para el texto dado.
        
        Args:
            text: Texto para generar el embedding
            retry_count: Número de reintentos en caso de error
            retry_delay: Delay entre reintentos en segundos
        
        Returns:
            Lista de floats representando el vector,
            o None si hay un error irrecuperable
        """
        if not text or not text.strip():
            logger.warning("Texto vacío proporcionado para embedding")
            return None
        
        # Limpiar y preparar el texto
        cleaned_text = self._preprocess_text(text)
        
        for attempt in range(retry_count):
            try:
                if self.provider == "gemini":
                    embedding = self._generate_gemini_embedding(cleaned_text)
                else:
                    embedding = self._generate_azure_embedding(cleaned_text)
                
                # Validar dimensiones
                if len(embedding) != self.embedding_dimensions:
                    logger.error(
                        f"Embedding con dimensiones incorrectas: "
                        f"{len(embedding)} (esperado: {self.embedding_dimensions})"
                    )
                    return None
                
                logger.debug(f"Embedding generado exitosamente ({len(embedding)} dimensiones)")
                return embedding
                
            except Exception as e:
                logger.warning(
                    f"Intento {attempt + 1}/{retry_count} falló: {type(e).__name__}: {str(e)}"
                )
                
                if attempt < retry_count - 1:
                    time.sleep(retry_delay * (attempt + 1))  # Backoff exponencial
                else:
                    logger.error(f"Error generando embedding después de {retry_count} intentos")
                    return None
    
    def _generate_azure_embedding(self, text: str) -> List[float]:
        """Genera embedding usando Azure OpenAI"""
        response = self.client.embeddings.create(
            model=self.deployment,
            input=text
        )
        return response.data[0].embedding
    
    def _generate_gemini_embedding(self, text: str) -> List[float]:
        """Genera embedding usando Google Gemini"""
        import google.generativeai as genai
        
        result = genai.embed_content(
            model=self.model_name,
            content=text,
            task_type="retrieval_document",  # Para documentos que se indexarán
            title="Financial data"  # Opcional
        )
        
        return result['embedding']
    
    def generate_embeddings_batch(
        self,
        texts: List[str],
        batch_size: int = 100
    ) -> List[Optional[List[float]]]:
        """
        Genera embeddings para múltiples textos en lotes.
        
        Args:
            texts: Lista de textos para generar embeddings
            batch_size: Tamaño del lote (Azure OpenAI soporta hasta 2048)
        
        Returns:
            Lista de embeddings (o None para textos que fallaron)
        """
        results = []
        total_batches = (len(texts) + batch_size - 1) // batch_size
        
        logger.info(f"Generando embeddings para {len(texts)} textos en {total_batches} lotes")
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            batch_num = i // batch_size + 1
            
            logger.info(f"Procesando lote {batch_num}/{total_batches}")
            
            try:
                # Limpiar textos
                cleaned_batch = [self._preprocess_text(text) for text in batch]
                
                # Llamada a la API con el lote completo
                response = self.client.embeddings.create(
                    model=self.deployment,
                    input=cleaned_batch
                )
                
                # Extraer embeddings
                batch_embeddings = [data.embedding for data in response.data]
                results.extend(batch_embeddings)
                
                # Log de uso
                tokens_used = response.usage.total_tokens
                cost = self._calculate_cost(tokens_used)
                logger.info(
                    f"Lote {batch_num} completado: {tokens_used} tokens, "
                    f"costo: ${cost:.6f}"
                )
                
            except Exception as e:
                logger.error(f"Error procesando lote {batch_num}: {str(e)}")
                # Agregar None para cada texto que falló
                results.extend([None] * len(batch))
        
        return results
    
    def _preprocess_text(self, text: str) -> str:
        """
        Limpia y prepara el texto para generar un embedding de calidad.
        
        Args:
            text: Texto original
        
        Returns:
            Texto limpio y preparado
        """
        # Eliminar espacios extras
        cleaned = " ".join(text.split())
        
        # Limitar longitud (dejar margen para el límite de tokens)
        max_chars = self.max_tokens * 4  # Aproximadamente 4 chars por token
        if len(cleaned) > max_chars:
            cleaned = cleaned[:max_chars]
            logger.warning(f"Texto truncado de {len(text)} a {max_chars} caracteres")
        
        return cleaned
    
    def _calculate_cost(self, tokens: int) -> float:
        """
        Calcula el costo de generar embeddings.
        
        Args:
            tokens: Número de tokens procesados
        
        Returns:
            Costo en USD
        """
        return (tokens / 1_000_000) * self.COST_PER_1M_TOKENS
    
    def build_gasto_text(self, gasto: Dict[str, Any]) -> str:
        """
        Construye el texto descriptivo de un gasto para generar su embedding.
        
        Combina descripción, categoría, monto y fecha en un texto rico en contexto.
        
        Args:
            gasto: Diccionario con datos del gasto
        
        Returns:
            Texto descriptivo para embedding
        """
        parts = []
        
        # Descripción principal
        if gasto.get("descripcion"):
            parts.append(f"Gasto: {gasto['descripcion']}")
        
        # Categoría
        if gasto.get("categoria"):
            parts.append(f"Categoría: {gasto['categoria']}")
        
        # Monto con moneda
        if gasto.get("monto") and gasto.get("moneda"):
            parts.append(f"Monto: {gasto['monto']} {gasto['moneda']}")
        
        # Fecha
        if gasto.get("fecha"):
            parts.append(f"Fecha: {gasto['fecha']}")
        
        # Notas adicionales
        if gasto.get("notas"):
            parts.append(f"Notas: {gasto['notas']}")
        
        # Método de pago
        if gasto.get("metodo_pago"):
            parts.append(f"Método: {gasto['metodo_pago']}")
        
        return " | ".join(parts)
    
    def build_ingreso_text(self, ingreso: Dict[str, Any]) -> str:
        """
        Construye el texto descriptivo de un ingreso para generar su embedding.
        
        Args:
            ingreso: Diccionario con datos del ingreso
        
        Returns:
            Texto descriptivo para embedding
        """
        parts = []
        
        # Descripción principal
        if ingreso.get("descripcion"):
            parts.append(f"Ingreso: {ingreso['descripcion']}")
        
        # Categoría
        if ingreso.get("categoria"):
            parts.append(f"Categoría: {ingreso['categoria']}")
        
        # Monto con moneda
        if ingreso.get("monto") and ingreso.get("moneda"):
            parts.append(f"Monto: {ingreso['monto']} {ingreso['moneda']}")
        
        # Fecha
        if ingreso.get("fecha"):
            parts.append(f"Fecha: {ingreso['fecha']}")
        
        # Notas adicionales
        if ingreso.get("notas"):
            parts.append(f"Notas: {ingreso['notas']}")
        
        # Fuente
        if ingreso.get("fuente"):
            parts.append(f"Fuente: {ingreso['fuente']}")
        
        return " | ".join(parts)
    
    def build_metadata(self, entity: Dict[str, Any], entity_type: str) -> Dict[str, Any]:
        """
        Construye el metadata JSON para almacenar junto con el embedding.
        
        Args:
            entity: Diccionario con datos de la entidad (gasto o ingreso)
            entity_type: Tipo de entidad ("gasto" o "ingreso")
        
        Returns:
            Diccionario con metadata relevante
        """
        metadata = {
            "tipo": entity_type,
            "categoria": entity.get("categoria"),
            "monto": float(entity.get("monto", 0)),
            "moneda": entity.get("moneda"),
            "fecha": str(entity.get("fecha")) if entity.get("fecha") else None,
        }
        
        # Campos específicos por tipo
        if entity_type == "gasto":
            metadata["metodo_pago"] = entity.get("metodo_pago")
            metadata["fuente"] = entity.get("fuente")
        elif entity_type == "ingreso":
            metadata["fuente"] = entity.get("fuente")
        
        # Remover valores None
        return {k: v for k, v in metadata.items() if v is not None}
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Retorna estadísticas del servicio de embeddings.
        
        Returns:
            Diccionario con información de configuración y costos
        """
        return {
            "model": self.MODEL_NAME,
            "dimensions": self.EMBEDDING_DIMENSIONS,
            "max_tokens": self.max_tokens,
            "cost_per_1m_tokens": self.COST_PER_1M_TOKENS,
            "deployment": self.deployment,
            "endpoint": self.endpoint.replace(self.api_key, "***") if self.endpoint else None
        }
