# 📊 Informe Técnico: Implementación de IA en el Backend

## 🎯 Resumen Ejecutivo

El backend utiliza **modelos de lenguaje GPT** (OpenAI o Azure OpenAI) para proporcionar un **asistente financiero conversacional** que analiza datos del usuario y ofrece recomendaciones personalizadas. La integración sigue un **patrón de adaptador** que permite cambiar entre proveedores de IA sin modificar la lógica de negocio.

---

## 🏗️ Arquitectura de la Integración con IA

### **Patrón de Diseño: Factory + Adapter**

La implementación utiliza dos patrones de diseño clave:

1. **Factory Pattern** (`ai_factory.py`): Crea la instancia correcta del adaptador según las variables de entorno
2. **Adapter Pattern** (`ai_adapter.py`): Abstrae las diferencias entre Azure OpenAI y OpenAI directo

```
┌─────────────────────────────────────────┐
│        AIAdapterFactory                 │
│  (Decide qué proveedor usar)            │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌─────────────┐  ┌──────────────┐
│   Azure     │  │   OpenAI     │
│   Adapter   │  │   Adapter    │
└─────────────┘  └──────────────┘
       │                │
       └────────┬───────┘
                ▼
        ┌──────────────┐
        │  API Externa │
        │  (GPT-4)     │
        └──────────────┘
```

---

## 🔌 Conexión con los Servicios de IA

### **Configuración por Variables de Entorno**

El sistema detecta automáticamente qué proveedor usar mediante variables de entorno en `config.py`:

```python
# Configuración de IA
USE_AZURE_OPENAI: bool = os.getenv("USE_AZURE_OPENAI", "false").lower() == "true"
AZURE_OPENAI_KEY: Optional[str] = os.getenv("AZURE_OPENAI_KEY")
AZURE_OPENAI_ENDPOINT: Optional[str] = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_DEPLOYMENT: Optional[str] = os.getenv("AZURE_OPENAI_DEPLOYMENT")
OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
```

### **Factory: Decisión del Proveedor** (`ai_factory.py`)

```python
class AIAdapterFactory:
    @staticmethod
    def create_adapter() -> AIAdapter:
        if settings.USE_AZURE_OPENAI:
            # Validar credenciales de Azure
            if not all([settings.AZURE_OPENAI_KEY, 
                       settings.AZURE_OPENAI_ENDPOINT,
                       settings.AZURE_OPENAI_DEPLOYMENT]):
                raise ValueError("Faltan variables de Azure OpenAI")
            
            return AzureOpenAIAdapter(
                api_key=settings.AZURE_OPENAI_KEY,
                endpoint=settings.AZURE_OPENAI_ENDPOINT,
                deployment=settings.AZURE_OPENAI_DEPLOYMENT
            )
        else:
            # Usar OpenAI directo
            if not settings.OPENAI_API_KEY:
                raise ValueError("Falta OPENAI_API_KEY")
            
            return OpenAIAdapter(
                api_key=settings.OPENAI_API_KEY,
                model="gpt-4"  # o gpt-3.5-turbo
            )
```

**Lógica de decisión:**
- Si `USE_AZURE_OPENAI=true` → Usa Azure OpenAI Service
- Si `USE_AZURE_OPENAI=false` o no está definida → Usa OpenAI directo

---

## 🧩 Adaptadores: Abstracción de Proveedores

### **Clase Base: AIAdapter** (`ai_adapter.py`)

Define la interfaz común que ambos adaptadores deben implementar:

