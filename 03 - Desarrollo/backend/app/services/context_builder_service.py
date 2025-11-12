"""
Servicio de Construcción de Contexto
=====================================
Construye contexto optimizado para GPT-4 a partir de resultados de búsqueda vectorial

Responsabilidades:
- Formatear resultados de búsqueda vectorial para GPT-4
- Construir contexto conciso y relevante
- Agregar información de resumen (totales, promedios)
- Limitar tokens para optimizar costos

Autor: Sistema de Analizador Financiero
Fecha: 11 noviembre 2025
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import date
from decimal import Decimal

logger = logging.getLogger(__name__)


class ContextBuilderService:
    """
    Servicio para construir contexto optimizado desde resultados de búsqueda vectorial.
    
    Reduce el contexto de ~15,000 tokens a ~800 tokens usando solo resultados relevantes.
    """
    
    # Límites de tokens aproximados
    MAX_CONTEXT_TOKENS = 1000
    CHARS_PER_TOKEN = 4  # Aproximadamente
    MAX_CONTEXT_CHARS = MAX_CONTEXT_TOKENS * CHARS_PER_TOKEN
    
    def __init__(self):
        """Inicializa el servicio de construcción de contexto."""
        logger.debug("ContextBuilderService inicializado")
    
    def build_context_from_search(
        self,
        gastos: List[Dict[str, Any]],
        ingresos: List[Dict[str, Any]],
        user_query: str,
        include_stats: bool = True
    ) -> str:
        """
        Construye el contexto completo para enviar a GPT-4.
        
        Args:
            gastos: Lista de gastos relevantes de la búsqueda vectorial
            ingresos: Lista de ingresos relevantes de la búsqueda vectorial
            user_query: Pregunta del usuario
            include_stats: Si incluir estadísticas resumidas
        
        Returns:
            Contexto formateado como string
        """
        context_parts = []
        
        # Encabezado
        context_parts.append("=== CONTEXTO FINANCIERO RELEVANTE ===\n")
        context_parts.append(f"Pregunta del usuario: {user_query}\n")
        context_parts.append("Datos encontrados por similitud semántica:\n")
        
        # Estadísticas generales
        if include_stats and (gastos or ingresos):
            stats = self._calculate_stats(gastos, ingresos)
            context_parts.append(f"\n--- RESUMEN ---")
            context_parts.append(f"Total gastos encontrados: {stats['total_gastos']}")
            context_parts.append(f"Total ingresos encontrados: {stats['total_ingresos']}")
            
            if stats['total_gastos'] > 0:
                context_parts.append(
                    f"Suma total de gastos: {stats['suma_gastos']:.2f} "
                    f"(promedio: {stats['promedio_gastos']:.2f})"
                )
            
            if stats['total_ingresos'] > 0:
                context_parts.append(
                    f"Suma total de ingresos: {stats['suma_ingresos']:.2f} "
                    f"(promedio: {stats['promedio_ingresos']:.2f})"
                )
            
            context_parts.append("")
        
        # Gastos
        if gastos:
            context_parts.append("\n--- GASTOS RELEVANTES ---")
            for i, gasto in enumerate(gastos, 1):
                gasto_str = self._format_gasto(gasto, i)
                context_parts.append(gasto_str)
        
        # Ingresos
        if ingresos:
            context_parts.append("\n--- INGRESOS RELEVANTES ---")
            for i, ingreso in enumerate(ingresos, 1):
                ingreso_str = self._format_ingreso(ingreso, i)
                context_parts.append(ingreso_str)
        
        # Instrucciones para GPT-4
        context_parts.append("\n--- INSTRUCCIONES ---")
        context_parts.append(
            "Los datos anteriores fueron seleccionados por similitud semántica con la pregunta. "
            "Responde usando SOLO esta información. Si la información es insuficiente para "
            "responder con precisión, indica qué datos adicionales serían necesarios."
        )
        
        # Unir todo
        full_context = "\n".join(context_parts)
        
        # Verificar longitud y truncar si es necesario
        if len(full_context) > self.MAX_CONTEXT_CHARS:
            logger.warning(
                f"Contexto excede el límite ({len(full_context)} chars), truncando..."
            )
            full_context = full_context[:self.MAX_CONTEXT_CHARS] + "\n[... contexto truncado ...]"
        
        logger.info(
            f"Contexto construido: {len(full_context)} caracteres, "
            f"~{len(full_context) // self.CHARS_PER_TOKEN} tokens estimados"
        )
        
        return full_context
    
    def build_minimal_context(
        self,
        gastos: List[Dict[str, Any]],
        ingresos: List[Dict[str, Any]]
    ) -> str:
        """
        Construye un contexto mínimo solo con datos esenciales.
        
        Args:
            gastos: Lista de gastos
            ingresos: Lista de ingresos
        
        Returns:
            Contexto minimalista
        """
        lines = []
        
        if gastos:
            lines.append("GASTOS:")
            for g in gastos:
                lines.append(
                    f"- {g.get('fecha')}: {g.get('descripcion')} "
                    f"${g.get('monto')} {g.get('moneda')} "
                    f"({g.get('categoria')})"
                )
        
        if ingresos:
            lines.append("\nINGRESOS:")
            for i in ingresos:
                lines.append(
                    f"- {i.get('fecha')}: {i.get('descripcion')} "
                    f"${i.get('monto')} {i.get('moneda')} "
                    f"({i.get('categoria')})"
                )
        
        return "\n".join(lines)
    
    def _format_gasto(self, gasto: Dict[str, Any], index: int) -> str:
        """
        Formatea un gasto para el contexto.
        
        Args:
            gasto: Diccionario con datos del gasto
            index: Número del gasto en la lista
        
        Returns:
            String formateado
        """
        parts = [f"{index}. {gasto.get('descripcion', 'Sin descripción')}"]
        
        if gasto.get('monto') and gasto.get('moneda'):
            parts.append(f"Monto: ${gasto['monto']} {gasto['moneda']}")
        
        if gasto.get('fecha'):
            parts.append(f"Fecha: {gasto['fecha']}")
        
        if gasto.get('categoria'):
            parts.append(f"Categoría: {gasto['categoria']}")
        
        # Similitud (indica qué tan relevante es)
        if gasto.get('similarity'):
            parts.append(f"Relevancia: {gasto['similarity'] * 100:.1f}%")
        
        return " | ".join(parts)
    
    def _format_ingreso(self, ingreso: Dict[str, Any], index: int) -> str:
        """
        Formatea un ingreso para el contexto.
        
        Args:
            ingreso: Diccionario con datos del ingreso
            index: Número del ingreso en la lista
        
        Returns:
            String formateado
        """
        parts = [f"{index}. {ingreso.get('descripcion', 'Sin descripción')}"]
        
        if ingreso.get('monto') and ingreso.get('moneda'):
            parts.append(f"Monto: ${ingreso['monto']} {ingreso['moneda']}")
        
        if ingreso.get('fecha'):
            parts.append(f"Fecha: {ingreso['fecha']}")
        
        if ingreso.get('categoria'):
            parts.append(f"Categoría: {ingreso['categoria']}")
        
        # Similitud (indica qué tan relevante es)
        if ingreso.get('similarity'):
            parts.append(f"Relevancia: {ingreso['similarity'] * 100:.1f}%")
        
        return " | ".join(parts)
    
    def _calculate_stats(
        self,
        gastos: List[Dict[str, Any]],
        ingresos: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Calcula estadísticas resumidas de los resultados.
        
        Args:
            gastos: Lista de gastos
            ingresos: Lista de ingresos
        
        Returns:
            Diccionario con estadísticas
        """
        stats = {
            "total_gastos": len(gastos),
            "total_ingresos": len(ingresos),
            "suma_gastos": 0.0,
            "suma_ingresos": 0.0,
            "promedio_gastos": 0.0,
            "promedio_ingresos": 0.0
        }
        
        # Calcular suma de gastos
        if gastos:
            suma = sum(float(g.get('monto', 0)) for g in gastos)
            stats["suma_gastos"] = suma
            stats["promedio_gastos"] = suma / len(gastos)
        
        # Calcular suma de ingresos
        if ingresos:
            suma = sum(float(i.get('monto', 0)) for i in ingresos)
            stats["suma_ingresos"] = suma
            stats["promedio_ingresos"] = suma / len(ingresos)
        
        return stats
    
    def build_context_for_category_analysis(
        self,
        gastos: List[Dict[str, Any]],
        ingresos: List[Dict[str, Any]]
    ) -> str:
        """
        Construye contexto optimizado para análisis por categoría.
        
        Args:
            gastos: Lista de gastos
            ingresos: Lista de ingresos
        
        Returns:
            Contexto agrupado por categoría
        """
        context_parts = ["=== ANÁLISIS POR CATEGORÍA ===\n"]
        
        # Agrupar gastos por categoría
        if gastos:
            gastos_por_cat = self._group_by_category(gastos)
            context_parts.append("GASTOS POR CATEGORÍA:")
            for cat, items in gastos_por_cat.items():
                total = sum(float(g.get('monto', 0)) for g in items)
                context_parts.append(f"  {cat}: ${total:.2f} ({len(items)} transacciones)")
        
        # Agrupar ingresos por categoría
        if ingresos:
            ingresos_por_cat = self._group_by_category(ingresos)
            context_parts.append("\nINGRESOS POR CATEGORÍA:")
            for cat, items in ingresos_por_cat.items():
                total = sum(float(i.get('monto', 0)) for i in items)
                context_parts.append(f"  {cat}: ${total:.2f} ({len(items)} transacciones)")
        
        return "\n".join(context_parts)
    
    def build_context_for_time_analysis(
        self,
        gastos: List[Dict[str, Any]],
        ingresos: List[Dict[str, Any]]
    ) -> str:
        """
        Construye contexto optimizado para análisis temporal.
        
        Args:
            gastos: Lista de gastos
            ingresos: Lista de ingresos
        
        Returns:
            Contexto agrupado por período
        """
        context_parts = ["=== ANÁLISIS TEMPORAL ===\n"]
        
        # Agrupar gastos por mes
        if gastos:
            gastos_por_mes = self._group_by_month(gastos)
            context_parts.append("GASTOS POR MES:")
            for mes, items in sorted(gastos_por_mes.items()):
                total = sum(float(g.get('monto', 0)) for g in items)
                context_parts.append(f"  {mes}: ${total:.2f} ({len(items)} transacciones)")
        
        # Agrupar ingresos por mes
        if ingresos:
            ingresos_por_mes = self._group_by_month(ingresos)
            context_parts.append("\nINGRESOS POR MES:")
            for mes, items in sorted(ingresos_por_mes.items()):
                total = sum(float(i.get('monto', 0)) for i in items)
                context_parts.append(f"  {mes}: ${total:.2f} ({len(items)} transacciones)")
        
        return "\n".join(context_parts)
    
    def _group_by_category(
        self,
        items: List[Dict[str, Any]]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Agrupa items por categoría."""
        grouped = {}
        for item in items:
            cat = item.get('categoria', 'Sin categoría')
            if cat not in grouped:
                grouped[cat] = []
            grouped[cat].append(item)
        return grouped
    
    def _group_by_month(
        self,
        items: List[Dict[str, Any]]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Agrupa items por mes."""
        grouped = {}
        for item in items:
            fecha = item.get('fecha')
            if fecha:
                # Convertir a formato YYYY-MM
                if isinstance(fecha, date):
                    mes = fecha.strftime('%Y-%m')
                else:
                    mes = str(fecha)[:7]  # Tomar primeros 7 caracteres
                
                if mes not in grouped:
                    grouped[mes] = []
                grouped[mes].append(item)
        return grouped
    
    def estimate_tokens(self, text: str) -> int:
        """
        Estima el número de tokens en un texto.
        
        Args:
            text: Texto a estimar
        
        Returns:
            Número estimado de tokens
        """
        return len(text) // self.CHARS_PER_TOKEN
    
    def truncate_to_token_limit(self, text: str, max_tokens: int) -> str:
        """
        Trunca el texto para que no exceda un límite de tokens.
        
        Args:
            text: Texto original
            max_tokens: Límite máximo de tokens
        
        Returns:
            Texto truncado
        """
        max_chars = max_tokens * self.CHARS_PER_TOKEN
        if len(text) <= max_chars:
            return text
        
        truncated = text[:max_chars]
        return truncated + "\n[... contexto truncado ...]"
    
    async def construir_contexto_completo(
        self,
        user_id: int,
        consulta: str,
        db: Any,
        limite_gastos: int = 10,
        limite_ingresos: int = 5
    ) -> str:
        """
        Construye contexto completo usando búsqueda semántica con embeddings.
        
        Args:
            user_id: ID del usuario
            consulta: Pregunta/mensaje del usuario
            db: Sesión de base de datos SQLAlchemy
            limite_gastos: Número máximo de gastos a incluir
            limite_ingresos: Número máximo de ingresos a incluir
        
        Returns:
            Contexto formateado como string
        """
        from app.services.vector_search_service import VectorSearchService
        
        try:
            # Instanciar servicio de búsqueda vectorial
            vector_search = VectorSearchService(db)
            
            # Buscar gastos e ingresos relevantes usando embeddings
            gastos_resultados = await vector_search.buscar_gastos_similares(
                user_id=user_id,
                query_text=consulta,
                limite=limite_gastos
            )
            
            ingresos_resultados = await vector_search.buscar_ingresos_similares(
                user_id=user_id,
                query_text=consulta,
                limite=limite_ingresos
            )
            
            # Construir contexto desde los resultados
            context = self.build_context_from_search(
                gastos=gastos_resultados,
                ingresos=ingresos_resultados,
                user_query=consulta,
                include_stats=True
            )
            
            logger.info(
                f"✅ Contexto con embeddings generado: "
                f"{len(gastos_resultados)} gastos, {len(ingresos_resultados)} ingresos"
            )
            
            return context
            
        except Exception as e:
            logger.error(f"❌ Error construyendo contexto con embeddings: {e}", exc_info=True)
            raise
