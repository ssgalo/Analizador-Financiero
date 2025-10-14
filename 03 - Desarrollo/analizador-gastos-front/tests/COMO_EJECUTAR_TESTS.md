# 🧪 Guía para Ejecutar Tests - Paso a Paso

Esta guía está diseñada para personas **sin experiencia técnica** que necesiten ejecutar las pruebas del sistema.

---

## 📋 Requisitos Previos

### 1. ¿Qué necesito tener instalado?

Antes de ejecutar los tests, asegúrate de tener:

- ✅ **Node.js** (versión 18 o superior)
  - Para verificar: Abre PowerShell y escribe: `node --version`
  - Si no está instalado, descárgalo desde: https://nodejs.org/

- ✅ **Visual Studio Code** (recomendado)
  - Para abrir el proyecto y ver los archivos
  - Descarga: https://code.visualstudio.com/

- ✅ **Backend funcionando** (API en puerto 8000)
  - Verifica que http://localhost:8000 responda
  - Si no funciona, consulta la documentación de backend

---

## 🚀 Paso 1: Abrir el Proyecto

### Opción A: Usando Visual Studio Code

1. Abre **Visual Studio Code**
2. Ve a **Archivo → Abrir Carpeta**
3. Navega a: `C:\github-repo\Analizador-Financiero\03 - Desarrollo\analizador-gastos-front`
4. Haz clic en **Seleccionar carpeta**

### Opción B: Usando PowerShell

1. Presiona **Windows + X**
2. Selecciona **Windows PowerShell**
3. Escribe el siguiente comando:

```powershell
cd "C:\github-repo\Analizador-Financiero\03 - Desarrollo\analizador-gastos-front"
```

4. Presiona **Enter**

---

## 📦 Paso 2: Instalar Dependencias (Primera vez solamente)

**⚠️ Solo necesitas hacer esto UNA VEZ, o cuando cambien las dependencias.**

### En PowerShell, ejecuta:

```powershell
npm install
```

**¿Qué hace esto?**  
Descarga todas las herramientas necesarias para ejecutar los tests, incluyendo Playwright.

**Tiempo estimado:** 2-3 minutos

**¿Cómo sé que funcionó?**  
Deberías ver un mensaje final como:
```
added 234 packages in 45s
```

---

## 🔐 Paso 3: Configurar Credenciales de Prueba (Primera vez solamente)

**⚠️ MUY IMPORTANTE: Este paso es OBLIGATORIO**

### 3.1 Copiar el archivo de ejemplo

En PowerShell, ejecuta:

```powershell
Copy-Item ".env.test.example" ".env.test"
```

**Alternativa:** También puedes copiar el archivo manualmente:
1. En el Explorador de Archivos, navega a la carpeta del proyecto
2. Busca el archivo `.env.test.example`
3. Cópialo y pégalo en la misma carpeta
4. Renombra la copia a `.env.test` (sin el ".example")

---

### 3.2 Editar las credenciales

Abre el archivo `.env.test` con cualquier editor de texto (Bloc de notas, Visual Studio Code, etc.)

**Contenido original:**
```
TEST_USER_EMAIL=tu_email@ejemplo.com
TEST_USER_PASSWORD=TuContraseñaSegura123#
```

**Reemplaza con tus credenciales reales:**
```
TEST_USER_EMAIL=tu_usuario_real@mail.com
TEST_USER_PASSWORD=TuContraseñaReal123#
```

---

### 3.3 ¿Qué credenciales debo usar?

**Opción 1: Crear un usuario de prueba (RECOMENDADO)**
1. Ve a la aplicación en http://localhost:3000
2. Regístrate con un usuario nuevo (ej: `pruebas@test.com`)
3. Usa esas credenciales en `.env.test`

**Opción 2: Usar un usuario existente**
- Puedes usar tus credenciales personales
- ⚠️ **NO recomendado:** Los tests crearán y borrarán datos de prueba

---

### 3.4 ¿Por qué necesito esto?

Los tests necesitan **iniciar sesión en la aplicación** para probar las funcionalidades. Sin credenciales válidas, los tests fallarán inmediatamente.

**⚠️ IMPORTANTE:**
- El archivo `.env.test` NO se sube a GitHub (está en .gitignore)
- Tus credenciales están seguras en tu computadora
- Cada persona que ejecute los tests debe configurar sus propias credenciales

---

## 🌐 Paso 4: Instalar Navegadores de Playwright (Primera vez solamente)

**⚠️ Solo necesitas hacer esto UNA VEZ.**

### Ejecuta:

```powershell
npx playwright install
```

**¿Qué hace esto?**  
Descarga versiones especiales de Chrome, Firefox y Safari para testing.

**Tiempo estimado:** 3-5 minutos (descarga ~300MB)

**¿Cómo sé que funcionó?**  
Verás mensajes como:
```
Downloading Chromium...
Downloading Firefox...
Downloading Webkit...
```

---

## ✅ Paso 5: Verificar que el Backend esté Funcionando

