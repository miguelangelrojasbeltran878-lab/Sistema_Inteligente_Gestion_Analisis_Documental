# PLAN Y ESPECIFICACIÓN DE CASOS DE PRUEBA (STP - SOFTWARE TEST PLAN)
## Proyecto: Sistema Inteligente de Gestión y Análisis Documental
### Institución: Unidades Tecnológicas de Santander (UTS)
### Estándar: IEEE 829 / ISTQB (International Software Testing Qualifications Board)
### Versión: 1.0.0 - Línea Base de Calidad y Pruebas

---

## 1. CONTROL DE CAMBIOS Y LÍNEA BASE DEL PLAN DE PRUEBAS

| Versión | Fecha | Autor(es) | Rol | Descripción del Cambio | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1.0.0** | 06/09/2026 | Equipo de Aseguramiento de Calidad (QA) | QA Lead / Test Automation Engineer | Definición del plan formal de pruebas, estrategia de validación de IA, dataset de 30 documentos sintéticos y especificación de 10 casos de prueba (CP-01 a CP-10). | Aprobado |

---

## 2. ESTRATEGIA Y TIPOS DE PRUEBAS APLICADAS

### 2.1 Alcance del Testing y Tipología de Pruebas
La certificación de calidad del sistema abarca una estrategia multinivel orientada tanto al software convencional como a los componentes probabilísticos de Inteligencia Artificial:
1. **Pruebas Unitarias e Integración:** Validación de controladores, servicios de negocio, repositorios y clientes HTTP en backend (`Jest/Supertest`) y pipeline de extracción (`PyTest`).
2. **Pruebas Funcionales de Caja Negra:** Verificación extremo a extremo (E2E) de las historias de usuario y casos de uso desde la interfaz gráfica de usuario.
3. **Pruebas de Validación y Sanitización de Archivos:** Evaluación de límites de tamaño (20 MB), extensiones admitidas (.pdf, .docx, .txt), detección de Magic Bytes y rechazo de formatos no autorizados (.exe, .mp4, .zip).
4. **Pruebas de Inferencia de IA y Motor RAG:** Evaluación cuantitativa de precisión en clasificación multiclase, coherencia de resúmenes ejecutivos, fidelidad de extracción JSON estructurada y mitigación de alucinaciones en respuestas semánticas con citas bibliográficas.
5. **Pruebas de Seguridad y Control de Acceso (RBAC):** Verificación de aislamiento de sesiones mediante JWT y protección de endpoints ante accesos no autorizados.
6. **Pruebas de Casos Límite y Resiliencia:** Comportamiento ante documentos en blanco, escaneos borrosos, PDFs corruptos, caídas de conectividad y superación de límites de cuota de API.

### 2.2 Criterios de Aceptación, Suspensión y Reanudación
- **Criterio de Aceptación:** El 100% de los casos de prueba de severidad Crítica y Alta deben resultar en estado `PASSED` (Aprobado). La tasa de precisión de la clasificación de IA debe ser $\ge 85\%$, y las latencias de búsqueda RAG deben ser $< 2.5$ segundos.
- **Criterio de Suspensión:** Si se detecta un bloqueo total del pipeline de procesamiento asíncrono, caída de la base de datos PostgreSQL o vulnerabilidad crítica de autenticación.
- **Criterio de Reanudación:** Despliegue del parche correctivo (`bugfix`), verificación de pruebas unitarias locales y ejecución de la suite de regresión.

### 2.3 Definición del Banco de Datos de Prueba (30 Documentos Sintéticos)
Para evaluar exhaustivamente el sistema sin comprometer datos institucionales sensibles ni información personal real (cumplimiento de Ley de Protección de Datos Personales), se estructuró un corpus de 30 documentos sintéticos con contenido formal representativo de las UTS:

```
BANCO DE PRUEBAS DOCUMENTAL UTS (30 ARCHIVOS):
├── 1. Categoría Administrativo (10 archivos):
│   ├── DOC-ADM-01 a DOC-ADM-04: Actas de Consejo Académico y Directivo (PDF, DOCX, TXT)
│   ├── DOC-ADM-05 a DOC-ADM-07: Resoluciones de Rectoría de nombramiento y asignación (PDF nativo y escaneado)
│   └── DOC-ADM-08 a DOC-ADM-10: Circulares informativas y memorandos internos (DOCX, TXT)
│
├── 2. Categoría Financiero (10 archivos):
│   ├── DOC-FIN-01 a DOC-FIN-04: Presupuestos generales y planes de compras institucionales (PDF, DOCX)
│   ├── DOC-FIN-05 a DOC-FIN-07: Contratos de prestación de servicios y convenios económicos (PDF, DOCX)
│   └── DOC-FIN-08 a DOC-FIN-10: Órdenes de pago y balances contables simplificados (PDF, TXT)
│
└── 3. Categoría Técnico/Legal (10 archivos):
    ├── DOC-TEC-01 a DOC-TEC-04: Proyectos de grado de Tecnología en Software y manuales técnicos (PDF, DOCX)
    ├── DOC-TEC-05 a DOC-TEC-07: Pliegos de condiciones técnicas para infraestructura TI (PDF, DOCX)
    └── DOC-TEC-08 a DOC-TEC-10: Reglamentos estudiantiles, normatividad y estatutos UTS (PDF, TXT)
```

