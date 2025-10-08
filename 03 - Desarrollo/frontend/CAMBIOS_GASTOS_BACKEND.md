# Cambios: Integración de Gastos con Backend Real

## 📋 Resumen
Se modificó completamente la funcionalidad de gastos del frontend para consumir los endpoints reales del backend en lugar de usar datos mock.

## 🔄 Archivos Modificados

### 1. **src/services/api.ts**
- ✅ Agregados interfaces TypeScript basadas en el OpenAPI:
  - `Categoria`
  - `Gasto`
  - `GastoCreate`
  - `GastoUpdate`

- ✅ Agregado servicio completo de gastos (`gastosService`):
  - `getGastos(filtros)` - Obtener lista de gastos con filtros
  - `getGasto(id)` - Obtener un gasto por ID
  - `createGasto(gasto)` - Crear un nuevo gasto
  - `updateGasto(id, gasto)` - Actualizar un gasto existente
  - `deleteGasto(id)` - Eliminar un gasto

- ✅ Agregado servicio completo de categorías (`categoriasService`):
  - `getCategorias(filtros)` - Obtener lista de categorías
  - `getCategoriasUsuario(userId, filtros)` - Categorías de un usuario (personalizadas + globales)
  - `getCategoria(id)` - Obtener una categoría por ID

### 2. **src/hooks/useGastos.ts**
- ✅ Reemplazado `mockApi` por servicios reales (`gastosService`, `categoriasService`)
- ✅ Actualizado para obtener el usuario autenticado desde `authService`
- ✅ Modificado para enviar `id_usuario` en las peticiones al backend
- ✅ Implementados filtros del backend:
  - Filtros enviados al backend: `fecha_desde`, `fecha_hasta`, `id_categoria`
  - Filtros aplicados localmente: `busqueda`, `fuente`, `monto_desde`, `monto_hasta`
- ✅ Actualizado tipado de funciones para usar `GastoCreate` y `GastoUpdate`
- ✅ Mejora en el manejo de errores con mensajes más descriptivos

### 3. **src/pages/GastosPage.tsx**
- ✅ Actualizado imports para usar tipos del servicio API real
- ✅ Modificadas las funciones de manejo de gastos para usar los tipos correctos:
  - `handleCrearGasto` usa `GastoCreate`
  - `handleActualizarGasto` usa `GastoUpdate`

### 4. **src/components/forms/FormularioGasto.tsx**
- ✅ Actualizado imports para usar tipos del servicio API real
- ✅ Modificado `handleSubmit` para:
  - Obtener el usuario autenticado desde `authService.getStoredUser()`
  - Crear objetos `GastoCreate` y `GastoUpdate` correctos según OpenAPI
  - Validar autenticación antes de enviar datos
- ✅ Separada la lógica de creación vs actualización con tipos específicos
- ✅ Eliminado el campo `estado` (no se envía en create/update según OpenAPI)

## 📡 Endpoints Utilizados

### Gastos
- `GET /api/v1/gastos/` - Lista de gastos con filtros
- `GET /api/v1/gastos/{gasto_id}` - Gasto específico
- `POST /api/v1/gastos/` - Crear gasto
- `PUT /api/v1/gastos/{gasto_id}` - Actualizar gasto
- `DELETE /api/v1/gastos/{gasto_id}` - Eliminar gasto

### Categorías
- `GET /api/v1/categorias/` - Lista de categorías
- `GET /api/v1/categorias/usuario/{usuario_id}` - Categorías de un usuario

## 🎯 Características Implementadas

### Filtros del Backend
Los siguientes filtros se envían directamente al backend:
- `id_usuario` - Siempre se incluye (del usuario autenticado)
- `fecha_desde` - Filtro de fecha inicial
- `fecha_hasta` - Filtro de fecha final
- `id_categoria` - Filtro por categoría
- `limit` - Límite de resultados (1000 por defecto)

### Filtros Locales
Estos filtros se aplican en el frontend después de obtener los datos:
- `busqueda` - Búsqueda de texto en comercio, descripción y categoría
- `fuente` - Filtro por fuente del gasto (manual, PDF, imagen, etc.)
- `monto_desde` - Monto mínimo
- `monto_hasta` - Monto máximo

## 🔐 Autenticación
- Utiliza el token JWT almacenado en localStorage
- El interceptor de Axios agrega automáticamente el header `Authorization: Bearer {token}`
- Obtiene el `id_usuario` del usuario autenticado desde localStorage

## ✅ Validaciones
- Se valida que el usuario esté autenticado antes de hacer peticiones
- Se manejan errores de red y se muestran mensajes descriptivos
- Se valida el formato de datos antes de enviar al backend

## 🚀 Próximos Pasos (Recomendados)
1. Agregar manejo de errores más granular con mensajes específicos por tipo de error
2. Implementar paginación para grandes volúmenes de gastos
3. Agregar loading states más específicos (loading en tabla vs modal)
4. Implementar caché de categorías para reducir llamadas al backend
5. Agregar toast/notifications para feedback visual de operaciones exitosas/fallidas

## 📝 Notas Importantes
- **NO se usa mockApi** - Todos los datos vienen del backend real
- **Formato de fechas**: El frontend usa `dd/mm/yyyy` pero envía `yyyy-mm-dd` al backend
- **Formato de montos**: El frontend usa formato local (coma decimal) pero envía números al backend
- **Estado del gasto**: El backend maneja el estado internamente, no se envía en create/update
- **Usuario**: Se obtiene automáticamente del usuario autenticado

## 🐛 Issues Conocidos
- ⚠️ Import `useColors` no usado en `GastosPage.tsx` (warning menor)

---
**Fecha de modificación**: 2025-10-06
**Autor**: GitHub Copilot
**Versión del Backend**: API v1