```python
class ChatMessage:
    """Representa un mensaje en la conversación"""
    role: str  # "system", "user", "assistant"
    content: str

class AIAdapter(ABC):
    """Interfaz abstracta para adaptadores de IA"""
    
    @abstractmethod
    async def generar_respuesta(
        self,
        mensajes: List[ChatMessage],
        contexto_adicional: Optional[str] = None,
        temperatura: float = 0.7,
        max_tokens: int = 1000,
        stream: bool = False
    ) -> str:
        """
        Genera una respuesta usando el modelo de IA.
        
        Args:
            mensajes: Historial de conversación
            contexto_adicional: Datos financieros del usuario
            temperatura: Creatividad (0-1)
            max_tokens: Longitud máxima de respuesta
            stream: Si debe retornar streaming
        """
        pass
    
    @abstractmethod
    async def generar_respuesta_streaming(
        self,
        mensajes: List[ChatMessage],
        contexto_adicional: Optional[str] = None,
        temperatura: float = 0.7,
        max_tokens: int = 1000
    ) -> AsyncGenerator[str, None]:
        """Genera respuesta en tiempo real (streaming)"""
        pass
```

### **Azure OpenAI Adapter** (`azure_openai_adapter.py`)

```python
class AzureOpenAIAdapter(AIAdapter):
    def __init__(self, api_key: str, endpoint: str, deployment: str):
        self.api_key = api_key
        self.endpoint = endpoint
        self.deployment = deployment
        self.api_version = "2024-02-15-preview"
        
        # URL completa para Azure
        self.url = (
            f"{endpoint}/openai/deployments/{deployment}"
            f"/chat/completions?api-version={self.api_version}"
        )
    
    async def generar_respuesta(
        self,
        mensajes: List[ChatMessage],
        contexto_adicional: Optional[str] = None,
        temperatura: float = 0.7,
        max_tokens: int = 1000,
        stream: bool = False
    ) -> str:
        messages = []
        
        # ⚠️ PROBLEMA DE AZURE: No respeta bien el rol "system"
        # SOLUCIÓN: Reforzar el contexto en el primer mensaje user
        if contexto_adicional and len(mensajes) > 0:
            # Estrategia 1: Agregar como system (puede ser ignorado)
            messages.append({
                "role": "system",
                "content": contexto_adicional
            })
            
            # Estrategia 2: REFORZAR en el primer mensaje user
            primer_mensaje = mensajes[0]
            if primer_mensaje.role == "user":
                contenido_reforzado = (
                    f"{contexto_adicional}\n\n"
                    f"---\n\n"
                    f"Pregunta del usuario: {primer_mensaje.content}"
                )
                messages.append({
                    "role": "user",
                    "content": contenido_reforzado
                })
                # Agregar el resto de mensajes
                for msg in mensajes[1:]:
                    messages.append(msg.to_dict())
            else:
                # Si no es user el primero, agregar todos normalmente
                for msg in mensajes:
                    messages.append(msg.to_dict())
        else:
            # Sin contexto, agregar mensajes normalmente
            for msg in mensajes:
                messages.append(msg.to_dict())
        
        # Hacer request a Azure OpenAI
        headers = {
            "Content-Type": "application/json",
            "api-key": self.api_key
        }
        
        payload = {
            "messages": messages,
            "temperature": temperatura,
            "max_tokens": max_tokens,
            "stream": stream
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                self.url,
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]
```

**Particularidades de Azure:**
- Requiere `api-key` en header (no `Authorization: Bearer`)
- URL específica con deployment y versión de API
- **Problema conocido:** Azure a veces ignora mensajes `system` largos
- **Solución:** Reforzar contexto prepending-lo al primer mensaje del usuario

### **OpenAI Adapter** (`openai_adapter.py`)

```python
class OpenAIAdapter(AIAdapter):
    def __init__(self, api_key: str, model: str = "gpt-4"):
        self.api_key = api_key
        self.model = model
        self.url = "https://api.openai.com/v1/chat/completions"
    
    async def generar_respuesta(
        self,
        mensajes: List[ChatMessage],
        contexto_adicional: Optional[str] = None,
        temperatura: float = 0.7,
        max_tokens: int = 1000,
        stream: bool = False
    ) -> str:
        messages = []
        
        # ✅ OpenAI SÍ respeta el mensaje system correctamente
        if contexto_adicional:
            messages.append({
                "role": "system",
                "content": contexto_adicional
            })
        
        # Agregar historial de conversación
        for msg in mensajes:
            messages.append(msg.to_dict())
        
        # Request a OpenAI
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperatura,
            "max_tokens": max_tokens,
            "stream": stream
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                self.url,
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]
```

