# ============================================================================
# API ENDPOINTS PARA CHAT CON IA
# ============================================================================
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, extract
import uuid
import sys
from datetime import datetime, date
from calendar import monthrange

from app.schemas.chat import (
    ChatMensajeRequest,
    ChatMensajeResponse,
    ChatConversacion,
    ChatConversacionResumen,
    ChatConversacionCreate,
    ChatMensajeDetalle,
    ChatProveedorInfo
)
from app.utils.ai_factory import obtener_adaptador_ia, AIAdapterFactory
from app.utils.ai_adapter import ChatMessage
from app.api.deps import get_current_user, get_optional_user, get_db
from app.models.usuario import Usuario
from app.models.gasto import Gasto
from app.models.ingreso import Ingreso
from app.models.categoria import Categoria

router = APIRouter()

# Almacenamiento temporal de conversaciones (en producción usar base de datos)
conversaciones = {}


# ============================================================================
conversaciones_temp = {}


def obtener_contexto_gastos(user_id: int, db: Session) -> str:
    """Obtiene contexto con datos reales del usuario"""
    try:
        hoy = date.today()
        mes_actual = hoy.month
        anio_actual = hoy.year
        
        contexto = """Eres un asistente financiero personal especializado en an�lisis de gastos.

PRIMER MENSAJE: "�Hola! Soy tu asistente financiero. Estoy aqu� para ayudarte con tus gastos, presupuestos y finanzas. �En qu� puedo ayudarte? "

SOLO FINANZAS: Si preguntan sobre temas no financieros, responde: "Disculpa, solo puedo ayudarte con finanzas personales. �Tienes alguna consulta sobre gastos, presupuestos o ahorro? "
"""
        
        if user_id == 0:
            return contexto + "\n Usuario no autenticado (sin datos personales)\n"
        
        contexto += f"\n DATOS FINANCIEROS DEL USUARIO:\n"
        
        # Gastos del mes actual
        gastos_mes = db.query(Gasto).filter(
            Gasto.id_usuario == user_id,
            Gasto.estado == 'confirmado',
            extract('year', Gasto.fecha) == anio_actual,
            extract('month', Gasto.fecha) == mes_actual
        ).all()
        
        total_gastos = sum(float(g.monto) for g in gastos_mes)
        contexto += f" Total gastado este mes: ${total_gastos:,.2f} ({len(gastos_mes)} gastos)\n"
        
        # �ltimos 5 gastos
        ultimos = db.query(Gasto).join(Categoria).filter(
            Gasto.id_usuario == user_id,
            Gasto.estado == 'confirmado'
        ).order_by(desc(Gasto.fecha)).limit(5).all()
        
        if ultimos:
            contexto += "\n Últimos 5 gastos:\n"
            for g in ultimos:
                cat = g.categoria.nombre if g.categoria else "Sin categoría"
                descripcion = f" - {g.descripcion[:30]}" if g.descripcion else ""
                contexto += f"   ${g.monto:,.2f} en {cat}{descripcion}\n"
        
        # Top 3 categor�as del mes
        top_cat = db.query(
            Categoria.nombre,
            func.sum(Gasto.monto).label('total')
        ).join(Gasto).filter(
            Gasto.id_usuario == user_id,
            Gasto.estado == 'confirmado',
            extract('year', Gasto.fecha) == anio_actual,
            extract('month', Gasto.fecha) == mes_actual
        ).group_by(Categoria.nombre).order_by(desc('total')).limit(3).all()
        
        if top_cat:
            contexto += "\n Top 3 categor�as del mes:\n"
            for i, (cat, total) in enumerate(top_cat, 1):
                pct = (float(total) / total_gastos * 100) if total_gastos > 0 else 0
                contexto += f"  {i}. {cat}: ${float(total):,.2f} ({pct:.1f}%)\n"
        
        # Ingresos del mes
        ingresos_mes = db.query(func.sum(Ingreso.monto)).filter(
            Ingreso.id_usuario == user_id,
            Ingreso.estado == 'confirmado',
            extract('year', Ingreso.fecha) == anio_actual,
            extract('month', Ingreso.fecha) == mes_actual
        ).scalar() or 0
        
        if ingresos_mes > 0:
            balance = float(ingresos_mes) - total_gastos
            contexto += f"\n Ingresos del mes: ${float(ingresos_mes):,.2f}\n"
            contexto += f" Balance: ${balance:,.2f}"
            if balance > 0:
                contexto += "  (Ahorrando)\n"
            else:
                contexto += "  (Gastando m�s de lo que ingresas)\n"
        
        # Comparaci�n con mes anterior
        mes_ant = mes_actual - 1 if mes_actual > 1 else 12
        anio_ant = anio_actual if mes_actual > 1 else anio_actual - 1
        
        gastos_ant = db.query(func.sum(Gasto.monto)).filter(
            Gasto.id_usuario == user_id,
            Gasto.estado == 'confirmado',
            extract('year', Gasto.fecha) == anio_ant,
            extract('month', Gasto.fecha) == mes_ant
        ).scalar() or 0
        
        if gastos_ant > 0:
            dif = total_gastos - float(gastos_ant)
            pct = (dif / float(gastos_ant)) * 100
            contexto += f"\n Mes anterior: ${float(gastos_ant):,.2f}"
            if dif > 0:
                contexto += f" (Gastaste ${dif:,.2f} m�s, +{pct:.1f}%)\n"
            else:
                contexto += f" (Gastaste ${abs(dif):,.2f} menos, {pct:.1f}%) \n"
        
        contexto += "\n USA ESTOS DATOS REALES para dar consejos personalizados y específicos.\n"
        return contexto
        
    except Exception as e:
        print(f"❌ Error al obtener contexto: {str(e)}", flush=True)
        return "Eres un asistente financiero personal."


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/mensaje", response_model=ChatMensajeResponse)
async def enviar_mensaje(
    request: ChatMensajeRequest,
    current_user: Optional[Usuario] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Enviar un mensaje al asistente IA y recibir respuesta"""
    try:
        # Obtener adaptador de IA
        adaptador = obtener_adaptador_ia()
        
        # ID del usuario (puede ser None si no está autenticado)
        user_id = current_user.id_usuario if current_user else None
        
        # Obtener o crear conversación
        conversacion_id = request.conversacion_id or str(uuid.uuid4())
        
        if conversacion_id not in conversaciones:
            conversaciones[conversacion_id] = {
                "id": conversacion_id,
                "user_id": user_id,
                "titulo": request.mensaje[:50] + "..." if len(request.mensaje) > 50 else request.mensaje,
                "mensajes": [],
                "fecha_creacion": datetime.now().isoformat(),
                "fecha_actualizacion": datetime.now().isoformat()
            }
        
        # Agregar mensaje del usuario
        mensaje_usuario = {
            "id": str(uuid.uuid4()),
            "rol": "user",
            "contenido": request.mensaje,
            "timestamp": datetime.now().isoformat()
        }
        conversaciones[conversacion_id]["mensajes"].append(mensaje_usuario)
        
        # Preparar historial de mensajes para el modelo
        historial = [
            ChatMessage(role=msg["rol"], content=msg["contenido"])
            for msg in conversaciones[conversacion_id]["mensajes"]
        ]
        
        # Obtener contexto financiero del usuario
        contexto_adicional = ""
        
        # Si hay usuario autenticado, usar su ID
        if user_id:
            print(f"🔍 Obteniendo contexto para user_id: {user_id}", file=sys.stderr, flush=True)
            contexto_adicional = obtener_contexto_gastos(user_id, db)
            print(f"📊 Contexto obtenido: {len(contexto_adicional)} caracteres", file=sys.stderr, flush=True)
        else:
            print(f"⚠️ NO HAY user_id autenticado - Chat funcionará sin contexto personalizado", file=sys.stderr, flush=True)
        
        # Generar respuesta del asistente
        respuesta_ia = await adaptador.generar_respuesta(
            mensajes=historial,
            contexto_adicional=contexto_adicional,
            temperatura=request.temperatura,
            max_tokens=request.max_tokens
        )
        
        # Agregar respuesta del asistente
        mensaje_asistente = {
            "id": str(uuid.uuid4()),
            "rol": "assistant",
            "contenido": respuesta_ia,
            "timestamp": datetime.now().isoformat()
        }
        conversaciones[conversacion_id]["mensajes"].append(mensaje_asistente)
        conversaciones[conversacion_id]["fecha_actualizacion"] = datetime.now().isoformat()
        
        return ChatMensajeResponse(
            respuesta=respuesta_ia,
            conversacion_id=conversacion_id,
            sugerencias=None
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar mensaje: {str(e)}"
        )


@router.get("/conversaciones", response_model=List[ChatConversacionResumen])
async def obtener_conversaciones(
    current_user: Optional[Usuario] = Depends(get_optional_user)
):
    """Obtener todas las conversaciones del usuario"""
    user_id = current_user.id_usuario if current_user else None
    
    resultado = []
    for conv_id, conv in conversaciones.items():
        # Si hay usuario, filtrar por sus conversaciones
        if user_id and conv.get("user_id") != user_id:
            continue
        # Si no hay usuario, mostrar conversaciones sin usuario asignado
        if not user_id and conv.get("user_id") is not None:
            continue
            
        ultimo_mensaje = conv["mensajes"][-1]["contenido"] if conv["mensajes"] else ""
        
        # Asegurar que siempre hay un título
        titulo = conv.get("titulo") or f"Conversación {conv.get('fecha_creacion', '')[:10]}"
        
        resultado.append(ChatConversacionResumen(
            id=conv["id"],
            titulo=titulo,
            ultimo_mensaje=ultimo_mensaje,
            fecha_creacion=conv["fecha_creacion"],
            fecha_actualizacion=conv["fecha_actualizacion"],
            cantidad_mensajes=len(conv["mensajes"])
        ))
    
    return sorted(resultado, key=lambda x: x.fecha_actualizacion, reverse=True)


@router.get("/conversaciones/{conversacion_id}", response_model=ChatConversacionResumen)
async def obtener_conversacion(
    conversacion_id: str,
    current_user: Optional[Usuario] = Depends(get_optional_user)
):
    """Obtener una conversación específica"""
    if conversacion_id not in conversaciones:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversación no encontrada"
        )
    
    user_id = current_user.id_usuario if current_user else None
    conv = conversaciones[conversacion_id]
    
    # Verificar permisos
    if user_id and conv.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver esta conversación"
        )
    
    ultimo_mensaje = conv["mensajes"][-1]["contenido"] if conv["mensajes"] else ""
    
    return ChatConversacionResumen(
        id=conv["id"],
        titulo=conv["titulo"],
        ultimo_mensaje=ultimo_mensaje,
        fecha_creacion=conv["fecha_creacion"],
        fecha_actualizacion=conv["fecha_actualizacion"],
        cantidad_mensajes=len(conv["mensajes"])
    )


@router.get("/conversaciones/{conversacion_id}/mensajes", response_model=List[ChatMensajeDetalle])
async def obtener_mensajes_conversacion(
    conversacion_id: str,
    current_user: Optional[Usuario] = Depends(get_optional_user)
):
    """Obtener todos los mensajes de una conversación"""
    if conversacion_id not in conversaciones:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversación no encontrada"
        )
    
    user_id = current_user.id_usuario if current_user else None
    conv = conversaciones[conversacion_id]
    
    # Verificar permisos
    if user_id and conv.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver esta conversación"
        )
    
    return [
        ChatMensajeDetalle(
            id=msg["id"],
            role=msg["rol"],
            content=msg["contenido"],
            timestamp=datetime.fromisoformat(msg["timestamp"])
        )
        for msg in conv["mensajes"]
    ]


@router.delete("/conversaciones/{conversacion_id}")
async def eliminar_conversacion(
    conversacion_id: str,
    current_user: Optional[Usuario] = Depends(get_optional_user)
):
    """Eliminar una conversación"""
    if conversacion_id not in conversaciones:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversación no encontrada"
        )
    
    user_id = current_user.id_usuario if current_user else None
    conv = conversaciones[conversacion_id]
    
    # Verificar permisos
    if user_id and conv.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para eliminar esta conversación"
        )
    
    del conversaciones[conversacion_id]
    return {"mensaje": "Conversación eliminada exitosamente"}


@router.post("/conversaciones", response_model=ChatConversacionResumen)
async def crear_conversacion(
    request: ChatConversacionCreate,
    current_user: Optional[Usuario] = Depends(get_optional_user)
):
    """Crear una nueva conversación"""
    user_id = current_user.id_usuario if current_user else None
    conversacion_id = str(uuid.uuid4())
    
    # Si no hay título, generar uno por defecto
    titulo = request.titulo if request.titulo else f"Conversación {datetime.now().strftime('%d/%m/%Y %H:%M')}"
    
    conversaciones[conversacion_id] = {
        "id": conversacion_id,
        "user_id": user_id,
        "titulo": titulo,
        "mensajes": [],
        "fecha_creacion": datetime.now().isoformat(),
        "fecha_actualizacion": datetime.now().isoformat()
    }
    
    return ChatConversacionResumen(
        id=conversacion_id,
        titulo=titulo,
        ultimo_mensaje="",
        fecha_creacion=conversaciones[conversacion_id]["fecha_creacion"],
        fecha_actualizacion=conversaciones[conversacion_id]["fecha_actualizacion"],
        cantidad_mensajes=0
    )


@router.get("/proveedor", response_model=ChatProveedorInfo)
async def obtener_proveedor():
    """Obtener información del proveedor de IA actual"""
    adaptador = obtener_adaptador_ia()
    return ChatProveedorInfo(
        nombre=adaptador.nombre,
        modelo=adaptador.modelo
    )

