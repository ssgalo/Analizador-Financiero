-- ============================================================
-- Script: create_embeddings_tables.sql
-- Descripción: Crea las tablas para almacenar embeddings de gastos e ingresos
-- Fecha: 11 noviembre 2025
-- Orden de ejecución: 03 (después de init_pgvector.sql)
-- ============================================================

-- ============================================================
-- TABLA: gastos_embeddings
-- Descripción: Almacena embeddings vectoriales de los gastos para búsqueda semántica
-- ============================================================
CREATE TABLE IF NOT EXISTS gastos_embeddings (
    id SERIAL PRIMARY KEY,
    gasto_id INTEGER NOT NULL REFERENCES gastos(id_gasto) ON DELETE CASCADE,
    embedding vector(1536) NOT NULL,  -- Dimensión de text-embedding-3-small de OpenAI
    texto_original TEXT NOT NULL,     -- Texto usado para generar el embedding
    metadata JSONB,                   -- Metadatos adicionales (categoría, monto, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint para evitar duplicados
    UNIQUE(gasto_id)
);

-- Índice IVFFlat para búsqueda vectorial eficiente en gastos
-- lists = sqrt(total_rows) es una buena regla general
-- Para 10,000 gastos: lists = 100
-- Para 100,000 gastos: lists = 316
CREATE INDEX IF NOT EXISTS idx_gastos_embeddings_vector 
ON gastos_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Índice para búsquedas por gasto_id
CREATE INDEX IF NOT EXISTS idx_gastos_embeddings_gasto_id 
ON gastos_embeddings(gasto_id);

-- Índice GIN para búsqueda eficiente en metadata JSONB
CREATE INDEX IF NOT EXISTS idx_gastos_embeddings_metadata 
ON gastos_embeddings USING gin(metadata);

-- Índice para ordenamiento por fecha
CREATE INDEX IF NOT EXISTS idx_gastos_embeddings_created_at 
ON gastos_embeddings(created_at DESC);

-- ============================================================
-- TABLA: ingresos_embeddings
-- Descripción: Almacena embeddings vectoriales de los ingresos para búsqueda semántica
-- ============================================================
CREATE TABLE IF NOT EXISTS ingresos_embeddings (
    id SERIAL PRIMARY KEY,
    ingreso_id INTEGER NOT NULL REFERENCES ingresos(id_ingreso) ON DELETE CASCADE,
    embedding vector(1536) NOT NULL,  -- Dimensión de text-embedding-3-small de OpenAI
    texto_original TEXT NOT NULL,     -- Texto usado para generar el embedding
    metadata JSONB,                   -- Metadatos adicionales (categoría, monto, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint para evitar duplicados
    UNIQUE(ingreso_id)
);

-- Índice IVFFlat para búsqueda vectorial eficiente en ingresos
CREATE INDEX IF NOT EXISTS idx_ingresos_embeddings_vector 
ON ingresos_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Índice para búsquedas por ingreso_id
CREATE INDEX IF NOT EXISTS idx_ingresos_embeddings_ingreso_id 
ON ingresos_embeddings(ingreso_id);

-- Índice GIN para búsqueda eficiente en metadata JSONB
CREATE INDEX IF NOT EXISTS idx_ingresos_embeddings_metadata 
ON ingresos_embeddings USING gin(metadata);

-- Índice para ordenamiento por fecha
CREATE INDEX IF NOT EXISTS idx_ingresos_embeddings_created_at 
ON ingresos_embeddings(created_at DESC);

-- ============================================================
-- TRIGGER: Actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_embeddings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gastos_embeddings
DROP TRIGGER IF EXISTS trigger_update_gastos_embeddings_updated_at ON gastos_embeddings;
CREATE TRIGGER trigger_update_gastos_embeddings_updated_at
    BEFORE UPDATE ON gastos_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_embeddings_updated_at();

-- Trigger para ingresos_embeddings
DROP TRIGGER IF EXISTS trigger_update_ingresos_embeddings_updated_at ON ingresos_embeddings;
CREATE TRIGGER trigger_update_ingresos_embeddings_updated_at
    BEFORE UPDATE ON ingresos_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_embeddings_updated_at();

-- ============================================================
-- COMENTARIOS EN LAS TABLAS
-- ============================================================
COMMENT ON TABLE gastos_embeddings IS 'Almacena embeddings vectoriales de gastos para búsqueda semántica';
COMMENT ON COLUMN gastos_embeddings.embedding IS 'Vector de 1536 dimensiones generado por text-embedding-3-small';
COMMENT ON COLUMN gastos_embeddings.texto_original IS 'Texto usado para generar el embedding (descripción + contexto)';
COMMENT ON COLUMN gastos_embeddings.metadata IS 'JSONB con categoría, monto, fecha, moneda, etc.';

COMMENT ON TABLE ingresos_embeddings IS 'Almacena embeddings vectoriales de ingresos para búsqueda semántica';
COMMENT ON COLUMN ingresos_embeddings.embedding IS 'Vector de 1536 dimensiones generado por text-embedding-3-small';
COMMENT ON COLUMN ingresos_embeddings.texto_original IS 'Texto usado para generar el embedding (descripción + contexto)';
COMMENT ON COLUMN ingresos_embeddings.metadata IS 'JSONB con categoría, monto, fecha, moneda, etc.';

-- Mensajes informativos
\echo '✓ Tabla gastos_embeddings creada'
\echo '✓ Tabla ingresos_embeddings creada'
\echo '✓ Índices vectoriales IVFFlat creados'
\echo '✓ Triggers de actualización configurados'
