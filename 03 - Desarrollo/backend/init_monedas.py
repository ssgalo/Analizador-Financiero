"""
Script de inicialización de monedas básicas
Ejecutar después de crear las tablas para poblar la tabla MONEDAS con datos iniciales
"""

from sqlalchemy.orm import Session
from app.crud.session import SessionLocal
from app.models.moneda import Moneda

def init_monedas():
    """
    Inicializar la tabla MONEDAS con monedas básicas
    """
    db: Session = SessionLocal()
    
    try:
        # Verificar si ya hay monedas
        existing = db.query(Moneda).first()
        if existing:
            print("Ya existen monedas en la base de datos. Saltando inicialización.")
            return
        
        # Monedas básicas para Argentina y región
        monedas_iniciales = [
            {
                "codigo_moneda": "ARS",
                "nombre": "Peso Argentino",
                "simbolo": "$",
                "activa": True
            },
            {
                "codigo_moneda": "USD",
                "nombre": "Dólar Estadounidense",
                "simbolo": "US$",
                "activa": True
            },
            {
                "codigo_moneda": "EUR",
                "nombre": "Euro",
                "simbolo": "€",
                "activa": True
            },
            {
                "codigo_moneda": "BRL",
                "nombre": "Real Brasileño",
                "simbolo": "R$",
                "activa": True
            },
            {
                "codigo_moneda": "CLP",
                "nombre": "Peso Chileno",
                "simbolo": "CLP$",
                "activa": True
            },
            {
                "codigo_moneda": "UYU",
                "nombre": "Peso Uruguayo",
                "simbolo": "$U",
                "activa": True
            },
            {
                "codigo_moneda": "PYG",
                "nombre": "Guaraní Paraguayo",
                "simbolo": "₲",
                "activa": True
            },
            {
                "codigo_moneda": "BOB",
                "nombre": "Boliviano",
                "simbolo": "Bs.",
                "activa": True
            },
            {
                "codigo_moneda": "PEN",
                "nombre": "Sol Peruano",
                "simbolo": "S/",
                "activa": True
            },
            {
                "codigo_moneda": "COP",
                "nombre": "Peso Colombiano",
                "simbolo": "COL$",
                "activa": True
            }
        ]
        
        # Crear las monedas
        for moneda_data in monedas_iniciales:
            moneda = Moneda(**moneda_data)
            db.add(moneda)
        
        db.commit()
        print(f"✅ Inicializadas {len(monedas_iniciales)} monedas en la base de datos")
        
        # Mostrar las monedas creadas
        print("\n📋 Monedas disponibles:")
        for moneda in db.query(Moneda).filter(Moneda.activa == True).order_by(Moneda.codigo_moneda).all():
            print(f"  • {moneda.codigo_moneda} - {moneda.nombre} ({moneda.simbolo})")
            
    except Exception as e:
        print(f"❌ Error al inicializar monedas: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🚀 Inicializando monedas...")
    init_monedas()
    print("✅ Proceso completado!")