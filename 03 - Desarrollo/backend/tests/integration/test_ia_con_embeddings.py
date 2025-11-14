"""
Tests de integración end-to-end para IA con embeddings
Autor: Sistema de Analizador Financiero
Fecha: 12 noviembre 2025
"""

import pytest
import time
from unittest.mock import Mock, patch
from datetime import datetime, date

from app.services.embeddings_service import EmbeddingsService
from app.services.vector_search_service import VectorSearchService
from app.services.context_builder_service import ContextBuilderService


@pytest.mark.integration
class TestIAWithEmbeddingsIntegration:
    """Tests de integración end-to-end del flujo con embeddings."""
    
    @pytest.fixture
    def embeddings_service(self):
        """Fixture para servicio de embeddings."""
        return EmbeddingsService()
    
    @pytest.fixture
    def vector_search_service(self):
        """Fixture para servicio de búsqueda vectorial."""
        return VectorSearchService()
    
    @pytest.fixture
    def context_builder_service(self):
        """Fixture para servicio de construcción de contexto."""
        return ContextBuilderService()
    
    @pytest.fixture
    def mock_db_session(self):
        """Fixture para sesión de base de datos mock."""
        return Mock()
    
    @pytest.fixture
    def sample_user_query(self):
        """Fixture para consulta de usuario de ejemplo."""
        return "¿Cuánto gasté en supermercados este mes?"
    
    # ==================== Tests de flujo completo ====================
    
    @patch('app.services.embeddings_service.openai.Embedding.create')
    @patch('app.services.vector_search_service.VectorSearchService._execute_gastos_search')
    def test_full_query_pipeline_with_embeddings(
        self,
        mock_vector_search,
        mock_openai,
        embeddings_service,
        vector_search_service,
        context_builder_service,
        mock_db_session,
        sample_user_query
    ):
        """Test: Pipeline completo desde query hasta respuesta."""
        
        # 1. Mock: Generar embedding de la query
        mock_openai.return_value = {
            'data': [{'embedding': [0.1] * 1536, 'index': 0}],
            'usage': {'total_tokens': 10}
        }
        
        # 2. Mock: Resultados de búsqueda vectorial
        mock_vector_search.return_value = [
            {
                'tipo': 'gasto',
                'id_gasto': 1,
                'fecha': '2025-11-12',
                'monto': 150.50,
                'descripcion': 'Compra de comestibles',
                'categoria': 'Supermercado',
                'comercio': 'Supermercado Día',
                'similarity': 0.95
            },
            {
                'tipo': 'gasto',
                'id_gasto': 2,
                'fecha': '2025-11-10',
                'monto': 80.00,
                'descripcion': 'Compra de verduras',
                'categoria': 'Supermercado',
                'comercio': 'Mercado Central',
                'similarity': 0.92
            }
        ]
        
        # Ejecutar pipeline
        start_time = time.time()
        
        # Paso 1: Generar embedding de la query
        query_embedding = embeddings_service.generate_embedding(sample_user_query)
        assert query_embedding is not None
        assert len(query_embedding) == 1536
        
        # Paso 2: Buscar gastos similares
        search_results = vector_search_service.search_gastos(
            query=sample_user_query,
            user_id=1,
            limit=10,
            db=mock_db_session
        )
        assert search_results is not None
        assert len(search_results) > 0
        
        # Paso 3: Construir contexto
        context = context_builder_service.build_context_from_results(
            results=search_results,
            user_id=1
        )
        assert context is not None
        assert len(context) > 0
        assert 'Supermercado' in context
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # El pipeline debería ser rápido (< 2 segundos en mock)
        assert execution_time < 2.0, f"Pipeline tardó {execution_time}s (esperado < 2s)"
    
    # ==================== Tests de búsqueda específica ====================
    
    @patch('app.services.vector_search_service.VectorSearchService._execute_gastos_search')
    def test_busqueda_gastos_supermercado(
        self,
        mock_search,
        vector_search_service,
        context_builder_service,
        mock_db_session
    ):
        """Test: Búsqueda específica de gastos en supermercado."""
        mock_search.return_value = [
            {
                'tipo': 'gasto',
                'fecha': '2025-11-12',
                'monto': 150.50,
                'categoria': 'Supermercado',
                'similarity': 0.95
            },
            {
                'tipo': 'gasto',
                'fecha': '2025-11-10',
                'monto': 80.00,
                'categoria': 'Supermercado',
                'similarity': 0.92
            }
        ]
        
        query = "gastos en supermercado"
        results = vector_search_service.search_gastos(
            query=query,
            user_id=1,
            db=mock_db_session
        )
        
        # Todos los resultados deben ser de supermercado
        assert all(r['categoria'] == 'Supermercado' for r in results)
        
        # Construir contexto
        context = context_builder_service.build_context_from_results(
            results=results,
            user_id=1
        )
        
        # El contexto debe ser conciso
        assert len(context) < 2000  # < 500 tokens aprox
    
    @patch('app.services.vector_search_service.VectorSearchService._execute_ingresos_search')
    def test_busqueda_ingresos_salario(
        self,
        mock_search,
        vector_search_service,
        context_builder_service,
        mock_db_session
    ):
        """Test: Búsqueda específica de ingresos de salario."""
        mock_search.return_value = [
            {
                'tipo': 'ingreso',
                'fecha': '2025-11-01',
                'monto': 50000.00,
                'categoria': 'Salario',
                'descripcion': 'Salario mensual',
                'similarity': 0.96
            }
        ]
        
        query = "cuánto cobré de salario"
        results = vector_search_service.search_ingresos(
            query=query,
            user_id=1,
            db=mock_db_session
        )
        
        assert len(results) > 0
        assert results[0]['categoria'] == 'Salario'
        
        # Construir contexto
        context = context_builder_service.build_context_from_results(
            results=results,
            user_id=1
        )
        
        assert 'Salario' in context
        assert '50000' in context
    
    @patch('app.services.vector_search_service.VectorSearchService.search_combined')
    def test_consulta_mixta_gastos_e_ingresos(
        self,
        mock_combined,
        vector_search_service,
        context_builder_service,
        mock_db_session
    ):
        """Test: Consulta que involucra gastos e ingresos."""
        mock_combined.return_value = [
            {
                'tipo': 'ingreso',
                'fecha': '2025-11-01',
                'monto': 50000.00,
                'categoria': 'Salario',
                'similarity': 0.96
            },
            {
                'tipo': 'gasto',
                'fecha': '2025-11-12',
                'monto': 150.50,
                'categoria': 'Supermercado',
                'similarity': 0.95
            }
        ]
        
        query = "balance de noviembre"
        results = vector_search_service.search_combined(
            query=query,
            user_id=1,
            db=mock_db_session
        )
        
        # Debe tener ambos tipos
        tipos = {r['tipo'] for r in results}
        assert 'ingreso' in tipos and 'gasto' in tipos
        
        # Construir contexto
        context = context_builder_service.build_context_from_results(
            results=results,
            user_id=1
        )
        
        assert 'ingreso' in context.lower() or 'salario' in context.lower()
        assert 'gasto' in context.lower() or 'supermercado' in context.lower()
    
    # ==================== Tests de performance ====================
    
    @patch('app.services.embeddings_service.openai.Embedding.create')
    @patch('app.services.vector_search_service.VectorSearchService._execute_gastos_search')
    def test_performance_vs_sin_embeddings(
        self,
        mock_search,
        mock_openai,
        embeddings_service,
        vector_search_service,
        context_builder_service,
        mock_db_session
    ):
        """Test: Comparar performance con vs sin embeddings."""
        
        # Simular datos
        mock_openai.return_value = {
            'data': [{'embedding': [0.1] * 1536, 'index': 0}],
            'usage': {'total_tokens': 10}
        }
        
        mock_search.return_value = [
            {'tipo': 'gasto', 'monto': i * 100, 'similarity': 0.9}
            for i in range(10)  # Solo 10 resultados
        ]
        
        # ===== CON EMBEDDINGS =====
        start_with = time.time()
        
        # Generar embedding
        query_embedding = embeddings_service.generate_embedding("test query")
        
        # Buscar con vector search (solo trae 10 relevantes)
        results_with = vector_search_service.search_gastos(
            query="test query",
            user_id=1,
            limit=10,
            db=mock_db_session
        )
        
        # Construir contexto reducido
        context_with = context_builder_service.build_context_from_results(
            results=results_with,
            user_id=1
        )
        
        time_with = time.time() - start_with
        tokens_with = len(context_with) / 4  # Estimación
        
        # ===== SIN EMBEDDINGS (simulado) =====
        start_without = time.time()
        
        # Sin embeddings: traería TODOS los gastos (simular 1000)
        all_results = [
            {'tipo': 'gasto', 'monto': i * 100}
            for i in range(1000)
        ]
        
        # Construir contexto ENORME
        context_without = "\n".join([
            f"Gasto {i}: ${r['monto']}"
            for i, r in enumerate(all_results)
        ])
        
        time_without = time.time() - start_without
        tokens_without = len(context_without) / 4  # Estimación
        
        # ===== VERIFICACIONES =====
        print(f"\n{'='*60}")
        print(f"COMPARACIÓN DE PERFORMANCE")
        print(f"{'='*60}")
        print(f"CON embeddings:")
        print(f"  - Tiempo: {time_with:.4f}s")
        print(f"  - Tokens estimados: {tokens_with:.0f}")
        print(f"  - Registros: {len(results_with)}")
        print(f"\nSIN embeddings:")
        print(f"  - Tiempo: {time_without:.4f}s")
        print(f"  - Tokens estimados: {tokens_without:.0f}")
        print(f"  - Registros: {len(all_results)}")
        print(f"\nMEJORA:")
        print(f"  - Reducción de tokens: {(1 - tokens_with/tokens_without)*100:.1f}%")
        print(f"  - Reducción de datos: {(1 - len(results_with)/len(all_results))*100:.1f}%")
        print(f"{'='*60}\n")
        
        # Verificar que hay mejora significativa
        assert tokens_with < tokens_without * 0.2, "Debería reducir tokens al menos 80%"
        assert len(results_with) < len(all_results) * 0.1, "Debería reducir datos al menos 90%"
    
    # ==================== Tests de relevancia ====================
    
    @patch('app.services.vector_search_service.VectorSearchService._execute_gastos_search')
    def test_relevancia_de_resultados(
        self,
        mock_search,
        vector_search_service,
        mock_db_session
    ):
        """Test: Verificar relevancia de resultados."""
        
        # Simular resultados con diferentes niveles de similitud
        mock_search.return_value = [
            {
                'tipo': 'gasto',
                'categoria': 'Supermercado',
                'descripcion': 'Compra en supermercado',
                'similarity': 0.95  # Muy relevante
            },
            {
                'tipo': 'gasto',
                'categoria': 'Supermercado',
                'descripcion': 'Compra de comestibles',
                'similarity': 0.92  # Muy relevante
            },
            {
                'tipo': 'gasto',
                'categoria': 'Supermercado',
                'descripcion': 'Compra semanal',
                'similarity': 0.88  # Relevante
            },
            {
                'tipo': 'gasto',
                'categoria': 'Transporte',
                'descripcion': 'Taxi',
                'similarity': 0.65  # Poco relevante
            }
        ]
        
        query = "gastos en supermercado"
        results = vector_search_service.search_gastos(
            query=query,
            user_id=1,
            db=mock_db_session
        )
        
        # Los primeros resultados deben tener alta similitud
        assert results[0]['similarity'] > 0.85
        assert results[1]['similarity'] > 0.85
        
        # Los resultados deben estar ordenados por similitud
        similarities = [r['similarity'] for r in results]
        assert similarities == sorted(similarities, reverse=True)
    
    # ==================== Tests de casos edge ====================
    
    def test_query_sin_resultados(
        self,
        vector_search_service,
        context_builder_service,
        mock_db_session
    ):
        """Test: Manejar query sin resultados."""
        with patch.object(vector_search_service, '_execute_gastos_search', return_value=[]):
            results = vector_search_service.search_gastos(
                query="búsqueda imposible de encontrar xyz123",
                user_id=1,
                db=mock_db_session
            )
            
            assert results == []
            
            context = context_builder_service.build_context_from_results(
                results=results,
                user_id=1
            )
            
            # El contexto debe indicar que no hay datos
            assert 'no encontr' in context.lower() or 'sin datos' in context.lower()
    
    @patch('app.services.embeddings_service.openai.Embedding.create')
    def test_query_muy_larga(
        self,
        mock_openai,
        embeddings_service
    ):
        """Test: Manejar query muy larga."""
        mock_openai.return_value = {
            'data': [{'embedding': [0.1] * 1536, 'index': 0}],
            'usage': {'total_tokens': 500}
        }
        
        # Query de 1000 palabras
        long_query = " ".join(["palabra"] * 1000)
        
        embedding = embeddings_service.generate_embedding(long_query)
        
        # Debería manejar queries largas (con posible truncamiento)
        assert embedding is not None
    
    # ==================== Tests de costo ====================
    
    @patch('app.services.embeddings_service.openai.Embedding.create')
    def test_estimacion_costo_consulta(
        self,
        mock_openai,
        embeddings_service
    ):
        """Test: Estimar costo de una consulta."""
        mock_openai.return_value = {
            'data': [{'embedding': [0.1] * 1536, 'index': 0}],
            'usage': {'total_tokens': 10}
        }
        
        # Generar embedding de query
        query_embedding = embeddings_service.generate_embedding("test query")
        
        # Costo de embedding: 10 tokens * $0.02 / 1M = $0.0000002
        embedding_cost = (10 / 1_000_000) * 0.02
        
        # Asumiendo contexto de 800 tokens enviado a GPT-4
        context_tokens = 800
        # GPT-4: ~$0.03/1K input tokens
        gpt4_cost = (context_tokens / 1000) * 0.03
        
        total_cost = embedding_cost + gpt4_cost
        
        print(f"\nCOSTO ESTIMADO POR CONSULTA:")
        print(f"  Embedding: ${embedding_cost:.6f}")
        print(f"  GPT-4: ${gpt4_cost:.6f}")
        print(f"  TOTAL: ${total_cost:.6f}")
        
        # Con embeddings, el costo debería ser < $0.03
        assert total_cost < 0.03, "Costo por consulta debería ser < $0.03"


