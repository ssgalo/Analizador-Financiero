"""
Fixtures y configuración para tests
====================================
"""

import pytest
import os
from unittest.mock import Mock, patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


@pytest.fixture(scope="session", autouse=True)
def setup_test_env():
    """Configura variables de entorno para tests."""
    os.environ["AZURE_OPENAI_API_KEY"] = "test_key_12345"
    os.environ["AZURE_OPENAI_ENDPOINT"] = "https://test.openai.azure.com/"
    os.environ["AZURE_OPENAI_EMBEDDING_DEPLOYMENT"] = "text-embedding-3-small"
    os.environ["DATABASE_URL"] = os.getenv(
        "DATABASE_URL",
        "postgresql://unlam:ia-aplicada-123@postgres:5432/analizador_financiero"
    )


@pytest.fixture
def mock_azure_client():
    """Mock del cliente de Azure OpenAI."""
    with patch("app.services.embeddings_service.AzureOpenAI") as mock:
        client = Mock()
        mock.return_value = client
        
        # Mock de la respuesta de embeddings
        mock_response = Mock()
        mock_response.data = [Mock(embedding=[0.1] * 1536)]
        mock_response.usage = Mock(total_tokens=100)
        client.embeddings.create.return_value = mock_response
        
        yield client


@pytest.fixture
def db_session():
    """
    Proporciona una sesión de base de datos para tests.
    """
    from app.core.database import engine, SessionLocal
    
    # Crear sesión
    session = SessionLocal()
    
    try:
        yield session
    finally:
        session.rollback()
        session.close()
