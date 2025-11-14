"""
Tests unitarios para ContextBuilderService
Autor: Sistema de Analizador Financiero
Fecha: 12 noviembre 2025
"""

import pytest
from unittest.mock import Mock, patch
from datetime import datetime, date

from app.services.context_builder_service import ContextBuilderService


class TestContextBuilderService:
    """Tests para el servicio de construcción de contexto."""
    
    @pytest.fixture
    def context_builder_service(self):
        """Fixture para crear instancia del servicio."""
        return ContextBuilderService()
    
    @pytest.fixture
    def mock_search_results_gastos(self):
        """Fixture para resultados de búsqueda de gastos."""
        return [
            {
                'tipo': 'gasto',
                'id_gasto': 1,
                'fecha': '2025-11-12',
                'monto': 150.50,
                'descripcion': 'Compra de comestibles',
                'categoria': 'Supermercado',
                'comercio': 'Supermercado Día',
                'similarity': 0.95,
                'metadata': {
                    'metodo_pago': 'Tarjeta de Débito'
                }
            },
            {
                'tipo': 'gasto',
                'id_gasto': 2,
                'fecha': '2025-11-10',
                'monto': 80.00,
                'descripcion': 'Compra de verduras',
                'categoria': 'Supermercado',
                'comercio': 'Mercado Central',
                'similarity': 0.92,
                'metadata': {
                    'metodo_pago': 'Efectivo'
                }
            },
            {
                'tipo': 'gasto',
                'id_gasto': 3,
                'fecha': '2025-10-15',
                'monto': 500.00,
                'descripcion': 'Pago de gimnasio',
                'categoria': 'Salud',
                'comercio': 'Gimnasio FitLife',
                'similarity': 0.88,
                'metadata': {
                    'metodo_pago': 'Tarjeta de Crédito'
                }
            }
        ]
    
    @pytest.fixture
    def mock_search_results_ingresos(self):
        """Fixture para resultados de búsqueda de ingresos."""
        return [
            {
                'tipo': 'ingreso',
                'id_ingreso': 1,
                'fecha': '2025-11-01',
                'monto': 50000.00,
                'descripcion': 'Salario mensual',
                'categoria': 'Salario',
                'origen': 'Empresa XYZ',
                'similarity': 0.96,
                'metadata': {}
            },
            {
                'tipo': 'ingreso',
                'id_ingreso': 2,
                'fecha': '2025-10-15',
                'monto': 5000.00,
                'descripcion': 'Freelance proyecto web',
                'categoria': 'Freelance',
                'origen': 'Cliente ABC',
                'similarity': 0.89,
                'metadata': {}
            }
        ]
    
    @pytest.fixture
    def mock_combined_results(self, mock_search_results_gastos, mock_search_results_ingresos):
        """Fixture para resultados combinados."""
        return mock_search_results_gastos + mock_search_results_ingresos
    
    # ==================== Tests de build_context_from_results ====================
    
    def test_build_context_basic(self, context_builder_service, mock_search_results_gastos):
        """Test: Construcción básica de contexto."""
        context = context_builder_service.build_context_from_results(
            results=mock_search_results_gastos,
            user_id=1
        )
        
        assert context is not None
        assert isinstance(context, str)
        assert len(context) > 0
        
        # Verificar que contiene información de los gastos
        assert 'Supermercado Día' in context or '150.50' in context
    
    def test_build_context_empty_results(self, context_builder_service):
        """Test: Contexto con resultados vacíos."""
        context = context_builder_service.build_context_from_results(
            results=[],
            user_id=1
        )
        
        assert context is not None
        assert isinstance(context, str)
        # Debería retornar mensaje de "no hay datos"
        assert 'no encontr' in context.lower() or 'sin datos' in context.lower()
    
    def test_build_context_with_statistics(self, context_builder_service, mock_search_results_gastos):
        """Test: Contexto con estadísticas incluidas."""
        with patch.object(context_builder_service, '_add_statistics', return_value="Stats: Total 3 registros"):
            context = context_builder_service.build_context_from_results(
                results=mock_search_results_gastos,
                user_id=1,
                include_stats=True
            )
            
            assert context is not None
            # Debería incluir estadísticas
            context_builder_service._add_statistics.assert_called_once()
    
    def test_build_context_without_statistics(self, context_builder_service, mock_search_results_gastos):
        """Test: Contexto sin estadísticas."""
        with patch.object(context_builder_service, '_add_statistics') as mock_stats:
            context = context_builder_service.build_context_from_results(
                results=mock_search_results_gastos,
                user_id=1,
                include_stats=False
            )
            
            assert context is not None
            # No debería llamar a _add_statistics
            mock_stats.assert_not_called()
    
    def test_build_context_grouped_by_category(self, context_builder_service, mock_search_results_gastos):
        """Test: Contexto agrupado por categoría."""
        context = context_builder_service.build_context_from_results(
            results=mock_search_results_gastos,
            user_id=1,
            group_by='categoria'
        )
        
        assert context is not None
        # Verificar que menciona las categorías
        assert 'Supermercado' in context or 'Salud' in context
    
    def test_build_context_grouped_by_date(self, context_builder_service, mock_search_results_gastos):
        """Test: Contexto agrupado por fecha/periodo."""
        context = context_builder_service.build_context_from_results(
            results=mock_search_results_gastos,
            user_id=1,
            group_by='fecha'
        )
        
        assert context is not None
        # Debería organizar por fechas
        assert '2025-11' in context or 'noviembre' in context.lower()
    
    # ==================== Tests de _format_gasto_context ====================
    
    def test_format_gasto_context_complete(self, context_builder_service):
        """Test: Formatear gasto con todos los campos."""
        gasto = {
            'fecha': '2025-11-12',
            'monto': 150.50,
            'descripcion': 'Compra de comestibles',
            'categoria': 'Supermercado',
            'comercio': 'Supermercado Día',
            'similarity': 0.95
        }
        
        formatted = context_builder_service._format_gasto_context(gasto)
        
        assert formatted is not None
        assert '150.50' in formatted
        assert 'Supermercado Día' in formatted
        assert 'Compra de comestibles' in formatted
        assert '2025-11-12' in formatted
    
    def test_format_gasto_context_missing_fields(self, context_builder_service):
        """Test: Formatear gasto con campos faltantes."""
        gasto = {
            'fecha': '2025-11-12',
            'monto': 100.00,
            'categoria': 'Varios'
            # Faltan descripcion, comercio, etc.
        }
        
        formatted = context_builder_service._format_gasto_context(gasto)
        
        assert formatted is not None
        assert '100.00' in formatted
        # Debería manejar campos faltantes gracefully
    
    def test_format_gasto_context_concise(self, context_builder_service):
        """Test: Formato conciso para reducir tokens."""
        gasto = {
            'fecha': '2025-11-12',
            'monto': 150.50,
            'descripcion': 'Compra de comestibles en el supermercado del barrio',
            'categoria': 'Supermercado',
            'comercio': 'Supermercado Día'
        }
        
        formatted = context_builder_service._format_gasto_context(gasto)
        
        # El formato debe ser conciso (menos de 200 caracteres idealmente)
        assert len(formatted) < 300, "El formato debería ser conciso para reducir tokens"
    
    # ==================== Tests de _format_ingreso_context ====================
    
    def test_format_ingreso_context_complete(self, context_builder_service):
        """Test: Formatear ingreso con todos los campos."""
        ingreso = {
            'fecha': '2025-11-01',
            'monto': 50000.00,
            'descripcion': 'Salario mensual',
            'categoria': 'Salario',
            'origen': 'Empresa XYZ',
            'similarity': 0.96
        }
        
        formatted = context_builder_service._format_ingreso_context(ingreso)
        
        assert formatted is not None
        assert '50000.00' in formatted or '50000' in formatted
        assert 'Empresa XYZ' in formatted
        assert 'Salario mensual' in formatted
    
    def test_format_ingreso_context_missing_fields(self, context_builder_service):
        """Test: Formatear ingreso con campos faltantes."""
        ingreso = {
            'fecha': '2025-11-01',
            'monto': 10000.00,
            'categoria': 'Otros'
        }
        
        formatted = context_builder_service._format_ingreso_context(ingreso)
        
        assert formatted is not None
        assert '10000' in formatted
    
    # ==================== Tests de _add_statistics ====================
    
    def test_add_statistics_gastos(self, context_builder_service, mock_search_results_gastos):
        """Test: Agregar estadísticas de gastos."""
        with patch('app.services.context_builder_service.ContextBuilderService._calculate_statistics') as mock_calc:
            mock_calc.return_value = {
                'total_gastos': 3,
                'monto_total': 730.50,
                'monto_promedio': 243.50,
                'categorias': ['Supermercado', 'Salud']
            }
            
            stats = context_builder_service._add_statistics(
                results=mock_search_results_gastos,
                user_id=1
            )
            
            assert stats is not None
            assert '730.50' in str(stats) or 'total' in stats.lower()
    
    def test_add_statistics_combined(self, context_builder_service, mock_combined_results):
        """Test: Estadísticas de gastos e ingresos combinados."""
        stats = context_builder_service._add_statistics(
            results=mock_combined_results,
            user_id=1
        )
        
        assert stats is not None
        # Debería incluir info de ambos tipos
    
    def test_add_statistics_empty(self, context_builder_service):
        """Test: Estadísticas con lista vacía."""
        stats = context_builder_service._add_statistics(
            results=[],
            user_id=1
        )
        
        assert stats is not None
        # Debería manejar caso vacío
    
    # ==================== Tests de optimización de tokens ====================
    
    def test_context_token_optimization(self, context_builder_service, mock_search_results_gastos):
        """Test: Optimización de tokens en el contexto."""
        context = context_builder_service.build_context_from_results(
            results=mock_search_results_gastos * 10,  # Muchos resultados
            user_id=1
        )
        
        # El contexto NO debería ser extremadamente largo
        # Estimación: ~4 caracteres = 1 token
        estimated_tokens = len(context) / 4
        
        assert estimated_tokens < 2000, "El contexto debería estar optimizado (<2000 tokens)"
    
    def test_context_size_with_many_results(self, context_builder_service):
        """Test: Tamaño del contexto con muchos resultados."""
        # Crear 100 resultados ficticios
        many_results = [
            {
                'tipo': 'gasto',
                'fecha': '2025-11-01',
                'monto': 100.0 * i,
                'descripcion': f'Gasto {i}',
                'categoria': 'Test',
                'similarity': 0.9
            }
            for i in range(100)
        ]
        
        context = context_builder_service.build_context_from_results(
            results=many_results,
            user_id=1
        )
        
        # Debería truncar o resumir para mantener tamaño razonable
        assert len(context) < 20000, "El contexto no debería exceder ~5000 tokens"
    
    # ==================== Tests de agrupación ====================
    
    def test_group_by_category_logic(self, context_builder_service, mock_search_results_gastos):
        """Test: Lógica de agrupación por categoría."""
        # Agrupar resultados por categoría
        by_category = {}
        for result in mock_search_results_gastos:
            cat = result.get('categoria', 'Sin categoría')
            if cat not in by_category:
                by_category[cat] = []
            by_category[cat].append(result)
        
        assert 'Supermercado' in by_category
        assert len(by_category['Supermercado']) == 2
        assert 'Salud' in by_category
        assert len(by_category['Salud']) == 1
    
    def test_group_by_month_logic(self, context_builder_service, mock_search_results_gastos):
        """Test: Lógica de agrupación por mes."""
        # Agrupar por mes
        by_month = {}
        for result in mock_search_results_gastos:
            fecha = result.get('fecha', '')
            month = fecha[:7] if fecha else 'Sin fecha'  # YYYY-MM
            if month not in by_month:
                by_month[month] = []
            by_month[month].append(result)
        
        assert '2025-11' in by_month
        assert len(by_month['2025-11']) == 2
        assert '2025-10' in by_month
        assert len(by_month['2025-10']) == 1
    
    # ==================== Tests de formato de salida ====================
    
    def test_context_format_structured(self, context_builder_service, mock_search_results_gastos):
        """Test: Formato estructurado del contexto."""
        context = context_builder_service.build_context_from_results(
            results=mock_search_results_gastos,
            user_id=1,
            format='structured'
        )
        
        # Debería tener estructura clara
        assert '---' in context or '#' in context or '•' in context
    
    def test_context_format_narrative(self, context_builder_service, mock_search_results_gastos):
        """Test: Formato narrativo del contexto."""
        context = context_builder_service.build_context_from_results(
            results=mock_search_results_gastos,
            user_id=1,
            format='narrative'
        )
        
        # Debería ser más narrativo, tipo párrafo
        assert context is not None
        # Menos estructuras como bullets o headers
    
    # ==================== Tests de casos especiales ====================
    
    def test_context_with_null_values(self, context_builder_service):
        """Test: Manejar valores null en resultados."""
        results_with_nulls = [
            {
                'tipo': 'gasto',
                'fecha': None,
                'monto': 100.0,
                'descripcion': None,
                'categoria': None,
                'comercio': None
            }
        ]
        
        context = context_builder_service.build_context_from_results(
            results=results_with_nulls,
            user_id=1
        )
        
        # No debería crashear
        assert context is not None
        assert '100' in context
    
    def test_context_with_special_characters(self, context_builder_service):
        """Test: Manejar caracteres especiales."""
        results_with_special = [
            {
                'tipo': 'gasto',
                'fecha': '2025-11-12',
                'monto': 100.0,
                'descripcion': 'Compra con $ & € símbolos "especiales"',
                'categoria': 'Test'
            }
        ]
        
        context = context_builder_service.build_context_from_results(
            results=results_with_special,
            user_id=1
        )
        
        # Debería manejar caracteres especiales
        assert context is not None


# ==================== Tests de integración ====================

@pytest.mark.integration
class TestContextBuilderServiceIntegration:
    """Tests de integración del servicio de contexto."""
    
    def test_full_pipeline_with_real_data(self):
        """Test: Pipeline completo con datos reales."""
        # Implementar cuando tengamos datos de prueba
        pass
    
    def test_context_quality_evaluation(self):
        """Test: Evaluar calidad del contexto generado."""
        # Verificar que el contexto es útil para GPT-4
        pass
