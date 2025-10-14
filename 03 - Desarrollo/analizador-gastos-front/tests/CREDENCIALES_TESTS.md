# 🔐 Configuración de Credenciales para Tests

## ⚠️ Acción Requerida Antes de Ejecutar Tests

Este proyecto usa **variables de entorno** para proteger las credenciales de los usuarios. Debes configurar tus propias credenciales antes de ejecutar los tests por primera vez.

---

## 🚀 Setup Rápido (3 pasos)

### 1️⃣ Copiar el archivo de ejemplo

```powershell
Copy-Item ".env.test.example" ".env.test"
```

### 2️⃣ Editar `.env.test` con tus credenciales

Abre `.env.test` y reemplaza:

```env
TEST_USER_EMAIL=tu_email@ejemplo.com
TEST_USER_PASSWORD=TuContraseñaSegura123#
```

Con tus credenciales reales:

```env
TEST_USER_EMAIL=mi_usuario@mail.com
TEST_USER_PASSWORD=MiPassword123#
```

### 3️⃣ ¡Listo! Ejecuta los tests

```powershell
npx playwright test --project=chromium --reporter=line
```

---

## 🛡️ Seguridad

### ✅ Archivos Seguros (NO se suben a GitHub)
- `.env.test` - Tus credenciales personales
- `storageState.json` - Token de sesión generado

### ✅ Archivos en el Repositorio
- `.env.test.example` - Template sin credenciales reales
- Código de los tests (sin credenciales hardcodeadas)

### ⚠️ IMPORTANTE
- **NUNCA** compartas tu archivo `.env.test`
- **NUNCA** subas credenciales al repositorio
- El archivo `.env.test` está en `.gitignore` para protegerte

---

## 🤔 ¿Qué credenciales debo usar?

### Opción 1: Usuario de Prueba (Recomendado) ⭐
1. Crea un usuario nuevo en la aplicación
2. Email: `pruebas@test.com` (o similar)
3. Úsalo solo para tests

**Ventajas:**
- ✅ No afecta tus datos personales
- ✅ Los tests pueden crear/borrar datos libremente
- ✅ Recomendado para equipos

### Opción 2: Tu Usuario Personal
Puedes usar tu usuario real, pero considera:
- ⚠️ Los tests crearán datos de prueba en tu cuenta
- ⚠️ Se crearán y eliminarán gastos/ingresos temporales
- ⚠️ No recomendado para uso productivo

---

## 🔍 ¿Cómo funcionan las credenciales?

### Proceso de Autenticación

1. **Al ejecutar tests:**
   ```
   npx playwright test
   ```

2. **Playwright carga `.env.test`:**
   ```typescript
   const email = process.env.TEST_USER_EMAIL;
   const password = process.env.TEST_USER_PASSWORD;
   ```

3. **`global-setup.ts` hace login automático:**
   - POST a `/api/v1/auth/login`
   - Obtiene token de acceso
   - Guarda en `storageState.json`

4. **Los tests usan el token:**
   - No necesitan hacer login en cada test
   - Más rápidos y eficientes

### Archivos que Usan Credenciales

| Archivo | Uso |
|---------|-----|
| `global-setup.ts` | Login inicial, genera token |
| `auth.e2e.spec.ts` | Test AUTH-007 (login manual) |
| `api.complete.spec.ts` | Tests de API que requieren autenticación |
| `dashboard.e2e.spec.ts` | DASH-005 (verifica nombre de usuario) |

---

## 🐛 Solución de Problemas

### Error: "Credenciales de prueba no configuradas"

```
⚠️  ERROR: Credenciales de prueba no configuradas.

📝 Por favor, sigue estos pasos:
1. Copia el archivo ".env.test.example" y renómbralo a ".env.test"
2. Edita ".env.test" y configura tus credenciales
```

**Solución:**
1. Verifica que exista el archivo `.env.test` en la raíz del proyecto
2. Verifica que tenga las variables `TEST_USER_EMAIL` y `TEST_USER_PASSWORD`
3. Asegúrate de que no estén vacías