**Particularidades de OpenAI:**
- Usa `Authorization: Bearer <token>` (estándar OAuth)
- Necesita especificar el modelo (`gpt-4`, `gpt-3.5-turbo`, etc.)
- Respeta correctamente el rol `system`

---

## 💬 Uso de la IA: Endpoint de Chat

### **Ruta Principal** (`chat.py`)

El endpoint `/api/chat/mensaje` es donde se integra todo:

```python
@router.post("/mensaje", response_model=ChatMensajeResponse)
async def enviar_mensaje(
    request: ChatMensajeRequest,
    db: Session = Depends(get_db),
    usuario_actual = Depends(get_current_user)
):
    """
    Envía un mensaje al chatbot y recibe una respuesta.
    
    Request Body:
        - mensaje: Pregunta del usuario
        - conversacion_id: ID de conversación (opcional)
        - contexto_gastos: Si incluir datos financieros (default: true)
        - temperatura: Creatividad 0-1 (default: 0.7)
        - max_tokens: Longitud máxima (default: 1000)
    """
    
    # 1. OBTENER ADAPTADOR DE IA
    try:
        ai_adapter = AIAdapterFactory.create_adapter()
    except ValueError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error de configuración de IA: {str(e)}"
        )
    
    # 2. CONSTRUIR CONTEXTO FINANCIERO (si se solicita)
    contexto = None
    if request.contexto_gastos:
        contexto = construir_contexto_financiero(
            db, 
            usuario_actual.id_usuario
        )
    
    # 3. PREPARAR MENSAJES
    mensajes = [
        ChatMessage(
            role="user",
            content=request.mensaje
        )
    ]
    
    # Si hay conversación previa, cargar historial
    if request.conversacion_id:
        historial = obtener_historial_conversacion(
            db, 
            request.conversacion_id
        )
        mensajes = historial + mensajes
    
    # 4. GENERAR RESPUESTA CON IA
    try:
        respuesta = await ai_adapter.generar_respuesta(
            mensajes=mensajes,
            contexto_adicional=contexto,
            temperatura=request.temperatura,
            max_tokens=request.max_tokens
        )
    except Exception as e:
        logger.error(f"Error al generar respuesta: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error al comunicarse con el servicio de IA"
        )
    
    # 5. GUARDAR EN BASE DE DATOS
    guardar_mensaje(
        db,
        usuario_actual.id_usuario,
        request.mensaje,
        respuesta,
        request.conversacion_id
    )
    
    # 6. GENERAR SUGERENCIAS
    sugerencias = generar_sugerencias_contexto(db, usuario_actual.id_usuario)
    
    return ChatMensajeResponse(
        respuesta=respuesta,
        conversacion_id=request.conversacion_id or generar_nuevo_id(),
        sugerencias=sugerencias
    )
```

---

## 📊 Construcción del Contexto Financiero

### **Función `construir_contexto_financiero`** (en `chat.py`)

Esta función consulta la base de datos y construye un texto con los datos del usuario:

