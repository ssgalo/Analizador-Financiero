"""
Tests básicos para verificar que pytest funciona correctamente
"""
import pytest
from datetime import datetime
from typing import Dict, Any


def test_pytest_basic():
    """Test básico para verificar que pytest funciona"""
    assert 1 + 1 == 2


def test_string_operations():
    """Test de operaciones con strings"""
    app_name = "Analizador Financiero"
    assert app_name == "Analizador Financiero"
    assert len(app_name) > 0
    assert "Financiero" in app_name


def test_gasto_validation():
    """Test de validación de datos de gasto"""
    gasto_data = {
        "descripcion": "Supermercado",
        "monto": 150.50,
        "fecha": "2025-01-15",
        "categoria_id": 1,
        "usuario_id": 1
    }
    
    assert "descripcion" in gasto_data
    assert gasto_data["monto"] == 150.50
    assert gasto_data["fecha"] == "2025-01-15"
    assert isinstance(gasto_data["monto"], float)


def test_date_format():
    """Test de formato de fecha"""
    import re
    date_pattern = r'^\d{4}-\d{2}-\d{2}$'
    
    valid_date = "2025-01-15"
    invalid_date = "15/01/2025"
    
    assert re.match(date_pattern, valid_date)
    assert not re.match(date_pattern, invalid_date)


def test_calculate_total():
    """Test de cálculo de totales"""
    gastos = [100, 250, 75.50]
    total = sum(gastos)
    
    assert total == 425.50


def test_filter_by_category():
    """Test de filtrado por categoría"""
    gastos = [
        {"categoria_id": 1, "monto": 100, "descripcion": "Alimentación"},
        {"categoria_id": 2, "monto": 50, "descripcion": "Transporte"},
        {"categoria_id": 1, "monto": 75, "descripcion": "Alimentación"}
    ]
    
    gastos_alimentacion = [g for g in gastos if g["categoria_id"] == 1]
    
    assert len(gastos_alimentacion) == 2
    assert all(g["categoria_id"] == 1 for g in gastos_alimentacion)


def test_pydantic_like_validation():
    """Test que simula validación de Pydantic"""
    def validate_gasto_data(data: Dict[str, Any]) -> bool:
        required_fields = ["descripcion", "monto", "fecha"]
        
        # Verificar campos requeridos
        for field in required_fields:
            if field not in data:
                return False
        
        # Verificar tipos
        if not isinstance(data["monto"], (int, float)) or data["monto"] <= 0:
            return False
            
        if not isinstance(data["descripcion"], str) or len(data["descripcion"]) == 0:
            return False
            
        return True
    
    valid_data = {
        "descripcion": "Supermercado",
        "monto": 150.50,
        "fecha": "2025-01-15"
    }
    
    invalid_data = {
        "descripcion": "",
        "monto": -50,
        "fecha": "2025-01-15"
    }
    
    assert validate_gasto_data(valid_data)
    assert not validate_gasto_data(invalid_data)