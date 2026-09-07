import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

OUTPUT_DIR = r"c:\Users\Lenovo\OneDrive\Documentos\Sistema_Inteligente_Gestion_Analisis_Documental\02_DISENO"

def create_base_doc():
    doc = Document()
    for s in doc.sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)
    return doc

def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_header_block(doc, title, subtitle):
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_p.paragraph_format.space_after = Pt(2)
    r1 = title_p.add_run(title)
    r1.font.name = 'Arial'
    r1.font.size = Pt(16)
    r1.font.bold = True
    r1.font.color.rgb = RGBColor(14, 56, 122)

    sub_p = doc.add_paragraph()
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_p.paragraph_format.space_after = Pt(12)
    r2 = sub_p.add_run(subtitle)
    r2.font.name = 'Arial'
    r2.font.size = Pt(10)
    r2.font.italic = True
    r2.font.color.rgb = RGBColor(90, 90, 90)

def add_heading_1(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(6)
    r = p.add_run(text)
    r.font.name = 'Arial'
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(14, 56, 122)
    return p

def add_heading_2(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run(text)
    r.font.name = 'Arial'
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = RGBColor(30, 80, 160)
    return p

def add_p(doc, text, bold_prefix=None, space_after=4):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Arial'
        r_pre.font.bold = True
        r_pre.font.size = Pt(9.5)
        r_pre.font.color.rgb = RGBColor(20, 20, 20)
    r = p.add_run(text)
    r.font.name = 'Arial'
    r.font.size = Pt(9.5)
    r.font.color.rgb = RGBColor(40, 40, 40)
    return p

def add_bullet(doc, text, bold_prefix=None):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Arial'
        r_pre.font.bold = True
        r_pre.font.size = Pt(9.5)
        r_pre.font.color.rgb = RGBColor(20, 20, 20)
    r = p.add_run(text)
    r.font.name = 'Arial'
    r.font.size = Pt(9.5)
    r.font.color.rgb = RGBColor(40, 40, 40)
    return p

def add_code_block(doc, code_text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.left_indent = Inches(0.2)
    p.paragraph_format.right_indent = Inches(0.2)
    r = p.add_run(code_text)
    r.font.name = 'Consolas'
    r.font.size = Pt(8.5)
    r.font.color.rgb = RGBColor(30, 30, 30)

def add_table(doc, headers, rows_data, col_widths=None):
    table = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], "0E387A")
        set_cell_margins(hdr_cells[i], 100, 100, 120, 120)
        for p in hdr_cells[i].paragraphs:
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            for run in p.runs:
                run.font.name = 'Arial'
                run.font.size = Pt(9)
                run.font.bold = True
                run.font.color.rgb = RGBColor(255, 255, 255)

    for r_idx, row in enumerate(rows_data):
        row_cells = table.rows[r_idx + 1].cells
        bg_color = "F4F6F9" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row):
            row_cells[c_idx].text = str(val)
            set_cell_background(row_cells[c_idx], bg_color)
            set_cell_margins(row_cells[c_idx], 80, 80, 100, 100)
            for p in row_cells[c_idx].paragraphs:
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                for run in p.runs:
                    run.font.name = 'Arial'
                    run.font.size = Pt(8.5)
                    run.font.color.rgb = RGBColor(40, 40, 40)

    if col_widths:
        for row in table.rows:
            for i, w in enumerate(col_widths):
                row.cells[i].width = Inches(w)

    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_after = Pt(6)

