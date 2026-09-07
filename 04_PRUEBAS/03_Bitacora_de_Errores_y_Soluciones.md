# BITÁCORA DE ERRORES, SOLUCIONES Y MATRIZ DE TRAZABILIDAD DE PRUEBAS
## Proyecto: Sistema Inteligente de Gestión y Análisis Documental
### Institución: Unidades Tecnológicas de Santander (UTS)
### Estándar: Defect Tracking Log (IEEE 1044) & Requirements Traceability Matrix Testing (RTM)

---

## 1. POLÍTICA DE CLASIFICACIÓN DE DEFECTOS

### 1.1 Niveles de Severidad
- **Crítica (S1):** Bloqueo total del sistema, caída de la base de datos o fallo que impide ejecutar pruebas básicas.
- **Alta (S2):** Falla en una funcionalidad core de IA (ej. alucinaciones severas, bloqueo en subida de PDF) sin alternativa directa.
- **Media (S3):** Comportamiento erróneo en una función secundaria o degradación controlada que cuenta con solución temporal (*workaround*).
- **Baja (S4):** Inconsistencias estéticas, errores ortográficos en la interfaz o mejoras de usabilidad menores.

### 1.2 Estados del Ciclo de Vida del Defecto
```
[ABIERTO] ---> [EN CORRECCIÓN] ---> [RESUELTO] ---> [REPRUEBA QA] ---> [CERRADO]
```

---

## 2. BITÁCORA DETALLADA DE DEFECTOS Y SOLUCIONES (BUG TRACKER)

---

### BUG-01: Falla en Extracción de Texto en PDFs Escaneados sin Capa de Texto
- **Caso de Prueba Origen:** `CP-04` (Extracción de Texto y Parsing)
- **Severidad:** **Alta (S2)** | **Estado:** **Cerrado**
- **Descripción Técnica:** Al procesar resoluciones antiguas escaneadas en formato PDF (imágenes rasterizadas), PyMuPDF retornaba cadenas de texto vacías (`""`), lo que provocaba que el clasificador de IA fallara por contenido insuficiente.
- **Causa Raíz:** El extractor original únicamente leía el flujo digital de caracteres y no contaba con un mecanismo de reconocimiento óptico de caracteres (OCR) para páginas basadas puramente en imagen.
- **Solución Implementada:**
  - Se incorporó un detector de densidad de caracteres por página (`len(text) < 40`).
  - Ante páginas escaneadas, se activa automáticamente el motor **Tesseract OCR 5** con idioma español (`pytesseract.image_to_string(img, lang='spa')`), convirtiendo la imagen de la página en texto normalizado antes de pasar al chunker.
- **Resultado tras la Reprueba:** `PASSED`. Los documentos escaneados fueron parseados correctamente con un 96% de legibilidad textual.

---

### BUG-02: Alucinaciones del LLM en Preguntas Sin Sustento en los Documentos
- **Caso de Prueba Origen:** `CP-09` (Manejo de Preguntas Fuera de Contexto)
- **Severidad:** **Alta (S2)** | **Estado:** **Cerrado**
- **Descripción Técnica:** Al realizar preguntas abiertas que no guardaban relación con los documentos de las UTS, el modelo de lenguaje intentaba responder utilizando su conocimiento preentrenado general en lugar de restringirse al repositorio institucional.
- **Causa Raíz:** El System Prompt no contenía directivas de abstención explícitas ni existía un filtro de corte por umbral de similitud de coseno en los vectores recuperados.
- **Solución Implementada:**
  - Se implementó un filtro de similitud estricto en el backend RAG: si los fragmentos recuperados tienen una similitud $< 0.65$, el LLM no es invocado y se retorna un mensaje predeterminado.
  - Se blindó el System Prompt con la directiva: *"Responde basándote EXCLUSIVAMENTE en el contexto provisto. Si la respuesta no está contenida en el texto, indica amablemente que no existe información en el repositorio institucional"*.
  - Se fijó la temperatura en $0.1$.
- **Resultado tras la Reprueba:** `PASSED`. Cero alucinaciones detectadas en un banco de 25 preguntas fuera de dominio.

---

### BUG-03: Desbordamiento de la Ventana de Contexto en Documentos Extensos
- **Caso de Prueba Origen:** `CP-06` (Generación de Resumen Ejecutivo)
- **Severidad:** **Alta (S2)** | **Estado:** **Cerrado**
- **Descripción Técnica:** Al cargar manuales técnicos y proyectos de grado superiores a 80 páginas, la llamada directa al LLM arrojaba un error de timeout y superación del límite máximo de tokens por petición.
- **Causa Raíz:** Se intentaba enviar el texto completo en un único payload sin segmentación previa.
- **Solución Implementada:**
  - Se implementó la estrategia de segmentación semántica (*chunking*) mediante `RecursiveCharacterTextSplitter` con fragmentos de 500 tokens y 100 tokens de solapamiento (*overlap*).
  - Para el resumen de documentos muy extensos, se implementó el patrón *Map-Reduce* o muestreo estratificado de chunks clave (inicio, acuerdos y conclusiones).
