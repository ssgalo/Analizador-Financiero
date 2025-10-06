from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from decimal import Decimal

from app.api.deps import get_db, get_current_active_user
from app.models.ingreso import Ingreso
from app.models.moneda import Moneda
from app.models.categoria import Categoria
from app.models.usuario import Usuario
from app.schemas.ingreso import IngresoCreate, IngresoUpdate, IngresoResponse, IngresoWithCategoria, IngresoStats

router = APIRouter()

@router.post("/", response_model=IngresoResponse, status_code=status.HTTP_201_CREATED)
def create_ingreso(
    ingreso_in: IngresoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Crear un nuevo ingreso.
    """
    # Validar que la moneda existe y está activa
    moneda = db.query(Moneda).filter(
        Moneda.codigo_moneda == ingreso_in.moneda.upper(),
        Moneda.activa == True
    ).first()
    if not moneda:
        raise HTTPException(
            status_code=400,
            detail=f"Moneda '{ingreso_in.moneda}' no válida o inactiva"
        )
    
    # Validar categoría si se proporciona
    if ingreso_in.id_categoria:
        categoria = db.query(Categoria).filter(
            Categoria.id_categoria == ingreso_in.id_categoria,
            Categoria.activa == True
        ).first()
        if not categoria:
            raise HTTPException(
                status_code=400,
                detail="Categoría no válida o inactiva"
            )
    
    # Crear ingreso con el usuario logueado
    ingreso_data = ingreso_in.dict()
    ingreso_data["id_usuario"] = current_user.id_usuario
    
    db_ingreso = Ingreso(**ingreso_data)
    db.add(db_ingreso)
    db.commit()
    db.refresh(db_ingreso)
    
    return db_ingreso

@router.get("/", response_model=List[IngresoWithCategoria])
def read_ingresos(
    skip: int = Query(0, ge=0, description="Elementos a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Límite de elementos"),
    categoria_id: Optional[int] = Query(None, description="Filtrar por categoría"),
    tipo: Optional[str] = Query(None, description="Filtrar por tipo de ingreso"),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    fecha_desde: Optional[str] = Query(None, description="Fecha desde (YYYY-MM-DD)"),
    fecha_hasta: Optional[str] = Query(None, description="Fecha hasta (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Obtener ingresos del usuario actual con filtros opcionales.
    """
    query = db.query(Ingreso).filter(Ingreso.id_usuario == current_user.id_usuario)
    
    # Aplicar filtros
    if categoria_id:
        query = query.filter(Ingreso.id_categoria == categoria_id)
    if tipo:
        query = query.filter(Ingreso.tipo == tipo)
    if estado:
        query = query.filter(Ingreso.estado == estado)
    if fecha_desde:
        query = query.filter(Ingreso.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Ingreso.fecha <= fecha_hasta)
    
    ingresos = query.order_by(Ingreso.fecha.desc()).offset(skip).limit(limit).all()
    
    # Obtener categorías para los ingresos
    categorias_ids = [ingreso.id_categoria for ingreso in ingresos if ingreso.id_categoria]
    categorias = {}
    if categorias_ids:
        categorias_query = db.query(Categoria).filter(Categoria.id_categoria.in_(categorias_ids)).all()
        categorias = {cat.id_categoria: cat for cat in categorias_query}
    
    # Agregar datos de categoría a cada ingreso
    result = []
    for ingreso in ingresos:
        categoria_info = None
        if ingreso.id_categoria and ingreso.id_categoria in categorias:
            cat = categorias[ingreso.id_categoria]
            categoria_info = {
                "id_categoria": cat.id_categoria,
                "nombre": cat.nombre,
                "color": cat.color,
                "icono": cat.icono
            }
        
        ingreso_dict = {
            "id_ingreso": ingreso.id_ingreso,
            "id_usuario": ingreso.id_usuario,
            "id_categoria": ingreso.id_categoria,
            "fecha": ingreso.fecha,
            "monto": ingreso.monto,
            "descripcion": ingreso.descripcion,
            "fuente": ingreso.fuente,
            "tipo": ingreso.tipo,
            "recurrente": ingreso.recurrente,
            "frecuencia": ingreso.frecuencia,
            "estado": ingreso.estado,
            "notas": ingreso.notas,
            "fecha_creacion": ingreso.fecha_creacion,
            "fecha_modificacion": ingreso.fecha_modificacion,
            "moneda": ingreso.moneda,
            "categoria": categoria_info
        }
        result.append(ingreso_dict)
    
    return result

@router.get("/tipos/opciones")
def get_tipos_ingreso():
    """
    Obtener las opciones válidas para tipo de ingreso.
    """
    return {
        "tipos": [
            {"value": "salario", "label": "Salario"},
            {"value": "freelance", "label": "Freelance"},
            {"value": "inversion", "label": "Inversión"},
            {"value": "venta", "label": "Venta"},
            {"value": "regalo", "label": "Regalo/Bono"},
            {"value": "otro", "label": "Otro"}
        ],
        "frecuencias": [
            {"value": "unica", "label": "Única vez"},
            {"value": "semanal", "label": "Semanal"},
            {"value": "quincenal", "label": "Quincenal"},
            {"value": "mensual", "label": "Mensual"},
            {"value": "trimestral", "label": "Trimestral"},
            {"value": "anual", "label": "Anual"}
        ],
        "estados": [
            {"value": "confirmado", "label": "Confirmado"},
            {"value": "pendiente", "label": "Pendiente"},
            {"value": "cancelado", "label": "Cancelado"}
        ]
    }

@router.get("/stats", response_model=IngresoStats)
def get_ingreso_stats(
    año: Optional[int] = Query(None, description="Año para estadísticas"),
    mes: Optional[int] = Query(None, ge=1, le=12, description="Mes para estadísticas"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Obtener estadísticas de ingresos del usuario.
    """
    query = db.query(Ingreso).filter(
        Ingreso.id_usuario == current_user.id_usuario,
        Ingreso.estado == "confirmado"
    )
    
    # Filtrar por año y mes si se proporcionan
    if año:
        query = query.filter(extract('year', Ingreso.fecha) == año)
    if mes:
        query = query.filter(extract('month', Ingreso.fecha) == mes)
    
    ingresos = query.all()
    
    if not ingresos:
        return IngresoStats(
            total_ingresos=Decimal('0'),
            cantidad_ingresos=0,
            promedio_ingreso=Decimal('0'),
            ingresos_por_tipo={},
            ingresos_por_categoria={}
        )
    
    # Calcular estadísticas
    total = sum(ingreso.monto for ingreso in ingresos)
    cantidad = len(ingresos)
    promedio = total / cantidad if cantidad > 0 else Decimal('0')
    
    # Agrupar por tipo
    por_tipo = {}
    for ingreso in ingresos:
        tipo = ingreso.tipo
        if tipo not in por_tipo:
            por_tipo[tipo] = {'total': Decimal('0'), 'cantidad': 0}
        por_tipo[tipo]['total'] += ingreso.monto
        por_tipo[tipo]['cantidad'] += 1
    
    # Agrupar por categoría
    por_categoria = {}
    # Obtener categorías de los ingresos
    categorias_ids = [ingreso.id_categoria for ingreso in ingresos if ingreso.id_categoria]
    categorias = {}
    if categorias_ids:
        categorias_query = db.query(Categoria).filter(Categoria.id_categoria.in_(categorias_ids)).all()
        categorias = {cat.id_categoria: cat for cat in categorias_query}
    
    for ingreso in ingresos:
        if ingreso.id_categoria and ingreso.id_categoria in categorias:
            cat_nombre = categorias[ingreso.id_categoria].nombre
            if cat_nombre not in por_categoria:
                por_categoria[cat_nombre] = {'total': Decimal('0'), 'cantidad': 0}
            por_categoria[cat_nombre]['total'] += ingreso.monto
            por_categoria[cat_nombre]['cantidad'] += 1
    
    return IngresoStats(
        total_ingresos=total,
        cantidad_ingresos=cantidad,
        promedio_ingreso=promedio,
        ingresos_por_tipo=por_tipo,
        ingresos_por_categoria=por_categoria
    )

@router.get("/{ingreso_id}", response_model=IngresoWithCategoria)
def read_ingreso(
    ingreso_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Obtener un ingreso específico por ID.
    """
    ingreso = db.query(Ingreso).filter(
        Ingreso.id_ingreso == ingreso_id,
        Ingreso.id_usuario == current_user.id_usuario
    ).first()
    
    if not ingreso:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    
    # Obtener categoría si existe
    categoria_info = None
    if ingreso.id_categoria:
        categoria = db.query(Categoria).filter(Categoria.id_categoria == ingreso.id_categoria).first()
        if categoria:
            categoria_info = {
                "id_categoria": categoria.id_categoria,
                "nombre": categoria.nombre,
                "color": categoria.color,
                "icono": categoria.icono
            }
    
    # Construir respuesta
    result = {
        "id_ingreso": ingreso.id_ingreso,
        "id_usuario": ingreso.id_usuario,
        "id_categoria": ingreso.id_categoria,
        "fecha": ingreso.fecha,
        "monto": ingreso.monto,
        "descripcion": ingreso.descripcion,
        "fuente": ingreso.fuente,
        "tipo": ingreso.tipo,
        "recurrente": ingreso.recurrente,
        "frecuencia": ingreso.frecuencia,
        "estado": ingreso.estado,
        "notas": ingreso.notas,
        "fecha_creacion": ingreso.fecha_creacion,
        "fecha_modificacion": ingreso.fecha_modificacion,
        "moneda": ingreso.moneda,
        "categoria": categoria_info
    }
    
    return result

@router.put("/{ingreso_id}", response_model=IngresoResponse)
def update_ingreso(
    ingreso_id: int,
    ingreso_update: IngresoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Actualizar un ingreso existente.
    """
    # Buscar el ingreso
    db_ingreso = db.query(Ingreso).filter(
        Ingreso.id_ingreso == ingreso_id,
        Ingreso.id_usuario == current_user.id_usuario
    ).first()
    
    if not db_ingreso:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    
    # Validar categoría si se proporciona
    if ingreso_update.id_categoria:
        categoria = db.query(Categoria).filter(
            Categoria.id_categoria == ingreso_update.id_categoria,
            Categoria.activa == True
        ).first()
        if not categoria:
            raise HTTPException(
                status_code=400,
                detail="Categoría no válida o inactiva"
            )
    
    # Actualizar campos proporcionados
    update_data = ingreso_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_ingreso, field, value)
    
    db.commit()
    db.refresh(db_ingreso)
    
    return db_ingreso

@router.delete("/{ingreso_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ingreso(
    ingreso_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Eliminar un ingreso (hard delete).
    """
    db_ingreso = db.query(Ingreso).filter(
        Ingreso.id_ingreso == ingreso_id,
        Ingreso.id_usuario == current_user.id_usuario
    ).first()
    
    if not db_ingreso:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    
    db.delete(db_ingreso)
    db.commit()
    
    return None