# ==============================================================================
# DOC 1: DIAGRAMA DE ARQUITECTURA
# ==============================================================================
def build_doc1():
    doc = create_base_doc()
    add_header_block(doc, "DOCUMENTO DE ARQUITECTURA DE SOFTWARE (SAD)",
                     "Sistema Inteligente de Gestión y Análisis Documental | Unidades Tecnológicas de Santander (UTS)\nVersión 1.0.0 - Línea Base de Diseño")

    add_heading_1(doc, "1. Control de Cambios y Línea Base de Diseño")
    headers = ["Versión", "Fecha", "Autor(es)", "Rol", "Descripción del Cambio", "Estado"]
    rows = [["1.0.0", "06/09/2026", "Equipo de Arquitectura UTS", "Arquitecto de Software Senior", "Definición de arquitectura en microservicios, diagramas Mermaid, ADRs y seguridad.", "Aprobado"]]
    add_table(doc, headers, rows, [0.8, 1.0, 1.4, 1.4, 1.8, 0.8])

    add_heading_1(doc, "2. Vista General de la Arquitectura")
    add_heading_2(doc, "2.1 Patrón Arquitectónico Seleccionado")
    add_p(doc, "Para el Sistema Inteligente de Gestión y Análisis Documental de las UTS se adopta una Arquitectura de Microservicios Desacoplados Orientada a Eventos Asíncronos. Esta elección permite segregar el tráfico transaccional de gestión de usuarios y carpetas (Java Spring Boot) de las tareas intensivas en cómputo de OCR, chunking, embeddings y generación RAG (Python FastAPI/Celery), garantizando escalabilidad horizontal independiente y tolerancia a fallos.")
    
    add_heading_2(doc, "2.2 Descripción de Capas del Sistema")
    add_bullet(doc, "Desarrollada en React 18, TypeScript y TailwindCSS con Axios e interceptores JWT.", "Capa de Presentación (Frontend SPA): ")
    add_bullet(doc, "Desarrollada en Spring Boot 3.x REST API, responsable de la autenticación JWT, RBAC, auditoría y orquestación de tareas.", "Capa de Negocio y Orquestación (Backend REST): ")
    add_bullet(doc, "Implementada en Python con FastAPI y Celery; ejecuta PyMuPDF, OCR Tesseract, Sentence-Transformers y RAG con LLM.", "Capa de Inteligencia Artificial (Microservicio IA): ")
    add_bullet(doc, "PostgreSQL 16 para datos relacionales, extensión pgvector para embeddings y volumen local persistente para archivos binarios.", "Capa de Persistencia y Storage: ")

    add_heading_1(doc, "3. Diagramas Arquitectónicos (Sintaxis Mermaid)")
    add_heading_2(doc, "3.1 Diagrama de Arquitectura General del Sistema")
    mermaid_arch = """flowchart TB
    UI["Frontend Web (React + Tailwind)"] -->|"HTTPS / JWT"| Gateway["API Gateway (Spring Boot)"]
    Gateway --> Auth["Auth & RBAC Service"]
    Gateway --> DocMgr["Document Manager"]
    Gateway --> Audit["Audit Logger"]
    DocMgr -->|"Storage"| FileStore[("File Storage")]
    DocMgr -->|"Metadata"| Postgres[("PostgreSQL 16")]
    DocMgr -->|"Async Tasks"| AIEngine["AI Service (Python FastAPI)"]
    AIEngine --> OCR["OCR / Text Extractor"]
    AIEngine --> Classif["Classifier (Administrativo/Financiero/Técnico)"]
    AIEngine --> SumExt["Summarizer & JSON Schema Extractor"]
    AIEngine --> VecStore[("pgvector Store")]
    UI -->|"Query RAG"| Gateway
    Gateway -->|"RAG Ingestion"| AIEngine"""
    add_code_block(doc, mermaid_arch)

    add_heading_2(doc, "3.2 Diagrama de Componentes")
    mermaid_comp = """classDiagram
    class AuthController { +login() +refresh() }
    class DocumentController { +upload() +getAnalysis() +queryRAG() }
    class SecurityService { +validateToken() +checkRBAC() }
    class DocumentService { +saveFile() +notifyAIPipeline() }
    class AIPipelineClient { +processDoc() +executeRAG() }
    class VectorStoreClient { +storeVectors() +similaritySearch() }
    AuthController --> SecurityService
    DocumentController --> DocumentService
    DocumentController --> AIPipelineClient
    AIPipelineClient --> VectorStoreClient"""
    add_code_block(doc, mermaid_comp)

    add_heading_2(doc, "3.3 Diagrama de Despliegue en Contenedores (Docker)")
    mermaid_deploy = """flowchart LR
    Host["Ubuntu Linux 24.04 LTS (Docker Host)"]
    Nginx["Nginx (443/80)"] --> SpringApp["Spring Boot API (:8080)"]
    SpringApp --> Postgres["PostgreSQL 16 + pgvector (:5432)"]
    SpringApp --> FastAPI["FastAPI AI Service (:8000)"]
    FastAPI --> Redis["Redis Queue (:6379)"]
    FastAPI --> Postgres
    FastAPI --> Volume["/var/data/documents"]"""
    add_code_block(doc, mermaid_deploy)

    add_heading_2(doc, "3.4 Diagramas de Secuencia")
    add_p(doc, "Secuencia 1: Carga, Parseo, Clasificación y Resumen con IA", "Flujo Documental: ")
    seq1 = """sequenceDiagram
    Analista->>UI: Sube archivo (PDF/DOCX/TXT)
    UI->>API: POST /api/v1/documents/upload
    API->>Storage: Guarda binario
    API->>DB: INSERT documento (PENDING)
    API->>AI: POST /internal/v1/process-document
    AI->>AI: OCR/Text Extraction + Chunking + Embeddings
    AI->>DB: Guarda vectores (pgvector)
    AI->>AI: Clasificación + Resumen + JSON Extractor
    AI->>DB: UPDATE estado = COMPLETED"""
    add_code_block(doc, seq1)

    add_p(doc, "Secuencia 2: Consulta Semántica en Lenguaje Natural con RAG", "Flujo RAG: ")
    seq2 = """sequenceDiagram
    Consultor->>UI: Pregunta en lenguaje natural
    UI->>API: POST /api/v1/documents/query
    API->>AI: POST /internal/v1/rag/query
    AI->>AI: Genera vector de consulta
    AI->>pgvector: Búsqueda por similitud coseno (Top-4 chunks)
    pgvector-->>AI: Retorna fragmentos relevantes
    AI->>LLM: Inyecta prompt con contexto delimitado
    LLM-->>AI: Respuesta con citas exactas
    AI-->>UI: Retorna respuesta + fuentes [Doc, Pág]"""
    add_code_block(doc, seq2)

    add_heading_1(doc, "4. Decisiones Tecnológicas (ADR - Architecture Decision Records)")
    adr_headers = ["ID ADR", "Componente", "Opción Elegida", "Alternativas", "Justificación Técnica"]
    adr_rows = [
        ["ADR-01", "Backend Principal", "Java Spring Boot 3.x", "Node.js, Django, .NET", "Seguridad empresarial robusta (Spring Security), tipado fuerte y rendimiento."],
        ["ADR-02", "Microservicio IA", "Python 3.11 + FastAPI", "Flask, Go, Tornado", "Ecosistema líder en IA/NLP y ejecución asíncrona de alto desempeño."],
        ["ADR-03", "Embeddings", "Sentence-Transformers", "OpenAI, Cohere", "Ejecución local compacta (384 dim), sin costos de API y total privacidad."],
        ["ADR-04", "Base de Datos/Vectores", "PostgreSQL 16 + pgvector", "Pinecone, MySQL", "Unificación relacional y vectorial ACID con índices HNSW en un solo motor."],
        ["ADR-05", "Extracción/OCR", "PyMuPDF + Tesseract 5", "PDFMiner, Tika", "Velocidad de parsing 10x superior y OCR neural LSTM de alta precisión."],
        ["ADR-06", "Frontend", "React 18 + TailwindCSS", "Angular, Vue", "Modularidad, tipado con TypeScript y experiencia visual moderna."]
    ]
    add_table(doc, adr_headers, adr_rows, [0.7, 1.3, 1.4, 1.1, 2.7])

    add_heading_1(doc, "5. Diseño de Seguridad")
    add_bullet(doc, "Variables sensibles (JWT_SECRET_KEY, DB_PASS, API_KEYS) aisladas en .env y runtime de Docker.", "Manejo de Secretos: ")
    add_bullet(doc, "Segregación estricta de permisos para ADMIN (total), ANALISTA (carga/edición) y CONSULTOR (lectura/RAG).", "Control RBAC: ")
    add_bullet(doc, "Validación de Magic Bytes binarios, sanitización de rutas UUID v4 y límite de 20 MB por archivo.", "Sanitización de Archivos: ")

    doc.save(os.path.join(OUTPUT_DIR, "01_Diagrama_de_Arquitectura.docx"))
    print("Design Doc 1 generated.")

