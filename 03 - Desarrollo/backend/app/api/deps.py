from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.crud.session import SessionLocal
from app.core.security import verify_token
from app.models.usuario import Usuario

# Configuración del esquema de seguridad
security = HTTPBearer()

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Usuario:
    """Obtener usuario actual desde JWT token"""
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Verificar token
    payload = verify_token(credentials.credentials)
    if payload is None:
        raise credentials_exception
    
    # Extraer email del payload
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    
    # Buscar usuario en DB
    user = db.query(Usuario).filter(Usuario.email == email).first()
    if user is None:
        raise credentials_exception
    
    # Verificar que el usuario esté activo
    if user.estado != "activo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user

def get_current_active_user(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """Obtener usuario activo actual"""
    if current_user.estado != "activo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Inactive user"
        )
    return current_user