---

## 3. ESPECIFICACIÓN FORMAL DE CASOS DE PRUEBA (CP-01 a CP-10)

---

### CP-01: Autenticación Exitosa y Control de Acceso por Roles (RBAC)
- **Módulo:** Seguridad y Autenticación
- **Requisito Trazado:** `RF-01`, `RNF-01`
- **Tipo de Prueba:** Funcional / Seguridad (Caja Negra)
- **Precondiciones:** Usuario `analista.documental@uts.edu.co` registrado y activo con rol `ANALISTA`.
- **Datos de Entrada:** `email`: "analista.documental@uts.edu.co", `password`: "PasswordSeguro2026*"
- **Pasos de Ejecución:**
  1. Acceder a la URL de inicio de sesión `/login`.
  2. Ingresar el correo y la contraseña válida en el formulario.
  3. Presionar el botón "Iniciar Sesión".
  4. Intentar acceder a la ruta administrativa restringida `/dashboard/audit` (exclusiva de `ADMIN`).
- **Resultado Esperado:** Autenticación exitosa (HTTP 200), emisión de token JWT con rol `ANALISTA`, redirección al panel documental y bloqueo de acceso a `/dashboard/audit` con redirección a vista de no autorizado (HTTP 403).
- **Criterio de Éxito / Fallo:** Éxito si el token se valida y el rol restringe la vista administrativa; Fallo si permite el acceso no autorizado o no emite token válido.

---

### CP-02: Carga y Validación de Archivos con Formatos Soportados (PDF, DOCX, TXT $\le$ 20MB)
- **Módulo:** Ingesta y Gestión Documental
- **Requisito Trazado:** `RF-03`, `RN-01`
- **Tipo de Prueba:** Funcional / Validación de Datos
- **Precondiciones:** Usuario autenticado con rol `ANALISTA` y carpeta destino creada.
- **Datos de Entrada:** Archivos válidos: `Resolucion_045.pdf` (4.5 MB), `Acta_Consejo.docx` (1.8 MB), `Normativa.txt` (120 KB).
- **Pasos de Ejecución:**
  1. Navegar al módulo "Explorador de Repositorios".
  2. Seleccionar la carpeta destino "Actas_2026".
  3. Arrastrar y soltar los 3 archivos en el componente `FileDropzone`.
  4. Confirmar la carga y observar la barra de progreso.
- **Resultado Esperado:** Carga exitosa con respuesta HTTP 201 Created por cada archivo, almacenamiento en disco persistente, generación de hash SHA-256 e inserción en base de datos con estado inicial `PENDING`.
- **Criterio de Éxito / Fallo:** Éxito si los 3 archivos se almacenan íntegros y encolan el pipeline; Fallo si alguno es rechazado o corrompido.

---

### CP-03: Rechazo de Archivos No Soportados o con Tamaño Excedido
- **Módulo:** Ingesta y Seguridad
- **Requisito Trazado:** `RF-03`, `RN-01`, `RNF-01`
- **Tipo de Prueba:** Negativa / Caso Límite / Seguridad
- **Precondiciones:** Usuario autenticado en el sistema.
- **Datos de Entrada:**
  - Archivo A: `script_malicioso.exe` (1.2 MB).
  - Archivo B: `video_capacitacion.mp4` (15 MB).
  - Archivo C: `documento_pesado.pdf` (25.4 MB - Excede límite de 20 MB).
- **Pasos de Ejecución:**
  1. Intentar cargar `script_malicioso.exe` mediante el botón de selección de archivos.
  2. Intentar cargar `video_capacitacion.mp4` mediante drag & drop.
  3. Intentar cargar `documento_pesado.pdf` mediante llamada directa a la API (`POST /api/v1/documents/upload`).
- **Resultado Esperado:** Rechazo en cliente e interceptor de backend. Archivos `.exe` y `.mp4` retornan HTTP 400 Bad Request (`INVALID_FILE_TYPE`). Archivo $>20$ MB retorna HTTP 413 Payload Too Large (`FILE_TOO_LARGE`). Ningún binario se guarda en disco.
- **Criterio de Éxito / Fallo:** Éxito si los 3 archivos son bloqueados con mensaje descriptivo; Fallo si alguno es aceptado o guardado.

