#!/usr/bin/env python3
"""
Test rápido para verificar si un deployment soporta embeddings
"""
import os
from openai import AzureOpenAI

# Configuración
api_key = os.getenv("AZURE_OPENAI_API_KEY", "4TyWTlljROUfXziwFIawEFS5ocesDVhNe7bOKFSNXlx1akrHZ3r9JQQJ99BJACBsN54XJ3w3AAABACOGeH2f")
endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "https://ia-aplicada-openai.openai.azure.com")
deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "model-router")

print(f"🔍 Testeando deployment: {deployment}")
print(f"📍 Endpoint: {endpoint}")
print("-" * 60)

client = AzureOpenAI(
    api_key=api_key,
    api_version="2024-08-01-preview",
    azure_endpoint=endpoint
)

# Probar embeddings
try:
    print("\n1️⃣ Probando embeddings con deployment actual...")
    response = client.embeddings.create(
        model=deployment,
        input="Test embedding"
    )
    print("✅ ¡FUNCIONA! Este deployment soporta embeddings")
    print(f"   Vector de {len(response.data[0].embedding)} dimensiones generado")
    
except Exception as e:
    print(f"❌ ERROR: {type(e).__name__}")
    print(f"   Mensaje: {str(e)}")
    
    if "OperationNotSupportedError" in str(e):
        print("\n⚠️ CONFIRMADO: Este deployment NO soporta embeddings")
        print("   Solo soporta chat completions")
    elif "DeploymentNotFound" in str(e) or "404" in str(e):
        print("\n⚠️ Este deployment no existe o no está disponible")

print("\n" + "-" * 60)
print("\n💡 Para usar embeddings necesitás:")
print("   1. Crear un deployment de 'text-embedding-3-small'")
print("   2. Agregar AZURE_OPENAI_EMBEDDING_DEPLOYMENT al .env")
print("   3. Usar ese deployment específico para embeddings")
