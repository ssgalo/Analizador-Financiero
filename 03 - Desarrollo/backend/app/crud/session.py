from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Crear engine de PostgreSQL
engine = create_engine(
    settings.database_url,
    echo=True,  # Para debugging, cambiar a False en producción
    pool_pre_ping=True,  # Verificar conexión antes de usarla
    pool_recycle=300,    # Reciclar conexiones cada 5 minutos
    pool_size=10,        # Tamaño del pool de conexiones
    max_overflow=20      # Máximo de conexiones adicionales
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency para obtener la sesión de DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()