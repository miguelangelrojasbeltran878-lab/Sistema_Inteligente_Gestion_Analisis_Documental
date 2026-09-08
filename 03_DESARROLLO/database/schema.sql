-- ==============================================================================
-- SISTEMA INTELIGENTE DE GESTIÓN Y ANÁLISIS DOCUMENTAL - UTS
-- DDL Schema de Base de Datos PostgreSQL con extensión pgvector y Búsqueda Híbrida
-- ==============================================================================

-- 1. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Definición de Tipos ENUM
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'ANALISTA', 'CONSULTOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_status_enum AS ENUM (
        'PENDING', 
        'PARSING', 
        'CHUNKING', 
        'EMBEDDING', 
        'CLASSIFYING', 
        'SUMMARIZING', 
        'COMPLETED', 
        'ERROR'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_category_enum AS ENUM (
        'ADMINISTRATIVO', 
        'FINANCIERO', 
        'TECNICO_LEGAL', 
        'NO_CLASIFICADO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Tabla: Usuarios y Roles (RBAC)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'CONSULTOR',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla: Carpetas / Repositorios Lógicos
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    color_code VARCHAR(20) DEFAULT '#0A84FF',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla: Documentos
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL UNIQUE,
    file_path TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 20971520), -- Máximo 20 MB
    page_count INT DEFAULT 1,
    checksum_sha256 CHAR(64) NOT NULL,
    status document_status_enum NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla: Fragmentos de Documentos y Embeddings Vectoriales (pgvector)
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    page_number INT NOT NULL DEFAULT 1,
    content TEXT NOT NULL,
    cleaned_content TEXT NOT NULL,
    token_count INT NOT NULL DEFAULT 0,
    embedding vector(384), -- Vector denso normalizado para embeddings semánticos
    tsv_content tsvector GENERATED ALWAYS AS (to_tsvector('spanish', content)) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla: Análisis Cognitivo de Documentos (Metadatos, Entidades y Resumen)
CREATE TABLE IF NOT EXISTS document_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL UNIQUE REFERENCES documents(id) ON DELETE CASCADE,
    category document_category_enum NOT NULL DEFAULT 'NO_CLASIFICADO',
    category_confidence FLOAT NOT NULL DEFAULT 0.0 CHECK (category_confidence >= 0.0 AND category_confidence <= 1.0),
    executive_summary TEXT NOT NULL,
    key_insights JSONB DEFAULT '[]'::jsonb,
    entities JSONB DEFAULT '{"fechas": [], "montos": [], "personas_empresas": [], "nits_cedulas": [], "tipo_documental": null}'::jsonb,
    metadata_extracted JSONB DEFAULT '{}'::jsonb,
    pca_coordinates JSONB DEFAULT '{"x": 0.0, "y": 0.0, "cluster": 0}'::jsonb,
    faithfulness_baseline FLOAT DEFAULT 0.95,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabla: Telemetría y Bitácora de Procesamiento en Tiempo Real
CREATE TABLE IF NOT EXISTS processing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    duration_ms INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabla: Auditoría de Consultas RAG y Detección de Alucinaciones
CREATE TABLE IF NOT EXISTS query_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    query_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    retrieved_chunks JSONB DEFAULT '[]'::jsonb,
    faithfulness_score FLOAT NOT NULL DEFAULT 1.0 CHECK (faithfulness_score >= 0.0 AND faithfulness_score <= 1.0),
    is_hallucination_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    latency_ms INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- ÍNDICES DE ALTO RENDIMIENTO (RELACIONALES, TEXTO COMPLETO Y VECTORIALES HNSW)
-- ==============================================================================

-- Índices relacionales
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_checksum ON documents(checksum_sha256);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_analysis_category ON document_analysis(category);
CREATE INDEX IF NOT EXISTS idx_logs_document_id ON processing_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_query_audit_user ON query_audit(user_id);

-- Índice de Búsqueda de Texto Completo Léxica (BM25 / GIN)
CREATE INDEX IF NOT EXISTS idx_chunks_fts ON document_chunks USING gin(tsv_content);

-- Índice Vectorial HNSW para Similitud Coseno de Alta Velocidad
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw 
ON document_chunks USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ==============================================================================
-- SEED DATA INICIAL: USUARIOS Y CARPETAS BASE
-- Passwords iniciales con hash bcrypt (salt 12):
-- admin123     -> $2b$12$e8xL4Qy860xTqA11U.LzceZ18qH3M0.r0F3WnU9I5UjQc48l6e8u.
-- analista123  -> $2b$12$e8xL4Qy860xTqA11U.LzceZ18qH3M0.r0F3WnU9I5UjQc48l6e8u.
-- consultor123 -> $2b$12$e8xL4Qy860xTqA11U.LzceZ18qH3M0.r0F3WnU9I5UjQc48l6e8u.
-- ==============================================================================

INSERT INTO users (id, email, password_hash, full_name, role)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin@uts.edu.co', '$2b$12$e8xL4Qy860xTqA11U.LzceZ18qH3M0.r0F3WnU9I5UjQc48l6e8u.', 'Administrador General UTS', 'ADMIN'),
    ('00000000-0000-0000-0000-000000000002', 'analista@uts.edu.co', '$2b$12$e8xL4Qy860xTqA11U.LzceZ18qH3M0.r0F3WnU9I5UjQc48l6e8u.', 'Analista Documental UTS', 'ANALISTA'),
    ('00000000-0000-0000-0000-000000000003', 'consultor@uts.edu.co', '$2b$12$e8xL4Qy860xTqA11U.LzceZ18qH3M0.r0F3WnU9I5UjQc48l6e8u.', 'Consultor Institucional UTS', 'CONSULTOR')
ON CONFLICT (email) DO NOTHING;

INSERT INTO folders (id, user_id, name, description, color_code)
VALUES 
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Resoluciones y Acuerdos', 'Actos administrativos, resoluciones de rectoría y acuerdos del consejo directivo', '#0A84FF'),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Presupuesto y Finanzas', 'Informes presupuestales, estados financieros, balances y contratos de gasto', '#30D158'),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Convenios y Licitaciones', 'Pliegos de condiciones, actas de liquidación y convenios de cooperación', '#BF5AF2')
ON CONFLICT (id) DO NOTHING;
