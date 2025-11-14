-- ============================================================
-- Script: vector_search_functions.sql
-- Descripción: Funciones SQL para búsqueda vectorial en gastos e ingresos
-- Fecha: 11 noviembre 2025
-- Orden de ejecución: 04 (después de create_embeddings_tables.sql)
-- ============================================================

-- ============================================================
-- FUNCIÓN: search_gastos_by_vector
-- Descripción: Busca gastos similares usando búsqueda vectorial
-- Parámetros:
--   - query_embedding: Vector de consulta (1536 dimensiones)
--   - limit_results: Cantidad máxima de resultados (default: 10)
--   - similarity_threshold: Umbral mínimo de similitud 0-1 (default: 0.7)
-- Retorna: Tabla con gastos ordenados por similitud
-- ============================================================
CREATE OR REPLACE FUNCTION search_gastos_by_vector(
    query_embedding vector(1536),
    limit_results INTEGER DEFAULT 10,
    similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    gasto_id INTEGER,
    descripcion TEXT,
    monto DECIMAL,
    fecha DATE,
    categoria VARCHAR(100),
    moneda VARCHAR(10),
    similarity FLOAT,
    texto_embedding TEXT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id_gasto AS gasto_id,
        g.descripcion::TEXT,
        g.monto,
        g.fecha,
        c.nombre AS categoria,
        g.moneda::VARCHAR(10),
        -- Calcular similitud (1 - cosine distance)
        (1 - (ge.embedding <=> query_embedding))::FLOAT AS similarity,
        ge.texto_original AS texto_embedding,
        ge.metadata
    FROM gastos_embeddings ge
    INNER JOIN gastos g ON ge.gasto_id = g.id_gasto
    LEFT JOIN categorias c ON g.id_categoria = c.id_categoria
    WHERE (1 - (ge.embedding <=> query_embedding)) >= similarity_threshold
    ORDER BY ge.embedding <=> query_embedding ASC  -- Menor distancia = mayor similitud
    LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCIÓN: search_ingresos_by_vector
-- Descripción: Busca ingresos similares usando búsqueda vectorial
-- Parámetros:
--   - query_embedding: Vector de consulta (1536 dimensiones)
--   - limit_results: Cantidad máxima de resultados (default: 10)
--   - similarity_threshold: Umbral mínimo de similitud 0-1 (default: 0.7)
-- Retorna: Tabla con ingresos ordenados por similitud
-- ============================================================
CREATE OR REPLACE FUNCTION search_ingresos_by_vector(
    query_embedding vector(1536),
    limit_results INTEGER DEFAULT 10,
    similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    ingreso_id INTEGER,
    descripcion TEXT,
    monto DECIMAL,
    fecha DATE,
    categoria VARCHAR(100),
    moneda VARCHAR(10),
    similarity FLOAT,
    texto_embedding TEXT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id_ingreso AS ingreso_id,
        i.descripcion::TEXT,
        i.monto,
        i.fecha,
        c.nombre AS categoria,
        i.moneda::VARCHAR(10),
        -- Calcular similitud (1 - cosine distance)
        (1 - (ie.embedding <=> query_embedding))::FLOAT AS similarity,
        ie.texto_original AS texto_embedding,
        ie.metadata
    FROM ingresos_embeddings ie
    INNER JOIN ingresos i ON ie.ingreso_id = i.id_ingreso
    LEFT JOIN categorias c ON i.id_categoria = c.id_categoria
    WHERE (1 - (ie.embedding <=> query_embedding)) >= similarity_threshold
    ORDER BY ie.embedding <=> query_embedding ASC  -- Menor distancia = mayor similitud
    LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCIÓN: search_combined_by_vector
-- Descripción: Busca tanto en gastos como ingresos y combina resultados
-- Parámetros:
--   - query_embedding: Vector de consulta (1536 dimensiones)
--   - limit_results: Cantidad máxima de resultados por tipo (default: 10)
--   - similarity_threshold: Umbral mínimo de similitud 0-1 (default: 0.7)
-- Retorna: Tabla combinada con tipo de transacción, ordenada por similitud
-- ============================================================
CREATE OR REPLACE FUNCTION search_combined_by_vector(
    query_embedding vector(1536),
    limit_results INTEGER DEFAULT 10,
    similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    transaction_type VARCHAR(10),  -- 'gasto' o 'ingreso'
    transaction_id INTEGER,
    descripcion TEXT,
    monto DECIMAL,
    fecha DATE,
    categoria VARCHAR(100),
    moneda VARCHAR(10),
    similarity FLOAT,
    texto_embedding TEXT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    -- Unir resultados de gastos e ingresos
    SELECT * FROM (
        -- Gastos
        SELECT 
            'gasto'::VARCHAR(10) AS transaction_type,
            g.id_gasto AS transaction_id,
            g.descripcion::TEXT,
            g.monto,
            g.fecha,
            c.nombre AS categoria,
            g.moneda::VARCHAR(10),
            (1 - (ge.embedding <=> query_embedding))::FLOAT AS similarity,
            ge.texto_original AS texto_embedding,
            ge.metadata,
            (ge.embedding <=> query_embedding) AS distance
        FROM gastos_embeddings ge
        INNER JOIN gastos g ON ge.gasto_id = g.id_gasto
        LEFT JOIN categorias c ON g.id_categoria = c.id_categoria
        WHERE (1 - (ge.embedding <=> query_embedding)) >= similarity_threshold
        
        UNION ALL
        
        -- Ingresos
        SELECT 
            'ingreso'::VARCHAR(10) AS transaction_type,
            i.id_ingreso AS transaction_id,
            i.descripcion::TEXT,
            i.monto,
            i.fecha,
            c.nombre AS categoria,
            i.moneda::VARCHAR(10),
            (1 - (ie.embedding <=> query_embedding))::FLOAT AS similarity,
            ie.texto_original AS texto_embedding,
            ie.metadata,
            (ie.embedding <=> query_embedding) AS distance
        FROM ingresos_embeddings ie
        INNER JOIN ingresos i ON ie.ingreso_id = i.id_ingreso
        LEFT JOIN categorias c ON i.id_categoria = c.id_categoria
        WHERE (1 - (ie.embedding <=> query_embedding)) >= similarity_threshold
    ) combined
    ORDER BY similarity DESC  -- Ordenar todos los resultados por similitud
    LIMIT limit_results * 2;   -- Limitar resultados totales
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCIÓN: get_embedding_stats
-- Descripción: Obtiene estadísticas sobre los embeddings almacenados
-- Retorna: Estadísticas de cobertura de embeddings
-- ============================================================
CREATE OR REPLACE FUNCTION get_embedding_stats()
RETURNS TABLE (
    entity_type VARCHAR(20),
    total_records BIGINT,
    records_with_embeddings BIGINT,
    coverage_percentage NUMERIC(5,2),
    avg_vector_magnitude FLOAT,
    oldest_embedding TIMESTAMP WITH TIME ZONE,
    newest_embedding TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    -- Estadísticas de gastos
    SELECT 
        'gastos'::VARCHAR(20) AS entity_type,
        (SELECT COUNT(*) FROM gastos) AS total_records,
        COUNT(ge.id) AS records_with_embeddings,
        ROUND((COUNT(ge.id)::NUMERIC / NULLIF((SELECT COUNT(*) FROM gastos), 0)) * 100, 2) AS coverage_percentage,
        AVG(SQRT(
            (SELECT SUM(val * val) FROM unnest(ge.embedding) AS val)
        )) AS avg_vector_magnitude,
        MIN(ge.created_at) AS oldest_embedding,
        MAX(ge.created_at) AS newest_embedding
    FROM gastos_embeddings ge
    
    UNION ALL
    
    -- Estadísticas de ingresos
    SELECT 
        'ingresos'::VARCHAR(20) AS entity_type,
        (SELECT COUNT(*) FROM ingresos) AS total_records,
        COUNT(ie.id) AS records_with_embeddings,
        ROUND((COUNT(ie.id)::NUMERIC / NULLIF((SELECT COUNT(*) FROM ingresos), 0)) * 100, 2) AS coverage_percentage,
        AVG(SQRT(
            (SELECT SUM(val * val) FROM unnest(ie.embedding) AS val)
        )) AS avg_vector_magnitude,
        MIN(ie.created_at) AS oldest_embedding,
        MAX(ie.created_at) AS newest_embedding
    FROM ingresos_embeddings ie;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCIÓN: search_gastos_with_filters
-- Descripción: Búsqueda vectorial de gastos con filtros adicionales
-- Parámetros:
--   - query_embedding: Vector de consulta
--   - limit_results: Cantidad de resultados
--   - similarity_threshold: Umbral de similitud
--   - categoria_filter: Filtro opcional por categoría
--   - fecha_desde: Filtro opcional fecha inicial
--   - fecha_hasta: Filtro opcional fecha final
--   - monto_min: Filtro opcional monto mínimo
--   - monto_max: Filtro opcional monto máximo
-- ============================================================
CREATE OR REPLACE FUNCTION search_gastos_with_filters(
    query_embedding vector(1536),
    limit_results INTEGER DEFAULT 10,
    similarity_threshold FLOAT DEFAULT 0.7,
    categoria_filter VARCHAR(100) DEFAULT NULL,
    fecha_desde DATE DEFAULT NULL,
    fecha_hasta DATE DEFAULT NULL,
    monto_min DECIMAL DEFAULT NULL,
    monto_max DECIMAL DEFAULT NULL
)
RETURNS TABLE (
    gasto_id INTEGER,
    descripcion TEXT,
    monto DECIMAL,
    fecha DATE,
    categoria VARCHAR(100),
    moneda VARCHAR(10),
    similarity FLOAT,
    texto_embedding TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id AS gasto_id,
        g.descripcion,
        g.monto,
        g.fecha,
        g.categoria,
        g.moneda,
        (1 - (ge.embedding <=> query_embedding)) AS similarity,
        ge.texto_original AS texto_embedding
    FROM gastos_embeddings ge
    INNER JOIN gastos g ON ge.gasto_id = g.id
    WHERE (1 - (ge.embedding <=> query_embedding)) >= similarity_threshold
        AND (categoria_filter IS NULL OR g.categoria = categoria_filter)
        AND (fecha_desde IS NULL OR g.fecha >= fecha_desde)
        AND (fecha_hasta IS NULL OR g.fecha <= fecha_hasta)
        AND (monto_min IS NULL OR g.monto >= monto_min)
        AND (monto_max IS NULL OR g.monto <= monto_max)
    ORDER BY ge.embedding <=> query_embedding ASC
    LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCIÓN: search_ingresos_with_filters
-- Descripción: Búsqueda vectorial de ingresos con filtros adicionales
-- ============================================================
CREATE OR REPLACE FUNCTION search_ingresos_with_filters(
    query_embedding vector(1536),
    limit_results INTEGER DEFAULT 10,
    similarity_threshold FLOAT DEFAULT 0.7,
    categoria_filter VARCHAR(100) DEFAULT NULL,
    fecha_desde DATE DEFAULT NULL,
    fecha_hasta DATE DEFAULT NULL,
    monto_min DECIMAL DEFAULT NULL,
    monto_max DECIMAL DEFAULT NULL
)
RETURNS TABLE (
    ingreso_id INTEGER,
    descripcion TEXT,
    monto DECIMAL,
    fecha DATE,
    categoria VARCHAR(100),
    moneda VARCHAR(10),
    similarity FLOAT,
    texto_embedding TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id AS ingreso_id,
        i.descripcion,
        i.monto,
        i.fecha,
        i.categoria,
        i.moneda,
        (1 - (ie.embedding <=> query_embedding)) AS similarity,
        ie.texto_original AS texto_embedding
    FROM ingresos_embeddings ie
    INNER JOIN ingresos i ON ie.ingreso_id = i.id
    WHERE (1 - (ie.embedding <=> query_embedding)) >= similarity_threshold
        AND (categoria_filter IS NULL OR i.categoria = categoria_filter)
        AND (fecha_desde IS NULL OR i.fecha >= fecha_desde)
        AND (fecha_hasta IS NULL OR i.fecha <= fecha_hasta)
        AND (monto_min IS NULL OR i.monto >= monto_min)
        AND (monto_max IS NULL OR i.monto <= monto_max)
    ORDER BY ie.embedding <=> query_embedding ASC
    LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- COMENTARIOS EN LAS FUNCIONES
-- ============================================================
COMMENT ON FUNCTION search_gastos_by_vector IS 'Búsqueda vectorial en gastos usando similitud de coseno';
COMMENT ON FUNCTION search_ingresos_by_vector IS 'Búsqueda vectorial en ingresos usando similitud de coseno';
COMMENT ON FUNCTION search_combined_by_vector IS 'Búsqueda vectorial combinada en gastos e ingresos';
COMMENT ON FUNCTION get_embedding_stats IS 'Estadísticas de cobertura y calidad de embeddings';
COMMENT ON FUNCTION search_gastos_with_filters IS 'Búsqueda vectorial de gastos con filtros por categoría, fecha y monto';
COMMENT ON FUNCTION search_ingresos_with_filters IS 'Búsqueda vectorial de ingresos con filtros por categoría, fecha y monto';

-- Mensajes informativos
\echo '✓ Función search_gastos_by_vector creada'
\echo '✓ Función search_ingresos_by_vector creada'
\echo '✓ Función search_combined_by_vector creada'
\echo '✓ Función get_embedding_stats creada'
\echo '✓ Funciones de búsqueda con filtros creadas'
\echo ''
\echo '=================================================='
\echo 'CONFIGURACIÓN DE BASE DE DATOS COMPLETADA'
\echo '=================================================='
\echo 'Extensión pgvector: ✓'
\echo 'Tablas de embeddings: ✓'
\echo 'Índices vectoriales: ✓'
\echo 'Funciones de búsqueda: ✓'
\echo 'Triggers automáticos: ✓'
\echo '=================================================='
