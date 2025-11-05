# Cambios en Funcionalidad OCR - Noviembre 2025

## 📋 Resumen de Cambios

### 1. **Corrección del Error 422**

**Problema identificado:**
- El formulario intentaba hacer `PUT /api/v1/gastos/undefined` en lugar de `POST /api/v1/gastos/`
- Esto ocurría porque se usaba `setGastoEditar()` para pasar datos del OCR, lo que hacía que el formulario detectara modo "edición"
- El frontend enviaba campos que el backend no esperaba:
  - `id_usuario` en el body (debe venir del token JWT)
  - Faltaba el campo `moneda`
  - El valor de `fuente` era `'imagen'` pero la BD solo acepta: `'manual'`, `'importado'`, `'integracion'`

**Solución implementada:**
- ✅ Creada nueva prop `datosIniciales` en `FormularioGasto` para datos de OCR (sin activar modo edición)
- ✅ Eliminado `id_usuario` del `GastoCreate` (el backend lo toma del token)
- ✅ Agregado campo `moneda: 'ARS'` por defecto
- ✅ Cambiado valor de `fuente` de `'imagen'` a `'importado'`
- ✅ Actualizado tipo TypeScript de `fuente` para coincidir con la BD

### 2. **Descripción y Comercio Vacíos**

**Cambio solicitado:**
El usuario debe completar manualmente los campos `descripcion` y `comercio`, ya que el OCR no puede extraerlos con suficiente calidad.

**Implementación:**

#### Backend (`tesseract_openai_service.py`):
```python
# Antes:
3. CONCEPTO: Describe QUÉ se compró de forma clara y útil...
4. COMERCIO: El nombre EXACTO del comercio...

# Ahora:
3. CONCEPTO: DEJAR VACÍO (""). El usuario completará este campo manualmente.
4. COMERCIO: DEJAR VACÍO (""). El usuario completará este campo manualmente.
```

#### Frontend (`GastosPage.tsx`):
```typescript
const datosOCR = {
  fecha: importedData.fecha || new Date().toISOString().split('T')[0],
  monto: importedData.monto?.toString() || '',
  descripcion: '', // ✅ Vacío - usuario lo completa
  comercio: '', // ✅ Vacío - usuario lo completa
  id_categoria: importedData.categoria_sugerida?.toString() || '',
  fuente: 'importado' // ✅ Valor correcto para la BD
};
```

### 3. **Campo `fuente` en la Base de Datos**

**Pregunta:** ¿Con qué valor se completa la columna `fuente` al cargar un gasto usando OCR?

**Respuesta:** El campo `fuente` en la tabla `gastos` tiene una restricción CHECK:

```sql
fuente IN ('manual', 'importado', 'integracion')
```

**Valores según origen:**
- `'manual'` → Gastos ingresados manualmente por el usuario
- `'importado'` → **Gastos cargados mediante OCR** ✅
- `'integracion'` → Gastos importados desde integraciones externas (MercadoPago, bancos, etc.)

**Implementación actual:**
Cuando un gasto proviene del OCR, el campo `fuente` se establece en `'importado'`.

### 4. **Información Requerida para Crear un Gasto**

#### Campos en el Request Body (`GastoCreate`):

**Campos obligatorios:**
- ✅ `fecha` (string, formato: "YYYY-MM-DD")
- ✅ `monto` (number)
- ✅ `descripcion` (string)

**Campos opcionales:**
- `comercio` (string, opcional)
- `id_categoria` (number, opcional - puede ser null)
- `fuente` (string: 'manual' | 'importado' | 'integracion', default: 'manual')
- `moneda` (string, default: 'ARS')

#### Información que NO va en el request (se completa automáticamente):

**Información del backend:**
- ❌ `id_usuario` → Se obtiene del token JWT (campo `current_user` en el endpoint)
- ❌ `id_gasto` → Generado automáticamente por la BD (autoincrement)
- ❌ `fecha_creacion` → Generado por la BD con `server_default=func.now()`
- ❌ `fecha_modificacion` → Se completa en UPDATE, no en CREATE
- ❌ `estado` → Default: 'confirmado' (establecido por el endpoint si no se proporciona)

**Campos especiales (calculados por IA):**
- ❌ `categoria_ia_sugerida` → Calculado por el servicio OCR/GPT (opcional)
- ❌ `confianza_ia` → Nivel de confianza del OCR (opcional)
- ❌ `id_archivo_importado` → Referencia al archivo fuente (opcional, para trazabilidad)

#### Ejemplo de Request Body para crear gasto con OCR:

```json
{
  "fecha": "2025-11-04",
  "monto": 15750.50,
  "descripcion": "Compra de alimentos en supermercado",
  "comercio": "Carrefour Express",
  "id_categoria": 1,
  "fuente": "importado",
  "moneda": "ARS"
}
```

## 📊 Modelo de Base de Datos

