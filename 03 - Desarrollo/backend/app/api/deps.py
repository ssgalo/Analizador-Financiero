from typing import Generator, Optional
import sys
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.crud.session import SessionLocal
from app.core.security import verify_token
from app.models.usuario import Usuario

# Configuración del esquema de seguridad
security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)

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


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: Session = Depends(get_db)
) -> Optional[Usuario]:
    """
    Obtener usuario actual desde JWT token (OPCIONAL).
    Si no hay token o es inválido, retorna None en lugar de error.
    """
    if credentials is None:
        print("🔍 [AUTH] No se recibieron credentials", file=sys.stderr, flush=True)
        return None
    
    try:
        print(f"🔍 [AUTH] Token recibido: {credentials.credentials[:30]}...", file=sys.stderr, flush=True)
        
        # Verificar token
        payload = verify_token(credentials.credentials)
        if payload is None:
            print("❌ [AUTH] Token inválido o expirado", file=sys.stderr, flush=True)
            return None
        
        print(f"✅ [AUTH] Token válido. Payload: {payload}", file=sys.stderr, flush=True)
        
        # Extraer email del payload
        email: str = payload.get("sub")
        if email is None:
            print("❌ [AUTH] No se encontró 'sub' en el payload", file=sys.stderr, flush=True)
            return None
        
        print(f"🔍 [AUTH] Buscando usuario: {email}", file=sys.stderr, flush=True)
        
        # Buscar usuario en DB
        user = db.query(Usuario).filter(Usuario.email == email).first()
        if user is None:
            print(f"❌ [AUTH] Usuario no encontrado: {email}", file=sys.stderr, flush=True)
            return None
            
        if user.estado != "activo":
            print(f"❌ [AUTH] Usuario inactivo: {email}", file=sys.stderr, flush=True)
            return None
        
        print(f"✅ [AUTH] Usuario autenticado: {user.email} (ID: {user.id_usuario})", file=sys.stderr, flush=True)
        return user
    except Exception as e:
        print(f"❌ [AUTH] Error: {str(e)}", file=sys.stderr, flush=True)
        return None
