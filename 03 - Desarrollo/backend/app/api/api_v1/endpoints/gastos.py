"""
Endpoints de API para gestión de gastos

Este módulo proporciona endpoints REST para:
- Crear nuevos gastos
- Listar gastos con filtros (usuario, categoría, moneda, fecha)
- Obtener estadísticas de gastos
- Actualizar gastos existentes
- Eliminar gastos
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from decimal import Decimal

from app.api.deps import get_db, get_current_active_user
from app.models.gasto import Gasto
from app.models.moneda import Moneda
from app.models.categoria import Categoria
from app.models.usuario import Usuario
from app.schemas.gasto import GastoCreate, GastoUpdate, GastoResponse, GastoStats

router = APIRouter()

@router.post("/", response_model=GastoResponse, status_code=status.HTTP_201_CREATED)
def create_gasto(
    gasto_in: GastoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Crear un nuevo gasto
    
    Crea un gasto asociado al usuario autenticado. Valida que la moneda
    especificada exista y esté activa en el sistema.
    
    Args:
        gasto_in: Datos del gasto a crear (monto, fecha, categoría, etc.)
        db: Sesión de base de datos SQLAlchemy
        current_user: Usuario autenticado actual
        
    Returns:
        GastoResponse: Gasto creado con todos sus datos
        
    Raises:
        HTTPException 400: Si la moneda no es válida o está inactiva
        
    Example:
        POST /api/v1/gastos/
        {
            "monto": 150.50,
            "descripcion": "Supermercado",
            "fecha": "2025-10-22",
            "id_categoria": 1,
            "moneda": "ARS"
        }
    """
    # Validar que la moneda existe y está activa
    moneda = db.query(Moneda).filter(
        Moneda.codigo_moneda == gasto_in.moneda.upper(),
        Moneda.activa == True
    ).first()
    if not moneda:
        raise HTTPException(
            status_code=400,
            detail=f"Moneda '{gasto_in.moneda}' no válida o inactiva"
        )
    
    # Crear gasto asociado al usuario autenticado
    gasto_data = gasto_in.dict()
    gasto_data["id_usuario"] = current_user.id_usuario
    
    # Establecer estado por defecto si no se proporciona
    if "estado" not in gasto_data or gasto_data["estado"] is None:
        gasto_data["estado"] = "confirmado"
    
    db_gasto = Gasto(**gasto_data)
    db.add(db_gasto)
    db.commit()
    db.refresh(db_gasto)  # Refrescar para obtener valores generados por la BD
    
    # Expirar relaciones para evitar carga automática innecesaria
    db.expire(db_gasto, ['categoria', 'usuario'])
    
    return db_gasto

