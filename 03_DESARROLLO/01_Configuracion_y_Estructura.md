# GUÍA DE CONFIGURACIÓN DEL ENTORNO, ARQUITECTURA DE DIRECTORIOS Y GITFLOW
## Proyecto: Sistema Inteligente de Gestión y Análisis Documental
### Institución: Unidades Tecnológicas de Santander (UTS)
### Versión: 1.0.0 - Línea Base de Desarrollo

---

## 1. DESCRIPCIÓN DEL ENTORNO DE DESARROLLO

### 1.1 Especificación de Tecnologías y Versiones Oficiales
Para garantizar la reproducibilidad y estabilidad del entorno de desarrollo entre los integrantes del equipo y los servidores de integración continua (CI/CD), se han fijado las siguientes versiones mínimas oficiales:

| Componente / Herramienta | Versión Oficial | Propósito en el Stack |
| :--- | :---: | :--- |
| **Node.js** | `v20.17.0 LTS` | Entorno de ejecución para herramientas de frontend y backend |
| **Python** | `3.11.9+` | Runtime para el microservicio de IA, OCR, embeddings y RAG |
| **Java OpenJDK (Opcional)** | `17 LTS / 21 LTS` | Runtime para backend empresarial Spring Boot (si aplica) |
| **PostgreSQL** | `16.3` | Motor de base de datos relacional primario |
| **pgvector** | `v0.7.0+` | Extensión de PostgreSQL para indexación y búsqueda vectorial HNSW |
| **Tesseract OCR** | `5.3.4+` | Motor OCR para extracción de texto en documentos escaneados |
| **Docker & Docker Compose** | `26.1.0+ / v2.27+` | Contenerización y orquestación unificada de servicios |
| **Git** | `2.45.0+` | Sistema de control de versiones distribuido |
| **Gestores de Paquetes** | `npm v10.8+` / `pip v24.0+` | Gestión de dependencias en JavaScript/TypeScript y Python |

---

### 1.2 Archivo de Configuración de Variables de Entorno (`.env.example`)
El siguiente bloque define la plantilla exhaustiva de variables de entorno requeridas por todos los microservicios del sistema:

```ini
# ==============================================================================
# CONFIGURACIÓN GENERAL DEL SISTEMA Y SERVIDOR
# ==============================================================================
NODE_ENV=development
APP_PORT=8080
API_PREFIX=/api/v1
APP_URL=http://localhost:8080
FRONTEND_URL=http://localhost:5173

# ==============================================================================
# SEGURIDAD Y AUTENTICACIÓN (JWT & BCRYPT)
# ==============================================================================
JWT_SECRET_KEY=uts_super_secret_jwt_key_2026_secure_sha256_minimum_64_chars!
JWT_EXPIRATION_SECONDS=3600
JWT_REFRESH_SECRET_KEY=uts_refresh_token_secret_key_2026_ultra_secure_hash!
JWT_REFRESH_EXPIRATION_SECONDS=604800
BCRYPT_SALT_ROUNDS=12

# ==============================================================================
# BASE DE DATOS RELACIONAL Y VECTORIAL (POSTGRESQL + PGVECTOR)
# ==============================================================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=uts_documental_db
DB_USER=postgres
DB_PASSWORD=uts_postgres_secure_2026
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_TIMEOUT_MS=10000

# ==============================================================================
# MICROSERVICIO DE IA Y MOTOR NLP (PYTHON / FASTAPI)
# ==============================================================================
AI_SERVICE_URL=http://localhost:8000
AI_INTERNAL_API_KEY=uts_internal_ai_token_secure_bridge_2026
EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
EMBEDDING_DIMENSION=384
CHUNK_SIZE_TOKENS=500
CHUNK_OVERLAP_TOKENS=100
VECTOR_TOP_K=4
VECTOR_SIMILARITY_THRESHOLD=0.65

# ==============================================================================
# PROVEEDOR LLM (GOOGLE GEMINI / OPENAI / OLLAMA)
# ==============================================================================
LLM_PROVIDER=gemini
GEMINI_API_KEY=AIzaSyD_EXAMPLE_KEY_UTS_DOCUMENTAL_2026
OPENAI_API_KEY=sk-EXAMPLE_OPENAI_KEY_FOR_FALLBACK
LLM_MODEL_NAME=gemini-1.5-flash
LLM_TEMPERATURE=0.1
LLM_MAX_TOKENS=1024

# ==============================================================================
# ALMACENAMIENTO DE ARCHIVOS Y RUTAS LOCALES
# ==============================================================================
STORAGE_TYPE=local
UPLOAD_DIR=./uploads/documents
MAX_FILE_SIZE_BYTES=20971520
ALLOWED_MIME_TYPES=application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain

# ==============================================================================
# REDIS / SISTEMA DE COLAS Y CACHÉ ASÍNCRONO
# ==============================================================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=uts_redis_cache_2026
```

