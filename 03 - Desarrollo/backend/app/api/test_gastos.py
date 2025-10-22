import pytest
from fastapi.testclient import TestClient
from app.main import app

class TestGastosAPI:
    """Tests para los endpoints de gastos"""

    def test_get_gastos_sin_autenticacion(self, client):
        """Test para verificar que se requiere autenticación"""
        response = client.get("/gastos/")
        assert response.status_code == 401

    def test_get_gastos_con_autenticacion(self, client, auth_headers):
        """Test para obtener lista de gastos con autenticación"""
        response = client.get("/gastos/", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "gastos" in data
        assert "total" in data
        assert isinstance(data["gastos"], list)

    def test_crear_gasto_valido(self, client, auth_headers, test_categoria):
        """Test para crear un gasto válido"""
        gasto_data = {
            "descripcion": "Supermercado Dia",
            "monto": 125.50,
            "fecha": "2025-01-15",
            "comercio": "Dia",
            "categoria": "Alimentación",
            "fuente": "manual",
            "id_categoria": test_categoria.id_categoria,
            "notas": "Compras de la semana"
        }
        
        response = client.post("/gastos/", json=gasto_data, headers=auth_headers)
        assert response.status_code == 201
        
        created_gasto = response.json()
        assert created_gasto["descripcion"] == gasto_data["descripcion"]
        assert created_gasto["monto"] == gasto_data["monto"]
        assert created_gasto["comercio"] == gasto_data["comercio"]

    def test_crear_gasto_datos_invalidos(self, client, auth_headers):
        """Test para crear gasto con datos inválidos"""
        gasto_invalido = {
            "descripcion": "",  # Descripción vacía
            "monto": -50.00,    # Monto negativo
            "fecha": "fecha-invalida"
        }
        
        response = client.post("/gastos/", json=gasto_invalido, headers=auth_headers)
        assert response.status_code == 422  # Validation Error

    def test_obtener_gasto_existente(self, client, auth_headers, db_session, test_user, test_categoria):
        """Test para obtener un gasto específico"""
        # Crear gasto en la base de datos
        from app.models.gasto import Gasto
        from decimal import Decimal
        from datetime import date
        
        gasto = Gasto(
            descripcion="Test Gasto",
            monto=Decimal("100.00"),
            fecha=date.today(),
            comercio="Test Store",
            categoria="Test",
            id_usuario=test_user.id_usuario,
            id_categoria=test_categoria.id_categoria
        )
        db_session.add(gasto)
        db_session.commit()
        db_session.refresh(gasto)
        
        response = client.get(f"/gastos/{gasto.id_gasto}", headers=auth_headers)
        assert response.status_code == 200
        
        gasto_data = response.json()
        assert gasto_data["id_gasto"] == gasto.id_gasto
        assert gasto_data["descripcion"] == "Test Gasto"

    def test_obtener_gasto_inexistente(self, client, auth_headers):
        """Test para obtener un gasto que no existe"""
        response = client.get("/gastos/99999", headers=auth_headers)
        assert response.status_code == 404

    def test_actualizar_gasto_existente(self, client, auth_headers, db_session, test_user, test_categoria):
        """Test para actualizar un gasto existente"""
        # Crear gasto en la base de datos
        from app.models.gasto import Gasto
        from decimal import Decimal
        from datetime import date
        
        gasto = Gasto(
            descripcion="Gasto Original",
            monto=Decimal("100.00"),
            fecha=date.today(),
            id_usuario=test_user.id_usuario,
            id_categoria=test_categoria.id_categoria
        )
        db_session.add(gasto)
        db_session.commit()
        db_session.refresh(gasto)
        
        # Actualizar el gasto
        update_data = {
            "descripcion": "Gasto Actualizado",
            "monto": 150.75
        }
        
        response = client.put(f"/gastos/{gasto.id_gasto}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        
        updated_gasto = response.json()
        assert updated_gasto["descripcion"] == "Gasto Actualizado"
        assert updated_gasto["monto"] == 150.75

    def test_eliminar_gasto_existente(self, client, auth_headers, db_session, test_user, test_categoria):
        """Test para eliminar un gasto existente"""
        # Crear gasto en la base de datos
        from app.models.gasto import Gasto
        from decimal import Decimal
        from datetime import date
        
        gasto = Gasto(
            descripcion="Gasto a Eliminar",
            monto=Decimal("50.00"),
            fecha=date.today(),
            id_usuario=test_user.id_usuario,
            id_categoria=test_categoria.id_categoria
        )
        db_session.add(gasto)
        db_session.commit()
        db_session.refresh(gasto)
        
        # Eliminar el gasto
        response = client.delete(f"/gastos/{gasto.id_gasto}", headers=auth_headers)
        assert response.status_code == 204
        
        # Verificar que el gasto ya no existe
        response = client.get(f"/gastos/{gasto.id_gasto}", headers=auth_headers)
        assert response.status_code == 404

    def test_filtrar_gastos_por_fecha(self, client, auth_headers):
        """Test para filtrar gastos por rango de fechas"""
        params = {
            "fecha_desde": "2025-01-01",
            "fecha_hasta": "2025-01-31"
        }
        
        response = client.get("/gastos/", params=params, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "gastos" in data

    def test_filtrar_gastos_por_categoria(self, client, auth_headers, test_categoria):
        """Test para filtrar gastos por categoría"""
        params = {
            "categoria": test_categoria.id_categoria
        }
        
        response = client.get("/gastos/", params=params, headers=auth_headers)
        assert response.status_code == 200