```python
def construir_contexto_financiero(
    db: Session, 
    id_usuario: int
) -> str:
    """
    Construye un contexto con los datos financieros del usuario.
    Este texto se pasa como mensaje 'system' a la IA.
    """
    
    # === CONSULTAR DATOS DEL MES ACTUAL ===
    mes_actual = datetime.now().month
    anio_actual = datetime.now().year
    
    # Gastos del mes
    gastos_mes = db.query(Gasto).filter(
        Gasto.id_usuario == id_usuario,
        extract('month', Gasto.fecha) == mes_actual,
        extract('year', Gasto.fecha) == anio_actual,
        Gasto.estado == 'confirmado'
    ).all()
    
    # Ingresos del mes
    ingresos_mes = db.query(Ingreso).filter(
        Ingreso.id_usuario == id_usuario,
        extract('month', Ingreso.fecha) == mes_actual,
        extract('year', Ingreso.fecha) == anio_actual,
        Ingreso.estado == 'confirmado'
    ).all()
    
    # Presupuestos activos
    presupuestos = db.query(Presupuesto).filter(
        Presupuesto.id_usuario == id_usuario,
        Presupuesto.activo == True
    ).all()
    
    # Objetivos financieros
    objetivos = db.query(ObjetivoFinanciero).filter(
        ObjetivoFinanciero.id_usuario == id_usuario,
        ObjetivoFinanciero.estado == 'en_progreso'
    ).all()
    
    # === CALCULAR TOTALES Y ESTADÍSTICAS ===
    total_gastos = sum(float(g.monto) for g in gastos_mes)
    total_ingresos = sum(float(i.monto) for i in ingresos_mes)
    balance = total_ingresos - total_gastos
    
    # Gastos por categoría
    gastos_por_categoria = {}
    for gasto in gastos_mes:
        cat_nombre = gasto.categoria.nombre
        gastos_por_categoria[cat_nombre] = (
            gastos_por_categoria.get(cat_nombre, 0) + float(gasto.monto)
        )
    
    # Ordenar categorías por gasto
    categorias_ordenadas = sorted(
        gastos_por_categoria.items(),
        key=lambda x: x[1],
        reverse=True
    )
    
    # === FORMATEAR CONTEXTO COMO TEXTO ===
    contexto = f"""
DATOS FINANCIEROS DEL USUARIO - {datetime.now().strftime('%B %Y')}

═══════════════════════════════════════════════════════════
RESUMEN GENERAL
═══════════════════════════════════════════════════════════
• Total de Ingresos: ${total_ingresos:,.2f} ARS
• Total de Gastos: ${total_gastos:,.2f} ARS
• Balance: ${balance:,.2f} ARS {"✅ (Positivo)" if balance >= 0 else "⚠️ (Negativo)"}
• Cantidad de transacciones: {len(gastos_mes)} gastos, {len(ingresos_mes)} ingresos

═══════════════════════════════════════════════════════════
DISTRIBUCIÓN DE GASTOS POR CATEGORÍA
═══════════════════════════════════════════════════════════
"""
    
    # Agregar gastos por categoría
    for i, (categoria, monto) in enumerate(categorias_ordenadas[:5], 1):
        porcentaje = (monto / total_gastos * 100) if total_gastos > 0 else 0
        contexto += f"{i}. {categoria}: ${monto:,.2f} ({porcentaje:.1f}%)\n"
    
    # Agregar presupuestos
    if presupuestos:
        contexto += "\n═══════════════════════════════════════════════════════════\n"
        contexto += "PRESUPUESTOS ACTIVOS\n"
        contexto += "═══════════════════════════════════════════════════════════\n"
        
        for presupuesto in presupuestos:
            gasto_categoria = gastos_por_categoria.get(
                presupuesto.categoria.nombre, 
                0
            )
            porcentaje_usado = (
                gasto_categoria / float(presupuesto.monto_limite) * 100
            )
            
            estado_emoji = "✅" if porcentaje_usado < 80 else "⚠️" if porcentaje_usado < 100 else "🚨"
            
            contexto += (
                f"{estado_emoji} {presupuesto.nombre}: "
                f"${gasto_categoria:,.2f} / ${presupuesto.monto_limite:,.2f} "
                f"({porcentaje_usado:.1f}% usado)\n"
            )
    
    # Agregar objetivos
    if objetivos:
        contexto += "\n═══════════════════════════════════════════════════════════\n"
        contexto += "OBJETIVOS FINANCIEROS\n"
        contexto += "═══════════════════════════════════════════════════════════\n"
        
        for objetivo in objetivos:
            contexto += f"• {objetivo.descripcion}: ${objetivo.monto:,.2f}\n"
    
    # Instrucciones para la IA
    contexto += """
═══════════════════════════════════════════════════════════
INSTRUCCIONES PARA LA IA
═══════════════════════════════════════════════════════════
- Responde SIEMPRE en español (Argentina)
- Usa los datos anteriores para dar respuestas precisas
- Si el usuario pregunta por gastos/ingresos, usa los números exactos
- Si notas patrones preocupantes, menciónalos
- Sé conciso pero informativo (máximo 3-4 párrafos)
- Usa formato Markdown para mejor legibilidad
- Si no hay suficiente información, sugiere registrar más datos
- NUNCA inventes números, usa solo los datos proporcionados
"""
    
    return contexto
```

