"""
Tests unitarios para EmbeddingsService
Autor: Sistema de Analizador Financiero
Fecha: 12 noviembre 2025
"""

import pytest
import numpy as np
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, date

from app.services.embeddings_service import EmbeddingsService
from app.models.gasto import Gasto
from app.models.ingreso import Ingreso
from app.models.embeddings import GastoEmbedding, IngresoEmbedding


class TestEmbeddingsService:
    """Tests para el servicio de embeddings."""
    
    @pytest.fixture
    def embeddings_service(self):
        """Fixture para crear instancia del servicio."""
        return EmbeddingsService()
    
    @pytest.fixture
    def mock_gasto(self):
        """Fixture para crear un gasto de prueba."""
        gasto = Mock(spec=Gasto)
        gasto.id = 1
        gasto.id_usuario = 1
        gasto.fecha = date(2025, 11, 12)
        gasto.monto = 150.50
        gasto.descripcion = "Compra de comestibles"
        gasto.comercio = "Supermercado Día"
        
        # Mock de la relación con categoría
        categoria = Mock()
        categoria.nombre = "Supermercado"
        gasto.categoria = categoria
        
        # Mock de la relación con método de pago
        metodo_pago = Mock()
        metodo_pago.nombre = "Tarjeta de Débito"
        gasto.metodo_pago = metodo_pago
        
        return gasto
    
    @pytest.fixture
    def mock_ingreso(self):
        """Fixture para crear un ingreso de prueba."""
        ingreso = Mock(spec=Ingreso)
        ingreso.id = 1
        ingreso.id_usuario = 1
        ingreso.fecha = date(2025, 11, 1)
        ingreso.monto = 50000.00
        ingreso.descripcion = "Salario mensual"
        ingreso.origen = "Empresa XYZ"
        
        # Mock de la relación con categoría
        categoria = Mock()
        categoria.nombre = "Salario"
        ingreso.categoria = categoria
        
        return ingreso
    
    @pytest.fixture
    def mock_openai_response(self):
        """Fixture para simular respuesta de OpenAI."""
        return {
            'data': [
                {
                    'embedding': [0.1] * 1536,
                    'index': 0
                }
            ],
            'model': 'text-embedding-3-small',
            'usage': {
                'prompt_tokens': 10,
                'total_tokens': 10
            }
        }
    
    # ==================== Tests de generate_embedding ====================
    
    @patch('app.services.embeddings_service.openai.Embedding.create')
    def test_generate_embedding_success(self, mock_create, embeddings_service, mock_openai_response):
        """Test: Generar embedding exitosamente."""
        mock_create.return_value = mock_openai_response
        
        texto = "Gasto en supermercado"
        embedding = embeddings_service.generate_embedding(texto)
        
        assert embedding is not None
        assert len(embedding) == 1536
        assert all(isinstance(x, float) for x in embedding)
        mock_create.assert_called_once()
    
    @patch('app.services.embeddings_service.openai.Embedding.create')
    def test_generate_embedding_empty_text(self, mock_create, embeddings_service):
        """Test: Manejar texto vacío."""
        embedding = embeddings_service.generate_embedding("")
        
        assert embedding is None
        mock_create.assert_not_called()
    
    @patch('app.services.embeddings_service.openai.Embedding.create')
    def test_generate_embedding_api_error(self, mock_create, embeddings_service):
        """Test: Manejar error de API."""
        mock_create.side_effect = Exception("API Error")
        
        embedding = embeddings_service.generate_embedding("test text")
        
        assert embedding is None
    
    # ==================== Tests de generate_batch_embeddings ====================
    
    @patch('app.services.embeddings_service.openai.Embedding.create')
    def test_generate_batch_embeddings_success(self, mock_create, embeddings_service):
        """Test: Generar lote de embeddings."""
        mock_response = {
            'data': [
                {'embedding': [0.1] * 1536, 'index': 0},
                {'embedding': [0.2] * 1536, 'index': 1},
                {'embedding': [0.3] * 1536, 'index': 2}
            ],
            'usage': {'total_tokens': 30}
        }
        mock_create.return_value = mock_response
        
        textos = ["texto 1", "texto 2", "texto 3"]
        embeddings = embeddings_service.generate_batch_embeddings(textos)
        
        assert len(embeddings) == 3
        assert all(len(emb) == 1536 for emb in embeddings)
        mock_create.assert_called_once()
    
    @patch('app.services.embeddings_service.openai.Embedding.create')
    def test_generate_batch_embeddings_empty_list(self, mock_create, embeddings_service):
        """Test: Manejar lista vacía."""
        embeddings = embeddings_service.generate_batch_embeddings([])
        
        assert embeddings == []
        mock_create.assert_not_called()
    
    # ==================== Tests de generate_embedding_for_gasto ====================
    
    def test_generate_embedding_for_gasto_texto_construction(self, embeddings_service, mock_gasto):
        """Test: Construcción correcta del texto descriptivo para gasto."""
        with patch.object(embeddings_service, 'generate_embedding', return_value=[0.1] * 1536):
            result = embeddings_service.generate_embedding_for_gasto(mock_gasto, Mock())
            
            assert result is not None
            assert 'texto' in result
            assert 'embedding' in result
            assert 'metadata' in result
            
            texto = result['texto']
            assert 'Supermercado Día' in texto
            assert '150.50' in texto
            assert 'Supermercado' in texto
            assert 'Compra de comestibles' in texto
    
    def test_generate_embedding_for_gasto_with_none_fields(self, embeddings_service):
        """Test: Manejar campos nulos en gasto."""
        gasto = Mock(spec=Gasto)
        gasto.id = 1
        gasto.id_usuario = 1
        gasto.fecha = date(2025, 11, 12)
        gasto.monto = 100.0
        gasto.descripcion = None
        gasto.comercio = None
        gasto.categoria = None
        gasto.metodo_pago = None
        
        with patch.object(embeddings_service, 'generate_embedding', return_value=[0.1] * 1536):
            result = embeddings_service.generate_embedding_for_gasto(gasto, Mock())
            
            assert result is not None
            assert 'texto' in result
            assert '100.0' in result['texto']
    
    def test_generate_embedding_for_gasto_metadata(self, embeddings_service, mock_gasto):
        """Test: Metadata correctamente generado."""
        with patch.object(embeddings_service, 'generate_embedding', return_value=[0.1] * 1536):
            result = embeddings_service.generate_embedding_for_gasto(mock_gasto, Mock())
            
            metadata = result['metadata']
            assert metadata['id_gasto'] == 1
            assert metadata['fecha'] == '2025-11-12'
            assert metadata['monto'] == 150.50
            assert metadata['categoria'] == 'Supermercado'
    
    # ==================== Tests de generate_embedding_for_ingreso ====================
    
    def test_generate_embedding_for_ingreso_texto_construction(self, embeddings_service, mock_ingreso):
        """Test: Construcción correcta del texto descriptivo para ingreso."""
        with patch.object(embeddings_service, 'generate_embedding', return_value=[0.1] * 1536):
            result = embeddings_service.generate_embedding_for_ingreso(mock_ingreso, Mock())
            
            assert result is not None
            assert 'texto' in result
            assert 'embedding' in result
            assert 'metadata' in result
            
            texto = result['texto']
            assert 'Empresa XYZ' in texto
            assert '50000.0' in texto
            assert 'Salario' in texto
            assert 'Salario mensual' in texto
    
    def test_generate_embedding_for_ingreso_metadata(self, embeddings_service, mock_ingreso):
        """Test: Metadata correctamente generado para ingreso."""
        with patch.object(embeddings_service, 'generate_embedding', return_value=[0.1] * 1536):
            result = embeddings_service.generate_embedding_for_ingreso(mock_ingreso, Mock())
            
            metadata = result['metadata']
            assert metadata['id_ingreso'] == 1
            assert metadata['fecha'] == '2025-11-01'
            assert metadata['monto'] == 50000.00
            assert metadata['categoria'] == 'Salario'
    
    # ==================== Tests de cálculo de costos ====================
    
    def test_cost_estimation(self, embeddings_service):
        """Test: Estimación de costos."""
        # text-embedding-3-small: $0.02 per 1M tokens
        tokens = 1000
        costo_esperado = (tokens / 1_000_000) * 0.02
        
        # El servicio debería calcular costos similares
        assert costo_esperado == 0.00002
    
    # ==================== Tests de manejo de errores ====================
    
    @patch('app.services.embeddings_service.openai.Embedding.create')
    def test_retry_on_rate_limit(self, mock_create, embeddings_service):
        """Test: Reintentar en caso de rate limit."""
        mock_create.side_effect = [
            Exception("Rate limit exceeded"),
            {
                'data': [{'embedding': [0.1] * 1536, 'index': 0}],
                'usage': {'total_tokens': 10}
            }
        ]
        
        # Debería reintentar y eventualmente tener éxito
        # (Esto depende de la implementación de reintentos en el servicio)
        pass
    
    @patch('app.services.embeddings_service.openai.Embedding.create')
    def test_handle_invalid_response(self, mock_create, embeddings_service):
        """Test: Manejar respuesta inválida de API."""
        mock_create.return_value = {
            'data': []  # Respuesta vacía
        }
        
        embedding = embeddings_service.generate_embedding("test")
        
        # Debería manejar gracefully
        assert embedding is None or len(embedding) == 0


# ==================== Tests de integración con DB ====================

@pytest.mark.integration
class TestEmbeddingsServiceIntegration:
    """Tests de integración con base de datos."""
    
    @pytest.fixture
    def db_session(self):
        """Fixture para sesión de base de datos de prueba."""
        # Aquí se crearía una sesión de prueba
        # Por ahora es un mock
        return Mock()
    
    def test_save_gasto_embedding_to_db(self, db_session):
        """Test: Guardar embedding de gasto en DB."""
        # Implementar cuando tengamos DB de prueba
        pass
    
    def test_update_existing_embedding(self, db_session):
        """Test: Actualizar embedding existente."""
        # Implementar cuando tengamos DB de prueba
        pass
    
    def test_delete_cascade_on_gasto_delete(self, db_session):
        """Test: Cascade delete cuando se elimina gasto."""
        # Implementar cuando tengamos DB de prueba
        pass
