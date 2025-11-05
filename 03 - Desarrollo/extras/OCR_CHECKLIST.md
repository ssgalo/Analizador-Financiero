# ✅ Checklist Rápido - Implementación OCR

## 📋 Pasos para Activar el OCR

### 1. Configuración Azure (10 minutos)
```
□ Ir a https://portal.azure.com
□ Buscar "Document Intelligence"
□ Crear recurso con Tier "Free F0" (GRATIS)
□ Copiar ENDPOINT
□ Copiar KEY 1
□ Actualizar .env con las credenciales:
  AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=tu-endpoint
  AZURE_DOCUMENT_INTELLIGENCE_KEY=tu-key
```

### 2. Instalar Dependencias (5 minutos)

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

### 3. Verificar Archivos Creados
```
□ backend/app/services/azure_ocr_service.py
□ src/components/ImportFileModal.tsx
□ src/hooks/useImportGasto.ts
□ extras/OCR_IMPLEMENTATION_GUIDE.md
```

### 4. Ejecutar Aplicación

**Con Docker:**
```powershell
cd "c:\github-repo\Analizador-Financiero\03 - Desarrollo"
docker-compose up --build
```

**Sin Docker:**
```powershell
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd analizador-gastos-front
npm run dev
```

### 5. Probar Funcionalidad
```
□ Abrir navegador en http://localhost:3000 (o el puerto configurado)
□ Login con tu usuario
□ Ir a "Importar" en el menú
□ Hacer clic en "Subir Documento"
□ Seleccionar un recibo/factura (JPG, PNG o PDF)
□ Esperar procesamiento (2-5 segundos)
□ Verificar que se extraigan los datos
□ Guardar el gasto
```

---

## 🎯 Archivos Modificados

### Backend
- ✅ `requirements.txt` - Dependencias Azure AI
- ✅ `Dockerfile` - Librería libmagic1
- ✅ `app/services/azure_ocr_service.py` - Servicio OCR (NUEVO)
- ✅ `app/api/api_v1/endpoints/gastos.py` - Endpoint import-file

### Frontend
- ✅ `package.json` - react-dropzone
- ✅ `src/components/ImportFileModal.tsx` - Modal de importación (NUEVO)
- ✅ `src/hooks/useImportGasto.ts` - Hook de importación (NUEVO)
- ✅ `src/pages/ImportarPage.tsx` - Página de importación

### Configuración
- ✅ `.env` - Credenciales Azure AI

---

## ⚠️ Problemas Conocidos

### ImportarPage.tsx Duplicado
Si ves errores en `ImportarPage.tsx`, ejecuta:
```powershell
Remove-Item "c:\github-repo\Analizador-Financiero\03 - Desarrollo\analizador-gastos-front\src\pages\ImportarPage.tsx"
# Luego copia el contenido correcto del OCR_IMPLEMENTATION_GUIDE.md
```

---

## 🎉 Listo para Usar

Una vez completados todos los pasos, podrás:
- ✅ Subir fotos de recibos
- ✅ Subir facturas en PDF
- ✅ Extraer automáticamente: fecha, monto, concepto
- ✅ Obtener sugerencia de categoría
- ✅ Crear gastos en segundos

---

## 📞 Soporte

Si algo no funciona:
1. Revisa el archivo `OCR_IMPLEMENTATION_GUIDE.md`
2. Verifica los logs de la consola
3. Asegúrate de que las credenciales de Azure estén correctas
4. Verifica que el servicio de Azure esté activo

---

**Tiempo total estimado: 15-20 minutos** ⏱️