### **Ejemplo de Contexto Generado**

```
DATOS FINANCIEROS DEL USUARIO - Noviembre 2025

═══════════════════════════════════════════════════════════
RESUMEN GENERAL
═══════════════════════════════════════════════════════════
• Total de Ingresos: $850,000.00 ARS
• Total de Gastos: $45,230.75 ARS
• Balance: $804,769.25 ARS ✅ (Positivo)
• Cantidad de transacciones: 11 gastos, 4 ingresos

═══════════════════════════════════════════════════════════
DISTRIBUCIÓN DE GASTOS POR CATEGORÍA
═══════════════════════════════════════════════════════════
1. Comida: $28,546.25 (63.1%)
2. Entretenimiento: $3,500.00 (7.7%)
3. Transporte: $950.00 (2.1%)
4. Vivienda: $12,234.50 (27.1%)

═══════════════════════════════════════════════════════════
PRESUPUESTOS ACTIVOS
═══════════════════════════════════════════════════════════
✅ Presupuesto mensual de Supermercado: $28,546.25 / $80,000.00 (35.7% usado)

═══════════════════════════════════════════════════════════
OBJETIVOS FINANCIEROS
═══════════════════════════════════════════════════════════
• Ahorrar para vacaciones de verano: $250,000.00

═══════════════════════════════════════════════════════════
INSTRUCCIONES PARA LA IA
═══════════════════════════════════════════════════════════
- Responde SIEMPRE en español (Argentina)
- Usa los datos anteriores para dar respuestas precisas
...
```

---

## 🎯 Para Qué se Usa la IA

La IA se utiliza para proporcionar **4 tipos de funcionalidades**:

### **1. Consultas sobre Datos Financieros**

**Ejemplo:**
- **Usuario:** "¿Cuánto gasté en comida este mes?"
- **IA (con contexto):** "Este mes has gastado **$28,546.25** en la categoría Comida, lo que representa el **63.1%** de tus gastos totales. Es el mayor rubro de gasto este mes."

### **2. Análisis y Recomendaciones**

**Ejemplo:**
- **Usuario:** "¿Cómo voy con mi presupuesto?"
- **IA (con contexto):** "Tu presupuesto de supermercado está en buen estado: has usado solo el **35.7%** ($28,546 de $80,000). Al ritmo actual, llegarías a fin de mes muy por debajo del límite. ¡Buen trabajo! 🎉"

### **3. Detección de Patrones**

**Ejemplo:**
- **Usuario:** "Analiza mis gastos"
- **IA (con contexto):** "Noto que el **63%** de tus gastos se concentra en Comida. Aunque estás dentro del presupuesto, podrías considerar reducir un 10-15% en este rubro para acelerar tu objetivo de ahorro para vacaciones."

### **4. Conversación General Financiera**

