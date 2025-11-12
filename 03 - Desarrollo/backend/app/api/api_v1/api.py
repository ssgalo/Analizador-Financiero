from fastapi import APIRouter
from app.api.api_v1.endpoints import usuarios, gastos, categorias, objetivos_financieros, presupuestos, monedas, ingresos, auth, embeddings
from app.api.routes import chat

api_router = APIRouter()

# Rutas públicas (sin autenticación)
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# Rutas protegidas (requieren JWT)
api_router.include_router(usuarios.router, prefix="/usuarios", tags=["usuarios"])
api_router.include_router(gastos.router, prefix="/gastos", tags=["gastos"])
api_router.include_router(ingresos.router, prefix="/ingresos", tags=["ingresos"])
api_router.include_router(categorias.router, prefix="/categorias", tags=["categorias"])
api_router.include_router(objetivos_financieros.router, prefix="/objetivos-financieros", tags=["objetivos-financieros"])
api_router.include_router(presupuestos.router, prefix="/presupuestos", tags=["presupuestos"])
api_router.include_router(monedas.router, prefix="/monedas", tags=["monedas"])
api_router.include_router(embeddings.router, prefix="/embeddings", tags=["embeddings"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat-ia"])