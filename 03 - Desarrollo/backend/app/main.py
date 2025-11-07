from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.api_v1.api import api_router
import json

print("🌟" * 50)
print("🌟 BACKEND MAIN.PY CARGADO!")
print("🌟" * 50)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

print("🌟" * 50)
print("🌟 FastAPI APP CREADA!")
print("🌟" * 50)

# Middleware para interceptar TODAS las requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print("🚀" * 40)
    print(f"🚀 INCOMING REQUEST: {request.method} {request.url.path}")
    print(f"🚀 Headers: {dict(request.headers)}")
    
    # Leer el body SIN consumirlo
    body = await request.body()
    print(f"🚀 Body RAW: {body}")
    print("🚀" * 40)
    
    # IMPORTANTE: Recrear el request porque ya leímos el body
    from starlette.requests import Request as StarletteRequest
    async def receive():
        return {"type": "http.request", "body": body}
    
    request = StarletteRequest(request.scope, receive)
    
    response = await call_next(request)
    return response

# Manejador de errores de validación
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print("❌" * 40)
    print(f"❌ VALIDATION ERROR DETECTED")
    print(f"❌ URL: {request.url}")
    print(f"❌ Method: {request.method}")
    print(f"❌ Errors details:")
    for error in exc.errors():
        print(f"❌   - Location: {error.get('loc')}")
        print(f"❌     Type: {error.get('type')}")
        print(f"❌     Message: {error.get('msg')}")
        print(f"❌     Input: {error.get('input')}")
    print("❌" * 40)
    
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica los dominios permitidos.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Analizador Financiero API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}