from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import urllib

# Configurar connection string para SQL Server
def get_connection_string():
    if settings.DATABASE_URL:
        return settings.DATABASE_URL
    
    # Construir connection string desde componentes
    params = urllib.parse.quote_plus(
        f'DRIVER={{ODBC Driver 17 for SQL Server}};'
        f'SERVER={settings.DB_SERVER};'
        f'DATABASE={settings.DB_NAME};'
        f'UID={settings.DB_USER};'
        f'PWD={settings.DB_PASSWORD}'
    )
    return f"mssql+pyodbc:///?odbc_connect={params}"

engine = create_engine(
    get_connection_string(),
    echo=True  # Para debugging, cambiar a False en producción
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency para obtener la sesión de DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()