"""
Utilidades de validación comunes para el backend

Este módulo proporciona funciones reutilizables para validar:
- Monedas activas
- Categorías activas
- Fechas válidas
- Rangos de valores
"""

from fastapi import HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.models.moneda import Moneda
from app.models.categoria import Categoria


def validar_moneda_activa(db: Session, codigo_moneda: str) -> Moneda:
    """
    Valida que una moneda existe y está activa
    
    Args:
        db: Sesión de base de datos SQLAlchemy
        codigo_moneda: Código de la moneda (ej: 'ARS', 'USD')
        
    Returns:
        Moneda: Objeto moneda si es válida y activa
        
    Raises:
        HTTPException 400: Si la moneda no existe o está inactiva
        
    Example:
        >>> moneda = validar_moneda_activa(db, 'ARS')
        >>> print(moneda.nombre)
        'Peso Argentino'
    """
    moneda = db.query(Moneda).filter(
        Moneda.codigo_moneda == codigo_moneda.upper(),
        Moneda.activa == True
    ).first()
    
    if not moneda:
        raise HTTPException(
            status_code=400,
            detail=f"Moneda '{codigo_moneda}' no válida o inactiva"
        )
    
    return moneda


def validar_categoria_activa(
    db: Session, 
    id_categoria: int, 
    nombre_entidad: str = "Categoría"
) -> Categoria:
    """
    Valida que una categoría existe y está activa
    
    Args:
        db: Sesión de base de datos SQLAlchemy
        id_categoria: ID de la categoría a validar
        nombre_entidad: Nombre de la entidad para el mensaje de error
        
    Returns:
        Categoria: Objeto categoría si es válida y activa
        
    Raises:
        HTTPException 400: Si la categoría no existe o está inactiva
        
    Example:
        >>> categoria = validar_categoria_activa(db, 1)
        >>> print(categoria.nombre)
        'Alimentación'
    """
    categoria = db.query(Categoria).filter(
        Categoria.id_categoria == id_categoria,
        Categoria.activa == True
    ).first()
    
    if not categoria:
        raise HTTPException(
            status_code=400,
            detail=f"{nombre_entidad} no válida o inactiva"
        )
    
    return categoria


def validar_rango_fechas(fecha_desde: Optional[str], fecha_hasta: Optional[str]) -> tuple:
    """
    Valida que un rango de fechas sea coherente
    
    Args:
        fecha_desde: Fecha inicial en formato 'YYYY-MM-DD'
        fecha_hasta: Fecha final en formato 'YYYY-MM-DD'
        
    Returns:
        tuple: (fecha_desde, fecha_hasta) validadas
        
    Raises:
        HTTPException 400: Si las fechas son inválidas o el rango es incoherente
        
    Example:
        >>> desde, hasta = validar_rango_fechas('2025-01-01', '2025-12-31')
    """
    if fecha_desde and fecha_hasta:
        try:
            desde = date.fromisoformat(fecha_desde)
            hasta = date.fromisoformat(fecha_hasta)
            
            if desde > hasta:
                raise HTTPException(
                    status_code=400,
                    detail="La fecha inicial no puede ser posterior a la fecha final"
                )
                
            return fecha_desde, fecha_hasta
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Formato de fecha inválido. Use YYYY-MM-DD"
            )
    
    return fecha_desde, fecha_hasta


def validar_monto_positivo(monto: float, nombre_campo: str = "monto") -> float:
    """
    Valida que un monto sea positivo
    
    Args:
        monto: Valor numérico a validar
        nombre_campo: Nombre del campo para el mensaje de error
        
    Returns:
        float: Monto validado
        
    Raises:
        HTTPException 400: Si el monto es negativo o cero
        
    Example:
        >>> monto_validado = validar_monto_positivo(150.50)
    """
    if monto <= 0:
        raise HTTPException(
            status_code=400,
            detail=f"El {nombre_campo} debe ser mayor a cero"
        )
    
    return monto


def validar_estado_valido(estado: str, estados_permitidos: list = None) -> str:
    """
    Valida que un estado esté dentro de los valores permitidos
    
    Args:
        estado: Estado a validar
        estados_permitidos: Lista de estados válidos
        
    Returns:
        str: Estado validado en minúsculas
        
    Raises:
        HTTPException 400: Si el estado no es válido
        
    Example:
        >>> estado = validar_estado_valido('CONFIRMADO', ['confirmado', 'pendiente'])
        >>> print(estado)
        'confirmado'
    """
    if estados_permitidos is None:
        estados_permitidos = ['confirmado', 'pendiente', 'cancelado']
    
    estado_lower = estado.lower()
    
    if estado_lower not in estados_permitidos:
        raise HTTPException(
            status_code=400,
            detail=f"Estado inválido. Valores permitidos: {', '.join(estados_permitidos)}"
        )
    
    return estado_lower


def validar_paginacion(skip: int, limit: int, max_limit: int = 1000) -> tuple:
    """
    Valida parámetros de paginación
    
    Args:
        skip: Número de elementos a omitir
        limit: Límite de elementos a retornar
        max_limit: Límite máximo permitido
        
    Returns:
        tuple: (skip, limit) validados
        
    Raises:
        HTTPException 400: Si los parámetros son inválidos
        
    Example:
        >>> skip, limit = validar_paginacion(0, 100)
    """
    if skip < 0:
        raise HTTPException(
            status_code=400,
            detail="El parámetro 'skip' debe ser mayor o igual a 0"
        )
    
    if limit < 1 or limit > max_limit:
        raise HTTPException(
            status_code=400,
            detail=f"El parámetro 'limit' debe estar entre 1 y {max_limit}"
        )
    
    return skip, limit
