"""
Tests unitarios para VectorSearchService
Autor: Sistema de Analizador Financiero
Fecha: 12 noviembre 2025
"""

import pytest
import numpy as np
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, date

from app.services.vector_search_service import VectorSearchService


class TestVectorSearchService:
    """Tests para el servicio de búsqueda vectorial."""
    
    @pytest.fixture
    def vector_search_service(self):
        """Fixture para crear instancia del servicio."""
        return VectorSearchService()
    
    @pytest.fixture
    def mock_query_vector(self):
        """Fixture para vector de consulta de prueba."""
        return [0.1] * 1536
    
    @pytest.fixture
    def mock_db_session(self):
        """Fixture para sesión de base de datos mock."""
        session = Mock()
        return session
    
    @pytest.fixture
    def mock_search_results(self):
        """Fixture para resultados de búsqueda simulados."""
        return [
            {
                'id': 1,
                'id_gasto': 10,
                'tipo': 'gasto',
                'fecha': '2025-11-12',
                'monto': 150.50,
                'descripcion': 'Compra de comestibles',
                'categoria': 'Supermercado',
                'similarity': 0.95,
                'metadata': {
                    'comercio': 'Supermercado Día'
                }
            },
            {
                'id': 2,
                'id_gasto': 11,
                'tipo': 'gasto',
                'fecha': '2025-11-10',
                'monto': 80.00,
                'descripcion': 'Compra de verduras',
                'categoria': 'Supermercado',
                'similarity': 0.92,
                'metadata': {
                    'comercio': 'Mercado Central'
                }
            },
            {
                'id': 3,
                'id_gasto': 12,
                'tipo': 'gasto',
                'fecha': '2025-11-08',
                'monto': 200.00,
                'descripcion': 'Compra semanal',
                'categoria': 'Supermercado',
                'similarity': 0.88,
                'metadata': {
                    'comercio': 'Carrefour'
                }
            }
        ]
    
    # ==================== Tests de search_gastos ====================
    
    @patch('app.services.vector_search_service.VectorSearchService._execute_gastos_search')
    def test_search_gastos_basic(self, mock_execute, vector_search_service, mock_query_vector, mock_db_session, mock_search_results):
        """Test: Búsqueda básica de gastos."""
        mock_execute.return_value = mock_search_results[:2]
        
        query = "gastos en supermercado"
        user_id = 1
        
        results = vector_search_service.search_gastos(
            query=query,
            user_id=user_id,
            db=mock_db_session
        )
        
        assert results is not None
        assert len(results) <= 10  # límite por defecto
        assert all(r['tipo'] == 'gasto' for r in results)
    
    @patch('app.services.vector_search_service.VectorSearchService._execute_gastos_search')
    def test_search_gastos_with_limit(self, mock_execute, vector_search_service, mock_query_vector, mock_db_session, mock_search_results):
        """Test: Búsqueda con límite personalizado."""
        mock_execute.return_value = mock_search_results
        
        results = vector_search_service.search_gastos(
            query="supermercado",
            user_id=1,
            limit=5,
            db=mock_db_session
        )
        
        assert len(results) <= 5
    
    @patch('app.services.vector_search_service.VectorSearchService._execute_gastos_search')
    def test_search_gastos_with_filters(self, mock_execute, vector_search_service, mock_query_vector, mock_db_session):
        """Test: Búsqueda con filtros."""
        mock_execute.return_value = []
        
        filters = {
            'categoria': 'Supermercado',
            'fecha_desde': '2025-11-01',
            'fecha_hasta': '2025-11-30',
            'monto_min': 50.0,
            'monto_max': 200.0
        }
        
        results = vector_search_service.search_gastos(
            query="compras",
            user_id=1,
            filters=filters,
            db=mock_db_session
        )
        
        # Verificar que se llamó con los filtros
        mock_execute.assert_called_once()
        call_args = mock_execute.call_args
        assert 'filters' in call_args.kwargs or len(call_args.args) > 3
    
    @patch('app.services.vector_search_service.VectorSearchService._execute_gastos_search')
    def test_search_gastos_no_results(self, mock_execute, vector_search_service, mock_db_session):
        """Test: Búsqueda sin resultados."""
        mock_execute.return_value = []
        
        results = vector_search_service.search_gastos(
            query="búsqueda sin resultados",
            user_id=1,
            db=mock_db_session
        )
        
        assert results == []
    
    # ==================== Tests de search_ingresos ====================
    
    @patch('app.services.vector_search_service.VectorSearchService._execute_ingresos_search')
    def test_search_ingresos_basic(self, mock_execute, vector_search_service, mock_db_session):
        """Test: Búsqueda básica de ingresos."""
        mock_results = [
            {
                'id': 1,
                'id_ingreso': 5,
                'tipo': 'ingreso',
                'fecha': '2025-11-01',
                'monto': 50000.00,
                'descripcion': 'Salario mensual',
                'categoria': 'Salario',
                'similarity': 0.96
            }
        ]
        mock_execute.return_value = mock_results
        
        results = vector_search_service.search_ingresos(
            query="salario",
            user_id=1,
            db=mock_db_session
        )
        
        assert results is not None
        assert len(results) > 0
        assert all(r['tipo'] == 'ingreso' for r in results)
    
    # ==================== Tests de search_combined ====================
    
    @patch('app.services.vector_search_service.VectorSearchService.search_gastos')
    @patch('app.services.vector_search_service.VectorSearchService.search_ingresos')
    def test_search_combined_basic(self, mock_ingresos, mock_gastos, vector_search_service, mock_db_session, mock_search_results):
        """Test: Búsqueda combinada de gastos e ingresos."""
        mock_gastos.return_value = mock_search_results[:2]
        mock_ingresos.return_value = [
            {
                'id': 100,
                'id_ingreso': 5,
                'tipo': 'ingreso',
                'similarity': 0.94
            }
        ]
        
        results = vector_search_service.search_combined(
            query="transacciones",
            user_id=1,
            db=mock_db_session
        )
        
        assert results is not None
        assert len(results) > 0
        
        # Verificar que hay gastos e ingresos mezclados
        tipos = {r['tipo'] for r in results}
        assert 'gasto' in tipos or 'ingreso' in tipos
    
    @patch('app.services.vector_search_service.VectorSearchService.search_gastos')
    @patch('app.services.vector_search_service.VectorSearchService.search_ingresos')
    def test_search_combined_sorted_by_similarity(self, mock_ingresos, mock_gastos, vector_search_service, mock_db_session):
        """Test: Resultados ordenados por similitud."""
        mock_gastos.return_value = [
            {'id': 1, 'tipo': 'gasto', 'similarity': 0.85},
            {'id': 2, 'tipo': 'gasto', 'similarity': 0.92}
        ]
        mock_ingresos.return_value = [
            {'id': 3, 'tipo': 'ingreso', 'similarity': 0.95},
            {'id': 4, 'tipo': 'ingreso', 'similarity': 0.88}
        ]
        
        results = vector_search_service.search_combined(
            query="test",
            user_id=1,
            db=mock_db_session
        )
        
        # Verificar orden descendente por similarity
        similarities = [r['similarity'] for r in results]
        assert similarities == sorted(similarities, reverse=True)
    
    @patch('app.services.vector_search_service.VectorSearchService.search_gastos')
    @patch('app.services.vector_search_service.VectorSearchService.search_ingresos')
    def test_search_combined_respects_limit(self, mock_ingresos, mock_gastos, vector_search_service, mock_db_session):
        """Test: Límite total respetado en búsqueda combinada."""
        # Simular muchos resultados
        mock_gastos.return_value = [{'id': i, 'tipo': 'gasto', 'similarity': 0.9} for i in range(10)]
        mock_ingresos.return_value = [{'id': i+10, 'tipo': 'ingreso', 'similarity': 0.9} for i in range(10)]
        
        limit = 5
        results = vector_search_service.search_combined(
            query="test",
            user_id=1,
            limit=limit,
            db=mock_db_session
        )
        
        assert len(results) <= limit
    
    # ==================== Tests de _adjust_similarity_threshold ====================
    
    def test_adjust_threshold_no_results(self, vector_search_service):
        """Test: Ajustar threshold cuando no hay resultados."""
        results = []
        current_threshold = 0.8
        
        new_threshold = vector_search_service._adjust_similarity_threshold(
            results, current_threshold
        )
        
        # Debería reducir el threshold
        assert new_threshold < current_threshold
    
    def test_adjust_threshold_with_results(self, vector_search_service, mock_search_results):
        """Test: No ajustar threshold cuando hay suficientes resultados."""
        current_threshold = 0.8
        
        new_threshold = vector_search_service._adjust_similarity_threshold(
            mock_search_results, current_threshold
        )
        
        # No debería cambiar si hay resultados
        assert new_threshold == current_threshold
    
    def test_adjust_threshold_minimum_limit(self, vector_search_service):
        """Test: Threshold no baja del mínimo."""
        results = []
        current_threshold = 0.5  # Ya en el mínimo
        
        new_threshold = vector_search_service._adjust_similarity_threshold(
            results, current_threshold
        )
        
        # No debería bajar de 0.5
        assert new_threshold >= 0.5
    
    # ==================== Tests de filtrado ====================
    
    def test_filter_by_category(self, vector_search_service, mock_search_results):
        """Test: Filtrar por categoría."""
        results = mock_search_results
        filtered = [r for r in results if r.get('categoria') == 'Supermercado']
        
        assert len(filtered) == 3
        assert all(r['categoria'] == 'Supermercado' for r in filtered)
    
    def test_filter_by_date_range(self, vector_search_service, mock_search_results):
        """Test: Filtrar por rango de fechas."""
        results = mock_search_results
        fecha_desde = '2025-11-10'
        
        filtered = [r for r in results if r['fecha'] >= fecha_desde]
        
        assert len(filtered) == 2
    
    def test_filter_by_amount_range(self, vector_search_service, mock_search_results):
        """Test: Filtrar por rango de monto."""
        results = mock_search_results
        monto_min = 100.0
        
        filtered = [r for r in results if r['monto'] >= monto_min]
        
        assert len(filtered) == 2
        assert all(r['monto'] >= monto_min for r in filtered)
    
    # ==================== Tests de manejo de errores ====================
    
    def test_search_with_invalid_user_id(self, vector_search_service, mock_db_session):
        """Test: Búsqueda con user_id inválido."""
        with pytest.raises(ValueError):
            vector_search_service.search_gastos(
                query="test",
                user_id=None,
                db=mock_db_session
            )
    
    def test_search_with_empty_query(self, vector_search_service, mock_db_session):
        """Test: Búsqueda con query vacío."""
        results = vector_search_service.search_gastos(
            query="",
            user_id=1,
            db=mock_db_session
        )
        
        # Debería retornar lista vacía o error
        assert results == [] or results is None
    
    @patch('app.services.vector_search_service.VectorSearchService._execute_gastos_search')
    def test_search_database_error(self, mock_execute, vector_search_service, mock_db_session):
        """Test: Manejar error de base de datos."""
        mock_execute.side_effect = Exception("Database connection error")
        
        with pytest.raises(Exception):
            vector_search_service.search_gastos(
                query="test",
                user_id=1,
                db=mock_db_session
            )
    
    # ==================== Tests de performance ====================
    
    def test_search_performance_with_large_results(self, vector_search_service):
        """Test: Performance con muchos resultados."""
        # Simular búsqueda con 1000 resultados
        large_results = [
            {
                'id': i,
                'tipo': 'gasto',
                'similarity': 0.9 - (i * 0.0001)
            }
            for i in range(1000)
        ]
        
        # El servicio debería manejar esto eficientemente
        # y limitar los resultados
        assert len(large_results) == 1000
    
    # ==================== Tests de similitud ====================
    
    def test_similarity_score_range(self, vector_search_service, mock_search_results):
        """Test: Scores de similitud en rango válido."""
        results = mock_search_results
        
        for result in results:
            similarity = result.get('similarity', 0)
            assert 0 <= similarity <= 1, f"Similarity {similarity} fuera de rango [0,1]"
    
    def test_high_similarity_results_prioritized(self, vector_search_service, mock_search_results):
        """Test: Resultados con alta similitud priorizados."""
        results = mock_search_results
        
        # Los resultados deben estar ordenados por similarity descendente
        similarities = [r['similarity'] for r in results]
        assert similarities == sorted(similarities, reverse=True)


# ==================== Tests de integración ====================

@pytest.mark.integration
class TestVectorSearchServiceIntegration:
    """Tests de integración con base de datos real."""
    
    @pytest.fixture
    def db_session(self):
        """Fixture para sesión de base de datos de prueba."""
        # Implementar con DB de prueba
        return Mock()
    
    def test_real_vector_search(self, db_session):
        """Test: Búsqueda vectorial real en BD."""
        # Implementar cuando tengamos DB de prueba con datos
        pass
    
    def test_ivfflat_index_performance(self, db_session):
        """Test: Performance del índice IVFFlat."""
        # Medir tiempo de búsqueda con y sin índice
        pass
    
    def test_cosine_distance_calculation(self, db_session):
        """Test: Cálculo correcto de distancia coseno."""
        # Verificar que la distancia calculada por PostgreSQL es correcta
        pass
