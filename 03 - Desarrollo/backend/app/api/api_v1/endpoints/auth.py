from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.models.usuario import Usuario
from app.schemas.auth import UserLogin, UserRegister, Token
from app.schemas.usuario import UsuarioResponse

router = APIRouter()

@router.post("/register", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    user_in: UserRegister,
    db: Session = Depends(get_db)
):
    """Registrar nuevo usuario"""
    
    # Verificar si ya existe el email
    if db.query(Usuario).filter(Usuario.email == user_in.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Verificar si ya existe el nombre de usuario
    if db.query(Usuario).filter(Usuario.usuario == user_in.usuario).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Crear nuevo usuario con contraseña hasheada
    hashed_password = get_password_hash(user_in.contraseña)
    db_user = Usuario(
        nombre=user_in.nombre,
        email=user_in.email,
        usuario=user_in.usuario,
        contraseña=hashed_password,
        estado="activo"
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.post("/login", response_model=Token)
def login_user(
    user_credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """Autenticar usuario y devolver JWT token"""
    
    # Buscar usuario por email
    user = db.query(Usuario).filter(Usuario.email == user_credentials.email).first()
    
    if not user or not verify_password(user_credentials.contraseña, user.contraseña):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user.estado != "activo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Actualizar último login
    user.ultimo_login = datetime.utcnow()
    db.commit()
    
    # Crear token JWT
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id_usuario},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # en segundos
        "user_info": {
            "id_usuario": user.id_usuario,
            "nombre": user.nombre,
            "email": user.email,
            "usuario": user.usuario,
            "estado": user.estado
        }
    }

@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Endpoint alternativo compatible con OAuth2PasswordRequestForm (para Swagger UI)"""
    
    user = db.query(Usuario).filter(Usuario.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.contraseña):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id_usuario},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user_info": {
            "id_usuario": user.id_usuario,
            "nombre": user.nombre,
            "email": user.email,
            "usuario": user.usuario,
            "estado": user.estado
        }
    }

@router.get("/me", response_model=UsuarioResponse)
def get_current_user_info(
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener información del usuario actual"""
    return current_user