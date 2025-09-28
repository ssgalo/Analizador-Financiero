from fastapi import APIRouter
from app.api.api_v1.endpoints import usuarios, gastos, categorias, objetivos_financieros, presupuestos, monedas

api_router = APIRouter()

api_router.include_router(usuarios.router, prefix="/usuarios", tags=["usuarios"])
api_router.include_router(gastos.router, prefix="/gastos", tags=["gastos"])
api_router.include_router(categorias.router, prefix="/categorias", tags=["categorias"])
api_router.include_router(objetivos_financieros.router, prefix="/objetivos-financieros", tags=["objetivos-financieros"])
api_router.include_router(presupuestos.router, prefix="/presupuestos", tags=["presupuestos"])
api_router.include_router(monedas.router, prefix="/monedas", tags=["monedas"])