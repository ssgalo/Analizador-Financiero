"""
Utilidades para trabajar con monedas
"""

from sqlalchemy.orm import Session
from app.models.moneda import Moneda
from typing import Optional, List

def validar_moneda(db: Session, codigo_moneda: str) -> bool:
    """
    Validar si una moneda existe y está activa
    """
    if not codigo_moneda:
        return False
    
    moneda = db.query(Moneda).filter(
        Moneda.codigo_moneda == codigo_moneda.upper(),
        Moneda.activa == True
    ).first()
    
    return moneda is not None


def obtener_moneda(db: Session, codigo_moneda: str) -> Optional[Moneda]:
    """
    Obtener información completa de una moneda
    """
    return db.query(Moneda).filter(
        Moneda.codigo_moneda == codigo_moneda.upper()
    ).first()


def obtener_monedas_activas(db: Session) -> List[Moneda]:
    """
    Obtener todas las monedas activas
    """
    return db.query(Moneda).filter(
        Moneda.activa == True
    ).order_by(Moneda.codigo_moneda).all()


def obtener_simbolo_moneda(db: Session, codigo_moneda: str) -> str:
    """
    Obtener el símbolo de una moneda
    """
    moneda = obtener_moneda(db, codigo_moneda)
    return moneda.simbolo if moneda else codigo_moneda


def formatear_monto_con_moneda(db: Session, monto: float, codigo_moneda: str) -> str:
    """
    Formatear un monto con el símbolo de la moneda
    """
    simbolo = obtener_simbolo_moneda(db, codigo_moneda)
    return f"{simbolo} {monto:,.2f}"


# Constantes de monedas más comunes
MONEDAS_PRINCIPALES = ["ARS", "USD", "EUR"]
MONEDA_DEFAULT = "ARS"