- **Resultado tras la Reprueba:** `PASSED`. Documentos de hasta 150 páginas procesados sin errores de tokens ni timeouts.

---

### BUG-04: Bloqueo de la Petición HTTP por Procesamiento Síncrono Pesado
- **Caso de Prueba Origen:** `CP-02` (Carga y Validación de Archivos)
- **Severidad:** **Crítica (S1)** | **Estado:** **Cerrado**
- **Descripción Técnica:** La subida de múltiples archivos mantenía abierta la conexión HTTP durante más de 30 segundos mientras se ejecutaba el OCR y la inferencia de IA, provocando errores de timeout (`504 Gateway Timeout`) en el frontend.
- **Causa Raíz:** El controlador REST invocaba de forma síncrona y bloqueante todo el pipeline de análisis antes de responder al cliente.
- **Solución Implementada:**
  - Se desacopló la ingesta: la petición `POST /api/v1/documents/upload` persiste el archivo, registra el estado `PENDING` en PostgreSQL y responde de inmediato con HTTP 201 Created ($< 300$ ms).
  - El procesamiento de IA se delegó a tareas asíncronas en segundo plano gestionadas con **Celery / Redis / Spring Async**, actualizando el estado a `PROCESSING` y finalmente a `COMPLETED` o `ERROR`.
- **Resultado tras la Reprueba:** `PASSED`. Respuestas inmediatas al usuario y procesamiento encolado sin bloqueos.

---

### BUG-05: Error de Validación en Archivos con Extensiones Compuestas o Ambiguas
- **Caso de Prueba Origen:** `CP-03` (Rechazo de Archivos No Soportados)
- **Severidad:** **Media (S3)** | **Estado:** **Cerrado**
- **Descripción Técnica:** Un archivo malicioso nombrado como `informe.pdf.exe` o un archivo renombrado pasaba el filtro inicial de extensión si solo se evaluaba el string con `endsWith('.pdf')`.
- **Causa Raíz:** Validación superficial basada únicamente en el nombre de archivo y no en los bytes de cabecera (*Magic Bytes*).
- **Solución Implementada:**
  - Se implementó un middleware de validación profunda que inspecciona los primeros bytes del buffer: `%PDF-` para PDFs (`0x25 0x50 0x44 0x46`), `PK\x03\x04` para archivos DOCX comprimidos en ZIP y validación de codificación UTF-8 para archivos TXT.
- **Resultado tras la Reprueba:** `PASSED`. Detección y bloqueo del 100% de archivos camuflados o con extensiones falsas.

---

## 3. MATRIZ DE TRAZABILIDAD REQUISITO - PRUEBA (RTM TESTING)

| Requisito Funcional (ERS) | Historia de Usuario (HU) | Caso de Uso (CU) | Caso de Prueba (CP) | Tipo de Prueba Aplicada | Estado Final |
| :---: | :---: | :---: | :---: | :--- | :---: |
| **RF-01: Autenticación / RBAC** | `HU-01` | `CU-01` | **CP-01** | Seguridad / Funcional | **APROBADO** |
| **RF-02: Gestión de Carpetas** | `HU-02` | `CU-05` | **CP-02** | Funcional / Integración | **APROBADO** |
| **RF-03: Carga y Validación Archivos** | `HU-03` | `CU-02` | **CP-02, CP-03** | Validación / Negativa / Límites | **APROBADO** |
| **RF-04: Extracción de Texto / OCR** | `HU-03` | `CU-02, CU-03` | **CP-04** | Integración / Parsing | **APROBADO** |
| **RF-05: Clasificación Multiclase** | `HU-04` | `CU-03` | **CP-05** | Inferencia IA (Precisión $\ge 85\%$) | **APROBADO** |
| **RF-06: Resumen Ejecutivo IA** | `HU-05` | `CU-03` | **CP-06** | Inferencia IA / Calidad Texto | **APROBADO** |
| **RF-07: Extracción Estructurada JSON** | `HU-06` | `CU-03` | **CP-07** | Validación Schema Pydantic | **APROBADO** |
| **RF-08: Motor Semántico RAG (Q&A)** | `HU-07` | `CU-04` | **CP-08, CP-09** | Inferencia RAG / Citas Fuentes | **APROBADO** |
| **RF-09: Búsqueda Tradicional** | `HU-07` | `CU-06` | **CP-08** | Búsqueda y Filtrado SQL | **APROBADO** |
| **RF-10: Dashboard de Analítica** | `HU-08` | `CU-07` | **CP-01, CP-02** | Funcional UI / Agregaciones | **APROBADO** |
| **RF-11: Auditoría y Manejo de Errores**| `HU-08` | `CU-08` | **CP-10** | Resiliencia / Log de Estados | **APROBADO** |