@router.get("/", response_model=List[GastoResponse])
def read_gastos(
    skip: int = 0,
    limit: int = 100,
    usuario_id: Optional[int] = None,
    categoria_id: Optional[int] = None,
    moneda: Optional[str] = None,
    fecha_desde: Optional[str] = Query(None, description="Fecha desde (YYYY-MM-DD)"),
    fecha_hasta: Optional[str] = Query(None, description="Fecha hasta (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Listar gastos del usuario autenticado
    
    Obtiene todos los gastos del usuario con opciones de filtrado por
    categoría, moneda, rango de fechas y paginación.
    
    Args:
        skip: Número de registros a omitir (para paginación)
        limit: Número máximo de registros a retornar
        usuario_id: ID de usuario para filtrar (solo admin)
        categoria_id: Filtrar por categoría específica
        moneda: Código de moneda para filtrar (ej: 'ARS', 'USD')
        fecha_desde: Fecha inicial del rango (formato: YYYY-MM-DD)
        fecha_hasta: Fecha final del rango (formato: YYYY-MM-DD)
        db: Sesión de base de datos
        current_user: Usuario autenticado
        
    Returns:
        List[GastoResponse]: Lista de gastos ordenados por fecha descendente
        
    Example:
        GET /api/v1/gastos/?fecha_desde=2025-10-01&fecha_hasta=2025-10-31
    """
    # Filtrar por el usuario autenticado
    query = db.query(Gasto).filter(Gasto.id_usuario == current_user.id_usuario)
    
    # Aplicar filtros adicionales si se proporcionan
    if usuario_id:
        query = query.filter(Gasto.id_usuario == usuario_id)
    if categoria_id:
        query = query.filter(Gasto.id_categoria == categoria_id)
    if moneda:
        query = query.filter(Gasto.moneda == moneda.upper())
    if fecha_desde:
        query = query.filter(Gasto.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Gasto.fecha <= fecha_hasta)
    
    # Ordenar por ID descendente y aplicar paginación
    gastos = query.order_by(Gasto.id_gasto.desc()).offset(skip).limit(limit).all()
    return gastos

@router.get("/stats", response_model=GastoStats)
def get_gasto_stats(
    año: Optional[int] = Query(None, description="Año para estadísticas"),
    mes: Optional[int] = Query(None, ge=1, le=12, description="Mes para estadísticas"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Obtener estadísticas de gastos del usuario
    
    Calcula métricas agregadas de los gastos confirmados del usuario:
    - Total gastado
    - Cantidad de gastos
    - Promedio por gasto
    - Gasto máximo y mínimo
    
    Args:
        año: Año específico para filtrar estadísticas
        mes: Mes específico (1-12) para filtrar estadísticas
        db: Sesión de base de datos
        current_user: Usuario autenticado
        
    Returns:
        GastoStats: Objeto con todas las estadísticas calculadas
        
    Example:
        GET /api/v1/gastos/stats?año=2025&mes=10
        {
            "total": 15234.50,
            "cantidad": 42,
            "promedio": 362.72,
            "maximo": 2500.00,
            "minimo": 25.50
        }
    """
    # Filtrar gastos confirmados del usuario
    query = db.query(Gasto).filter(
        Gasto.id_usuario == current_user.id_usuario,
        Gasto.estado == "confirmado"
    )
    
    # Filtrar por año y mes si se proporcionan
    if año:
        query = query.filter(extract('year', Gasto.fecha) == año)
    if mes:
        query = query.filter(extract('month', Gasto.fecha) == mes)
    
    gastos = query.all()
    
    if not gastos:
        return GastoStats(
            total_gastos=Decimal('0'),
            cantidad_gastos=0,
            promedio_gasto=Decimal('0'),
            gastos_por_categoria={}
        )
    
    # Calcular estadísticas
    total = sum(gasto.monto for gasto in gastos)
    cantidad = len(gastos)
    promedio = total / cantidad if cantidad > 0 else Decimal('0')
    
    # Agrupar por categoría
    por_categoria = {}
    # Obtener categorías de los gastos
    categorias_ids = [gasto.id_categoria for gasto in gastos if gasto.id_categoria]
    categorias = {}
    if categorias_ids:
        categorias_query = db.query(Categoria).filter(Categoria.id_categoria.in_(categorias_ids)).all()
        categorias = {cat.id_categoria: cat for cat in categorias_query}
    
    for gasto in gastos:
        if gasto.id_categoria and gasto.id_categoria in categorias:
            cat_nombre = categorias[gasto.id_categoria].nombre
            if cat_nombre not in por_categoria:
                por_categoria[cat_nombre] = {'total': Decimal('0'), 'cantidad': 0}
            por_categoria[cat_nombre]['total'] += gasto.monto
            por_categoria[cat_nombre]['cantidad'] += 1
        else:
            # Gastos sin categoría
            if 'Sin categoría' not in por_categoria:
                por_categoria['Sin categoría'] = {'total': Decimal('0'), 'cantidad': 0}
            por_categoria['Sin categoría']['total'] += gasto.monto
            por_categoria['Sin categoría']['cantidad'] += 1
    
    return GastoStats(
        total_gastos=total,
        cantidad_gastos=cantidad,
        promedio_gasto=promedio,
        gastos_por_categoria=por_categoria
    )

@router.get("/{gasto_id}", response_model=GastoResponse)
def read_gasto(
    gasto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    db_gasto = db.query(Gasto).filter(
        Gasto.id_gasto == gasto_id,
        Gasto.id_usuario == current_user.id_usuario
    ).first()
    if db_gasto is None:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return db_gasto

@router.put("/{gasto_id}", response_model=GastoResponse)
def update_gasto(
    *,
    gasto_id: int,
    gasto_in: GastoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    db_gasto = db.query(Gasto).filter(
        Gasto.id_gasto == gasto_id,
        Gasto.id_usuario == current_user.id_usuario
        ).first()
    if db_gasto is None:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    
    update_data = gasto_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_gasto, field, value)
    
    db.add(db_gasto)
    db.commit()
    db.refresh(db_gasto)
    return db_gasto

@router.delete("/{gasto_id}", response_model=GastoResponse)
def delete_gasto(
    gasto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    db_gasto = db.query(Gasto).filter(
        Gasto.id_gasto == gasto_id,
        Gasto.id_usuario == current_user.id_usuario).first()
    if db_gasto is None:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    
    db.delete(db_gasto)
    db.commit()
    return db_gasto

#agrego restriccion a todos los endpoints de gastos para que siempre trabajen con el usuario logueado