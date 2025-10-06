#!/usr/bin/env python3
"""
Script para probar los endpoints de estadísticas del dashboard
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_endpoints():
    # Credentials para el test
    email = "eze@mail.com"
    password = "123456"
    
    print("🔐 Iniciando sesión...")
    
    # Login
    login_data = {
        "username": email,
        "password": password
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    
    if response.status_code != 200:
        print(f"❌ Error en login: {response.status_code}")
        print(response.text)
        return
    
    token_data = response.json()
    access_token = token_data["access_token"]
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    print("✅ Login exitoso")
    
    # Test endpoint de estadísticas de gastos
    print("\n📊 Probando estadísticas de gastos...")
    response = requests.get(f"{BASE_URL}/gastos/stats?año=2025&mes=10", headers=headers)
    
    if response.status_code == 200:
        print("✅ Estadísticas de gastos obtenidas:")
        print(json.dumps(response.json(), indent=2, default=str))
    else:
        print(f"❌ Error en estadísticas de gastos: {response.status_code}")
        print(response.text)
    
    # Test endpoint de estadísticas de ingresos
    print("\n💰 Probando estadísticas de ingresos...")
    response = requests.get(f"{BASE_URL}/ingresos/stats?año=2025&mes=10", headers=headers)
    
    if response.status_code == 200:
        print("✅ Estadísticas de ingresos obtenidas:")
        print(json.dumps(response.json(), indent=2, default=str))
    else:
        print(f"❌ Error en estadísticas de ingresos: {response.status_code}")
        print(response.text)
    
    # Test gastos recientes
    print("\n🛒 Probando gastos recientes...")
    response = requests.get(f"{BASE_URL}/gastos/?limit=5", headers=headers)
    
    if response.status_code == 200:
        gastos = response.json()
        print(f"✅ {len(gastos)} gastos recientes obtenidos")
        for gasto in gastos[:2]:  # Solo mostrar los primeros 2
            print(f"  - {gasto.get('descripcion', 'N/A')}: ${gasto.get('monto', 0)}")
    else:
        print(f"❌ Error en gastos recientes: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    test_endpoints()