---

### 1.3 Políticas de Seguridad para Manejo de Secretos y `.gitignore`
Para prevenir filtraciones accidentales de credenciales o binarios en el repositorio de código fuente, se aplican las siguientes reglas:
1. **Exclusión estricta de `.env`:** Solo se sube al control de versiones `.env.example` con valores de plantilla ficticios.
2. **Exclusión de archivos cargados por usuarios:** La carpeta `uploads/` se ignora para no comprometer datos sensibles de las UTS.
3. **Contenido oficial del archivo `.gitignore`:**

```gitignore
# Dependencias de Node y Python
node_modules/
dist/
build/
__pycache__/
*.py[cod]
*$py.class
.venv/
venv/
env/

# Archivos de entorno y credenciales
.env
.env.local
.env.*.local
*.pem
*.key

# Almacenamiento local de archivos y logs
uploads/
/uploads/*
!/uploads/.gitkeep
logs/
*.log

# Bases de datos y almacenamiento local
data/
*.sqlite
*.db

# IDEs y Editores
.vscode/
.idea/
*.swp
.DS_Store
```

---

## 2. ESTRUCTURA COMPLETA DEL CÓDIGO FUENTE (ÁRBOL DE DIRECTORIOS)

El proyecto se estructura bajo un esquema modular con responsabilidades claramente delimitadas:

```
Sistema_Inteligente_Gestion_Analisis_Documental/
│
├── .env.example                     # Plantilla oficial de variables de entorno
├── .gitignore                       # Reglas de exclusión de Git
├── README.md                        # Documentación general y guía de arranque
├── docker-compose.yml               # Orquestación de servicios locales (DB, Redis, API, AI)
│
├── 01_ANALISIS/                     # Documentación de Fase de Análisis (IEEE 830, HU, RTM)
├── 02_DISENO/                       # Documentación de Fase de Diseño (SAD, ERD, API, UI)
├── 03_DESARROLLO/                   # Documentación de Fase de Desarrollo
├── 04_PRUEBAS/                      # Planes y matrices de aseguramiento de calidad QA
├── 05_IMPLEMENTACION/               # Guías de despliegue, Dockerfile y manuales de usuario
│
├── frontend/                        # Aplicación Web Cliente (React + Vite + TailwindCSS)
│   ├── public/                      # Recursos estáticos institucionales (logos, favicons)
│   ├── src/
│   │   ├── assets/                  # Imágenes y estilos globales
│   │   ├── components/              # Componentes UI reutilizables (Buttons, Modals, Badges)
│   │   │   ├── common/              # Navbar, Sidebar, Toast, Spinners
│   │   │   ├── dashboard/           # Métricas, gráficos de categorías y contadores
│   │   │   ├── documents/           # FileDropzone, FolderTree, DocumentList
│   │   │   ├── analysis/            # SummaryCard, ExtractedDataViewer, LogsViewer
│   │   │   └── chat/                # RAGChatWindow, ChatBubble, SourceCitationCard
│   │   ├── context/                 # AuthContext y GlobalStateProvider
│   │   ├── hooks/                   # Custom Hooks (useAuth, useDocuments, useRAGChat)
│   │   ├── pages/                   # Vistas principales (Login, Dashboard, Explorer, Analysis, RAG)
│   │   ├── services/                # Clientes Axios y endpoints de API (authApi, docsApi, ragApi)
│   │   ├── types/                   # Definiciones TypeScript de datos y respuestas
│   │   ├── App.tsx                  # Enrutador principal y rutas protegidas (ProtectedRoute)
│   │   └── main.tsx                 # Punto de entrada de la aplicación React
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── backend/                         # Capa de Negocio, Gateway y REST API (Node.js/Express o Spring)
│   ├── src/
│   │   ├── config/                  # Configuración de base de datos, JWT y constantes
│   │   ├── controllers/             # Manejadores HTTP (AuthController, DocumentController, etc.)
│   │   ├── middlewares/             # AuthMiddleware (JWT), RBACGuard, UploadValidator, ErrorHandler
│   │   ├── models/                  # Definición de entidades relacionales / ORM
│   │   ├── repositories/            # Consultas SQL e interacción con PostgreSQL
│   │   ├── routes/                  # Definición de rutas REST (/auth, /folders, /documents, /dashboard)
│   │   ├── services/                # Lógica de negocio y cliente HTTP hacia el microservicio IA
│   │   ├── utils/                   # Funciones utilitarias (hashing, sanitización, formatters)
│   │   └── server.ts                # Inicialización del servidor Express y conexiones
│   ├── package.json
│   └── tsconfig.json
│
├── ai/                              # Microservicio de Inteligencia Artificial (Python FastAPI)
│   ├── app/
│   │   ├── api/                     # Rutas internas (/process-document, /rag/query, /classify)
│   │   ├── core/                    # Configuración, logging y carga de variables (.env)
│   │   ├── models/                  # Esquemas Pydantic para request/response y JSON Schemas
│   │   ├── services/                # Motores de IA:
│   │   │   ├── classifier_service.py # Clasificación multiclase con prompts estructurados
│   │   │   ├── summarizer_service.py # Generador de resúmenes ejecutivos
│   │   │   ├── extractor_service.py  # Extracción JSON de entidades y metadatos
│   │   │   ├── embedding_service.py  # Inferencia de embeddings locales (Sentence-Transformers)
│   │   │   └── rag_service.py        # Orquestador RAG (Vector search + LLM generation)
│   │   └── main.py                  # Punto de entrada FastAPI
│   └── requirements.txt             # Dependencias Python (fastapi, uvicorn, langchain, etc.)
│
├── document_processing/             # Módulo especializado en Extracción Textual y OCR
│   ├── extractors/
│   │   ├── pdf_extractor.py         # Extracción digital de PDF (PyMuPDF / pdfplumber)
│   │   ├── docx_extractor.py        # Parsing de párrafos y tablas DOCX (python-docx)
│   │   ├── txt_extractor.py         # Lectura y normalización de texto plano TXT
│   │   └── ocr_engine.py            # Motor OCR Tesseract para PDFs escaneados
│   ├── normalizers/
│   │   ├── text_cleaner.py          # Limpieza de saltos, espacios y caracteres especiales
│   │   └── chunker.py               # Segmentador de texto con overlap (RecursiveSplitter)
│   └── tests/                       # Pruebas unitarias del pipeline de extracción
│
├── database/                        # Scripts SQL y migraciones de base de datos
│   ├── migrations/
│   │   ├── 001_create_tables.sql    # Creación de tablas e integridad referencial
│   │   ├── 002_enable_pgvector.sql  # Habilitación de extensión pgvector
│   │   └── 003_create_indexes.sql   # Índices B-Tree, GIN y HNSW
│   └── seeds/
│       └── 001_seed_initial_data.sql # Carga de usuario administrador y carpetas base
│
└── tests/                           # Suite de pruebas automatizadas
    ├── backend/                     # Pruebas unitarias e integración de la API REST (Jest/Supertest)
    ├── ai/                          # Pruebas de inferencia y exactitud del pipeline IA (PyTest)
    └── e2e/                         # Pruebas end-to-end de flujos de usuario (Playwright)
```

