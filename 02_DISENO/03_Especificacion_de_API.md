# ESPECIFICACIÓN TÉCNICA DE LA API REST
## Proyecto: Sistema Inteligente de Gestión y Análisis Documental
### Institución: Unidades Tecnológicas de Santander (UTS)
### Estándar: OpenAPI 3.0 / RESTful JSON Specification

---

## 1. ESTÁNDARES Y CONVENCIONES DE LA API

### 1.1 Formato y Estructura Global de Respuestas
Todas las respuestas del API REST se estructuran bajo un envoltorio (*wrapper*) JSON uniforme para garantizar predictibilidad en el cliente:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2026-09-06T22:30:00Z"
}
```

En caso de error:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "DOC_TOO_LARGE",
    "message": "El archivo excede el límite máximo permitido de 20 MB.",
    "details": ["file_size: 27053210 bytes"]
  },
  "timestamp": "2026-09-06T22:30:00Z"
}
```

### 1.2 Códigos de Estado HTTP Utilizados
- `200 OK`: Solicitud procesada exitosamente.
- `201 Created`: Recurso creado exitosamente (documento, carpeta, token).
- `400 Bad Request`: Parámetros inválidos o formato de archivo no admitido.
- `401 Unauthorized`: Token ausente, expirado o credenciales inválidas.
- `403 Forbidden`: El usuario no posee el rol necesario para el recurso.
- `404 Not Found`: Recurso no encontrado en el sistema.
- `413 Payload Too Large`: Archivo cargado superior a 20 MB.
- `500 Internal Server Error`: Excepción no controlada en el servidor.
- `503 Service Unavailable`: Servicio de IA o base de datos no disponible.

---

## 2. ESPECIFICACIÓN DETALLADA DE ENDPOINTS

---

### Endpoint 1: `POST /api/v1/auth/login`
- **Descripción:** Autentica a un usuario institucional y retorna los tokens JWT de acceso y refresco.
- **Autenticación Requerida:** Pública (Sin Token).
- **Request Body (`application/json`):**
```json
{
  "email": "analista.documental@uts.edu.co",
  "password": "PasswordSeguro2026*"
}
```
- **Respuesta Exitosa (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": "e3b0c442-98fc-1c14-9af0-2d655f462a4a",
      "email": "analista.documental@uts.edu.co",
      "role": "ANALISTA"
    }
  },
  "error": null,
  "timestamp": "2026-09-06T22:30:00Z"
}
```
- **Respuesta de Error (`401 Unauthorized`):**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Credenciales de acceso incorrectas."
  },
  "timestamp": "2026-09-06T22:30:00Z"
}
```

---

### Endpoint 2: `GET /api/v1/folders` & `POST /api/v1/folders`
- **Descripción:** Obtiene la lista jerárquica de carpetas lógicas y crea nuevas carpetas.
- **Autenticación Requerida:** Bearer Token (Roles: `ADMIN`, `ANALISTA`, `CONSULTOR` para GET; `ADMIN`, `ANALISTA` para POST).

#### Creación de Carpeta (`POST /api/v1/folders`)
- **Request Body (`application/json`):**
```json
{
  "name": "Actas_Consejo_Directivo_2026",
  "description": "Actas oficiales del consejo directivo UTS correspondientes al año 2026"
}
```
- **Respuesta Exitosa (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "name": "Actas_Consejo_Directivo_2026",
    "description": "Actas oficiales del consejo directivo UTS correspondientes al año 2026",
    "created_at": "2026-09-06T22:31:00Z"
  },
  "error": null,
  "timestamp": "2026-09-06T22:31:00Z"
}
```

---

### Endpoint 3: `POST /api/v1/documents/upload`
- **Descripción:** Carga un archivo binario (PDF, DOCX, TXT $\le 20$ MB) e inicia el pipeline de análisis de IA.
- **Autenticación Requerida:** Bearer Token (Roles: `ADMIN`, `ANALISTA`).
- **Content-Type:** `multipart/form-data`.
- **Form Data Parameters:**
  - `file`: Archivo binario (Obligatorio).
  - `folder_id`: UUID de la carpeta destino (Obligatorio).
- **Respuesta Exitosa (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "document_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "file_name": "Resolucion_Rectoral_045.pdf",
    "file_type": "PDF",
    "file_size": 4718592,
    "status": "PENDING",
    "message": "Archivo cargado con éxito. Procesamiento de IA encolado."
  },
  "error": null,
  "timestamp": "2026-09-06T22:32:00Z"
}
```
- **Respuesta de Error (`413 Payload Too Large`):**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "FILE_SIZE_EXCEEDED",
    "message": "El archivo excede el tamaño máximo permitido de 20 MB."
  },
  "timestamp": "2026-09-06T22:32:00Z"
}
```

---

### Endpoint 4: `GET /api/v1/documents/{id}`
- **Descripción:** Obtiene los metadatos y el estado actual de procesamiento del archivo.
- **Autenticación Requerida:** Bearer Token (Roles: `ADMIN`, `ANALISTA`, `CONSULTOR`).
- **Parámetros de Ruta:** `id` (UUID del documento).
- **Respuesta Exitosa (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "folder_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "file_name": "Resolucion_Rectoral_045.pdf",
    "file_type": "PDF",
    "file_size": 4718592,
    "status": "COMPLETED",
    "file_hash": "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
    "created_at": "2026-09-06T22:32:00Z"
  },
  "error": null,
  "timestamp": "2026-09-06T22:33:00Z"
}
```