---

### Error: "Authentication failed"

```
global-setup: ❌ failed to authenticate with http://localhost:8000/api/v1/auth/login
```

**Posibles causas:**
1. ❌ El backend no está corriendo
2. ❌ Las credenciales son incorrectas
3. ❌ El usuario no existe en la base de datos

**Solución:**
1. Verifica que el backend esté corriendo: http://localhost:8000/docs
2. Verifica que las credenciales en `.env.test` sean correctas
3. Intenta hacer login manualmente en la aplicación con esas credenciales
4. Si no existe, crea el usuario primero

---

### El archivo `.env.test` no se carga

**Posibles causas:**
- El archivo está en la ubicación incorrecta
- Tiene un nombre incorrecto (ej: `.env.test.txt`)

**Solución:**
```powershell
# Verifica que el archivo existe
Test-Path ".env.test"  # Debe retornar True

# Verifica la ubicación correcta
Get-Location  # Debe estar en: ...\analizador-gastos-front

# Lista archivos ocultos
Get-ChildItem -Force | Where-Object { $_.Name -like ".env*" }
```

---

## 📝 Ejemplo de `.env.test` Completo

```env
# ========================================
# CREDENCIALES DE PRUEBA
# ========================================

# Email del usuario de prueba (REQUERIDO)
TEST_USER_EMAIL=pruebas@test.com

# Contraseña del usuario de prueba (REQUERIDO)
TEST_USER_PASSWORD=TestPass123#

# URL del backend (OPCIONAL - por defecto: http://localhost:8000)
# TEST_API_URL=http://localhost:8000/api/v1/auth/login

# ========================================
# NOTAS:
# - El usuario debe existir en la base de datos
# - Debe tener permisos para crear/editar/eliminar gastos e ingresos
# - Se recomienda usar un usuario dedicado para pruebas
# ========================================
```

---

## 🔄 Cambiar Credenciales

Si necesitas cambiar las credenciales:

1. Edita el archivo `.env.test`
2. Reemplaza los valores de `TEST_USER_EMAIL` y `TEST_USER_PASSWORD`
3. Guarda el archivo
4. Vuelve a ejecutar los tests

**No es necesario reinstalar nada**, las credenciales se cargan cada vez que ejecutas los tests.

---

## 👥 Trabajo en Equipo

### Para Desarrolladores
Cada desarrollador debe:
1. Copiar `.env.test.example` a `.env.test`
2. Configurar sus propias credenciales
3. **NUNCA** compartir su archivo `.env.test`

### Para CI/CD
En entornos de integración continua:
1. Configura variables de entorno en el CI:
   - `TEST_USER_EMAIL`
   - `TEST_USER_PASSWORD`
2. El código las leerá automáticamente
3. No necesitas crear el archivo `.env.test`

---

## ✅ Checklist

Antes de ejecutar tests por primera vez:

- [ ] Copié `.env.test.example` a `.env.test`
- [ ] Configuré `TEST_USER_EMAIL` con un email válido
- [ ] Configuré `TEST_USER_PASSWORD` con la contraseña correcta
- [ ] El usuario existe en la base de datos
- [ ] Puedo hacer login manualmente con esas credenciales
- [ ] El backend está corriendo (http://localhost:8000/docs)
- [ ] Ejecuté `npm install` (primera vez)
- [ ] Ejecuté `npx playwright install` (primera vez)

---

## 📚 Documentación Relacionada

- 📖 [COMO_EJECUTAR_TESTS.md](./COMO_EJECUTAR_TESTS.md) - Guía completa paso a paso
- 📊 [EVOLUCION_TESTS.md](./EVOLUCION_TESTS.md) - Evolución técnica del suite
- 📋 [README.md](./README.md) - Documentación general de tests

---

**Última actualización:** Octubre 2025  
**Sistema de credenciales implementado para proteger datos personales** 🔒
