# 🔍 Debug: Token JWT y Autenticación

## ✅ Cambios Realizados

### 1. **api.ts** - Interceptor mejorado con logs
- ✅ El interceptor ahora muestra en consola si encuentra o no el token
- ✅ El login guarda el token inmediatamente en localStorage
- ✅ Se agregaron logs para debugging

### 2. **useGastos.ts** - Usando authStore (Zustand)
- ✅ Ahora obtiene el usuario desde `useAuthStore()` en lugar de localStorage
- ✅ Agrega logs cuando carga datos del usuario
- ✅ Muestra advertencia si no hay usuario autenticado

### 3. **FormularioGasto.tsx** - Usando authStore
- ✅ Obtiene el usuario desde `useAuthStore()` 
- ✅ Valida autenticación antes de guardar gastos
- ✅ Logs de debug al guardar

---

## 🧪 Cómo Verificar que el Token se Envía

### Paso 1: Abrir DevTools del Navegador
1. Abre la aplicación en el navegador
2. Presiona **F12** (o clic derecho → Inspeccionar)
3. Ve a la pestaña **Console**

### Paso 2: Hacer Login
1. Inicia sesión con tu usuario
2. En la consola deberías ver:
   ```
   ✅ Token guardado en localStorage: eyJhbGciOiJIUzI1Ni...
   ```

### Paso 3: Navegar a Gastos
1. Ve a la página de Gastos
2. En la consola deberías ver:
   ```
   👤 Cargando datos para usuario: Juan Pérez - ID: 1
   🔑 Token encontrado, agregando a header: eyJhbGciOiJIUzI1Ni...
   ```

### Paso 4: Verificar Peticiones HTTP (Network)
1. Ve a la pestaña **Network** en DevTools
2. Busca las peticiones a `/api/v1/gastos/`
3. Haz clic en la petición
4. Ve a la sección **Headers**
5. Busca el header **Authorization**
6. Deberías ver: `Bearer eyJhbGciOiJIUzI1Ni...`

---

## ❌ Si No Se Envía el Token

### Verificar localStorage
Abre la consola y ejecuta:
```javascript
localStorage.getItem('auth_token')
localStorage.getItem('user_info')
```

**Si ambos son `null`:**
- No has iniciado sesión correctamente
- El login falló pero no mostró error
- Hay un problema en el proceso de login

### Verificar Zustand Store
En la consola ejecuta:
```javascript
// Ver el estado completo del store
console.log(window.__ZUSTAND_DEVTOOLS__)
```

---

## 🔧 Solución de Problemas

### Problema 1: "Not authenticated"
**Causa:** El token no se está enviando o es inválido

**Solución:**
1. Cierra sesión completamente
2. Limpia localStorage:
   ```javascript
   localStorage.clear()
   ```
3. Recarga la página (F5)
4. Vuelve a iniciar sesión
5. Revisa la consola para ver los logs

### Problema 2: "Usuario no autenticado"
**Causa:** El authStore de Zustand no tiene el usuario

**Solución:**
1. Verifica que el login fue exitoso
2. Revisa que `user_info` esté en localStorage
3. Recarga la página para que Zustand restaure el estado
4. Si persiste, limpia localStorage y vuelve a iniciar sesión

### Problema 3: Token expira rápidamente
**Causa:** El backend tiene un tiempo de expiración corto

**Solución:**
1. Verifica la configuración del backend (ACCESS_TOKEN_EXPIRE_MINUTES)
2. Implementa refresh token (futuro)
3. Por ahora, vuelve a iniciar sesión

---

## 📊 Logs Esperados en Consola

### Al Hacer Login:
```
🔐 Iniciando login...
✅ Login exitoso, actualizando estado...
✅ Token guardado en localStorage: eyJhbGciOiJIUzI1Ni...
🚀 Estado actualizado correctamente
```

### Al Cargar Gastos:
```
👤 Cargando datos para usuario: Juan Pérez - ID: 1
🔑 Token encontrado, agregando a header: eyJhbGciOiJIUzI1Ni...
```

### Si NO hay Token:
```
⚠️ No se encontró token en localStorage para: /api/v1/gastos/
```

### Si NO hay Usuario:
```
⚠️ Usuario no disponible en Zustand store: null
Error: Usuario no autenticado
```

---

## 🎯 Checklist de Debugging

- [ ] Login exitoso (ver token en console)
- [ ] Token guardado en localStorage
- [ ] Usuario guardado en localStorage
- [ ] authStore tiene el usuario (Zustand)
- [ ] Peticiones muestran "Token encontrado" en console
- [ ] Header Authorization visible en Network tab
- [ ] Backend responde con datos (no con 401)

---

## 🚀 Siguiente Paso

Si todo funciona:
- ✅ Los gastos se deberían cargar correctamente
- ✅ Puedes crear nuevos gastos
- ✅ Puedes editar y eliminar gastos

Si sigue sin funcionar:
1. Comparte los logs de la consola
2. Comparte el error exacto del backend
3. Verifica que el backend esté corriendo
4. Verifica la URL del backend en `.env`

---

**Actualizado:** 2025-10-06
**Debug Level:** Verbose (con logs completos)