---

## 3. CONTROL DE VERSIONES Y ESTRATEGIA GIT

### 3.1 Flujo de Trabajo Gitflow
Para garantizar la estabilidad del código y el desarrollo colaborativo sin conflictos, se adopta la estrategia Gitflow:

```
[main]       ----------------------------------(v1.0.0 Tag)----
                   ^                               ^
                   |                               | Merge Release
[release]          |                     [release/v1.0.0]
                   |                               ^
                   |                               |
[develop]    ------+-------------+-----------------+------------
                     \          /
[feature]             [feat/auth]
```

- **`main`:** Contiene exclusivamente código en estado de producción, estable y etiquetado con tags semánticos (`v1.0.0`).
- **`develop`:** Rama de integración donde convergen todas las características probadas.
- **`feature/<nombre-tarea>`:** Ramas individuales creadas a partir de `develop` para desarrollar nuevas funcionalidades (ej. `feature/rag-chat`, `feature/pdf-ocr`).
- **`fix/<nombre-bug>`:** Ramas de corrección para solventar incidencias detectadas en fase de pruebas.
- **`release/<version>`:** Rama de preparación previa al despliegue final institucional.

### 3.2 Estándar de Commits (Conventional Commits)
Cada commit debe cumplir con la convención formal: `<tipo>(<alcance>): <descripción concisa en presente>`.
- `feat(auth):` Implementar autenticación JWT con guardias RBAC.
- `feat(ai):` Integrar motor OCR Tesseract con fallback para PDFs escaneados.
- `fix(rag):` Ajustar cálculo de similitud coseno ante chunks con score bajo.
- `docs(api):` Actualizar especificación OpenAPI con endpoints de carpetas.
- `refactor(db):` Optimizar índice HNSW en la tabla `document_chunks`.
- `test(backend):` Agregar pruebas unitarias para validación de Magic Bytes en carga.

---

## 4. BITÁCORA DE DESARROLLO Y REGISTRO DE AVANCES

| Hito / Sprint | Fecha de Ejecución | Componente Abordado | Responsable | Entregable Técnico Completado |
| :---: | :---: | :--- | :--- | :--- |
| **H-01** | 10/08/2026 - 15/08/2026 | Arquitectura & Entorno | Tech Lead | Creación de estructura monorepo, Docker Compose, `.env.example` y scripts SQL iniciales. |
| **H-02** | 16/08/2026 - 22/08/2026 | Backend Seguridad & CRUD | Dev Backend | Módulo de Auth JWT, hashing BCrypt, endpoints de carpetas y carga validada $\le 20$ MB. |
| **H-03** | 23/08/2026 - 29/08/2026 | Extracción & OCR | Dev IA / NLP | Parser multiformato (PDF/DOCX/TXT), OCR Tesseract 5 y segmentador de chunks con overlap. |
| **H-04** | 30/08/2026 - 05/09/2026 | Inferencia IA & RAG | Dev IA / NLP | Clasificador multiclase (3 clases), generador de resumen, extractor JSON y motor RAG con citas. |
| **H-05** | 06/09/2026 - 12/09/2026 | Frontend SPA | Dev Frontend | Vistas completas React (Login, Dashboard, Explorador, Detalle IA, Chat RAG) con Tailwind. |
| **H-06** | 13/09/2026 - 18/09/2026 | Integración & QA | Lead QA & FullStack | Pruebas de integración E2E, afinamiento de latencias $<2.5$s y bitácora de auditoría. |
