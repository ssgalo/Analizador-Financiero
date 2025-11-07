-- Agregar campos para recuperación de contraseña
ALTER TABLE usuarios 
ADD COLUMN reset_token VARCHAR(255),
ADD COLUMN reset_token_expiry TIMESTAMP WITH TIME ZONE;

-- Crear índice para optimizar búsquedas por token
CREATE INDEX idx_usuarios_reset_token ON usuarios(reset_token) WHERE reset_token IS NOT NULL;
