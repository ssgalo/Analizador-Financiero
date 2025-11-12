# ============================================================================
# API ENDPOINTS PARA CHAT CON IA
# ============================================================================
"""
Módulo de rutas para el chatbot con IA

Proporciona endpoints para:
- Enviar mensajes al chatbot y recibir respuestas
- Gestionar conversaciones del usuario
- Integración con Azure OpenAI Service

El chatbot analiza los datos financieros del usuario (gastos, ingresos, categorías)
y proporciona recomendaciones personalizadas usando GPT-4.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, extract
import uuid
import json
import asyncio
from datetime import datetime, date

from app.schemas.chat import (
    ChatMensajeRequest,
    ChatMensajeResponse,
    ChatConversacion,
    ChatConversacionResumen,
    ChatConversacionCreate,
    ChatMensajeDetalle,
    ChatProveedorInfo,
    ChatLimitesUsuario,
    ChatEstadisticasUso
)
from app.utils.ai_factory import obtener_adaptador_ia, AIAdapterFactory
from app.utils.ai_adapter import ChatMessage
from app.utils.token_limits import token_manager
from app.api.deps import get_current_user, get_optional_user, get_db
from app.models.usuario import Usuario
from app.models.gasto import Gasto
from app.models.ingreso import Ingreso
from app.models.categoria import Categoria
from app.services.context_builder_service import ContextBuilderService
from app.services.vector_search_service import VectorSearchService
from app.services.embeddings_service import EmbeddingsService

router = APIRouter()

# Almacenamiento temporal de conversaciones en memoria
# TODO: Migrar a base de datos para persistencia
conversaciones = {}

# Inicializar servicios de embeddings
embeddings_service = EmbeddingsService()
vector_search_service = VectorSearchService()
context_builder_service = ContextBuilderService()


async def obtener_contexto_con_embeddings(user_id: int, consulta: str, db: Session) -> str:
    """
    Genera contexto financiero usando búsqueda semántica con embeddings
    
    Args:
        user_id: ID del usuario
        consulta: Pregunta/mensaje del usuario
        db: Sesión de base de datos
        
    Returns:
        str: Contexto enriquecido con búsqueda semántica
    """
    try:
        # Construir contexto usando el servicio que integra búsqueda semántica
        contexto = await context_builder_service.construir_contexto_completo(
            user_id=user_id,
            consulta=consulta,
            db=db,
            limite_gastos=10,
            limite_ingresos=5
        )
        return contexto
        
    except Exception as e:
        # Si falla, usar el método tradicional como fallback
        print(f"⚠️ Error en búsqueda con embeddings: {e}. Usando contexto tradicional.")
        return obtener_contexto_gastos_tradicional(user_id, db)


def obtener_contexto_gastos_tradicional(user_id: int, db: Session) -> str:
    """
    Genera el contexto financiero del usuario para el chatbot
    
    Analiza los datos de gastos del usuario y crea un resumen que incluye:
    - Último mes con datos registrados
    - Gastos del mes actual
    - Últimos 10 gastos
    - Top 5 categorías del mes
    
    Args:
        user_id: ID del usuario autenticado
        db: Sesión de base de datos SQLAlchemy
        
    Returns:
        str: Contexto formateado con información financiera del usuario
        
    Example:
        >>> contexto = obtener_contexto_gastos(123, db)
        >>> print(contexto)
        📅 ÚLTIMO MES CON DATOS REGISTRADOS: 10/2025
        💰 MES ACTUAL (10/2025):
           Total gastado: $15,234.50 (42 transacciones)
    """
    try:
        hoy = date.today()
        mes_actual = hoy.month
        anio_actual = hoy.year
        
        contexto = """Eres un asistente financiero personal especializado en análisis de gastos.

PRIMER MENSAJE: "¡Hola! Soy tu asistente financiero. Estoy aquí para ayudarte con tus gastos, presupuestos y finanzas. ¿En qué puedo ayudarte? 💰"

