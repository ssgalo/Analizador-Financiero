from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional

class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="Email del usuario")
    contraseña: str = Field(
        ..., 
        min_length=1, 
        max_length=32, 
        description="Contraseña del usuario"
    )
    
    @validator('contraseña')
    def validate_password(cls, v):
        if len(v) < 1:
            raise ValueError('La contraseña es requerida')
        if len(v) > 32:
            raise ValueError('La contraseña no puede tener más de 32 caracteres')
        return v

class UserRegister(BaseModel):
    nombre: str = Field(
        ..., 
        min_length=1, 
        max_length=100, 
        description="Nombre completo del usuario"
    )
    email: EmailStr = Field(..., description="Email único del usuario")
    usuario: str = Field(
        ..., 
        min_length=3, 
        max_length=50, 
        description="Nombre de usuario único"
    )
    contraseña: str = Field(
        ..., 
        min_length=8, 
        max_length=32, 
        description="Contraseña (8-32 caracteres)"
    )
    
    @validator('nombre')
    def validate_nombre(cls, v):
        if len(v.strip()) < 1:
            raise ValueError('El nombre es requerido')
        if len(v) > 100:
            raise ValueError('El nombre no puede tener más de 100 caracteres')
        return v.strip()
    
    @validator('usuario')
    def validate_usuario(cls, v):
        if len(v) < 3:
            raise ValueError('El nombre de usuario debe tener al menos 3 caracteres')
        if len(v) > 50:
            raise ValueError('El nombre de usuario no puede tener más de 50 caracteres')
        # Solo letras, números y guión bajo
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('El nombre de usuario solo puede contener letras, números, guiones y guión bajo')
        return v
    
    @validator('contraseña')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        if len(v) > 32:
            raise ValueError('La contraseña no puede tener más de 32 caracteres')
        
        # Validaciones de seguridad
        if not any(c.isupper() for c in v):
            raise ValueError('La contraseña debe contener al menos una letra mayúscula')
        if not any(c.islower() for c in v):
            raise ValueError('La contraseña debe contener al menos una letra minúscula')
        if not any(c.isdigit() for c in v):
            raise ValueError('La contraseña debe contener al menos un número')
        if not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in v):
            raise ValueError('La contraseña debe contener al menos un carácter especial (!@#$%^&*()_+-=[]{}|;:,.<>?)')
        
        return v

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user_info: dict

class TokenData(BaseModel):
    email: Optional[str] = None

class UserInToken(BaseModel):
    id_usuario: int
    nombre: str
    email: str
    usuario: str
    estado: str