---

### CP-04: Extracción de Texto Plano y Parseo en Documentos Multipágina
- **Módulo:** Extracción Textual y OCR
- **Requisito Trazado:** `RF-04`
- **Tipo de Prueba:** Integración / Caja Blanca
- **Precondiciones:** Archivos multipágina disponibles en el storage (`DOC-ADM-01.pdf` de 12 páginas y `DOC-FIN-02.docx` con tablas).
- **Datos de Entrada:** `file_path`: `/uploads/documents/DOC-ADM-01.pdf`
- **Pasos de Ejecución:**
  1. Invocar el método `DocumentExtractor.extract_text(file_path)`.
  2. Verificar el texto extraído página por página.
  3. Verificar que el orden de lectura y las tablas no se alteren.
  4. Comprobar la generación de chunks con overlap de 100 tokens.
- **Resultado Esperado:** Extracción del 100% del texto de las 12 páginas, preservando párrafos y tablas estructuradas, generando chunks limpios sin pérdida de caracteres.
- **Criterio de Éxito / Fallo:** Éxito si el texto resultante coincide con el contenido digital y los chunks son consistentes; Fallo si omite páginas o trunca tablas.

---

### CP-05: Clasificación Automática Multiclase Asistida por IA con Score de Confianza
- **Módulo:** Inteligencia Artificial (Clasificador)
- **Requisito Trazado:** `RF-05`, `OE-02`
- **Tipo de Prueba:** Inferencia de IA / Precisión
- **Precondiciones:** Documentos parseados en texto plano en la base de datos.
- **Datos de Entrada:** Fragmentos textuales de 3 documentos representativos:
  - Doc 1: "Presupuesto anual de compras y rubros de laboratorio..."
  - Doc 2: "Acta de sesión ordinaria del Consejo Directivo de las UTS..."
  - Doc 3: "Pliego de condiciones técnicas para la red de fibra óptica..."
- **Pasos de Ejecución:**
  1. Ejecutar `AIPipelineEngine.classify_document(text_sample)`.
  2. Evaluar la categoría retornada y el puntaje `confidence_score`.
  3. Verificar la actualización en la tabla `document_analysis`.
- **Resultado Esperado:**
  - Doc 1 clasificado como `Financiero` (Score $\ge 0.90$).
  - Doc 2 clasificado como `Administrativo` (Score $\ge 0.90$).
  - Doc 3 clasificado como `Técnico/Legal` (Score $\ge 0.85$).
- **Criterio de Éxito / Fallo:** Éxito si asigna las 3 categorías correctas con score $\ge 0.85$; Fallo si clasifica erróneamente alguna tipología.

---

### CP-06: Generación de Resumen Ejecutivo Coherente por IA
- **Módulo:** Inteligencia Artificial (Síntesis)
- **Requisito Trazado:** `RF-06`, `OE-03`
- **Tipo de Prueba:** Inferencia de IA / Evaluación Cualitativa
- **Precondiciones:** Documento institucional extenso (`DOC-ADM-05.pdf` de 8 páginas) en estado `PROCESSING`.
- **Datos de Entrada:** Texto completo de la resolución de rectoría sobre modernización académica.
- **Pasos de Ejecución:**
  1. Invocación de `AIPipelineEngine.generate_summary(full_text)`.
  2. Evaluar longitud en palabras (150 a 300 palabras).
  3. Evaluar presencia de secciones: Propósito, Decisiones Clave y Conclusiones.
  4. Validar ausencia de alucinaciones o datos no presentes en el texto fuente.
- **Resultado Esperado:** Resumen ejecutivo redactado en prosa formal y clara, longitud de 210 palabras, sintetizando con precisión el objeto del documento y persistido en `document_analysis.summary`.
- **Criterio de Éxito / Fallo:** Éxito si el resumen es coherente, conciso y fiel al texto original; Fallo si el resumen está vacío, descontextualizado o alucina hechos.

---

### CP-07: Extracción Estructurada de Entidades y Metadatos Clave en JSON
- **Módulo:** Inteligencia Artificial (Extracción Estructurada)
- **Requisito Trazado:** `RF-07`, `OE-03`
- **Tipo de Prueba:** Inferencia de IA / Validación de Esquema JSON
- **Precondiciones:** Documento contractual `DOC-FIN-05.docx` procesado.
- **Datos de Entrada:** Texto del contrato de adquisición de software académico.
- **Pasos de Ejecución:**
  1. Ejecutar `AIPipelineEngine.extract_structured_entities(full_text)`.
  2. Validar que la salida sea un JSON conforme al esquema `DocumentExtractionSchema` (Pydantic).
  3. Verificar campos: `numero_documento`, `emisor_responsable`, `fecha_expedicion`, `monto_economico`, `entidades_clave`.