---

### Endpoint 5: `GET /api/v1/documents/{id}/analysis`
- **Descripción:** Retorna el resultado del análisis de IA: categoría multiclase, resumen ejecutivo y entidades JSON estructuradas.
- **Autenticación Requerida:** Bearer Token (Roles: `ADMIN`, `ANALISTA`, `CONSULTOR`).
- **Parámetros de Ruta:** `id` (UUID del documento).
- **Respuesta Exitosa (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "document_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "category": "Financiero",
    "confidence_score": 0.94,
    "summary": "La Resolución Rectoral 045 aprueba la asignación de recursos presupuestales para el fortalecimiento de los laboratorios de software de las UTS, autorizando un desembolso de $120.000.000 COP bajo la supervisión de la Vicerrectoría Administrativa.",
    "extracted_data": {
      "numero_resolucion": "045-2026",
      "emisor": "Rectoría UTS",
      "fecha_expedicion": "2026-08-15",
      "monto_total": 120000000,
      "moneda": "COP",
      "responsable": "Vicerrectoría Administrativa y Financiera"
    },
    "processed_at": "2026-09-06T22:32:45Z"
  },
  "error": null,
  "timestamp": "2026-09-06T22:34:00Z"
}
```

---

### Endpoint 6: `POST /api/v1/documents/query` (Motor RAG)
- **Descripción:** Ejecuta una consulta semántica en lenguaje natural sobre los documentos y genera una respuesta contextualizada con citas bibliográficas.
- **Autenticación Requerida:** Bearer Token (Roles: `ADMIN`, `ANALISTA`, `CONSULTOR`).
- **Request Body (`application/json`):**
```json
{
  "question": "¿Cuál es el presupuesto aprobado para los laboratorios de desarrollo de software y quién es el responsable?",
  "folder_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
}
```
- **Respuesta Exitosa (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "answer": "El presupuesto aprobado para los laboratorios de desarrollo de software es de $120.000.000 COP, y la supervisión y ejecución está a cargo de la Vicerrectoría Administrativa y Financiera de las UTS.",
    "confidence": 0.96,
    "sources": [
      {
        "document_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "file_name": "Resolucion_Rectoral_045.pdf",
        "page_number": 2,
        "chunk_text": "Artículo 2: Aprobar el rubro de $120.000.000 COP para infraestructura de laboratorios de software a cargo de la Vicerrectoría Administrativa..."
      }
    ],
    "latency_seconds": 1.42
  },
  "error": null,
  "timestamp": "2026-09-06T22:35:00Z"
}
```

---

### Endpoint 7: `GET /api/v1/dashboard/metrics`
- **Descripción:** Retorna las estadísticas consolidadas del repositorio y el rendimiento del pipeline de IA.
- **Autenticación Requerida:** Bearer Token (Roles: `ADMIN`, `ANALISTA`).
- **Respuesta Exitosa (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "total_documents": 1420,
    "total_storage_mb": 3480.5,
    "status_distribution": {
      "COMPLETED": 1395,
      "PROCESSING": 8,
      "PENDING": 5,
      "ERROR": 12
    },
    "category_distribution": {
      "Administrativo": 620,
      "Financiero": 480,
      "Técnico/Legal": 295
    },
    "average_processing_time_seconds": 4.15,
    "success_rate_percentage": 98.24
  },
  "error": null,
  "timestamp": "2026-09-06T22:36:00Z"
}
```

---

### Endpoint 8: `GET /api/v1/logs`
- **Descripción:** Consulta la bitácora de auditoría y trazas de error de procesamiento de IA.
- **Autenticación Requerida:** Bearer Token (Rol: `ADMIN`).
- **Query Parameters:** `page=1`, `limit=20`, `status=ERROR`.
- **Respuesta Exitosa (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "total_logs": 12,
    "page": 1,
    "logs": [
      {
        "id": "8a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
        "document_id": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
        "file_name": "Contrato_Corrupto.pdf",
        "stage": "EXTRACTION",
        "status": "ERROR",
        "error_message": "PyMuPDF.FileDataError: Cannot open damaged or encrypted PDF file.",
        "executed_at": "2026-09-06T21:15:30Z"
      }
    ]
  },
  "error": null,
  "timestamp": "2026-09-06T22:37:00Z"
}
```
