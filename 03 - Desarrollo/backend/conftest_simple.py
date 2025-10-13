"""
Configuración de tests para el backend
"""
import pytest
from unittest.mock import AsyncMock, MagicMock

# Fixture para simular una base de datos de testing
@pytest.fixture
def mock_db():
    """Mock de la sesión de base de datos"""
    db_mock = MagicMock()
    db_mock.query = MagicMock()
    db_mock.add = MagicMock()
    db_mock.commit = MagicMock()
    db_mock.refresh = MagicMock()
    return db_mock

# Fixture para datos de prueba de gastos
@pytest.fixture
def sample_gasto_data():
    """Datos de ejemplo para tests de gastos"""
    return {
        "descripcion": "Supermercado",
        "monto": 150.50,
        "fecha": "2025-01-15",
        "categoria_id": 1,
        "usuario_id": 1
    }

# Fixture para datos de prueba de ingresos
@pytest.fixture
def sample_ingreso_data():
    """Datos de ejemplo para tests de ingresos"""
    return {
        "descripcion": "Salario",
        "monto": 3000.00,
        "fecha": "2025-01-01",
        "categoria_id": 1,
        "usuario_id": 1
    }

# Configuración global para tests async
pytest_plugins = ('pytest_asyncio',)