# ==============================================================================
# DOC 2: MODELO Y DICCIONARIO DE DATOS
# ==============================================================================
def build_doc2():
    doc = create_base_doc()
    add_header_block(doc, "MODELO Y DICCIONARIO DE DATOS TÉCNICO",
                     "Sistema Inteligente de Gestión y Análisis Documental | Unidades Tecnológicas de Santander (UTS)\nMotor: PostgreSQL 16 + Extensión pgvector")

    add_heading_1(doc, "1. Descripción del Modelo de Datos")
    add_p(doc, "El modelo combina integridad relacional estricta para usuarios, carpetas y bitácora de auditoría, soporte JSONB para entidades extraídas dinámicamente por la IA y almacenamiento vectorial denso con pgvector para búsquedas semánticas aceleradas con índices HNSW.")

    add_heading_1(doc, "2. Diagrama Entidad-Relación (Mermaid ERD)")
    mermaid_erd = """erDiagram
    users ||--o{ folders : "crea"
    users ||--o{ documents : "sube"
    users ||--o{ queries_history : "consulta"
    folders ||--o{ documents : "contiene"
    documents ||--|| document_analysis : "posee"
    documents ||--o{ document_chunks : "fragmenta en"
    documents ||--o{ processing_logs : "registra"

    users { UUID id PK, VARCHAR email UK, VARCHAR password_hash, VARCHAR role, VARCHAR status, TIMESTAMP created_at }
    folders { UUID id PK, UUID user_id FK, VARCHAR name, TEXT description, TIMESTAMP created_at }
    documents { UUID id PK, UUID folder_id FK, UUID user_id FK, VARCHAR file_name, VARCHAR file_path, VARCHAR file_type, BIGINT file_size, VARCHAR status, VARCHAR file_hash, TIMESTAMP created_at }
    document_analysis { UUID id PK, UUID document_id FK, VARCHAR category, TEXT summary, JSONB extracted_data, FLOAT confidence_score, TIMESTAMP processed_at }
    document_chunks { UUID id PK, UUID document_id FK, INTEGER chunk_index, TEXT text_content, VECTOR embedding_vector, INTEGER page_number, TIMESTAMP created_at }
    processing_logs { UUID id PK, UUID document_id FK, VARCHAR stage, VARCHAR status, TEXT error_message, TIMESTAMP executed_at }
    queries_history { UUID id PK, UUID user_id FK, TEXT query_text, TEXT response_text, JSONB sources_cited, FLOAT latency_seconds, TIMESTAMP created_at }"""
    add_code_block(doc, mermaid_erd)

    add_heading_1(doc, "3. Diccionario de Datos Técnico")
    
    tables_dict = [
        ("users", [
            ["id", "UUID", "16 B", "PK", "NOT NULL", "Identificador único universal", "gen_random_uuid()"],
            ["email", "VARCHAR", "150", "UK", "NOT NULL", "Correo institucional único", "Ninguno"],
            ["password_hash", "VARCHAR", "255", "-", "NOT NULL", "Hash BCrypt de la contraseña", "Ninguno"],
            ["role", "VARCHAR", "20", "-", "NOT NULL", "Rol (ADMIN, ANALISTA, CONSULTOR)", "'CONSULTOR'"],
            ["status", "VARCHAR", "20", "-", "NOT NULL", "Estado (ACTIVE, INACTIVE)", "'ACTIVE'"],
            ["created_at", "TIMESTAMP", "8 B", "-", "NOT NULL", "Fecha de creación de la cuenta", "CURRENT_TIMESTAMP"]
        ]),
        ("folders", [
            ["id", "UUID", "16 B", "PK", "NOT NULL", "Identificador de la carpeta", "gen_random_uuid()"],
            ["user_id", "UUID", "16 B", "FK", "NOT NULL", "Usuario creador (users.id)", "Ninguno"],
            ["name", "VARCHAR", "100", "-", "NOT NULL", "Nombre de la carpeta lógica", "Ninguno"],
            ["description", "TEXT", "Var", "-", "NULL", "Descripción de la carpeta", "NULL"],
            ["created_at", "TIMESTAMP", "8 B", "-", "NOT NULL", "Fecha de creación", "CURRENT_TIMESTAMP"]
        ]),
        ("documents", [
            ["id", "UUID", "16 B", "PK", "NOT NULL", "Identificador único del archivo", "gen_random_uuid()"],
            ["folder_id", "UUID", "16 B", "FK", "NOT NULL", "Carpeta contenedora (folders.id)", "Ninguno"],
            ["user_id", "UUID", "16 B", "FK", "NOT NULL", "Usuario que subió (users.id)", "Ninguno"],
            ["file_name", "VARCHAR", "255", "-", "NOT NULL", "Nombre original del archivo", "Ninguno"],
            ["file_path", "VARCHAR", "500", "-", "NOT NULL", "Ruta física de almacenamiento", "Ninguno"],
            ["file_type", "VARCHAR", "10", "-", "NOT NULL", "Extensión (PDF, DOCX, TXT)", "Ninguno"],
            ["file_size", "BIGINT", "8 B", "-", "NOT NULL", "Tamaño en bytes", "Ninguno"],
            ["status", "VARCHAR", "20", "-", "NOT NULL", "PENDING, PROCESSING, COMPLETED, ERROR", "'PENDING'"],
            ["file_hash", "VARCHAR", "64", "-", "NOT NULL", "Hash SHA-256 de integridad", "Ninguno"],
            ["created_at", "TIMESTAMP", "8 B", "-", "NOT NULL", "Fecha y hora de subida", "CURRENT_TIMESTAMP"]
        ]),
        ("document_analysis", [
            ["id", "UUID", "16 B", "PK", "NOT NULL", "Identificador del análisis", "gen_random_uuid()"],
            ["document_id", "UUID", "16 B", "FK, UK", "NOT NULL", "Documento origen (documents.id)", "Ninguno"],
            ["category", "VARCHAR", "50", "-", "NOT NULL", "Administrativo, Financiero, Técnico/Legal", "'Por Clasificar'"],
            ["summary", "TEXT", "Var", "-", "NOT NULL", "Resumen ejecutivo del LLM", "Ninguno"],
            ["extracted_data", "JSONB", "Var", "-", "NOT NULL", "Entidades extraídas en JSON", "'{}'::jsonb"],
            ["confidence_score", "FLOAT", "4 B", "-", "NOT NULL", "Puntaje de confianza (0.0 a 1.0)", "0.0"],
            ["processed_at", "TIMESTAMP", "8 B", "-", "NOT NULL", "Fecha de culminación análisis", "CURRENT_TIMESTAMP"]
        ]),
        ("document_chunks", [
            ["id", "UUID", "16 B", "PK", "NOT NULL", "Identificador del chunk", "gen_random_uuid()"],
            ["document_id", "UUID", "16 B", "FK", "NOT NULL", "Documento origen (documents.id)", "Ninguno"],
            ["chunk_index", "INTEGER", "4 B", "-", "NOT NULL", "Posición ordinal del fragmento", "Ninguno"],
            ["text_content", "TEXT", "Var", "-", "NOT NULL", "Texto plano del fragmento", "Ninguno"],
            ["embedding_vector", "VECTOR(384)", "1.5 KB", "-", "NOT NULL", "Vector denso de características", "Ninguno"],
            ["page_number", "INTEGER", "4 B", "-", "NULL", "Número de página de origen", "1"],
            ["created_at", "TIMESTAMP", "8 B", "-", "NOT NULL", "Fecha de indexación", "CURRENT_TIMESTAMP"]
        ]),
        ("processing_logs", [
            ["id", "UUID", "16 B", "PK", "NOT NULL", "Identificador del log", "gen_random_uuid()"],
            ["document_id", "UUID", "16 B", "FK", "NOT NULL", "Documento asociado (documents.id)", "Ninguno"],
            ["stage", "VARCHAR", "50", "-", "NOT NULL", "EXTRACTION, OCR, CLASSIFICATION, RAG", "Ninguno"],
            ["status", "VARCHAR", "20", "-", "NOT NULL", "SUCCESS, ERROR, RETRY", "Ninguno"],
            ["error_message", "TEXT", "Var", "-", "NULL", "Traza técnica de excepción", "NULL"],
            ["executed_at", "TIMESTAMP", "8 B", "-", "NOT NULL", "Marca de tiempo del evento", "CURRENT_TIMESTAMP"]
        ]),
        ("queries_history", [
            ["id", "UUID", "16 B", "PK", "NOT NULL", "Identificador de la consulta", "gen_random_uuid()"],
            ["user_id", "UUID", "16 B", "FK", "NOT NULL", "Usuario consultante (users.id)", "Ninguno"],
            ["query_text", "TEXT", "Var", "-", "NOT NULL", "Pregunta en lenguaje natural", "Ninguno"],
            ["response_text", "TEXT", "Var", "-", "NOT NULL", "Respuesta fundamentada LLM", "Ninguno"],
            ["sources_cited", "JSONB", "Var", "-", "NOT NULL", "Citas y metadatos de sustento", "'[]'::jsonb"],
            ["latency_seconds", "FLOAT", "4 B", "-", "NOT NULL", "Tiempo de respuesta en segundos", "0.0"],
            ["created_at", "TIMESTAMP", "8 B", "-", "NOT NULL", "Fecha y hora de consulta", "CURRENT_TIMESTAMP"]
        ])
    ]

    col_headers = ["Campo", "Tipo SQL", "Tamaño", "Llave", "Nulidad", "Descripción", "Por Defecto"]
    for tbl_name, tbl_rows in tables_dict:
        add_heading_2(doc, f"Entidad: {tbl_name}")
        add_table(doc, col_headers, tbl_rows, [1.1, 0.9, 0.6, 0.5, 0.8, 2.0, 1.3])

    add_heading_1(doc, "4. Integridad Referencial, Restricciones e Índices")
    add_bullet(doc, "ON DELETE RESTRICT en usuarios y carpetas; ON DELETE CASCADE en document_analysis, document_chunks y logs para asegurar consistencia.", "Acciones en Cascada: ")
    add_bullet(doc, "Índices B-Tree en llaves foráneas y estados; Índice GIN en extracted_data (JSONB); Índice HNSW en embedding_vector para búsquedas vectoriales ultra-rápidas.", "Estrategia de Indexación: ")

    doc.save(os.path.join(OUTPUT_DIR, "02_Modelo_y_Diccionario_de_Datos.docx"))
    print("Design Doc 2 generated.")

