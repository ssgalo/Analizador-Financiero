import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Analizador Financiero API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: Optional[str] = None
    DB_SERVER: Optional[str] = os.getenv("DB_SERVER")
    DB_NAME: Optional[str] = os.getenv("DB_NAME")
    DB_USER: Optional[str] = os.getenv("DB_USER")
    DB_PASSWORD: Optional[str] = os.getenv("DB_PASSWORD")
    
    # JWT Security.
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-jwt-key-change-in-production-min-32-chars-1234567890")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    ALGORITHM: str = "HS256"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()