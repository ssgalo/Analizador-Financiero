#!/usr/bin/env python3
"""
Script para probar la conexión a Azure SQL Database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.crud.session import engine
from sqlalchemy import text

def test_connection():
    """Probar la conexión y hacer una query simple"""
    try:
        print("🔗 Probando conexión a Azure SQL Database...")
        
        with engine.connect() as connection:
            # Probar conexión básica
            result = connection.execute(text("SELECT 1 as test"))
            print("✅ Conexión básica exitosa:", result.fetchone())
            
            # Verificar que las tablas existen
            result = connection.execute(text("""
                SELECT TABLE_SCHEMA, TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME IN ('USUARIOS', 'GASTOS')
                ORDER BY TABLE_NAME
            """))
            
            print("\n📋 Tablas encontradas:")
            tables = result.fetchall()
            for row in tables:
                print(f"  📋 {row[0]}.{row[1]}")
            
            if not tables:
                print("❌ No se encontraron las tablas USUARIOS y GASTOS")
                return False
            
            # Probar query a la tabla usuarios (sin crear datos)
            result = connection.execute(text("SELECT COUNT(*) FROM dbo.USUARIOS"))
            count = result.fetchone()[0]
            print(f"\n👥 Usuarios en la base de datos: {count}")
            
            print("\n✅ ¡Conexión y tablas funcionando correctamente!")
            return True
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        print(f"🔧 Tipo de error: {type(e).__name__}")
        return False

def test_sqlalchemy_models():
    """Probar que los modelos de SQLAlchemy funcionan"""
    try:
        print("\n🧪 Probando modelos SQLAlchemy...")
        
        from app.models.usuario import Usuario
        from sqlalchemy.orm import sessionmaker
        
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Probar query usando el modelo (sin crear datos)
        count = session.query(Usuario).count()
        print(f"✅ Query con modelo Usuario exitosa. Count: {count}")
        
        session.close()
        return True
        
    except Exception as e:
        print(f"❌ Error con modelos SQLAlchemy: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Diagnóstico de conexión a base de datos...\n")
    
    connection_ok = test_connection()
    
    if connection_ok:
        models_ok = test_sqlalchemy_models()
        
        if models_ok:
            print("\n🎉 ¡Todo funcionando! Puedes iniciar el servidor FastAPI.")
            print("📡 uvicorn app.main:app --reload --host 0.0.0.0 --port 8001")
        else:
            print("\n⚠️  Conexión OK, pero hay problemas con los modelos SQLAlchemy")
    else:
        print("\n❌ Problemas de conexión. Revisa tu configuración .env")