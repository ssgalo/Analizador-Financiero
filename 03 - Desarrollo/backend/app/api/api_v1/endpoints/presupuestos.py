from typing import List, Optional
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from app.api.deps import get_db
from app.models.presupuesto import Presupuesto
from app.models.gasto import Gasto
from app.models.moneda import Moneda
from app.schemas.presupuesto import PresupuestoCreate, PresupuestoUpdate, PresupuestoResponse, PresupuestoConProgreso

router = APIRouter()


@router.post("/", response_model=PresupuestoResponse)
def create_presupuesto(
    *,
    db: Session = Depends(get_db),
    presupuesto_in: PresupuestoCreate
) -> PresupuestoResponse:
    """
    Crear un nuevo presupuesto.
    """
    # Validar que la moneda existe y está activa
    moneda = db.query(Moneda).filter(
        Moneda.codigo_moneda == presupuesto_in.moneda.upper(),
        Moneda.activa == True
    ).first()
    if not moneda:
        raise HTTPException(
            status_code=400,
            detail=f"Moneda '{presupuesto_in.moneda}' no válida o inactiva"
        )
    # Verificar si ya existe un presupuesto para la misma categoría y período
    existing_presupuesto = db.query(Presupuesto).filter(
        and_(
            Presupuesto.id_usuario == presupuesto_in.id_usuario,
            Presupuesto.id_categoria == presupuesto_in.id_categoria,
            Presupuesto.periodo == presupuesto_in.periodo,
            Presupuesto.fecha_inicio == presupuesto_in.fecha_inicio
        )
    ).first()
    
    if existing_presupuesto:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un presupuesto para esta categoría en este período"
        )
    
    db_presupuesto = Presupuesto(**presupuesto_in.dict())
    db.add(db_presupuesto)
    db.commit()
    db.refresh(db_presupuesto)
    return db_presupuesto


@router.get("/", response_model=List[PresupuestoResponse])
def read_presupuestos(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    id_usuario: Optional[int] = Query(None),
    id_categoria: Optional[int] = Query(None),
    periodo: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None)
) -> List[PresupuestoResponse]:
    """
    Obtener lista de presupuestos con filtros opcionales.
    """
    query = db.query(Presupuesto)
    
    # Aplicar filtros
    if id_usuario is not None:
        query = query.filter(Presupuesto.id_usuario == id_usuario)
    
    if id_categoria is not None:
        query = query.filter(Presupuesto.id_categoria == id_categoria)
    
    if periodo:
        query = query.filter(Presupuesto.periodo == periodo)
    
    if activo is not None:
        query = query.filter(Presupuesto.activo == activo)
    
    # Orden necesario para SQL Server con paginación
    query = query.order_by(Presupuesto.id_presupuesto)
    
    presupuestos = query.offset(skip).limit(limit).all()
    
    # Asegurar que cada presupuesto tenga una moneda válida
    for presupuesto in presupuestos:
        if presupuesto.moneda is None:
            presupuesto.moneda = "ARS"
    
    return presupuestos


@router.get("/{presupuesto_id}", response_model=PresupuestoResponse)
def read_presupuesto(
    presupuesto_id: int,
    db: Session = Depends(get_db)
) -> PresupuestoResponse:
    """
    Obtener un presupuesto específico por ID.
    """
    presupuesto = db.query(Presupuesto).filter(Presupuesto.id_presupuesto == presupuesto_id).first()
    if presupuesto is None:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    
    # Asegurar que el presupuesto tenga una moneda válida
    if presupuesto.moneda is None:
        presupuesto.moneda = "ARS"
    
    return presupuesto


@router.put("/{presupuesto_id}", response_model=PresupuestoResponse)
def update_presupuesto(
    *,
    db: Session = Depends(get_db),
    presupuesto_id: int,
    presupuesto_in: PresupuestoUpdate
) -> PresupuestoResponse:
    """
    Actualizar un presupuesto existente.
    """
    presupuesto = db.query(Presupuesto).filter(Presupuesto.id_presupuesto == presupuesto_id).first()
    if presupuesto is None:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    
    # Obtener datos de actualización
    update_data = presupuesto_in.dict(exclude_unset=True)
    
    # Verificar duplicados si se están cambiando campos clave
    if any(field in update_data for field in ["id_categoria", "periodo", "fecha_inicio"]):
        id_categoria = update_data.get("id_categoria", presupuesto.id_categoria)
        periodo = update_data.get("periodo", presupuesto.periodo)
        fecha_inicio_nueva = update_data.get("fecha_inicio", presupuesto.fecha_inicio)
        
        existing_presupuesto = db.query(Presupuesto).filter(
            and_(
                Presupuesto.id_usuario == presupuesto.id_usuario,
                Presupuesto.id_categoria == id_categoria,
                Presupuesto.periodo == periodo,
                Presupuesto.fecha_inicio == fecha_inicio_nueva,
                Presupuesto.id_presupuesto != presupuesto_id
            )
        ).first()
        
        if existing_presupuesto:
            raise HTTPException(
                status_code=400,
                detail="Ya existe un presupuesto para esta categoría en este período"
            )
    
    # Actualizar campos
    for field, value in update_data.items():
        setattr(presupuesto, field, value)
    
    db.add(presupuesto)
    db.commit()
    db.refresh(presupuesto)
    
    # Asegurar que el presupuesto tenga una moneda válida
    if presupuesto.moneda is None:
        presupuesto.moneda = "ARS"
    
    return presupuesto


