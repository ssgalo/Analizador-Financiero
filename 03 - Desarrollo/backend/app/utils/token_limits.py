# ============================================================================
# GESTIÓN DE LÍMITES DE TOKENS PARA CHAT IA
# ============================================================================
"""
Sistema de límites de tokens para controlar el uso de la API de IA.

Funcionalidades:
- Límites diarios por usuario
- Límites por mensaje individual  
- Seguimiento de uso histórico
- Reset automático diario
- Prevención de abuso
"""

from datetime import datetime, date
from typing import Dict, Optional
from dataclasses import dataclass, asdict
import json
import os

@dataclass
class UsuarioLimites:
    """Límites y uso de tokens de un usuario específico"""
    limite_diario: int = 10000          # 10K tokens por día (ajustable)
    limite_por_mensaje: int = 2000       # 2K tokens por mensaje máximo
    tokens_usados_hoy: int = 0          # Contador diario
    mensajes_hoy: int = 0               # Contador de mensajes diarios
    fecha_ultimo_reset: str = None      # Última fecha de reset
    tokens_mes: int = 0                 # Uso mensual total
    
    def __post_init__(self):
        if self.fecha_ultimo_reset is None:
            self.fecha_ultimo_reset = str(date.today())

class TokenLimitManager:
    """Gestor de límites de tokens para usuarios"""
    
    def __init__(self, archivo_datos: str = "/tmp/token_limits.json"):
        self.archivo_datos = archivo_datos
        self.usuarios_limites: Dict[int, UsuarioLimites] = {}
        self.cargar_datos()
    
    def cargar_datos(self):
        """Cargar datos de límites desde archivo"""
        try:
            if os.path.exists(self.archivo_datos):
                with open(self.archivo_datos, 'r') as f:
                    datos = json.load(f)
                    for user_id, data in datos.items():
                        self.usuarios_limites[int(user_id)] = UsuarioLimites(**data)
        except Exception as e:
            print(f"Error cargando límites de tokens: {e}")
    
    def guardar_datos(self):
        """Guardar datos de límites a archivo"""
        try:
            datos = {}
            for user_id, limites in self.usuarios_limites.items():
                datos[str(user_id)] = asdict(limites)
            
            with open(self.archivo_datos, 'w') as f:
                json.dump(datos, f, indent=2)
        except Exception as e:
            print(f"Error guardando límites de tokens: {e}")
    
    def obtener_limites_usuario(self, user_id: int) -> UsuarioLimites:
        """Obtener límites de un usuario, crear si no existe"""
        if user_id not in self.usuarios_limites:
            self.usuarios_limites[user_id] = UsuarioLimites()
        
        usuario = self.usuarios_limites[user_id]
        self.verificar_reset_diario(usuario)
        return usuario
    
    def verificar_reset_diario(self, usuario: UsuarioLimites):
        """Verificar si necesita reset diario"""
        hoy = str(date.today())
        if usuario.fecha_ultimo_reset != hoy:
            usuario.tokens_usados_hoy = 0
            usuario.mensajes_hoy = 0
            usuario.fecha_ultimo_reset = hoy
    
    def puede_enviar_mensaje(self, user_id: int, tokens_estimados: int) -> tuple[bool, str]:
        """
        Verificar si un usuario puede enviar un mensaje
        
        Returns:
            tuple: (puede_enviar, mensaje_error)
        """
        usuario = self.obtener_limites_usuario(user_id)
        
        # Verificar límite por mensaje
        if tokens_estimados > usuario.limite_por_mensaje:
            return False, f"El mensaje supera el límite de {usuario.limite_por_mensaje:,} tokens por mensaje"
        
        # Verificar límite diario
        tokens_despues = usuario.tokens_usados_hoy + tokens_estimados
        if tokens_despues > usuario.limite_diario:
            tokens_restantes = usuario.limite_diario - usuario.tokens_usados_hoy
            return False, f"Límite diario alcanzado. Tokens restantes: {tokens_restantes:,}"
        
        return True, ""
    
    def registrar_uso(self, user_id: int, tokens_usados: int):
        """Registrar el uso de tokens de un usuario"""
        usuario = self.obtener_limites_usuario(user_id)
        usuario.tokens_usados_hoy += tokens_usados
        usuario.mensajes_hoy += 1
        usuario.tokens_mes += tokens_usados
        self.guardar_datos()
    
    def obtener_estadisticas_usuario(self, user_id: int) -> dict:
        """Obtener estadísticas de uso de un usuario"""
        usuario = self.obtener_limites_usuario(user_id)
        tokens_restantes = max(0, usuario.limite_diario - usuario.tokens_usados_hoy)
        
        return {
            "limite_diario": usuario.limite_diario,
            "limite_por_mensaje": usuario.limite_por_mensaje,
            "tokens_usados_hoy": usuario.tokens_usados_hoy,
            "tokens_restantes_dia": tokens_restantes,
            "mensajes_hoy": usuario.mensajes_hoy,
            "tokens_mes": usuario.tokens_mes,
            "porcentaje_usado": (usuario.tokens_usados_hoy / usuario.limite_diario) * 100
        }
    
    def actualizar_limites_usuario(self, user_id: int, nuevo_limite_diario: int = None, 
                                 nuevo_limite_mensaje: int = None):
        """Actualizar los límites de un usuario (solo admin)"""
        usuario = self.obtener_limites_usuario(user_id)
        
        if nuevo_limite_diario is not None:
            usuario.limite_diario = nuevo_limite_diario
        
        if nuevo_limite_mensaje is not None:
            usuario.limite_por_mensaje = nuevo_limite_mensaje
        
        self.guardar_datos()
    
    def estimar_tokens_mensaje(self, mensaje: str) -> int:
        """
        Estimación aproximada de tokens basada en el texto
        Regla general: ~4 caracteres = 1 token para texto en español
        """
        # Estimación conservadora: 3.5 chars = 1 token
        return max(1, len(mensaje) // 3) + 100  # +100 tokens de overhead del sistema

# Instancia global del gestor
token_manager = TokenLimitManager()

# Configuración por defecto de límites
LIMITES_DEFAULT = {
    "LIMITE_DIARIO_DEFAULT": 10000,     # 10K tokens por día
    "LIMITE_MENSAJE_DEFAULT": 2000,     # 2K tokens por mensaje
    "LIMITE_DIARIO_PREMIUM": 50000,     # 50K tokens para usuarios premium
    "LIMITE_MENSAJE_PREMIUM": 5000,     # 5K tokens por mensaje premium
}