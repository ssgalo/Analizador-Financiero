import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Analizador Financiero API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database - PostgreSQL
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")
    DB_SERVER: Optional[str] = os.getenv("DB_SERVER", "localhost")
    DB_NAME: Optional[str] = os.getenv("DB_NAME", "analizador_financiero")
    DB_USER: Optional[str] = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: Optional[str] = os.getenv("DB_PASSWORD", "postgres")
    
    # JWT Security.
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-jwt-key-change-in-production-min-32-chars-1234567890")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    ALGORITHM: str = "HS256"
    
    @property
    def database_url(self) -> str:
        """Construye la URL de PostgreSQL si no está definida"""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_SERVER}:5432/{self.DB_NAME}"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()