# ==============================================================================
# DOC 3: ESPECIFICACIÓN DE API
# ==============================================================================
def build_doc3():
    doc = create_base_doc()
    add_header_block(doc, "ESPECIFICACIÓN TÉCNICA DE LA API REST",
                     "Sistema Inteligente de Gestión y Análisis Documental | Unidades Tecnológicas de Santander (UTS)\nEstándar: OpenAPI 3.0 / RESTful JSON Specification")

    add_heading_1(doc, "1. Estándares y Convenciones de la API")
    add_p(doc, "Todas las respuestas retornan una estructura JSON uniforme compuesta por: success (boolean), data (objeto/array), error (objeto con code y message) y timestamp (ISO 8601). Códigos HTTP estándar: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 413 Payload Too Large, 500 Internal Error y 503 Service Unavailable.")

    add_heading_1(doc, "2. Especificación Detallada de Endpoints")

    endpoints = [
        ("POST /api/v1/auth/login", "Pública (Sin Token)",
         "Autentica a un usuario institucional y retorna tokens JWT de acceso y refresco.",
         '{\n  "email": "analista.documental@uts.edu.co",\n  "password": "PasswordSeguro2026*"\n}',
         '200 OK:\n{\n  "success": true,\n  "data": {\n    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",\n    "refresh_token": "eyJhbGciOiJIUzI1...",\n    "user": { "id": "uuid", "role": "ANALISTA" }\n  }\n}\n\n401 Unauthorized:\n{\n  "success": false,\n  "error": { "code": "INVALID_CREDENTIALS", "message": "Credenciales inválidas" }\n}'),

        ("GET /api/v1/folders & POST /api/v1/folders", "Bearer Token (ADMIN, ANALISTA, CONSULTOR)",
         "Lista y crea carpetas lógicas para organizar los archivos institucionales.",
         'POST Body:\n{\n  "name": "Actas_Consejo_Directivo_2026",\n  "description": "Actas oficiales del año 2026"\n}',
         '201 Created:\n{\n  "success": true,\n  "data": { "id": "uuid-folder", "name": "Actas_Consejo_Directivo_2026" }\n}'),

        ("POST /api/v1/documents/upload", "Bearer Token (ADMIN, ANALISTA)",
         "Carga archivos binarios (PDF, DOCX, TXT <= 20MB) e inicia el pipeline de análisis de IA.",
         'Multipart Form Data:\n- file: [Binario PDF/DOCX/TXT]\n- folder_id: "uuid-carpeta"',
         '201 Created:\n{\n  "success": true,\n  "data": { "document_id": "uuid", "file_name": "Resolucion_045.pdf", "status": "PENDING" }\n}\n\n413 Payload Too Large:\n{\n  "success": false,\n  "error": { "code": "FILE_SIZE_EXCEEDED", "message": "Límite 20MB superado" }\n}'),

        ("GET /api/v1/documents/{id}", "Bearer Token (ADMIN, ANALISTA, CONSULTOR)",
         "Obtiene los metadatos y el estado actual de procesamiento del archivo.",
         'Path Param: id (UUID del documento)',
         '200 OK:\n{\n  "success": true,\n  "data": { "id": "uuid", "file_name": "Resolucion_045.pdf", "status": "COMPLETED", "file_hash": "sha256..." }\n}'),

        ("GET /api/v1/documents/{id}/analysis", "Bearer Token (ADMIN, ANALISTA, CONSULTOR)",
         "Retorna la clasificación multiclase, resumen ejecutivo y entidades JSON extraídas.",
         'Path Param: id (UUID del documento)',
         '200 OK:\n{\n  "success": true,\n  "data": {\n    "category": "Financiero",\n    "confidence_score": 0.94,\n    "summary": "La Resolución 045 aprueba $120.000.000 COP para laboratorios...",\n    "extracted_data": { "numero": "045-2026", "monto": 120000000, "emisor": "Rectoría" }\n  }\n}'),

        ("POST /api/v1/documents/query", "Bearer Token (ADMIN, ANALISTA, CONSULTOR)",
         "Ejecuta consulta semántica en lenguaje natural con motor RAG y retorna citas.",
         '{\n  "question": "¿Cuál es el presupuesto aprobado para los laboratorios?",\n  "folder_id": "uuid-folder"\n}',
         '200 OK:\n{\n  "success": true,\n  "data": {\n    "answer": "El presupuesto aprobado es de $120.000.000 COP...",\n    "sources": [{ "file_name": "Resolucion_045.pdf", "page": 2, "chunk_text": "..." }],\n    "latency_seconds": 1.42\n  }\n}'),

        ("GET /api/v1/dashboard/metrics", "Bearer Token (ADMIN, ANALISTA)",
         "Retorna indicadores consolidados del repositorio y estadísticas del pipeline de IA.",
         'Query Params: Opcionales (rango de fechas)',
         '200 OK:\n{\n  "success": true,\n  "data": {\n    "total_documents": 1420,\n    "status_distribution": { "COMPLETED": 1395, "PROCESSING": 8, "ERROR": 12 },\n    "category_distribution": { "Administrativo": 620, "Financiero": 480, "Técnico/Legal": 295 },\n    "success_rate_percentage": 98.24\n  }\n}'),

        ("GET /api/v1/logs", "Bearer Token (ADMIN)",
         "Consulta la bitácora de auditoría y trazas de error de procesamiento.",
         'Query Params: page=1, limit=20, status=ERROR',
         '200 OK:\n{\n  "success": true,\n  "data": {\n    "total_logs": 12,\n    "logs": [{ "document_id": "uuid", "stage": "EXTRACTION", "status": "ERROR", "error_message": "Corrupt PDF" }]\n  }\n}')
    ]

    for ep, auth, desc, req, resp in endpoints:
        add_heading_2(doc, ep)
        add_p(doc, auth, "Autenticación: ")
        add_p(doc, desc, "Descripción: ")
        add_p(doc, "", "Parámetros / Request Body:")
        add_code_block(doc, req)
        add_p(doc, "", "Respuestas HTTP:")
        add_code_block(doc, resp)

    doc.save(os.path.join(OUTPUT_DIR, "03_Especificacion_de_API.docx"))
    print("Design Doc 3 generated.")

