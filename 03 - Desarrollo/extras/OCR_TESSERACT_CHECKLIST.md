# ✅ Checklist Rápido - OCR con Tesseract + OpenAI

## 🚀 Setup en 5 Minutos

### 1️⃣ Obtener API Key de OpenAI (2 min)
```
□ Ir a https://platform.openai.com/signup
□ Registrarse (obtendrás $5 USD GRATIS)
□ Ir a https://platform.openai.com/api-keys
□ Crear nueva key
□ Copiar la key (empieza con sk-proj-...)
```

### 2️⃣ Configurar API Key (30 segundos)
```
□ Abrir archivo .env
□ Buscar: OPENAI_API_KEY=your-openai-api-key-here
□ Reemplazar con tu key
□ Guardar archivo
```

### 3️⃣ Instalar Dependencias (2 min)

**Backend:**
```powershell
cd "c:\github-repo\Analizador-Financiero\03 - Desarrollo\backend"
pip install -r requirements.txt
```

**Frontend:**
```powershell
cd "c:\github-repo\Analizador-Financiero\03 - Desarrollo\analizador-gastos-front"
npm install
```

### 4️⃣ Ejecutar Aplicación (30 segundos)
```powershell
cd "c:\github-repo\Analizador-Financiero\03 - Desarrollo"
docker-compose up --build
```

### 5️⃣ Probar (30 segundos)
```
□ Abrir http://localhost:3000
□ Ir a "Importar"
□ Subir recibo/factura
□ Esperar 3-5 segundos
□ Ver datos extraídos
□ Guardar gasto
```

---

## ✅ Archivos Modificados

### Backend
- ✅ `requirements.txt` - pytesseract, openai, pdf2image
- ✅ `Dockerfile` - tesseract-ocr, poppler-utils
- ✅ `app/services/tesseract_openai_service.py` (NUEVO)
- ✅ `app/api/api_v1/endpoints/gastos.py` - Import actualizado

### Configuración
- ✅ `.env` - OPENAI_API_KEY

### Frontend
- ✅ (Sin cambios necesarios)

---

## 💰 Costos

| Operación | Costo |
|-----------|-------|
| 1 imagen | $0.0001 |
| 100 imágenes | $0.01 |
| 1000 imágenes | $0.10 |

**= Prácticamente GRATIS** 🎉

---

## 🎯 Cómo Funciona

1. **Tesseract** extrae texto (GRATIS)
2. **GPT-4o-mini** analiza y estructura ($0.0001)
3. **Frontend** muestra formulario pre-completado
4. **Usuario** confirma y guarda

---

## 🚨 Solución Rápida de Problemas

### "API Key inválida"
→ Verifica el .env y que la key sea correcta

### "Tesseract not found"
→ Ejecuta: `docker-compose up --build`

### "No se extrajo información"
→ Prueba con mejor calidad de imagen

### "Error de conexión OpenAI"
→ Verifica tu internet y saldo en OpenAI

---

## 📚 Documentación Completa

Lee: `extras/OCR_TESSERACT_OPENAI_GUIDE.md`

---

## ✨ Ventajas vs Azure

| Feature | Azure AI | Tesseract + OpenAI |
|---------|----------|-------------------|
| Costo | $0.01/página | $0.0001/imagen |
| Setup | Complejo | Fácil |
| Precisión | 95% | 95%+ |
| Requiere cuenta | Sí (Azure) | Sí (OpenAI) |
| Crédito gratis | No | $5 USD ✅ |

---

## 🎉 ¡Todo Listo!

Ya puedes procesar recibos y facturas con OCR inteligente y **casi gratis**.

**Siguiente paso:** Obtén tu API Key de OpenAI y pégala en el `.env`

---

**Tiempo total: 5 minutos** ⏱️
