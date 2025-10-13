import pytest
from datetime import date, datetime
from decimal import Decimal
from app.models.gasto import Gasto
from app.schemas.gasto import GastoCreate, GastoUpdate

class TestGastoModel:
    """Tests para el modelo Gasto"""
    
    def test_crear_gasto_valido(self, db_session, test_user, test_categoria):
        """Test para crear un gasto válido"""
        gasto_data = {
            "descripcion": "Supermercado Coto",
            "monto": Decimal("150.75"),
            "fecha": date.today(),
            "comercio": "Coto",
            "categoria": "Alimentación",
            "fuente": "manual",
            "id_usuario": test_user.id_usuario,
            "id_categoria": test_categoria.id_categoria
        }
        
        gasto = Gasto(**gasto_data)
        db_session.add(gasto)
        db_session.commit()
        db_session.refresh(gasto)
        
        assert gasto.id_gasto is not None
        assert gasto.descripcion == "Supermercado Coto"
        assert gasto.monto == Decimal("150.75")
        assert gasto.comercio == "Coto"
        assert gasto.id_usuario == test_user.id_usuario
        assert gasto.id_categoria == test_categoria.id_categoria

    def test_gasto_str_representation(self, test_user, test_categoria):
        """Test para la representación string del gasto"""
        gasto = Gasto(
            descripcion="Test Gasto",
            monto=Decimal("100.00"),
            fecha=date.today(),
            id_usuario=test_user.id_usuario,
            id_categoria=test_categoria.id_categoria
        )
        
        expected_str = f"Gasto(descripcion='Test Gasto', monto=100.00)"
        assert str(gasto) == expected_str

    def test_gasto_fecha_creacion_automatica(self, db_session, test_user, test_categoria):
        """Test para verificar que la fecha de creación se establece automáticamente"""
        gasto = Gasto(
            descripcion="Test Auto Fecha",
            monto=Decimal("50.00"),
            fecha=date.today(),
            id_usuario=test_user.id_usuario,
            id_categoria=test_categoria.id_categoria
        )
        
        db_session.add(gasto)
        db_session.commit()
        db_session.refresh(gasto)
        
        assert gasto.fecha_creacion is not None
        assert isinstance(gasto.fecha_creacion, datetime)

class TestGastoSchemas:
    """Tests para los esquemas de Gasto"""
    
    def test_gasto_create_schema_valido(self):
        """Test para validar esquema de creación de gasto"""
        gasto_data = {
            "descripcion": "Almuerzo",
            "monto": 85.50,
            "fecha": "2025-01-15",
            "comercio": "Restaurant",
            "categoria": "Alimentación",
            "fuente": "manual",
            "id_categoria": 1,
            "notas": "Almuerzo con cliente"
        }
        
        gasto_create = GastoCreate(**gasto_data)
        
        assert gasto_create.descripcion == "Almuerzo"
        assert gasto_create.monto == 85.50
        assert gasto_create.comercio == "Restaurant"
        assert gasto_create.id_categoria == 1
        assert gasto_create.notas == "Almuerzo con cliente"

    def test_gasto_create_campos_requeridos(self):
        """Test para validar campos requeridos en creación"""
        with pytest.raises(ValueError):
            GastoCreate()  # Sin campos requeridos
            
        with pytest.raises(ValueError):
            GastoCreate(descripcion="Test")  # Sin monto
            
        with pytest.raises(ValueError):
            GastoCreate(descripcion="Test", monto=100)  # Sin fecha

    def test_gasto_update_schema_parcial(self):
        """Test para validar esquema de actualización parcial"""
        update_data = {
            "descripcion": "Descripción actualizada",
            "monto": 200.00
        }
        
        gasto_update = GastoUpdate(**update_data)
        
        assert gasto_update.descripcion == "Descripción actualizada"
        assert gasto_update.monto == 200.00

    def test_gasto_monto_positivo(self):
        """Test para validar que el monto debe ser positivo"""
        with pytest.raises(ValueError, match="El monto debe ser mayor a 0"):
            GastoCreate(
                descripcion="Test",
                monto=-50.00,
                fecha="2025-01-15",
                id_categoria=1
            )

    def test_gasto_descripcion_no_vacia(self):
        """Test para validar que la descripción no puede estar vacía"""
        with pytest.raises(ValueError, match="La descripción no puede estar vacía"):
            GastoCreate(
                descripcion="",
                monto=50.00,
                fecha="2025-01-15",
                id_categoria=1
            )