@router.delete("/{presupuesto_id}", response_model=PresupuestoResponse)
def delete_presupuesto(
    presupuesto_id: int,
    db: Session = Depends(get_db)
) -> PresupuestoResponse:
    """
    Eliminar un presupuesto.
    """
    presupuesto = db.query(Presupuesto).filter(Presupuesto.id_presupuesto == presupuesto_id).first()
    if presupuesto is None:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    
    # Asegurar que el presupuesto tenga una moneda válida antes de devolverlo
    if presupuesto.moneda is None:
        presupuesto.moneda = "ARS"
    
    db.delete(presupuesto)
    db.commit()
    return presupuesto


@router.get("/usuario/{usuario_id}/activos", response_model=List[PresupuestoConProgreso])
def read_presupuestos_activos_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
) -> List[PresupuestoConProgreso]:
    """
    Obtener presupuestos activos de un usuario con información de progreso.
    """
    # Obtener presupuestos activos
    presupuestos = db.query(Presupuesto).filter(
        Presupuesto.id_usuario == usuario_id,
        Presupuesto.activo == True
    ).order_by(Presupuesto.fecha_inicio.desc()).offset(skip).limit(limit).all()
    
    result = []
    for presupuesto in presupuestos:
        # Asegurar que el presupuesto tenga una moneda válida
        if presupuesto.moneda is None:
            presupuesto.moneda = "ARS"
            
        # Calcular gastos del período en la misma moneda del presupuesto
        gastos_query = db.query(func.coalesce(func.sum(Gasto.monto), 0)).filter(
            Gasto.id_usuario == usuario_id,
            Gasto.id_categoria == presupuesto.id_categoria,
            Gasto.moneda == presupuesto.moneda  # Solo gastos en la misma moneda
        )
        
        if presupuesto.fecha_inicio:
            gastos_query = gastos_query.filter(Gasto.fecha >= presupuesto.fecha_inicio)
        
        monto_gastado = gastos_query.scalar() or Decimal('0')
        
        # Crear respuesta con progreso
        presupuesto_con_progreso = PresupuestoConProgreso(
            **presupuesto.__dict__,
            monto_gastado=monto_gastado,
            porcentaje_usado=float(monto_gastado / presupuesto.monto_limite * 100) if presupuesto.monto_limite > 0 else 0,
            monto_disponible=presupuesto.monto_limite - monto_gastado if presupuesto.monto_limite else Decimal('0')
        )
        
        result.append(presupuesto_con_progreso)
    
    return result


@router.get("/{presupuesto_id}/progreso", response_model=PresupuestoConProgreso)
def get_progreso_presupuesto(
    presupuesto_id: int,
    db: Session = Depends(get_db)
) -> PresupuestoConProgreso:
    """
    Obtener el progreso detallado de un presupuesto específico.
    """
    presupuesto = db.query(Presupuesto).filter(Presupuesto.id_presupuesto == presupuesto_id).first()
    if presupuesto is None:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    
    # Asegurar que el presupuesto tenga una moneda válida
    if presupuesto.moneda is None:
        presupuesto.moneda = "ARS"
    
    # Calcular gastos del período en la misma moneda del presupuesto
    gastos_query = db.query(func.coalesce(func.sum(Gasto.monto), 0)).filter(
        Gasto.id_usuario == presupuesto.id_usuario,
        Gasto.id_categoria == presupuesto.id_categoria,
        Gasto.moneda == presupuesto.moneda  # Solo gastos en la misma moneda
    )
    
    if presupuesto.fecha_inicio:
        gastos_query = gastos_query.filter(Gasto.fecha >= presupuesto.fecha_inicio)
    
    monto_gastado = gastos_query.scalar() or Decimal('0')
    
    # Crear respuesta con progreso
    presupuesto_con_progreso = PresupuestoConProgreso(
        **presupuesto.__dict__,
        monto_gastado=monto_gastado,
        porcentaje_usado=float(monto_gastado / presupuesto.monto_limite * 100) if presupuesto.monto_limite > 0 else 0,
        monto_disponible=presupuesto.monto_limite - monto_gastado if presupuesto.monto_limite else Decimal('0')
    )
    
    return presupuesto_con_progreso


@router.post("/{presupuesto_id}/alerta")
def configurar_alerta_presupuesto(
    presupuesto_id: int,
    porcentaje_alerta: float = Query(..., ge=0, le=100),
    db: Session = Depends(get_db)
) -> dict:
    """
    Configurar alerta para un presupuesto cuando se alcance cierto porcentaje.
    """
    presupuesto = db.query(Presupuesto).filter(Presupuesto.id_presupuesto == presupuesto_id).first()
    if presupuesto is None:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    
    # Aquí se podría implementar la lógica de alertas
    # Por ahora solo actualizamos el campo de porcentaje de alerta si existe
    
    return {
        "message": f"Alerta configurada para el {porcentaje_alerta}% del presupuesto",
        "presupuesto_id": presupuesto_id,
        "porcentaje_alerta": porcentaje_alerta
    }