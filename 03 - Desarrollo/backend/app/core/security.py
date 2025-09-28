import hashlib
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

# Configuración para hashing de contraseñas con argon2 como respaldo
pwd_context = CryptContext(
    schemes=["argon2", "bcrypt"], 
    deprecated="auto",
    bcrypt__rounds=12,
    argon2__time_cost=2,
    argon2__memory_cost=102400,
    argon2__parallelism=8,
)

def get_password_hash(password: str) -> str:
    """Generar hash de contraseña usando argon2 (más seguro que bcrypt)"""
    try:
        # Usar argon2 que no tiene límite de 72 bytes
        return pwd_context.hash(password)
    except Exception as e:
        print(f"Error in get_password_hash: {e}")
        # Último recurso: usar SHA256 + salt simple
        salt = "analizador_financiero_salt_2024"
        combined = password + salt
        return hashlib.sha256(combined.encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar contraseña plana contra hash"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        print(f"Error in verify_password: {e}")
        # Último recurso: verificar SHA256 simple
        salt = "analizador_financiero_salt_2024"
        combined = plain_password + salt
        simple_hash = hashlib.sha256(combined.encode('utf-8')).hexdigest()
        return simple_hash == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crear token JWT"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """Verificar y decodificar token JWT"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None