```sql
CREATE TABLE gastos (
    id_gasto SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,                    -- Del token JWT
    id_categoria INTEGER NOT NULL,                  -- Del request o default
    id_archivo_importado INTEGER NULL,              -- Opcional
    fecha DATE NOT NULL,                            -- Del request
    monto NUMERIC(18, 2) NOT NULL,                  -- Del request
    descripcion VARCHAR(255) NULL,                  -- Del request
    comercio VARCHAR(100) NULL,                     -- Del request (opcional)
    fuente VARCHAR(20) CHECK (fuente IN ('manual', 'importado', 'integracion')),
    estado VARCHAR(20) CHECK (estado IN ('confirmado', 'pendiente', 'eliminado')),
    fecha_creacion TIMESTAMP DEFAULT NOW(),         -- Automático
    fecha_modificacion TIMESTAMP NULL,              -- Automático en UPDATE
    categoria_ia_sugerida VARCHAR(100) NULL,        -- Del OCR (opcional)
    confianza_ia NUMERIC(5, 4) NULL,                -- Del OCR (opcional)
    moneda VARCHAR(3) DEFAULT 'ARS',                -- Del request o default
    
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria),
    FOREIGN KEY (id_archivo_importado) REFERENCES archivos_importados(id_archivo_importado),
    FOREIGN KEY (moneda) REFERENCES monedas(codigo_moneda)
);
```

## 🔄 Flujo Completo de OCR

1. **Usuario sube imagen/PDF** → `ImportFileModal.tsx`
2. **Backend procesa con Tesseract** → Extrae texto
3. **GPT-4o-mini analiza** → Devuelve:
   - `fecha`
   - `monto`
   - `concepto` (vacío)
   - `comercio` (vacío)
   - `categoria_sugerida`
   - `moneda_codigo`
   - `confianza`
4. **Frontend navega a gastos** → Con datos en `location.state.importedData`
5. **GastosPage detecta datos** → Crea `datosIniciales`
6. **FormularioGasto abre** → Pre-llena fecha, monto y categoría
7. **Usuario completa** → Descripción y comercio manualmente
8. **Submit** → POST a `/api/v1/gastos/` con:
   ```json
   {
     "fecha": "2025-11-04",
     "monto": 15750.50,
     "descripcion": "[completado por usuario]",
     "comercio": "[completado por usuario]",
     "id_categoria": 1,
     "fuente": "importado",
     "moneda": "ARS"
   }
   ```
9. **Backend valida** → Verifica moneda, agrega `id_usuario` del token
10. **Éxito** → Gasto creado con `fuente='importado'`

## 📁 Archivos Modificados

### Backend:
- `backend/app/services/tesseract_openai_service.py` → Prompt modificado para devolver concepto y comercio vacíos

### Frontend:
- `analizador-gastos-front/src/services/api.ts` → Tipos actualizados:
  - `GastoCreate`: Removido `id_usuario`, agregado `moneda`, actualizado `fuente`
  - `GastoUpdate`: Removido `fuente`, agregado `estado`
  
- `analizador-gastos-front/src/components/forms/FormularioGasto.tsx`:
  - Agregada prop `datosIniciales`
  - Agregado estado `fuenteOrigen`
  - Modificado `useEffect` para manejar datos iniciales sin activar modo edición
  - Actualizado lógica de submit para usar `fuenteOrigen`
  
- `analizador-gastos-front/src/pages/GastosPage.tsx`:
  - Agregado estado `datosIniciales`
  - Modificado `useEffect` para crear datos iniciales en lugar de `gastoEditar`
  - Actualizado `cerrarFormulario` para limpiar `datosIniciales`
  - Pasado `datosIniciales` a `FormularioGasto`

## ✅ Resultado Final

**Antes:**
- ❌ Error 422 al intentar guardar
- ❌ Campo `fuente` con valor incorrecto (`'imagen'`)
- ❌ Enviaba `id_usuario` en el body
- ❌ Faltaba campo `moneda`
- ❌ Descripción y comercio con calidad pobre del OCR

**Ahora:**
- ✅ Gasto se crea correctamente
- ✅ Campo `fuente` con valor `'importado'`
- ✅ `id_usuario` viene del token JWT
- ✅ Campo `moneda` con default `'ARS'`
- ✅ Usuario completa descripción y comercio manualmente
- ✅ Flujo OCR → Formulario → Guardado funciona completamente

## 🧪 Cómo Probar

1. Accede a http://localhost:80
2. Ve a "Importar Gastos"
3. Sube una imagen de un ticket/recibo
4. Espera a que procese
5. El formulario se abrirá con:
   - ✅ Fecha prellenada
   - ✅ Monto prellenado
   - ✅ Categoría sugerida seleccionada
   - ⚠️ Descripción vacía (completar)
   - ⚠️ Comercio vacío (completar)
6. Completa descripción y comercio
7. Haz clic en "Guardar"
8. ✅ El gasto se guardará con `fuente='importado'`

## 📝 Notas Adicionales

- El costo de procesamiento con GPT-4o-mini es aproximadamente $0.0001 por imagen
- La columna `fuente` permite filtrar gastos por origen
- Para futuras integraciones (MercadoPago, bancos), usar `fuente='integracion'`
- El campo `id_archivo_importado` permite trazabilidad pero actualmente es opcional