- **Resultado Esperado:** JSON estrictamente válido que extrae: `"numero_documento": "CONTRATO-2026-088"`, `"emisor_responsable": "Rectoría UTS"`, `"fecha_expedicion": "2026-07-20"`, `"monto_economico": 85000000.0`, `"entidades_clave": ["UTS", "Proveedor TIC SAS"]`.
- **Criterio de Éxito / Fallo:** Éxito si el JSON cumple el esquema sin errores de sintaxis y los valores extraídos coinciden con el contrato; Fallo si falla la validación de schema.

---

### CP-08: Consulta en Lenguaje Natural con RAG y Cita a Documentos Fuente
- **Módulo:** Motor RAG y Búsqueda Semántica
- **Requisito Trazado:** `RF-08`, `OE-04`, `RNF-02`
- **Tipo de Prueba:** Inferencia RAG / Precisión y Rendimiento
- **Precondiciones:** Banco de 30 documentos indexados con vectores en `document_chunks` (pgvector).
- **Datos de Entrada:** Pregunta: "¿Cuál es el valor total del contrato de software académico y qué empresa fue la adjudicataria?"
- **Pasos de Ejecución:**
  1. Realizar petición `POST /api/v1/documents/query` con la pregunta en el payload.
  2. Medir tiempo de respuesta (latencia).
  3. Analizar la respuesta en lenguaje natural generada por el LLM.
  4. Verificar el arreglo `sources` con el nombre del documento y número de página.
- **Resultado Esperado:** Respuesta exacta ("El valor total del contrato es de $85.000.000 COP y fue adjudicado a Proveedor TIC SAS"), latencia total $< 2.0$ segundos, y cita exacta `[DOC-FIN-05.docx, Página 3]`.
- **Criterio de Éxito / Fallo:** Éxito si responde correctamente en $<2.5$s y entrega la cita documental exacta; Fallo si alucina, no cita la fuente o excede 2.5s.

---

### CP-09: Manejo de Preguntas Fuera de Contexto o Sin Información en el Repositorio
- **Módulo:** Motor RAG (Mitigación de Alucinaciones)
- **Requisito Trazado:** `RF-08`, `RNF-01`, `RSK-01`
- **Tipo de Prueba:** Negativa / Robustez de IA
- **Precondiciones:** Base vectorial cargada exclusivamente con documentos institucionales de las UTS.
- **Datos de Entrada:** Pregunta sin relación: "¿Cuál es la fórmula química para fabricar combustible de cohetes espaciales?"
- **Pasos de Ejecución:**
  1. Enviar la pregunta mediante `POST /api/v1/documents/query`.
  2. Observar el score de similitud vectorial de los fragmentos recuperados.
  3. Verificar que el score no supere el umbral de corte ($\text{Similarity} < 0.65$).
  4. Evaluar la respuesta generada por el sistema.
- **Resultado Esperado:** El sistema detecta similitud insuficiente y responde de forma determinista: "La información solicitada no se encuentra disponible en los documentos cargados en el repositorio institucional", sin intentar inventar una respuesta.
- **Criterio de Éxito / Fallo:** Éxito si reconoce la ausencia de contexto y se abstiene de responder; Fallo si genera contenido externo o alucinaciones.

---

### CP-10: Resiliencia ante Documentos Corruptos o Ilegibles (Estado 'ERROR')
- **Módulo:** Pipeline Asíncrono y Auditoría
- **Requisito Trazado:** `RF-11`, `RN-03`, `RSK-03`
- **Tipo de Prueba:** Resiliencia / Manejo de Fallas
- **Precondiciones:** Pipeline de procesamiento activo en segundo plano.
- **Datos de Entrada:** Archivo `documento_danado.pdf` (cabeceras `%PDF` válidas pero flujo interno de bytes deliberadamente corrompido).
- **Pasos de Ejecución:**
  1. Cargar el archivo `documento_danado.pdf`.
  2. Verificar la recepción HTTP 201 Created inicial (estado `PENDING`).
  3. Dejar que el worker asíncrono intente abrir el archivo.
  4. Consultar el estado final del documento vía `GET /api/v1/documents/{id}`.
  5. Consultar la tabla de logs de auditoría vía `GET /api/v1/logs`.
- **Resultado Esperado:** El worker captura la excepción de lectura sin caerse, actualiza el estado del documento a `ERROR`, registra la traza técnica en `processing_logs` ("FileDataError: corrupted stream") y permite que los demás archivos continúen procesándose normalmente.
- **Criterio de Éxito / Fallo:** Éxito si el fallo queda aislado, registrado en auditoría y con estado `ERROR`; Fallo si el worker se bloquea o el sistema queda inoperable.
