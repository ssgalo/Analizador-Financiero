"""
Servicio de Búsqueda Vectorial
===============================
Realiza búsquedas de similitud vectorial en la base de datos usando pgvector

Responsabilidades:
- Ejecutar búsquedas vectoriales en gastos y/o ingresos
- Aplicar filtros adicionales (fecha, categoría, monto)
- Combinar resultados de múltiples fuentes
- Manejar umbrales de similitud

Autor: Sistema de Analizador Financiero
Fecha: 11 noviembre 2025
"""

import logging
from typing import List, Optional, Dict, Any, Tuple
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

logger = logging.getLogger(__name__)


class VectorSearchService:
    """
    Servicio para realizar búsquedas de similitud vectorial en la base de datos.
    
    Utiliza las funciones SQL de pgvector para búsquedas eficientes.
    """
    
    # Configuración por defecto
    DEFAULT_LIMIT = 10
    DEFAULT_SIMILARITY_THRESHOLD = 0.7  # 70% de similitud mínima
    MAX_LIMIT = 100
    
    def __init__(self, db: Session):
        """
        Inicializa el servicio con una sesión de base de datos.
        
        Args:
            db: Sesión de SQLAlchemy
        """
        self.db = db
        logger.debug("VectorSearchService inicializado")
    
    def search_gastos(
        self,
        query_embedding: List[float],
        limit: int = DEFAULT_LIMIT,
        similarity_threshold: float = DEFAULT_SIMILARITY_THRESHOLD,
        categoria: Optional[str] = None,
        fecha_desde: Optional[date] = None,
        fecha_hasta: Optional[date] = None,
        monto_min: Optional[Decimal] = None,
        monto_max: Optional[Decimal] = None
    ) -> List[Dict[str, Any]]:
        """
        Busca gastos similares usando búsqueda vectorial.
        
        Args:
            query_embedding: Vector de consulta (1536 dimensiones)
            limit: Número máximo de resultados
            similarity_threshold: Umbral mínimo de similitud (0-1)
            categoria: Filtro opcional por categoría
            fecha_desde: Filtro opcional de fecha inicial
            fecha_hasta: Filtro opcional de fecha final
            monto_min: Filtro opcional de monto mínimo
            monto_max: Filtro opcional de monto máximo
        
        Returns:
            Lista de gastos con su similitud
        """
        limit = min(limit, self.MAX_LIMIT)
        
        try:
            # Convertir el embedding a formato PostgreSQL array
            embedding_str = self._format_vector(query_embedding)
            
            # Construir y ejecutar la consulta
            if any([categoria, fecha_desde, fecha_hasta, monto_min, monto_max]):
                # Usar función con filtros
                query = text("""
                    SELECT * FROM search_gastos_with_filters(
                        :embedding::vector,
                        :limit,
                        :threshold,
                        :categoria,
                        :fecha_desde,
                        :fecha_hasta,
                        :monto_min,
                        :monto_max
                    )
                """)
                
                result = self.db.execute(query, {
                    "embedding": embedding_str,
                    "limit": limit,
                    "threshold": similarity_threshold,
                    "categoria": categoria,
                    "fecha_desde": fecha_desde,
                    "fecha_hasta": fecha_hasta,
                    "monto_min": float(monto_min) if monto_min else None,
                    "monto_max": float(monto_max) if monto_max else None
                })
            else:
                # Usar función básica sin filtros
                query = text("""
                    SELECT * FROM search_gastos_by_vector(
                        :embedding::vector,
                        :limit,
                        :threshold
                    )
                """)
                
                result = self.db.execute(query, {
                    "embedding": embedding_str,
                    "limit": limit,
                    "threshold": similarity_threshold
                })
            
            # Convertir resultados a diccionarios
            gastos = []
            for row in result:
                gastos.append({
                    "gasto_id": row[0],
                    "descripcion": row[1],
                    "monto": float(row[2]),
                    "fecha": row[3],
                    "categoria": row[4],
                    "moneda": row[5],
                    "similarity": float(row[6]),
                    "texto_embedding": row[7] if len(row) > 7 else None
                })
            
            logger.info(
                f"Búsqueda de gastos: {len(gastos)} resultados "
                f"(umbral: {similarity_threshold})"
            )
            
            return gastos
            
        except Exception as e:
            logger.error(f"Error en búsqueda vectorial de gastos: {str(e)}")
            return []
    
    def search_ingresos(
        self,
        query_embedding: List[float],
        limit: int = DEFAULT_LIMIT,
        similarity_threshold: float = DEFAULT_SIMILARITY_THRESHOLD,
        categoria: Optional[str] = None,
        fecha_desde: Optional[date] = None,
        fecha_hasta: Optional[date] = None,
        monto_min: Optional[Decimal] = None,
        monto_max: Optional[Decimal] = None
    ) -> List[Dict[str, Any]]:
        """
        Busca ingresos similares usando búsqueda vectorial.
        
        Args:
            query_embedding: Vector de consulta (1536 dimensiones)
            limit: Número máximo de resultados
            similarity_threshold: Umbral mínimo de similitud (0-1)
            categoria: Filtro opcional por categoría
            fecha_desde: Filtro opcional de fecha inicial
            fecha_hasta: Filtro opcional de fecha final
            monto_min: Filtro opcional de monto mínimo
            monto_max: Filtro opcional de monto máximo
        
        Returns:
            Lista de ingresos con su similitud
        """
        limit = min(limit, self.MAX_LIMIT)
        
        try:
            # Convertir el embedding a formato PostgreSQL array
            embedding_str = self._format_vector(query_embedding)
            
            # Construir y ejecutar la consulta
            if any([categoria, fecha_desde, fecha_hasta, monto_min, monto_max]):
                # Usar función con filtros
                query = text("""
                    SELECT * FROM search_ingresos_with_filters(
                        :embedding::vector,
                        :limit,
                        :threshold,
                        :categoria,
                        :fecha_desde,
                        :fecha_hasta,
                        :monto_min,
                        :monto_max
                    )
                """)
                
                result = self.db.execute(query, {
                    "embedding": embedding_str,
                    "limit": limit,
                    "threshold": similarity_threshold,
                    "categoria": categoria,
                    "fecha_desde": fecha_desde,
                    "fecha_hasta": fecha_hasta,
                    "monto_min": float(monto_min) if monto_min else None,
                    "monto_max": float(monto_max) if monto_max else None
                })
            else:
                # Usar función básica sin filtros
                query = text("""
                    SELECT * FROM search_ingresos_by_vector(
                        :embedding::vector,
                        :limit,
                        :threshold
                    )
                """)
                
                result = self.db.execute(query, {
                    "embedding": embedding_str,
                    "limit": limit,
                    "threshold": similarity_threshold
                })
            
            # Convertir resultados a diccionarios
            ingresos = []
            for row in result:
                ingresos.append({
                    "ingreso_id": row[0],
                    "descripcion": row[1],
                    "monto": float(row[2]),
                    "fecha": row[3],
                    "categoria": row[4],
                    "moneda": row[5],
                    "similarity": float(row[6]),
                    "texto_embedding": row[7] if len(row) > 7 else None
                })
            
            logger.info(
                f"Búsqueda de ingresos: {len(ingresos)} resultados "
                f"(umbral: {similarity_threshold})"
            )
            
            return ingresos
            
        except Exception as e:
            logger.error(f"Error en búsqueda vectorial de ingresos: {str(e)}")
            return []
    
    def search_combined(
        self,
        query_embedding: List[float],
        limit: int = DEFAULT_LIMIT,
        similarity_threshold: float = DEFAULT_SIMILARITY_THRESHOLD
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Busca tanto en gastos como en ingresos y retorna ambos resultados.
        
        Args:
            query_embedding: Vector de consulta (1536 dimensiones)
            limit: Número máximo de resultados por tipo
            similarity_threshold: Umbral mínimo de similitud (0-1)
        
        Returns:
            Tupla con (gastos, ingresos)
        """
        limit = min(limit, self.MAX_LIMIT)
        
        try:
            # Convertir el embedding a formato PostgreSQL array
            embedding_str = self._format_vector(query_embedding)
            
            # Ejecutar búsqueda combinada
            query = text("""
                SELECT * FROM search_combined_by_vector(
                    :embedding::vector,
                    :limit,
                    :threshold
                )
            """)
            
            result = self.db.execute(query, {
                "embedding": embedding_str,
                "limit": limit,
                "threshold": similarity_threshold
            })
            
            # Separar resultados por tipo
            gastos = []
            ingresos = []
            
            for row in result:
                transaction_type = row[0]
                data = {
                    "id": row[1],
                    "descripcion": row[2],
                    "monto": float(row[3]),
                    "fecha": row[4],
                    "categoria": row[5],
                    "moneda": row[6],
                    "similarity": float(row[7]),
                    "texto_embedding": row[8] if len(row) > 8 else None,
                    "metadata": row[9] if len(row) > 9 else None
                }
                
                if transaction_type == "gasto":
                    gastos.append(data)
                elif transaction_type == "ingreso":
                    ingresos.append(data)
            
            logger.info(
                f"Búsqueda combinada: {len(gastos)} gastos, {len(ingresos)} ingresos "
                f"(umbral: {similarity_threshold})"
            )
            
            return gastos, ingresos
            
        except Exception as e:
            logger.error(f"Error en búsqueda vectorial combinada: {str(e)}")
            return [], []
    
    def get_embedding_stats(self) -> Dict[str, Any]:
        """
        Obtiene estadísticas de cobertura de embeddings.
        
        Returns:
            Diccionario con estadísticas por tipo de entidad
        """
        try:
            query = text("SELECT * FROM get_embedding_stats()")
            result = self.db.execute(query)
            
            stats = {}
            for row in result:
                entity_type = row[0]
                stats[entity_type] = {
                    "total_records": row[1],
                    "records_with_embeddings": row[2],
                    "coverage_percentage": float(row[3]) if row[3] else 0.0,
                    "avg_vector_magnitude": float(row[4]) if row[4] else 0.0,
                    "oldest_embedding": row[5],
                    "newest_embedding": row[6]
                }
            
            logger.info(f"Estadísticas de embeddings: {stats}")
            return stats
            
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas de embeddings: {str(e)}")
            return {}
    
    def _format_vector(self, embedding: List[float]) -> str:
        """
        Convierte una lista de floats a formato de array de PostgreSQL.
        
        Args:
            embedding: Lista de floats
        
        Returns:
            String en formato '[1.0, 2.0, 3.0, ...]'
        """
        return "[" + ",".join(str(x) for x in embedding) + "]"
    
    def adjust_threshold_dynamically(
        self,
        query_embedding: List[float],
        entity_type: str,
        min_results: int = 5,
        initial_threshold: float = 0.7,
        threshold_step: float = 0.05,
        min_threshold: float = 0.5
    ) -> Tuple[List[Dict[str, Any]], float]:
        """
        Ajusta dinámicamente el umbral de similitud para obtener un mínimo de resultados.
        
        Si la búsqueda inicial no retorna suficientes resultados, reduce el umbral
        gradualmente hasta alcanzar el mínimo deseado o el umbral mínimo.
        
        Args:
            query_embedding: Vector de consulta
            entity_type: "gastos" o "ingresos"
            min_results: Número mínimo de resultados deseados
            initial_threshold: Umbral inicial
            threshold_step: Paso de reducción del umbral
            min_threshold: Umbral mínimo permitido
        
        Returns:
            Tupla con (resultados, umbral_usado)
        """
        current_threshold = initial_threshold
        results = []
        
        while current_threshold >= min_threshold:
            if entity_type == "gastos":
                results = self.search_gastos(
                    query_embedding,
                    limit=self.DEFAULT_LIMIT,
                    similarity_threshold=current_threshold
                )
            elif entity_type == "ingresos":
                results = self.search_ingresos(
                    query_embedding,
                    limit=self.DEFAULT_LIMIT,
                    similarity_threshold=current_threshold
                )
            else:
                logger.error(f"Tipo de entidad no válido: {entity_type}")
                return [], current_threshold
            
            if len(results) >= min_results:
                logger.info(
                    f"Umbral ajustado a {current_threshold} "
                    f"({len(results)} resultados)"
                )
                return results, current_threshold
            
            # Reducir umbral
            current_threshold -= threshold_step
        
        logger.warning(
            f"No se alcanzó el mínimo de {min_results} resultados. "
            f"Retornando {len(results)} con umbral {current_threshold + threshold_step}"
        )
        
        return results, current_threshold + threshold_step