### Antes de ejecutar los tests, verifica:

1. Abre tu navegador (Chrome, Edge, etc.)
2. Ve a: http://localhost:8000/docs
3. **¿Ves la documentación de la API?**
   - ✅ **SÍ** → Continúa al siguiente paso
   - ❌ **NO** → Inicia el backend primero (consulta documentación de backend)

---

## 🎯 Paso 6: Ejecutar los Tests

Ahora sí, ¡a ejecutar las pruebas!

### 🔹 Opción 1: Ejecutar TODOS los tests (90 tests)

Este comando ejecuta el suite completo de pruebas:

```powershell
npx playwright test --project=chromium --reporter=line
```

**Tiempo estimado:** 20-30 segundos

**⚠️ Si ves este error:**
```
⚠️  ERROR: Credenciales de prueba no configuradas.
```

**Solución:** Vuelve al **Paso 3** y configura el archivo `.env.test` con tus credenciales.

---

### 🔹 Opción 2: Ejecutar solo tests de una categoría

#### Tests de Autenticación (10 tests):
```powershell
npx playwright test auth.e2e.spec.ts --project=chromium --reporter=line
```

#### Tests de Gastos (13 tests):
```powershell
npx playwright test gastos.e2e.spec.ts --project=chromium --reporter=line
```

#### Tests de Ingresos (14 tests):
```powershell
npx playwright test ingresos.e2e.spec.ts --project=chromium --reporter=line
```

#### Tests de Dashboard (27 tests):
```powershell
npx playwright test dashboard.e2e.spec.ts --project=chromium --reporter=line
```

#### Tests de API (23 tests):
```powershell
npx playwright test api.complete.spec.ts --project=chromium --reporter=line
```

#### Tests Unitarios (16 tests):
```powershell
npx playwright test unit.spec.ts --project=chromium --reporter=line
```

---

### 🔹 Opción 3: Ejecutar un test específico por nombre

Si quieres ejecutar solo un test en particular:

```powershell
npx playwright test -g "AUTH-001" --project=chromium --reporter=line
```

**Ejemplo:** Esto ejecutaría solo el test "AUTH-001: debe autenticar usuario válido"

---

## 📊 Paso 7: Leer los Resultados

### ✅ Resultado Exitoso

Si todo sale bien, verás algo como:

```
Running 90 tests using 16 workers

  90 passed (23.4s)
```

**Interpretación:**
- `90 passed` = Los 90 tests pasaron exitosamente ✅
- `(23.4s)` = Tardó 23.4 segundos en ejecutarse

**¿Qué significa?**  
✅ Todas las funcionalidades del sistema están funcionando correctamente.

---

### ❌ Resultado con Errores

Si hay problemas, verás algo como:

```
Running 90 tests using 16 workers

  85 passed
  5 failed
  
  1) tests/gastos.e2e.spec.ts:45:5 › GAS-005: debe editar un gasto existente
     Error: expect(locator).toBeVisible()
     Expected: visible
     Received: hidden
```

**Interpretación:**
- `85 passed` = 85 tests funcionaron bien ✅
- `5 failed` = 5 tests fallaron ❌
- La lista muestra **qué tests fallaron** y **por qué**

**¿Qué hacer?**  
1. Anota el nombre del test que falló (ej: "GAS-005")
2. Lee el mensaje de error
3. Consulta con el equipo de desarrollo

---

## 🖥️ Paso 8: Ver el Reporte Visual (Opcional)

Si quieres ver un reporte más detallado con imágenes:

### 1. Ejecuta los tests con el reporter HTML:

```powershell
npx playwright test --project=chromium --reporter=html
```

### 2. Abre el reporte:

```powershell
npx playwright show-report
```

**¿Qué verás?**  
Se abrirá tu navegador con una página web mostrando:
- ✅ Tests que pasaron (en verde)
- ❌ Tests que fallaron (en rojo)
- 📸 Capturas de pantalla de los errores
- 📹 Videos de la ejecución (si está habilitado)

---

## 🛠️ Solución de Problemas Comunes

### Problema 1: "npx: command not found"

**Causa:** Node.js no está instalado o no está en el PATH.

**Solución:**
1. Instala Node.js desde https://nodejs.org/
2. Cierra y vuelve a abrir PowerShell
3. Verifica con: `node --version`

---

### Problema 2: "Credenciales no configuradas"

**Mensaje de error:**
```
⚠️  ERROR: Credenciales de prueba no configuradas.

📝 Por favor, sigue estos pasos:
1. Copia el archivo ".env.test.example" y renómbralo a ".env.test"
2. Edita ".env.test" y configura tus credenciales
```

**Causa:** No existe el archivo `.env.test` o está vacío.

**Solución:**
1. Copia `.env.test.example` a `.env.test`
2. Edita `.env.test` con tus credenciales reales
3. Asegúrate de que el usuario exista en la base de datos
4. Vuelve a ejecutar los tests

---

### Problema 3: "Backend no responde"

**Mensaje de error:**
```
global-setup: ❌ failed to authenticate with http://localhost:8000/api/v1/auth/login
```