**Ejemplo:**
- **Usuario:** "Dame consejos para ahorrar"
- **IA (sin contexto):** "Aquí hay 5 estrategias efectivas: 1) Regla 50/30/20... 2) Automatiza tus ahorros... 3) Elimina gastos hormiga..."

---

## 🔄 Flujo Completo con Diagrama

```
┌─────────────────────────────────────────────────────────┐
│  1. USUARIO ENVÍA MENSAJE                               │
│  POST /api/chat/mensaje                                 │
│  {                                                       │
│    "mensaje": "¿Cuánto gasté en comida?",              │
│    "contexto_gastos": true                              │
│  }                                                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  2. BACKEND VALIDA AUTENTICACIÓN                        │
│  - JWT token válido                                     │
│  - Usuario autenticado                                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  3. CONSTRUIR CONTEXTO FINANCIERO                       │
│  - Query DB: gastos del mes                             │
│  - Query DB: ingresos del mes                           │
│  - Query DB: presupuestos activos                       │
│  - Query DB: objetivos financieros                      │
│  - Calcular totales y porcentajes                       │
│  - Formatear como texto estructurado                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  4. OBTENER ADAPTADOR DE IA                             │
│  AIAdapterFactory.create_adapter()                      │
│                                                          │
│  IF USE_AZURE_OPENAI == true:                           │
│    → return AzureOpenAIAdapter(...)                     │
│  ELSE:                                                   │
│    → return OpenAIAdapter(...)                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  5. PREPARAR MENSAJES                                   │
│  messages = [                                            │
│    {                                                     │
│      "role": "system",                                   │
│      "content": "<contexto_financiero>"                  │
│    },                                                    │
│    {                                                     │
│      "role": "user",                                     │
│      "content": "¿Cuánto gasté en comida?"             │
│    }                                                     │
│  ]                                                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  6. LLAMAR A LA API EXTERNA                             │
│                                                          │
│  Azure OpenAI:                                           │
│  POST https://{endpoint}/openai/deployments/...         │
│  Header: api-key: xxxxx                                 │
│                                                          │
│  OpenAI:                                                 │
│  POST https://api.openai.com/v1/chat/completions        │
│  Header: Authorization: Bearer xxxxx                    │
│                                                          │
│  Body: { "messages": [...], "temperature": 0.7, ... }   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  7. RECIBIR RESPUESTA DE GPT-4                          │
│  "Este mes has gastado $28,546.25 en Comida,           │
│   que representa el 63.1% de tus gastos totales..."    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  8. GUARDAR EN BASE DE DATOS                            │
│  - INSERT INTO chats (mensaje_usuario, respuesta_ia)   │
│  - INSERT INTO sesiones_chat (si es nueva)             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  9. GENERAR SUGERENCIAS                                 │
│  - "Ver gastos del mes"                                 │
│  - "Analizar presupuesto"                               │
│  - "Comparar con mes anterior"                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  10. RESPUESTA AL FRONTEND                              │
│  {                                                       │
│    "respuesta": "Este mes has gastado...",              │
│    "conversacion_id": "abc123",                         │
│    "sugerencias": [...]                                 │
│  }                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Seguridad y Buenas Prácticas

### **1. Gestión de API Keys**

```python
# ✅ CORRECTO: API keys en variables de entorno
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# ❌ INCORRECTO: Hardcodear keys (nunca hacer esto)
OPENAI_API_KEY = "sk-proj-xxxxxxxxxxxxx"
```

### **2. Validación de Entrada**

```python
# Validar longitud del mensaje
if len(request.mensaje) > 2000:
    raise HTTPException(
        status_code=400,
        detail="El mensaje es demasiado largo (máximo 2000 caracteres)"
    )

# Validar temperatura
if not 0 <= request.temperatura <= 1:
    raise HTTPException(
        status_code=400,
        detail="La temperatura debe estar entre 0 y 1"
    )
```

### **3. Manejo de Errores**

```python
try:
    respuesta = await ai_adapter.generar_respuesta(...)
