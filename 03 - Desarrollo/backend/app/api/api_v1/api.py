from fastapi import APIRouter
from app.api.api_v1.endpoints import usuarios, gastos

api_router = APIRouter()

api_router.include_router(usuarios.router, prefix="/usuarios", tags=["usuarios"])
api_router.include_router(gastos.router, prefix="/gastos", tags=["gastos"])