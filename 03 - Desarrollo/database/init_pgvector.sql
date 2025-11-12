-- ============================================================
-- Script: init_pgvector.sql
-- Descripción: Inicializa la extensión pgvector en PostgreSQL
-- Fecha: 11 noviembre 2025
-- Orden de ejecución: 02 (después de init.sql)
-- ============================================================

-- Crear la extensión pgvector para habilitar el tipo de dato vector
CREATE EXTENSION IF NOT EXISTS vector;

-- Verificar que la extensión se creó correctamente
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_extension 
        WHERE extname = 'vector'
    ) THEN
        RAISE NOTICE 'Extensión pgvector instalada correctamente';
    ELSE
        RAISE EXCEPTION 'Error: No se pudo instalar la extensión pgvector';
    END IF;
END $$;

-- Mensaje informativo
\echo '✓ Extensión pgvector habilitada'
\echo '✓ Tipo de dato vector disponible'
