# Recuperación de Contraseña

Sistema para restablecer contraseña desde login.

## Desde el Login

1. Click en "¿Olvidaste tu contraseña?" debajo del campo contraseña
2. Ingresar email
3. Click "Restablecer"

El modal muestra mensaje de confirmación.

## Restablecer Contraseña

1. Ir a la URL `/reset-password` (en desarrollo, el modal muestra el link)
2. Completar campos:
   - Email
   - Token (el recibido)
   - Nueva contraseña
   - Confirmar contraseña
3. Click "Restablecer"
4. Redirect automático al login

## Desarrollo

El token se imprime en los logs del backend:

```bash
docker logs analizador-backend --tail 20
```

Buscar la línea: `🔑 Token de recuperación para`

## Producción

Requiere configuración de SMTP para envío automático de emails.

Ver comentarios TODO en: `backend/app/api/api_v1/endpoints/usuarios.py`

### Dependencias necesarias:
- aiosmtplib
- email-validator
- jinja2

### Variables de entorno:
- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASSWORD

## Seguridad

- Token único de 32 bytes generado con `secrets.token_urlsafe(32)`
- Expiración: 1 hora
- Token se elimina después de usarse (single-use)
- Nueva contraseña hasheada con Argon2
