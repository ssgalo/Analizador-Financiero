# 🚀 Configuración de Embeddings con Google Gemini

## ✅ VENTAJAS DE USAR GEMINI

- ✅ **GRATIS** (1,500 requests/día en tier gratuito)
- ✅ **Sin problemas de región** (funciona globalmente)
- ✅ **Fácil de configurar** (solo API key)
- ✅ **Buena calidad** (768 dimensiones suficientes para tu caso)
- ⚠️ **Requiere ajustar pgvector** (de 1536 a 768 dimensiones)

---

## 📋 PASO 1: OBTENER API KEY

### 1.1 Ir a Google AI Studio
```
URL: https://aistudio.google.com/app/apikey
```

### 1.2 Crear API Key
1. Click **"Get API key"** o **"Create API key"**
2. Selecciona un proyecto de Google Cloud
   - O click **"Create API key in new project"**
3. Copia la API key (formato: `AIzaSy...`)
4. ⚠️ **Guárdala en lugar seguro**

---

## 📋 PASO 2: ACTUALIZAR `.env`

Agregá estas líneas al archivo `.env`:

```bash
# ============================================================================
# GEMINI - EMBEDDINGS
# ============================================================================
EMBEDDING_PROVIDER=gemini
GEMINI_API_KEY=AIzaSy_TU_API_KEY_AQUI
```

**Dejá las variables de Azure OpenAI** (se siguen usando para el chat):
```bash
AI_PROVIDER=azure
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=...
AZURE_OPENAI_DEPLOYMENT=gpt-4-deployment  # Para chat
```

---

## 📋 PASO 3: INSTALAR DEPENDENCIA

Agregá al `requirements.txt`:

```bash
google-generativeai==0.3.2
```

O instala directamente en el contenedor:

```bash
docker exec analizador-backend pip install google-generativeai==0.3.2
```

---

## 📋 PASO 4: AJUSTAR DIMENSIONES EN PGVECTOR

### Opción A: Recrear Tablas (RECOMENDADO si no tenés datos)

```bash
docker exec analizador-postgres psql -U unlam -d analizador_financiero << EOF
-- Eliminar tablas viejas
DROP TABLE IF EXISTS gastos_embeddings CASCADE;
DROP TABLE IF EXISTS ingresos_embeddings CASCADE;

-- Recrear con 768 dimensiones
CREATE TABLE gastos_embeddings (
    id SERIAL PRIMARY KEY,
    gasto_id INTEGER NOT NULL UNIQUE REFERENCES gastos(id_gasto) ON DELETE CASCADE,
    embedding vector(768) NOT NULL,  -- 768 dimensiones (Gemini)
    texto_original TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ingresos_embeddings (
    id SERIAL PRIMARY KEY,
    ingreso_id INTEGER NOT NULL UNIQUE REFERENCES ingresos(id_ingreso) ON DELETE CASCADE,
    embedding vector(768) NOT NULL,  -- 768 dimensiones (Gemini)
    texto_original TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_gastos_embeddings_gasto_id ON gastos_embeddings(gasto_id);
CREATE INDEX idx_gastos_embeddings_metadata ON gastos_embeddings USING gin(metadata);
CREATE INDEX idx_ingresos_embeddings_ingreso_id ON ingresos_embeddings(ingreso_id);
CREATE INDEX idx_ingresos_embeddings_metadata ON ingresos_embeddings USING gin(metadata);

-- Índices vectoriales (crear después de tener datos)
-- CREATE INDEX idx_gastos_embeddings_vector ON gastos_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- CREATE INDEX idx_ingresos_embeddings_vector ON ingresos_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
EOF
```

### Opción B: Script Automático

```bash
cd backend
docker exec analizador-postgres psql -U unlam -d analizador_financiero -f /docker-entrypoint-initdb.d/recreate_embeddings_768.sql
```

---

## 📋 PASO 5: ACTUALIZAR MODELOS SQLALCHEMY

Ya está actualizado el `embeddings_service.py`, pero necesitás actualizar `models/embeddings.py`:

**Cambio necesario:**
```python
# DE:
embedding = Column(Vector(1536), nullable=False)  # Azure OpenAI

# A:
embedding = Column(Vector(768), nullable=False)   # Gemini
```

O mejor, hazlo dinámico:

```python
import os

EMBEDDING_DIMENSIONS = int(os.getenv("EMBEDDING_DIMENSIONS", "768"))

class GastoEmbedding(Base):
    # ...
    embedding = Column(Vector(EMBEDDING_DIMENSIONS), nullable=False)
```

---

## 📋 PASO 6: REINICIAR DOCKER

```bash
docker-compose down
docker-compose up -d
```

---

## 📋 PASO 7: PROBAR CONEXIÓN

```bash
docker exec analizador-backend python << EOF
import os
os.environ['EMBEDDING_PROVIDER'] = 'gemini'
os.environ['GEMINI_API_KEY'] = 'TU_API_KEY'

from app.services.embeddings_service import EmbeddingsService

service = EmbeddingsService()
embedding = service.generate_embedding("Test de embedding con Gemini")

if embedding:
    print(f"✅ Embedding generado: {len(embedding)} dimensiones")
    print(f"Primeros 5 valores: {embedding[:5]}")
else:
    print("❌ Error generando embedding")
EOF
```

---

## 📋 PASO 8: MIGRAR DATOS EXISTENTES

```bash
cd backend
./scripts/migrar_embeddings.sh
```

Deberías ver:

```
[1/9] Procesando gasto #1... ✅
[2/9] Procesando gasto #2... ✅
...
✅ Migración completada exitosamente!
```

---

## 🔍 VERIFICACIÓN

### Verificar embeddings en BD:

```bash
docker exec analizador-postgres psql -U unlam -d analizador_financiero -c "
SELECT 
    COUNT(*) as total,
    AVG(array_length(embedding::float[], 1)) as avg_dimensions
FROM gastos_embeddings;
"
```

Deberías ver:
```
 total | avg_dimensions 
-------+----------------
     9 |            768
```

---

## 🆚 COMPARACIÓN: AZURE vs GEMINI

| Feature | Azure OpenAI | Google Gemini |
|---------|--------------|---------------|
| **Costo** | $0.02 / 1M tokens | **GRATIS** (1500/día) |
| **Dimensiones** | 1536 | 768 |
| **Calidad** | Excelente | Muy buena |
| **Velocidad** | Rápido | Muy rápido |
| **Límites** | Según tier | 1500 req/día (free) |
| **Restricciones** | Por región | Globales ✅ |
| **Setup** | Deployment complejo | Solo API key ✅ |

---

## 💡 RECOMENDACIÓN

Para tu caso de uso (26 registros existentes + crecimiento gradual):

✅ **USA GEMINI**
- Gratis y suficiente
- Más fácil de configurar
- 768 dimensiones son perfectas para tu escala

Más adelante, si crecés mucho o necesitás mejor rendimiento, podés migrar a Azure OpenAI.

---

## 🆘 TROUBLESHOOTING

### Error: "API key not valid"
```bash
# Verificar que la API key esté bien configurada
docker exec analizador-backend env | grep GEMINI_API_KEY
```

### Error: "Module google.generativeai not found"
```bash
# Instalar dependencia
docker exec analizador-backend pip install google-generativeai==0.3.2
```

### Error: "Dimension mismatch"
```bash
# Recrear tablas con 768 dimensiones (ver Paso 4)
```

---

## ✅ CHECKLIST FINAL

- [ ] Obtener API key de Google AI Studio
- [ ] Agregar `EMBEDDING_PROVIDER=gemini` y `GEMINI_API_KEY` al `.env`
- [ ] Instalar `google-generativeai` en requirements.txt
- [ ] Recrear tablas de embeddings con 768 dimensiones
- [ ] Reiniciar Docker
- [ ] Probar conexión con Gemini
- [ ] Ejecutar migración de datos existentes
- [ ] Verificar embeddings en BD
- [ ] Probar chat con búsqueda semántica

---

¡Listo! Ahora tu sistema usa Gemini para embeddings (gratis) y Azure OpenAI para chat. 🚀
