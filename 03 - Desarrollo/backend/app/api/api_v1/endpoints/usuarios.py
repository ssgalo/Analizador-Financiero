from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.api.deps import get_db, get_current_active_user
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate, UsuarioResponse
from app.core.security import verify_password, get_password_hash

# Schemas adicionales para operaciones específicas
class CambioContraseñaRequest(BaseModel):
    contraseña_actual: str
    contraseña_nueva: str

class RecuperarContraseñaRequest(BaseModel):
    email: str

class RestablecerContraseñaRequest(BaseModel):
    email: str
    token: str
    nueva_contraseña: str

router = APIRouter()

@router.post("/", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def create_usuario(
    usuario_in: UsuarioCreate,
    db: Session = Depends(get_db)
):
    # Verificar si el usuario ya existe
    db_usuario = db.query(Usuario).filter(Usuario.usuario == usuario_in.usuario).first()
    if db_usuario:
        raise HTTPException(
            status_code=400,
            detail="El usuario ya está registrado"
        )
    
    # Verificar si el email ya existe
    db_email = db.query(Usuario).filter(Usuario.email == usuario_in.email).first()
    if db_email:
        raise HTTPException(
            status_code=400,
            detail="El email ya está registrado"
        )
    
    # Crear el usuario
    db_usuario = Usuario(**usuario_in.dict())
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

@router.get("/", response_model=List[UsuarioResponse])
def read_usuarios(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    usuarios = db.query(Usuario).order_by(Usuario.id_usuario).offset(skip).limit(limit).all()
    return usuarios

# IMPORTANTE: /me debe estar ANTES de /{usuario_id} para evitar conflictos de ruteo
@router.put("/me")
async def update_mi_perfil(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Actualizar el perfil del usuario actual"""
    import json
    
    print("🔍🔍🔍 " + "=" * 80)
    print("🔍🔍🔍 ENDPOINT /me EJECUTADO!")
    
    # Leer el body manualmente
    try:
        body_bytes = await request.body()
        body_str = body_bytes.decode('utf-8')
        data = json.loads(body_str)
        print(f"🔍 Datos recibidos: {data}")
        print(f"🔍 Tipos: {[(k, type(v).__name__) for k, v in data.items()]}")
    except Exception as e:
        print(f"🔍 Error leyendo body: {e}")
        raise HTTPException(status_code=400, detail=f"Error al leer datos: {str(e)}")
    
    # Crear diccionario con solo los campos permitidos
    update_data = {}
    if 'nombre' in data:
        update_data['nombre'] = str(data['nombre'])
    if 'email' in data:
        update_data['email'] = str(data['email'])
    if 'usuario' in data:
        update_data['usuario'] = str(data['usuario'])
    
    print(f"🔍 update_data: {update_data}")
    
    # Validar que haya al menos un campo para actualizar
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    # Validar unicidad de email si se está actualizando
    if 'email' in update_data and update_data['email'] != current_user.email:
        existing_email = db.query(Usuario).filter(Usuario.email == update_data['email']).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="El email ya está en uso")
    
    # Validar unicidad de usuario si se está actualizando
    if 'usuario' in update_data and update_data['usuario'] != current_user.usuario:
        existing_usuario = db.query(Usuario).filter(Usuario.usuario == update_data['usuario']).first()
        if existing_usuario:
            raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso")
    
    # Actualizar campos
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    try:
        db.commit()
        db.refresh(current_user)
        print(f"🔍 Usuario actualizado exitosamente: {current_user.usuario}")
    except Exception as e:
        db.rollback()
        print(f"🔍 Error al guardar: {e}")
        raise HTTPException(status_code=500, detail=f"Error al guardar cambios: {str(e)}")
    
    return {
        "id_usuario": current_user.id_usuario,
        "nombre": current_user.nombre,
        "email": current_user.email,
        "usuario": current_user.usuario,
        "estado": current_user.estado
    }

@router.get("/{usuario_id}", response_model=UsuarioResponse)
def read_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario

@router.put("/{usuario_id}", response_model=UsuarioResponse)
def update_usuario(
    usuario_id: int,
    usuario_in: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    db_usuario = db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
    if db_usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    update_data = usuario_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_usuario, field, value)
    
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

@router.delete("/{usuario_id}", response_model=UsuarioResponse)
def delete_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    db.delete(usuario)
    db.commit()
    return usuario

@router.put("/me")
async def update_mi_perfil(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Actualizar el perfil del usuario actual"""
    import json
    
    print("🔍🔍🔍 " + "=" * 80)
    print("🔍🔍🔍 ENDPOINT /me EJECUTADO!")
    
    # Leer el body manualmente
    try:
        body_bytes = await request.body()
        body_str = body_bytes.decode('utf-8')
        data = json.loads(body_str)
        print(f"🔍 Datos recibidos: {data}")
        print(f"🔍 Tipos: {[(k, type(v).__name__) for k, v in data.items()]}")
    except Exception as e:
        print(f"🔍 Error leyendo body: {e}")
        raise HTTPException(status_code=400, detail=f"Error al leer datos: {str(e)}")
    
    # Crear diccionario con solo los campos permitidos
    update_data = {}
    if 'nombre' in data:
        update_data['nombre'] = str(data['nombre'])
    if 'email' in data:
        update_data['email'] = str(data['email'])
    if 'usuario' in data:
        update_data['usuario'] = str(data['usuario'])
    
    print(f"🔍 update_data: {update_data}")
    
    # Validar que haya al menos un campo para actualizar
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    # Validar unicidad de email si se está actualizando
    if 'email' in update_data and update_data['email'] != current_user.email:
        existing_email = db.query(Usuario).filter(Usuario.email == update_data['email']).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="El email ya está en uso")
    
    # Validar unicidad de usuario si se está actualizando
    if 'usuario' in update_data and update_data['usuario'] != current_user.usuario:
        existing_usuario = db.query(Usuario).filter(Usuario.usuario == update_data['usuario']).first()
        if existing_usuario:
            raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso")
    
    # Actualizar campos
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    try:
        db.commit()
        db.refresh(current_user)
        print(f"🔍 Usuario actualizado exitosamente: {current_user.usuario}")
    except Exception as e:
        db.rollback()
        print(f"🔍 Error al guardar: {e}")
        raise HTTPException(status_code=500, detail=f"Error al guardar cambios: {str(e)}")
    
    return {
        "id_usuario": current_user.id_usuario,
        "nombre": current_user.nombre,
        "email": current_user.email,
        "usuario": current_user.usuario,
        "estado": current_user.estado
    }

@router.post("/cambiar-contraseña")
def cambiar_contraseña(
    datos: CambioContraseñaRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Cambiar la contraseña del usuario actual"""
    # DEBUG: Imprimir información para diagnóstico
    print(f"\n{'='*60}")
    print(f"DEBUG - Cambio de contraseña para usuario: {current_user.email}")
    print(f"Contraseña actual recibida (primeros 5 chars): {datos.contraseña_actual[:5]}...")
    print(f"Hash almacenado (primeros 30 chars): {current_user.contraseña[:30]}...")
    print(f"Longitud contraseña recibida: {len(datos.contraseña_actual)}")
    print(f"{'='*60}\n")
    
    # Verificar que la contraseña actual sea correcta (usando verify_password como en login)
    verification_result = verify_password(datos.contraseña_actual, current_user.contraseña)
    print(f"Resultado de verify_password: {verification_result}")
    
    if not verification_result:
        print("❌ Verificación fallida - lanzando HTTPException")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta"
        )
    
    print("✅ Verificación exitosa - procediendo a cambiar contraseña")
    
    # Actualizar la contraseña (hashear con get_password_hash como en el registro)
    hashed_password = get_password_hash(datos.contraseña_nueva)
    current_user.contraseña = hashed_password
    db.add(current_user)
    db.commit()
    
    print("✅ Contraseña actualizada exitosamente en la base de datos")
    
    return {"message": "Contraseña actualizada correctamente"}

@router.post("/recuperar-contraseña")
def recuperar_contraseña(
    datos: RecuperarContraseñaRequest,
    db: Session = Depends(get_db)
):
    """Solicitar recuperación de contraseña (genera token y lo guarda en BD)"""
    import secrets
    from datetime import datetime, timedelta, timezone
    
    # Verificar que el email existe
    usuario = db.query(Usuario).filter(Usuario.email == datos.email).first()
    if not usuario:
        # Por seguridad, no revelar si el email existe o no
        return {"message": "Si el correo existe, recibirás instrucciones para recuperar tu contraseña"}
    
    # Generar token seguro
    reset_token = secrets.token_urlsafe(32)
    
    # Guardar token con expiración de 1 hora
    usuario.reset_token = reset_token
    usuario.reset_token_expiry = datetime.now(timezone.utc) + timedelta(hours=1)
    db.commit()
    
    # TODO: En producción, aquí se enviaría un email con el token
    # Por ahora, retornamos el token en la respuesta (SOLO PARA DESARROLLO)
    print(f"🔑 Token de recuperación para {usuario.email}: {reset_token}")
    print(f"📧 En producción, este token se enviaría por email")
    
    return {
        "message": "Si el correo existe, recibirás instrucciones para recuperar tu contraseña",
        # QUITAR EN PRODUCCIÓN: solo para desarrollo
        "dev_token": reset_token if True else None  # Cambiar a False en producción
    }

@router.post("/restablecer-contraseña")
def restablecer_contraseña(
    datos: RestablecerContraseñaRequest,
    db: Session = Depends(get_db)
):
    """Restablecer la contraseña usando el token de recuperación"""
    from datetime import datetime, timezone
    
    # Buscar usuario por email
    usuario = db.query(Usuario).filter(Usuario.email == datos.email).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar token
    if not usuario.reset_token or usuario.reset_token != datos.token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido o expirado"
        )
    
    # Verificar que el token no haya expirado
    if not usuario.reset_token_expiry or usuario.reset_token_expiry < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El token ha expirado. Por favor, solicita uno nuevo"
        )
    
    # Hashear la nueva contraseña
    hashed_password = get_password_hash(datos.nueva_contraseña)
    usuario.contraseña = hashed_password
    
    # Limpiar el token
    usuario.reset_token = None
    usuario.reset_token_expiry = None
    
    db.commit()
    
    return {"message": "Contraseña restablecida correctamente"}