**Causa:** El backend no está ejecutándose o las credenciales son incorrectas.

**Solución:**
1. Verifica que el backend esté corriendo (http://localhost:8000/docs)
2. Verifica que las credenciales en `.env.test` sean correctas
3. Verifica que el usuario exista en la base de datos
4. Vuelve a ejecutar los tests

---

### Problema 4: "Error: Browser not installed"

**Mensaje de error:**
```
Error: Chromium was not found. Please run 'npx playwright install'
```

**Solución:**
```powershell
npx playwright install chromium
```

---

### Problema 5: Los tests van muy lento

**Causa:** Probablemente estás ejecutando en modo "headed" (con ventanas visibles).

**Solución:** Usa el comando normal sin flags adicionales:
```powershell
npx playwright test --project=chromium --reporter=line
```

**Nota:** Los tests en modo "headless" (sin ventanas) son mucho más rápidos.

---

## 📖 Explicación de Términos Técnicos

### ¿Qué es Playwright?
Una herramienta que **automatiza navegadores web** para probar aplicaciones. Simula un usuario real haciendo clic, escribiendo y navegando.

### ¿Qué es un "test E2E"?
"End-to-End" = **De principio a fin**. Prueba todo el flujo de una funcionalidad como lo haría un usuario real.

### ¿Qué es un "test unitario"?
Prueba **funciones individuales** del código, como formatear una fecha o validar un email.

### ¿Qué es un "test de API"?
Prueba los **endpoints del backend** directamente, sin pasar por la interfaz visual.

### ¿Qué significa "90/90 passed"?
De 90 tests ejecutados, los 90 pasaron exitosamente. **100% de aprobación.**

### ¿Qué es "chromium"?
La versión de código abierto de Google Chrome que usa Playwright para las pruebas.

---

## 📝 Comandos de Referencia Rápida

### Copiar y pegar estos comandos:

```powershell
# Navegar a la carpeta del proyecto
cd "C:\github-repo\Analizador-Financiero\03 - Desarrollo\analizador-gastos-front"

# Configurar credenciales (PRIMERA VEZ SOLAMENTE)
Copy-Item ".env.test.example" ".env.test"
# Luego edita .env.test con tus credenciales

# Ejecutar todos los tests
npx playwright test --project=chromium --reporter=line

# Ejecutar solo tests de autenticación
npx playwright test auth.e2e.spec.ts --project=chromium --reporter=line

# Ejecutar solo tests de gastos
npx playwright test gastos.e2e.spec.ts --project=chromium --reporter=line

# Ejecutar solo tests de ingresos
npx playwright test ingresos.e2e.spec.ts --project=chromium --reporter=line

# Ver reporte visual
npx playwright test --project=chromium --reporter=html
npx playwright show-report
```

---

## 🎯 Checklist de Ejecución

Usa esta lista para asegurarte de no olvidar ningún paso:

- [ ] Node.js está instalado (`node --version`)
- [ ] Navegué a la carpeta correcta (`cd ...`)
- [ ] Instalé dependencias (`npm install`) - Solo primera vez
- [ ] **Configuré credenciales en `.env.test`** - ⚠️ OBLIGATORIO
- [ ] Instalé navegadores (`npx playwright install`) - Solo primera vez
- [ ] El backend está funcionando (http://localhost:8000/docs)
- [ ] Ejecuté el comando de tests
- [ ] Leí los resultados
- [ ] Documenté cualquier error encontrado

---

## 📞 ¿Necesitas Ayuda?

Si los tests fallan o tienes dudas:

1. **Anota el mensaje de error completo**
2. **Copia el nombre del test que falló** (ej: "GAS-005")
3. **Toma una captura de pantalla del error**
4. **Consulta con el equipo de desarrollo**

---

## 📊 Tabla de Tiempos Estimados

| Tarea | Primera Vez | Ejecuciones Posteriores |
|-------|-------------|-------------------------|
| Instalar Node.js | 5 min | - |
| Instalar dependencias | 3 min | - |
| **Configurar credenciales (.env.test)** | **2 min** | - |
| Instalar navegadores | 5 min | - |
| Ejecutar todos los tests | 25 seg | 25 seg |
| Ejecutar tests de una categoría | 5-10 seg | 5-10 seg |
| Ver reporte visual | 30 seg | 30 seg |

**Tiempo total primera vez:** ~17 minutos  
**Tiempo ejecuciones posteriores:** ~30 segundos

---

## ✅ ¡Listo!

Ahora ya sabes cómo ejecutar los tests del sistema. Recuerda:

- ✅ **Ejecutar antes de hacer cambios importantes** en el código
- ✅ **Ejecutar después de implementar nuevas funcionalidades**
- ✅ **Ejecutar antes de desplegar a producción**

**Los tests son tu red de seguridad.** Si todos pasan, el sistema funciona correctamente.

---

**Guía creada:** Octubre 2025  
**Última actualización:** Suite completo de 90 tests funcionales ✅