SOLO FINANZAS: Si preguntan sobre temas no financieros, responde: "Disculpa, solo puedo ayudarte con finanzas personales. ¿Tienes alguna consulta sobre gastos, presupuestos o ahorro? 💡"
"""
        
        if user_id == 0:
            return contexto + "\n⚠️ Usuario no autenticado (sin datos personales)\n"
        
        # ========== ENCONTRAR ÚLTIMO MES CON DATOS ==========
        ultimo_gasto = db.query(Gasto).filter(
            Gasto.id_usuario == user_id,
            Gasto.estado == 'confirmado'
        ).order_by(desc(Gasto.fecha)).first()
        
        if ultimo_gasto:
            ultimo_mes_con_datos = ultimo_gasto.fecha.month
            ultimo_anio_con_datos = ultimo_gasto.fecha.year
            contexto += f"\n📅 ÚLTIMO MES CON DATOS REGISTRADOS: {ultimo_mes_con_datos:02d}/{ultimo_anio_con_datos}\n"
        else:
            contexto += "\n⚠️ No hay gastos registrados en el sistema.\n"
            return contexto
        
        contexto += f"\n📊 DATOS FINANCIEROS DEL USUARIO:\n"
        
        # ========== GASTOS DEL MES ACTUAL ==========
        gastos_mes = db.query(Gasto).filter(
            Gasto.id_usuario == user_id,
            Gasto.estado == 'confirmado',
            extract('year', Gasto.fecha) == anio_actual,
            extract('month', Gasto.fecha) == mes_actual
        ).all()
        
        total_gastos = sum(float(g.monto) for g in gastos_mes)
        contexto += f"\n💰 MES ACTUAL ({mes_actual}/{anio_actual}):\n"
        contexto += f"   Total gastado: ${total_gastos:,.2f} ({len(gastos_mes)} transacciones)\n"
        
        # ========== ÚLTIMOS 10 GASTOS ==========
        ultimos = db.query(Gasto).join(Categoria).filter(
            Gasto.id_usuario == user_id,
            Gasto.estado == 'confirmado'
        ).order_by(desc(Gasto.fecha)).limit(10).all()
        
        if ultimos:
            contexto += "\n📝 ÚLTIMOS 10 GASTOS:\n"
            for g in ultimos:
                cat = g.categoria.nombre if g.categoria else "Sin categoría"
                fecha_str = g.fecha.strftime('%d/%m/%Y')
                descripcion = f" - {g.descripcion[:30]}" if g.descripcion else ""
                comercio = f" en {g.comercio[:20]}" if g.comercio else ""
                contexto += f"   [{fecha_str}] ${g.monto:,.2f} en {cat}{comercio}{descripcion}\n"
        
        # ========== TOP 5 CATEGORÍAS DEL MES ==========
        top_cat = db.query(
            Categoria.nombre,
            func.sum(Gasto.monto).label('total'),
            func.count(Gasto.id_gasto).label('cantidad')
        ).join(Gasto).filter(
            Gasto.id_usuario == user_id,
            Gasto.estado == 'confirmado',
            extract('year', Gasto.fecha) == anio_actual,
            extract('month', Gasto.fecha) == mes_actual
        ).group_by(Categoria.nombre).order_by(desc('total')).limit(5).all()
        
        if top_cat:
            contexto += "\n🏆 TOP 5 CATEGORÍAS DEL MES:\n"
            for i, (cat, total, cant) in enumerate(top_cat, 1):
                pct = (float(total) / total_gastos * 100) if total_gastos > 0 else 0
                contexto += f"   {i}. {cat}: ${float(total):,.2f} ({pct:.1f}%) - {cant} gastos\n"
        
        # ========== HISTORIAL DE ÚLTIMOS 6 MESES ==========
        contexto += "\n📈 HISTORIAL ÚLTIMOS 6 MESES:\n"
        meses_con_datos = 0
        for i in range(5, -1, -1):  # De 5 meses atrás hasta el actual
            mes = mes_actual - i
            anio = anio_actual
            if mes <= 0:
                mes += 12
                anio -= 1
            
            total_mes = db.query(func.sum(Gasto.monto)).filter(
                Gasto.id_usuario == user_id,
                Gasto.estado == 'confirmado',
                extract('year', Gasto.fecha) == anio,
                extract('month', Gasto.fecha) == mes
            ).scalar() or 0
            
            cant_mes = db.query(func.count(Gasto.id_gasto)).filter(
                Gasto.id_usuario == user_id,
                Gasto.estado == 'confirmado',
                extract('year', Gasto.fecha) == anio,
                extract('month', Gasto.fecha) == mes
            ).scalar() or 0
            
            if float(total_mes) > 0 or cant_mes > 0:
                contexto += f"   {mes:02d}/{anio}: ${float(total_mes):,.2f} ({cant_mes} gastos)\n"
                meses_con_datos += 1
            else:
                contexto += f"   {mes:02d}/{anio}: Sin datos registrados\n"
        
        if meses_con_datos == 0:
            contexto += f"   ⚠️ No hay datos en los últimos 6 meses. Último mes con datos: {ultimo_mes_con_datos:02d}/{ultimo_anio_con_datos}\n"
        
        # ========== PROMEDIO MENSUAL HISTÓRICO ==========
        # Calcular promedio de los últimos 6 meses
        total_6_meses = 0
        for i in range(6):
            mes = mes_actual - i
            anio = anio_actual
            if mes <= 0:
                mes += 12
                anio -= 1
            
            total_mes = db.query(func.sum(Gasto.monto)).filter(
                Gasto.id_usuario == user_id,
                Gasto.estado == 'confirmado',
                extract('year', Gasto.fecha) == anio,
                extract('month', Gasto.fecha) == mes
            ).scalar() or 0
            total_6_meses += float(total_mes)
        
        promedio_mensual = total_6_meses / 6
        diferencia_promedio = total_gastos - promedio_mensual
        pct_vs_promedio = (diferencia_promedio / promedio_mensual * 100) if promedio_mensual > 0 else 0
        
        contexto += f"\n📊 PROMEDIO MENSUAL (últimos 6 meses): ${promedio_mensual:,.2f}\n"
        if diferencia_promedio > 0:
            contexto += f"   ⚠️ Este mes gastaste ${diferencia_promedio:,.2f} MÁS que el promedio (+{pct_vs_promedio:.1f}%)\n"
        elif diferencia_promedio < 0:
            contexto += f"   ✅ Este mes gastaste ${abs(diferencia_promedio):,.2f} MENOS que el promedio ({pct_vs_promedio:.1f}%)\n"
        
        # ========== INGRESOS DEL MES ==========
        ingresos_mes = db.query(func.sum(Ingreso.monto)).filter(
            Ingreso.id_usuario == user_id,
            Ingreso.estado == 'confirmado',
            extract('year', Ingreso.fecha) == anio_actual,
            extract('month', Ingreso.fecha) == mes_actual
        ).scalar() or 0
        
        if ingresos_mes > 0:
            balance = float(ingresos_mes) - total_gastos
            pct_gastado = (total_gastos / float(ingresos_mes) * 100) if ingresos_mes > 0 else 0
            contexto += f"\n💵 INGRESOS DEL MES: ${float(ingresos_mes):,.2f}\n"
            contexto += f"   Balance: ${balance:,.2f}"
            if balance > 0:
                contexto += f" ✅ (Ahorrando ${balance:,.2f})\n"
            else:
                contexto += f" ⚠️ (Déficit de ${abs(balance):,.2f})\n"
            contexto += f"   Estás gastando el {pct_gastado:.1f}% de tus ingresos\n"
        
        # ========== COMPARACIÓN CON MES ANTERIOR ==========
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
            contexto += f"\n📊 MES ANTERIOR ({mes_ant:02d}/{anio_ant}): ${float(gastos_ant):,.2f}\n"
            if dif > 0:
                contexto += f"   ⚠️ Gastaste ${dif:,.2f} MÁS (+{pct:.1f}%)\n"
            elif dif < 0:
                contexto += f"   ✅ Gastaste ${abs(dif):,.2f} MENOS ({pct:.1f}%)\n"
            else:
                contexto += f"   = Igual que el mes anterior\n"
        
        # ========== CATEGORÍAS HISTÓRICAS (últimos 3 meses) ==========
        contexto += "\n📂 CATEGORÍAS MÁS USADAS (últimos 3 meses):\n"
        for i in range(3):
            mes = mes_actual - i
            anio = anio_actual
            if mes <= 0:
                mes += 12
                anio -= 1
            
            top_cat_hist = db.query(
                Categoria.nombre,
                func.sum(Gasto.monto).label('total')
            ).join(Gasto).filter(
                Gasto.id_usuario == user_id,
                Gasto.estado == 'confirmado',
                extract('year', Gasto.fecha) == anio,
                extract('month', Gasto.fecha) == mes
            ).group_by(Categoria.nombre).order_by(desc('total')).limit(3).all()
            
            if top_cat_hist:
                contexto += f"   {mes:02d}/{anio}: "
                contexto += ", ".join([f"{cat} ${float(total):,.0f}" for cat, total in top_cat_hist])
                contexto += "\n"
        
        contexto += "\n💡 USA ESTOS DATOS HISTÓRICOS para dar consejos personalizados, identificar patrones de gasto y sugerir mejoras.\n"
        contexto += f"\n⚠️ IMPORTANTE: Si el usuario pregunta por un mes SIN DATOS, indícale que su último mes con datos registrados es {ultimo_mes_con_datos:02d}/{ultimo_anio_con_datos} y sugiérele que registre nuevos gastos.\n"
        return contexto
        
    except Exception:
        return "Eres un asistente financiero personal."


@router.post("/mensaje", response_model=ChatMensajeResponse)
async def enviar_mensaje(
    request: ChatMensajeRequest,
    current_user: Optional[Usuario] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Enviar un mensaje al asistente IA y recibir respuesta"""
    try:
        adaptador = obtener_adaptador_ia()
        user_id = current_user.id_usuario if current_user else 0
        
        # Verificar límites de tokens antes de procesar
        tokens_estimados = token_manager.estimar_tokens_mensaje(request.mensaje)
        puede_enviar, mensaje_error = token_manager.puede_enviar_mensaje(user_id, tokens_estimados)
        
        if not puede_enviar:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Límite de tokens excedido: {mensaje_error}"
            )
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
        
        mensaje_usuario = {
            "id": str(uuid.uuid4()),
            "rol": "user",
            "contenido": request.mensaje,
            "timestamp": datetime.now().isoformat()
        }
        conversaciones[conversacion_id]["mensajes"].append(mensaje_usuario)
        
        historial = [
            ChatMessage(role=msg["rol"], content=msg["contenido"])
            for msg in conversaciones[conversacion_id]["mensajes"]
        ]
        
        # Obtener contexto usando búsqueda semántica con embeddings
        contexto_adicional = ""
        if user_id:
            contexto_adicional = await obtener_contexto_con_embeddings(user_id, request.mensaje, db)
        
        respuesta_ia = await adaptador.generar_respuesta(
            mensajes=historial,
            contexto_adicional=contexto_adicional,
            temperatura=request.temperatura,
            max_tokens=request.max_tokens
        )
        
        mensaje_asistente = {
            "id": str(uuid.uuid4()),
            "rol": "assistant",
            "contenido": respuesta_ia,
            "timestamp": datetime.now().isoformat()
        }
        conversaciones[conversacion_id]["mensajes"].append(mensaje_asistente)
        conversaciones[conversacion_id]["fecha_actualizacion"] = datetime.now().isoformat()
        
        # Calcular tokens reales utilizados (estimación mejorada)
        tokens_respuesta = token_manager.estimar_tokens_mensaje(respuesta_ia)
        tokens_totales = tokens_estimados + tokens_respuesta
        
        # Registrar el uso real de tokens
        token_manager.registrar_uso(user_id, tokens_totales)
        
        # Obtener estadísticas actualizadas
        estadisticas = token_manager.obtener_estadisticas_usuario(user_id)
        
        return ChatMensajeResponse(
            respuesta=respuesta_ia,
            conversacion_id=conversacion_id,
            sugerencias=None,
            tokens_utilizados=tokens_totales,
            tokens_restantes_dia=estadisticas["tokens_restantes_dia"],
            limite_diario=estadisticas["limite_diario"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar mensaje: {str(e)}"
        )


@router.post("/mensaje/stream")
async def enviar_mensaje_streaming(
    request: ChatMensajeRequest,
    current_user: Optional[Usuario] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Enviar un mensaje al asistente IA y recibir respuesta en streaming"""
    
    async def generar_stream():
        try:
            adaptador = obtener_adaptador_ia()
            user_id = current_user.id_usuario if current_user else 0
            
            # Verificar límites de tokens antes de procesar
            tokens_estimados = token_manager.estimar_tokens_mensaje(request.mensaje)
            puede_enviar, mensaje_error = token_manager.puede_enviar_mensaje(user_id, tokens_estimados)
            
            if not puede_enviar:
                error_data = {
                    'error': f"Límite de tokens excedido: {mensaje_error}",
                    'codigo': 'TOKEN_LIMIT_EXCEEDED'
                }
                yield f"data: {json.dumps(error_data)}\n\n"
                yield f"data: [DONE]\n\n"
                return
            conversacion_id = request.conversacion_id or str(uuid.uuid4())
            
            # Inicializar conversación si no existe
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
            
            # Preparar historial
            historial = [
                ChatMessage(role=msg["rol"], content=msg["contenido"])
                for msg in conversaciones[conversacion_id]["mensajes"]
            ]
            
            # Obtener contexto financiero usando búsqueda semántica con embeddings
            contexto_adicional = ""
            if user_id:
                contexto_adicional = await obtener_contexto_con_embeddings(user_id, request.mensaje, db)
            
            # Generar respuesta (sin streaming por ahora, simularemos)
            respuesta_ia = await adaptador.generar_respuesta(
                mensajes=historial,
                contexto_adicional=contexto_adicional,
                temperatura=request.temperatura,
                max_tokens=request.max_tokens
            )
            
            # Enviar conversacion_id primero
            yield f"data: {json.dumps({'conversacion_id': conversacion_id})}\n\n"
            
            # Simular streaming dividiendo la respuesta en palabras
            palabras = respuesta_ia.split(' ')
            
            for i, palabra in enumerate(palabras):
                # Agregar espacio excepto en la última palabra
                contenido = palabra + (' ' if i < len(palabras) - 1 else '')
                
                # Enviar chunk
                chunk_data = {
                    'content': contenido,
                    'conversacion_id': conversacion_id
                }
                yield f"data: {json.dumps(chunk_data)}\n\n"
                
                # Pequeña pausa para simular streaming real
                await asyncio.sleep(0.05)  # 50ms entre palabras
            
            # Guardar mensaje del asistente
            mensaje_asistente = {
                "id": str(uuid.uuid4()),
                "rol": "assistant",
                "contenido": respuesta_ia,
                "timestamp": datetime.now().isoformat()
            }
            conversaciones[conversacion_id]["mensajes"].append(mensaje_asistente)
            conversaciones[conversacion_id]["fecha_actualizacion"] = datetime.now().isoformat()
            
            # Calcular y registrar tokens utilizados
            tokens_respuesta = token_manager.estimar_tokens_mensaje(respuesta_ia)
            tokens_totales = tokens_estimados + tokens_respuesta
            token_manager.registrar_uso(user_id, tokens_totales)
            
            # Enviar estadísticas finales
            estadisticas = token_manager.obtener_estadisticas_usuario(user_id)
            stats_data = {
                'tokens_utilizados': tokens_totales,
                'tokens_restantes_dia': estadisticas["tokens_restantes_dia"],
                'limite_diario': estadisticas["limite_diario"],
                'conversacion_id': conversacion_id
            }
            yield f"data: {json.dumps(stats_data)}\n\n"
            
            # Señal de finalización
            yield f"data: [DONE]\n\n"
            
        except Exception as e:
            # Enviar error en formato de stream
            error_data = {
                'error': str(e),
                'conversacion_id': conversacion_id if 'conversacion_id' in locals() else None
            }
            yield f"data: {json.dumps(error_data)}\n\n"
            yield f"data: [DONE]\n\n"
    
    return StreamingResponse(
        generar_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        }
    )


@router.get("/conversaciones", response_model=List[ChatConversacionResumen])
async def obtener_conversaciones(
    current_user: Optional[Usuario] = Depends(get_optional_user)
):
    """Obtener todas las conversaciones del usuario"""
    user_id = current_user.id_usuario if current_user else None
    
    resultado = []
    for conv_id, conv in conversaciones.items():
        if user_id and conv.get("user_id") != user_id:
            continue
        if not user_id and conv.get("user_id") is not None:
            continue
            
        ultimo_mensaje = conv["mensajes"][-1]["contenido"] if conv["mensajes"] else ""
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


@router.get("/limites", response_model=ChatLimitesUsuario)
async def obtener_limites_usuario(
    current_user: Optional[Usuario] = Depends(get_optional_user)
):
    """Obtener los límites y uso actual de tokens del usuario"""
    user_id = current_user.id_usuario if current_user else 0
    estadisticas = token_manager.obtener_estadisticas_usuario(user_id)
    
    return ChatLimitesUsuario(
        limite_diario=estadisticas["limite_diario"],
        limite_por_mensaje=estadisticas["limite_por_mensaje"],
        tokens_usados_hoy=estadisticas["tokens_usados_hoy"],
        tokens_restantes_dia=estadisticas["tokens_restantes_dia"],
        mensajes_hoy=estadisticas["mensajes_hoy"],
        ultimo_reset=datetime.now()  # Simplificado por ahora
    )


@router.get("/estadisticas", response_model=ChatEstadisticasUso)
async def obtener_estadisticas_uso(
    current_user: Optional[Usuario] = Depends(get_optional_user)
):
    """Obtener estadísticas de uso del chat del usuario"""
    user_id = current_user.id_usuario if current_user else 0
    
    # Obtener estadísticas de conversaciones
    conversaciones_usuario = [
        conv for conv in conversaciones.values() 
        if conv.get("user_id") == user_id
    ]
    
    total_mensajes = sum(len(conv["mensajes"]) for conv in conversaciones_usuario)
    estadisticas_tokens = token_manager.obtener_estadisticas_usuario(user_id)
    
    promedio_tokens = (estadisticas_tokens["tokens_mes"] / max(total_mensajes, 1)) if total_mensajes > 0 else 0
    
    return ChatEstadisticasUso(
        total_conversaciones=len(conversaciones_usuario),
        total_mensajes=total_mensajes,
        tokens_utilizados_mes=estadisticas_tokens["tokens_mes"],
        tokens_utilizados_semana=estadisticas_tokens["tokens_usados_hoy"] * 7,  # Estimación
        promedio_tokens_por_mensaje=promedio_tokens
    )

