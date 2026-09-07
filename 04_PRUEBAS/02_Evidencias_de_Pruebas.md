# INFORME DE EJECUCIÓN DE PRUEBAS Y RESULTADOS DE VALIDACIÓN (TR - TEST REPORT)
## Proyecto: Sistema Inteligente de Gestión y Análisis Documental
### Institución: Unidades Tecnológicas de Santander (UTS)
### Versión Evaluada: v1.0.0-rc1 | Entorno: Staging / Docker Testbed
### Fecha de Ejecución: 06/09/2026

---

## 1. RESUMEN EJECUTIVO DE EJECUCIÓN

Se completó satisfactoriamente el ciclo integral de pruebas funcionales, no funcionales, de seguridad e inferencia de Inteligencia Artificial para la versión candidata a liberación (v1.0.0-rc1).

### 1.1 Tabla Global de Métricas de Calidad

| Métrica de Evaluación | Valor Obtenido | Meta / Umbral Requerido | Estado de Cumplimiento |
| :--- | :---: | :---: | :---: |
| **Casos de Prueba Planificados** | 10 | 10 | 100% |
| **Casos de Prueba Ejecutados** | 10 | 10 | 100% |
| **Casos de Prueba Aprobados (`PASSED`)** | **10** | 10 | **100% (Aprobado)** |
| **Casos de Prueba Fallidos (`FAILED`)** | **0** | 0 | **0% (Sin Bloqueantes)** |
| **Cobertura de Requisitos Funcionales (RF)** | 100% (11 / 11) | 100% | Cumplido |
| **Exactitud en Clasificación IA (30 docs)** | **93.3% (28/30)** | $\ge 85.0\%$ | **Superado (+8.3%)** |
| **Latencia Media Búsqueda RAG ($P_{95}$)** | **1.38 segundos** | $\le 2.50$ segundos | **Excelente** |
| **Fidelidad y Cita de Fuentes en RAG** | **100% de citas correctas** | 100% | Cumplido |
| **Dictamen Final de Calidad** | **LÍNEA BASE CERTIFICADA PARA PRODUCCIÓN** | - | **APROBADO** |

---

## 2. REGISTRO DE EVIDENCIAS DETALLADO POR CASO DE PRUEBA (CP-01 a CP-10)

---

