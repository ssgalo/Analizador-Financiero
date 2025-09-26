from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UsuarioBase(BaseModel):
    nombre: str
    email: EmailStr
    usuario: str

class UsuarioCreate(UsuarioBase):
    contraseña: str

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    usuario: Optional[str] = None
    contraseña: Optional[str] = None
    preferencias: Optional[str] = None
    estado: Optional[str] = None

class UsuarioResponse(UsuarioBase):
    id_usuario: int
    fecha_creacion: datetime
    preferencias: Optional[str] = None
    ultimo_login: Optional[datetime] = None
    estado: str
    
    class Config:
        from_attributes = True