except httpx.TimeoutException:
    raise HTTPException(
        status_code=504,
        detail="Timeout al comunicarse con el servicio de IA"
    )
except httpx.HTTPStatusError as e:
    if e.response.status_code == 429:
        raise HTTPException(
            status_code=429,
            detail="Límite de rate de API alcanzado"
        )
    raise HTTPException(
        status_code=502,
        detail=f"Error en servicio de IA: {e.response.status_code}"
    )
except Exception as e:
    logger.error(f"Error inesperado: {e}")
    raise HTTPException(
        status_code=500,
        detail="Error interno del servidor"
    )
```

### **4. Rate Limiting y Costos**

```python
# Limitar tokens para controlar costos
MAX_TOKENS_DEFAULT = 1000
MAX_TOKENS_LIMIT = 2000

if request.max_tokens > MAX_TOKENS_LIMIT:
    request.max_tokens = MAX_TOKENS_LIMIT

# Limitar contexto para no exceder límites de API
def truncar_contexto(contexto: str, max_chars: int = 4000) -> str:
    if len(contexto) <= max_chars:
        return contexto
    return contexto[:max_chars] + "\n\n[...contexto truncado...]"
```

---

## 📈 Ventajas del Diseño Implementado

| Ventaja | Descripción |
|---------|-------------|
| **🔄 Flexibilidad** | Cambiar entre Azure y OpenAI solo requiere cambiar variables de entorno |
| **🧪 Testabilidad** | El patrón Adapter permite crear mocks para tests sin tocar la API real |
| **💰 Control de Costos** | Límites de tokens y validaciones previenen gastos excesivos |
| **🎯 Personalización** | El contexto se construye dinámicamente con datos reales del usuario |
| **📊 Escalabilidad** | Arquitectura preparada para agregar más proveedores (Google Gemini, etc.) |
| **🔒 Seguridad** | Separación de concerns: solo el endpoint tiene acceso a datos sensibles |

---

## 📝 Resumen Técnico

### **Conexión con IA**
- **Proveedores:** Azure OpenAI Service o OpenAI API
- **Modelos:** GPT-4, GPT-3.5-turbo
- **Autenticación:** API Key (Azure usa `api-key`, OpenAI usa `Bearer token`)
- **Endpoint:** POST a `/chat/completions` con JSON payload

### **Uso de la IA**
- **Propósito:** Asistente financiero conversacional
- **Funciones:** Consultas, análisis, recomendaciones, detección de patrones
- **Personalización:** Contexto dinámico con datos financieros del usuario

### **Paso de Contexto**
- **Método:** Mensaje con rol `system` (o reforzado en primer mensaje `user` para Azure)
- **Contenido:** Resumen de gastos, ingresos, presupuestos, objetivos
- **Construcción:** Query a PostgreSQL → cálculos → formateo como texto
- **Control:** Parámetro `contexto_gastos` en el request (true/false)

### **Arquitectura**
- **Patrón Factory:** Selecciona el adaptador correcto
- **Patrón Adapter:** Abstrae diferencias entre proveedores
- **Separación de Concerns:** API endpoint → Adaptador → Servicio externo

---

## 🎓 Conclusión Académica

La implementación de IA en el backend sigue principios de **arquitectura limpia** y **diseño orientado a objetos**, utilizando patrones de diseño establecidos (Factory, Adapter) que facilitan el mantenimiento y la extensibilidad del sistema. La separación entre la lógica de negocio y la integración con servicios externos permite una alta testabilidad y flexibilidad para adaptarse a cambios futuros en los proveedores de IA, sin comprometer la estabilidad del sistema principal.

El uso de contexto dinámico basado en datos reales del usuario permite ofrecer recomendaciones personalizadas y precisas, transformando un modelo de lenguaje genérico en un asistente financiero especializado que comprende la situación financiera específica de cada usuario.