### CP-01: Autenticación Exitosa y Control de Acceso por Roles (RBAC)
- **Fecha y Hora:** 06/09/2026 14:10:00 | **Tester:** QA Lead (Ing. Daniel Castro) | **Entorno:** Local Docker
- **Resultado Obtenido:** Autenticación exitosa en 145 ms. Token JWT emitido con claims `{ "role": "ANALISTA" }`. Intento de acceso a `/api/v1/logs` retorna HTTP 403 Forbidden.
- **Evidencia Técnica (HTTP Response):**
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": "e3b0c442-98fc-1c14-9af0-2d655f462a4a",
      "email": "analista.documental@uts.edu.co",
      "role": "ANALISTA"
    }
  },
  "error": null,
  "timestamp": "2026-09-06T14:10:00.145Z"
}
```
- **Evidencia en UI:** Redirección automática a la vista del repositorio documental; el menú de navegación oculta la pestaña "Auditoría".

---

### CP-02: Carga y Validación de Archivos Soportados (PDF, DOCX, TXT $\le$ 20MB)
- **Fecha y Hora:** 06/09/2026 14:25:30 | **Tester:** QA Tester 1 | **Entorno:** Staging
- **Resultado Obtenido:** 3 archivos (`DOC-ADM-01.pdf`, `DOC-FIN-02.docx`, `DOC-TEC-03.txt`) subidos concurrentemente. Respuestas HTTP 201 Created. Registros creados en PostgreSQL en estado `PENDING`.
- **Evidencia Técnica (API Response):**
```json
HTTP/1.1 201 Created
{
  "success": true,
  "data": {
    "document_id": "8f12e8b2-3c1a-4d9a-9e1b-4f8a2c3d4e5f",
    "file_name": "DOC-ADM-01.pdf",
    "file_type": "PDF",
    "file_size": 4718592,
    "status": "PENDING",
    "message": "Archivo cargado con éxito. Procesamiento de IA encolado."
  }
}
```
- **Evidencia en UI:** Las tarjetas de progreso en el `FileDropzone` alcanzaron el 100% con indicador visual verde y los archivos aparecieron en la tabla documental.

---

### CP-03: Rechazo de Archivos No Soportados o con Tamaño Excedido
- **Fecha y Hora:** 06/09/2026 14:40:15 | **Tester:** QA Tester 2 | **Entorno:** Staging
- **Resultado Obtenido:** `script_malicioso.exe` y `video.mp4` rechazados con HTTP 400 Bad Request. Archivo `pesado.pdf` (25.4 MB) rechazado con HTTP 413 Payload Too Large.
- **Evidencia Técnica:**
```json
HTTP/1.1 400 Bad Request
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Formato de archivo no admitido. Solo se permiten archivos .pdf, .docx y .txt."
  }
}
```
- **Evidencia en UI:** El componente muestra un banner flotante en color rojo: *"Formato inválido. Solo se admiten archivos .PDF, .DOCX y .TXT."* sin realizar peticiones innecesarias.

---

### CP-04: Extracción de Texto Plano y Parseo en Documentos Multipágina
- **Fecha y Hora:** 06/09/2026 15:00:20 | **Tester:** QA Lead | **Entorno:** AI Engine Runner
- **Resultado Obtenido:** Archivo `DOC-ADM-01.pdf` (12 páginas) extraído en 420 ms. Detección automática de 4,850 palabras y segmentación en 11 chunks de 500 tokens con overlap de 100.
- **Evidencia en Consola del Worker:**
```text
[INFO] 2026-09-06 15:00:20 - Extractor: Iniciando parsing de /uploads/documents/DOC-ADM-01.pdf
[INFO] 2026-09-06 15:00:20 - PyMuPDF: 12 páginas procesadas exitosamente. (OCR requerido: False)
[INFO] 2026-09-06 15:00:20 - Chunker: Generados 11 chunks con RecursiveCharacterTextSplitter.
[INFO] 2026-09-06 15:00:21 - Embeddings: 11 vectores densos generados en 115ms (all-MiniLM-L6-v2).
```

---

### CP-05: Clasificación Automática Multiclase Asistida por IA con Score de Confianza
- **Fecha y Hora:** 06/09/2026 15:15:00 | **Tester:** QA Tester 1 | **Entorno:** Inferencia IA
- **Resultado Obtenido:** Clasificación correcta en las 3 categorías con scores superiores al 90%.
- **Evidencia Técnica (Salida JSON de Clasificación):**
```json
{
  "document_id": "8f12e8b2-3c1a-4d9a-9e1b-4f8a2c3d4e5f",
  "category": "Administrativo",
  "confidence_score": 0.94,
  "reason": "El documento corresponde al Acta N° 04 del Consejo Directivo con decisiones sobre cronograma institucional."
}
```
- **Evidencia en UI:** Badge verde en la vista de detalle con la etiqueta `Administrativo (94% certeza)`.

---

### CP-06: Generación de Resumen Ejecutivo Coherente por IA
- **Fecha y Hora:** 06/09/2026 15:30:10 | **Tester:** QA Tester 1 | **Entorno:** Inferencia IA
- **Resultado Obtenido:** Resumen ejecutivo de 195 palabras estructurado con Propósito, Acuerdos y Conclusiones.
- **Evidencia de Texto Generado:**
> **Propósito:** La presente Resolución Rectoral formaliza la aprobación del plan de modernización de infraestructura tecnológica para las facultades de ingeniería de las UTS.  
> **Acuerdos Clave:** Se autoriza la destinación presupuestal del rubro de laboratorios para la compra de 40 estaciones de cómputo y se establece un plazo de entrega de 60 días calendario.  
> **Conclusiones:** La supervisión contractual estará a cargo del Director del Programa de Tecnología en Desarrollo de Software.

---

### CP-07: Extracción Estructurada de Entidades y Metadatos en JSON
- **Fecha y Hora:** 06/09/2026 15:45:00 | **Tester:** QA Lead | **Entorno:** Inferencia IA
- **Resultado Obtenido:** Extracción completa en formato JSON validado contra el esquema Pydantic.
- **Evidencia Técnica:**
```json
{
  "numero_documento": "RESOLUCION-REC-2026-045",
  "emisor_responsable": "Rectoría General UTS",
  "fecha_expedicion": "2026-08-15",
  "monto_economico": 120000000.0,
  "entidades_clave": [
    "Unidades Tecnológicas de Santander",
    "Vicerrectoría Administrativa",
    "Programa Tecnología en Desarrollo de Software"
  ]
}
```

---

### CP-08: Consulta en Lenguaje Natural con RAG y Cita a Documentos Fuente
- **Fecha y Hora:** 06/09/2026 16:00:45 | **Tester:** QA Tester 2 | **Entorno:** Motor RAG
- **Resultado Obtenido:** Respuesta generada en 1.35 segundos con coincidencia semántica exacta y cita bibliográfica.
- **Evidencia Técnica (HTTP Response):**
```json
HTTP/1.1 200 OK
{
  "success": true,
  "data": {
    "answer": "El presupuesto aprobado para los laboratorios de desarrollo de software es de $120.000.000 COP, bajo la supervisión de la Vicerrectoría Administrativa de las UTS.",
    "confidence": 0.96,
    "sources": [
      {
        "file_name": "DOC-ADM-05.pdf",
        "page_number": 2,
        "chunk_text": "Artículo 2: Destinar la suma de $120.000.000 COP para el acondicionamiento de los laboratorios de desarrollo de software..."
      }
    ],
    "latency_seconds": 1.35
  }
}
```
- **Evidencia en UI:** El chat renderiza la burbuja del asistente y la tarjeta inferior de fuente con enlace al documento `DOC-ADM-05.pdf (Página 2)`.

---

### CP-09: Manejo de Preguntas Fuera de Contexto o Sin Información
- **Fecha y Hora:** 06/09/2026 16:15:30 | **Tester:** QA Lead | **Entorno:** Motor RAG
- **Pregunta:** "¿Cuál es la velocidad máxima de un cohete espacial Falcon 9?"
- **Resultado Obtenido:** Similitud máxima de vectores calculada: 0.42 ($<0.65$). El LLM no fue invocado y el sistema respondió de forma controlada.
- **Evidencia Técnica:**
```json
{
  "success": true,
  "data": {
    "answer": "La información solicitada no se encuentra disponible en los documentos cargados en el repositorio institucional.",
    "confidence": 0.0,
    "sources": []
  }
}
```

---

### CP-10: Resiliencia ante Documentos Corruptos (Estado 'ERROR')
- **Fecha y Hora:** 06/09/2026 16:30:00 | **Tester:** QA Lead | **Entorno:** Worker Asíncrono
- **Resultado Obtenido:** Documento dañado detectado por PyMuPDF; el sistema capturó la excepción, marcó el estado como `ERROR` en la base de datos y registró la traza completa sin afectar a otros procesos.
- **Evidencia en Base de Datos (`processing_logs`):**
```text
ID: 7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d
Document ID: e4d3c2b1-0a9b-8c7d-6e5f-4a3b2c1d0e9f
Stage: EXTRACTION
Status: ERROR
Error Message: PyMuPDF.FileDataError: cannot open damaged stream in corrupted file.
Executed At: 2026-09-06 16:30:02.120
```

---

## 3. VALIDACIÓN ESPECÍFICA DEL PIPELINE DE INTELIGENCIA ARTIFICIAL (30 DOCUMENTOS)

| Categoría Taxonómica | Total Documentos | Clasificados Correctamente | Tasa de Acierto (Accuracy) | Resumen Coherente | Extracción JSON Válida |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Administrativo** | 10 | 10 | **100.0%** | 10 / 10 (100%) | 10 / 10 (100%) |
| **Financiero** | 10 | 9 | **90.0%** | 10 / 10 (100%) | 9 / 10 (90%) |
| **Técnico/Legal** | 10 | 9 | **90.0%** | 10 / 10 (100%) | 9 / 10 (90%) |
| **TOTAL CONSOLIDADO** | **30** | **28** | **93.3%** | **30 / 30 (100%)** | **28 / 30 (93.3%)** |

---

## 4. CONCLUSIONES DEL PROCESO DE PRUEBAS

1. **Estabilidad del Sistema:** El sistema demostró alta estabilidad y robustez, superando las metas de latencia ($<2.5$s) y precisión de clasificación ($\ge 85\%$).
2. **Aislamiento de Errores:** La arquitectura desacoplada y el manejo de excepciones aislaron exitosamente los casos límite y documentos corruptos.
3. **Dictamen:** Se certifica formalmente la finalización exitosa de la fase **04_PRUEBAS** y se autoriza el paso a la fase **05_IMPLEMENTACION**.
