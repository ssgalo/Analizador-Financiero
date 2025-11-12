-- ============================================================================
-- Recrear Tablas de Embeddings con 768 dimensiones (Google Gemini)
-- ============================================================================
-- Este script elimina las tablas de embeddings con 1536 dimensiones (Azure)
-- y las recrea con 768 dimensiones (Gemini)
--
-- Uso:
--   docker exec analizador-postgres psql -U unlam -d analizador_financiero \
--     -f /path/to/recreate_embeddings_768.sql
--
-- Fecha: 12 noviembre 2025
-- ============================================================================

\echo '🗑️  Eliminando tablas viejas...'

DROP TABLE IF EXISTS ingresos_embeddings CASCADE;
DROP TABLE IF EXISTS gastos_embeddings CASCADE;

\echo '✅ Tablas eliminadas'
\echo ''
\echo '🔨 Creando tablas con 768 dimensiones (Gemini)...'

-- ============================================================================
-- TABLA: gastos_embeddings
-- ============================================================================
CREATE TABLE gastos_embeddings (
    id SERIAL PRIMARY KEY,
    gasto_id INTEGER NOT NULL UNIQUE,
    embedding vector(768) NOT NULL,  -- 768 dimensiones para Gemini
    texto_original TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Foreign key
    CONSTRAINT fk_gasto
        FOREIGN KEY (gasto_id) 
        REFERENCES gastos(id_gasto) 
        ON DELETE CASCADE
);

-- Comentarios
COMMENT ON TABLE gastos_embeddings IS 'Embeddings vectoriales de gastos (768 dimensiones - Google Gemini)';
COMMENT ON COLUMN gastos_embeddings.embedding IS 'Vector de embedding de 768 dimensiones';
COMMENT ON COLUMN gastos_embeddings.texto_original IS 'Texto usado para generar el embedding';
COMMENT ON COLUMN gastos_embeddings.metadata IS 'Metadatos en formato JSON (categoría, monto, fecha, etc.)';

-- Índices
CREATE INDEX idx_gastos_embeddings_gasto_id ON gastos_embeddings(gasto_id);
CREATE INDEX idx_gastos_embeddings_metadata ON gastos_embeddings USING gin(metadata);
CREATE INDEX idx_gastos_embeddings_created_at ON gastos_embeddings(created_at);

\echo '✅ Tabla gastos_embeddings creada'

-- ============================================================================
-- TABLA: ingresos_embeddings
-- ============================================================================
CREATE TABLE ingresos_embeddings (
    id SERIAL PRIMARY KEY,
    ingreso_id INTEGER NOT NULL UNIQUE,
    embedding vector(768) NOT NULL,  -- 768 dimensiones para Gemini
    texto_original TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Foreign key
    CONSTRAINT fk_ingreso
        FOREIGN KEY (ingreso_id) 
        REFERENCES ingresos(id_ingreso) 
        ON DELETE CASCADE
);

-- Comentarios
COMMENT ON TABLE ingresos_embeddings IS 'Embeddings vectoriales de ingresos (768 dimensiones - Google Gemini)';
COMMENT ON COLUMN ingresos_embeddings.embedding IS 'Vector de embedding de 768 dimensiones';
COMMENT ON COLUMN ingresos_embeddings.texto_original IS 'Texto usado para generar el embedding';
COMMENT ON COLUMN ingresos_embeddings.metadata IS 'Metadatos en formato JSON (tipo, monto, fecha, etc.)';

-- Índices
CREATE INDEX idx_ingresos_embeddings_ingreso_id ON ingresos_embeddings(ingreso_id);
CREATE INDEX idx_ingresos_embeddings_metadata ON ingresos_embeddings USING gin(metadata);
CREATE INDEX idx_ingresos_embeddings_created_at ON ingresos_embeddings(created_at);

\echo '✅ Tabla ingresos_embeddings creada'
\echo ''
\echo '📊 Verificando estructura...'

-- Verificar que las tablas se crearon correctamente
SELECT 
    'gastos_embeddings' as tabla,
    COUNT(*) as registros
FROM gastos_embeddings
UNION ALL
SELECT 
    'ingresos_embeddings' as tabla,
    COUNT(*) as registros
FROM ingresos_embeddings;

\echo ''
\echo '✅ Tablas recreadas exitosamente con 768 dimensiones'
\echo '⚠️  NOTA: Los índices vectoriales IVFFlat se crearán automáticamente'
\echo '         después de tener al menos 100 registros en cada tabla.'
\echo ''
\echo '🚀 Próximo paso: Ejecutar migración de embeddings'
\echo '   cd backend && ./scripts/migrar_embeddings.sh'