# ==================== Tests de calidad de contexto ====================

@pytest.mark.integration
class TestContextQuality:
    """Tests para evaluar calidad del contexto generado."""
    
    def test_context_contiene_informacion_relevante(self):
        """Test: El contexto contiene información relevante para la query."""
        context_builder = ContextBuilderService()
        
        results = [
            {
                'tipo': 'gasto',
                'fecha': '2025-11-12',
                'monto': 150.50,
                'descripcion': 'Compra de comestibles',
                'categoria': 'Supermercado',
                'comercio': 'Supermercado Día',
                'similarity': 0.95
            }
        ]
        
        context = context_builder.build_context_from_results(
            results=results,
            user_id=1
        )
        
        # Verificar que el contexto contiene la info clave
        assert '150.50' in context or '150' in context
        assert 'Supermercado' in context.lower() or 'comestibles' in context.lower()
        assert '2025-11-12' in context or 'noviembre' in context.lower()
    
    def test_context_es_conciso(self):
        """Test: El contexto es conciso y no redundante."""
        context_builder = ContextBuilderService()
        
        # Crear 20 resultados similares
        results = [
            {
                'tipo': 'gasto',
                'fecha': f'2025-11-{i:02d}',
                'monto': 100.0,
                'descripcion': f'Compra {i}',
                'categoria': 'Supermercado',
                'similarity': 0.9
            }
            for i in range(1, 21)
        ]
        
        context = context_builder.build_context_from_results(
            results=results,
            user_id=1
        )
        
        # El contexto no debería simplemente listar los 20
        # Debería resumir o agrupar
        token_count = len(context) / 4
        assert token_count < 1000, "Contexto debería ser conciso (<1000 tokens)"