# ==============================================================================
# DOC 4: MOCKUPS Y DISEÑO DE INTERFAZ
# ==============================================================================
def build_doc4():
    doc = create_base_doc()
    add_header_block(doc, "GUÍA DE DISEÑO DE INTERFAZ, MOCKUPS Y UX",
                     "Sistema Inteligente de Gestión y Análisis Documental | Unidades Tecnológicas de Santander (UTS)\nEstándar: Heurísticas de Nielsen / Diseño Atómico & WCAG 2.1 AA")

    add_heading_1(doc, "1. Directrices de Diseño y Guía de Estilos")
    add_bullet(doc, "Verde Institucional (#1B5E20), Azul Profundo (#0E387A), Fondo Neutro (#F8FAFC), Blanco (#FFFFFF) y semántica de estados (Verde #16A34A, Amarillo #EAB308, Rojo #DC2626).", "Paleta Cromática: ")
    add_bullet(doc, "Tipografía Inter / Roboto con escala jerárquica clara (H1: 24px, H2: 18px, Body: 14px, Badges: 12px).", "Tipografía: ")
    add_bullet(doc, "Iconos vectoriales limpios Lucide-React y diseño responsivo fluido (Mobile <768px, Tablet 768-1024px, Desktop >1024px).", "Iconografía y Responsive: ")

    add_heading_1(doc, "2. Especificación Detallada de Pantallas (Mockups)")
    
    mockups = [
        ("Pantalla 1: Login / Acceso de Usuarios",
         "Formulario centrado con identidad UTS, campos para correo (@uts.edu.co) y contraseña con toggle de visibilidad, botón verde de acción y enlace de ayuda TI.",
         """+------------------------------------+--------------------------------------------+
|   [LOGO UTS]                       |   Iniciar Sesión                           |
|   Unidades Tecnológicas Santander  |   Correo Institucional:                    |
|   Sistema Inteligente Documental   |   [ analista@uts.edu.co                  ] |
|                                    |   Contraseña: [ ****************     (o) ] |
|   "Conocimiento activo"            |   [   INICIAR SESIÓN (Verde UTS)   ]       |
+------------------------------------+--------------------------------------------+"""),

        ("Pantalla 2: Dashboard Principal",
         "4 tarjetas KPI (Total Docs, Tasa Éxito IA, Tiempo Medio, Storage), gráfico de categorías (Administrativo, Financiero, Técnico/Legal) y tabla de actividad reciente.",
         """+---------------------------------------------------------------------------------+
| UTS Documental | [Buscar...]                    (Notif) [Laura Gómez - Analista]|
+--------------+------------------------------------------------------------------+
| (o) Dashboard|  [Total Docs: 1,420] [Tasa Éxito: 98.2%] [Tiempo Medio: 4.15s]   |
| [ ] Carpetas |  Categorías: Administrativo (44%) | Financiero (34%) | Técnico(22%)|
| [ ] Subir    |  Actividad Reciente: Resolucion_045.pdf [OK] | Contrato.docx [OK]|
+--------------+------------------------------------------------------------------+"""),

        ("Pantalla 3: Explorador de Repositorios y Carga Documental",
         "Árbol de navegación de carpetas, zona Drag & Drop para PDF/DOCX/TXT (hasta 20MB) con barra de progreso y tabla de archivos contenidos con badges de estado.",
         """+---------------------------------------------------------------------------------+
| Repositorio > Actas_y_Resoluciones_2026                     [+ Nueva Carpeta]   |
+----------------------+----------------------------------------------------------+
| CARPETAS             |  ZONA DE CARGA (PDF, DOCX, TXT <= 20MB)                  |
| v Repositorio Raíz   |  [Icono Upload] Arrastra tus archivos aquí               |
|   v Actas_2026       |  Subiendo: Acta_Comite_08.docx [=========>  ] 78%        |
|     - Resoluciones   |  Tabla: Resolucion_045.pdf (4.5MB) [COMPLETED] [Ver]     |
+----------------------+----------------------------------------------------------+"""),

        ("Pantalla 4: Vista de Detalle Documental y Análisis de IA",
         "Ficha completa con resumen ejecutivo generado por LLM, tarjetas de datos clave extraídos (JSON schema) y visor de trazas de auditoría de cada fase.",
         """+---------------------------------------------------------------------------------+
| Detalle: Resolucion_Rectoral_045.pdf                    [Categoría: FINANCIERO] |
+---------------------------------------------------------------------------------+
| [Resumen Ejecutivo (IA)]                 | [Datos Clave Extraídos (JSON)]       |
| La Resolución 045 aprueba $120.000.000   | - N° Resolución: 045-2026            |
| para modernizar laboratorios de software | - Monto: $120.000.000 COP            |
| bajo supervisión de Vicerrectoría.       | - Emisor: Rectoría UTS               |
|                                          | Trazas: Extracción OK | RAG Index OK |
+---------------------------------------------------------------------------------+"""),

        ("Pantalla 5: Módulo de Consulta Inteligente (Chatbot RAG)",
         "Área de chat conversacional para preguntas en lenguaje natural sobre los documentos, con tarjetas desplegables de citas exactas (documento y página).",
         """+---------------------------------------------------------------------------------+
| Consulta Inteligente RAG | Alcance: [Todas las Carpetas v]                      |
+---------------------------------------------------------------------------------+
| (Usuario): ¿Cuál es el presupuesto aprobado para los laboratorios de software?  |
| (Asistente IA): El presupuesto aprobado es de $120.000.000 COP según rectoría.  |
| +-----------------------------------------------------------------------------+ |
| | Cita: Resolucion_Rectoral_045.pdf - Pág. 2 "...rubro de $120.000.000 COP..."| |
| +-----------------------------------------------------------------------------+ |
| [ Escribe una pregunta sobre los documentos...                      ] [ENVIAR ] |
+---------------------------------------------------------------------------------+""")
    ]

    for title, desc, mock in mockups:
        add_heading_2(doc, title)
        add_p(doc, desc)
        add_code_block(doc, mock)

    add_heading_1(doc, "3. Mapa de Navegación y Flujo de Usuario")
    flow_mermaid = """flowchart TD
    Login["Login"] --> Role{"Rol"}
    Role -->|ADMIN| Dash["Dashboard"]
    Role -->|ANALISTA| Exp["Explorador/Carga"]
    Role -->|CONSULTOR| RAG["Chat RAG"]
    Exp --> Upload["Subir Archivo"] --> Detail["Detalle IA"]
    Detail --> RAG"""
    add_code_block(doc, flow_mermaid)

    add_heading_1(doc, "4. Matriz de Componentes Reutilizables")
    comp_headers = ["Componente UI", "Propósito", "Estados Visuales", "Props Principales"]
    comp_rows = [
        ["Button", "Acciones primarias y secundarias", "Default, Hover, Active, Disabled, Loading", "variant, size, onClick"],
        ["StatusBadge", "Indicador de estado del documento", "PENDING, PROCESSING, COMPLETED, ERROR", "status, size"],
        ["FileDropzone", "Área drag-and-drop para PDF/DOCX/TXT", "Idle, DragOver, Uploading, Error", "maxSize (20MB), onUpload"],
        ["SourceCitationCard", "Tarjeta interactiva para citas RAG", "Colapsada, Expandida, Hover", "docName, page, snippet"],
        ["Modal", "Diálogos modales y creación de carpetas", "Abierto, Cerrado", "isOpen, title, onClose"],
        ["ToastAlert", "Notificaciones flotantes reactivas", "Success, Error, Warning, Info", "type, message, duration"]
    ]
    add_table(doc, comp_headers, comp_rows, [1.4, 2.2, 2.0, 1.6])

    doc.save(os.path.join(OUTPUT_DIR, "04_Mockups_y_Diseno_de_Interfaz.docx"))
    print("Design Doc 4 generated.")

if __name__ == "__main__":
    build_doc1()
    build_doc2()
    build_doc3()
    build_doc4()
    print("All 4 Design DOCX files generated successfully!")
