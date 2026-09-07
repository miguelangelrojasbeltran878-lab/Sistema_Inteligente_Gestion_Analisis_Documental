# ESPECIFICACIÓN DE REQUISITOS DE SOFTWARE (ERS)
## Proyecto: Sistema Inteligente de Gestión y Análisis Documental
### Institución: Unidades Tecnológicas de Santander (UTS)
### Programa: Tecnología en Desarrollo de Software (VI Semestre)
### Estándar: IEEE 830 Adaptado

---

## 1. CONTROL DE CAMBIOS Y METADATOS DE VERSIÓN

| Versión | Fecha | Autor(es) | Rol | Descripción del Cambio | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1.0.0** | 06/09/2026 | Equipo de Ingeniería UTS | Ingeniero de Requisitos / Arquitecto | Creación de la Línea Base de Requisitos de Software para el ciclo académico y productivo. | Aprobado |

---

## 2. DESCRIPCIÓN DEL PROBLEMA, CONTEXTO, JUSTIFICACIÓN Y OPORTUNIDAD

### 2.1 Descripción del Problema
En las Unidades Tecnológicas de Santander (UTS), al igual que en múltiples organizaciones modernas, el volumen de activos documentales digitales (actas, proyectos de grado, resoluciones, manuales técnicos e informes de gestión) ha crecido de manera exponencial. Actualmente, estos archivos reposan en carpetas compartidas o repositorios pasivos desestructurados en formatos heterogéneos (`PDF`, `DOCX`, `TXT`). Esta condición genera las siguientes problemáticas críticas:
- **Tiempos excesivos de búsqueda:** La localización de información puntual requiere lecturas manuales extensas o búsquedas léxicas básicas que fallan ante sinonimias o conceptos implícitos.
- **Falta de visibilidad ejecutiva:** No existe un mecanismo ágil para sintetizar documentos extensos o extraer entidades estructuradas (responsables, fechas, convenios, valores económicos).
- **Procesamiento manual ineficiente:** La categorización de los archivos depende del criterio subjetivo de quien los carga, lo que genera inconsistencias taxonómicas.

### 2.2 Justificación
La implementación de un sistema basado en procesamiento de lenguaje natural (NLP) e Inteligencia Artificial Generativa y Semántica (RAG - *Retrieval-Augmented Generation*) transforma este repositorio inerte en un activo dinámico de conocimiento institucional. Automatizar la extracción, clasificación multiclase y síntesis reduce en más de un 70% el tiempo operativo del personal administrativo, docente e investigador.

### 2.3 Oportunidad de Negocio y Valor Agregado
- **Centralización y Gobierno:** Control de acceso granular (RBAC) y trazabilidad integral del ciclo de vida documental.
- **Interoperabilidad:** Exposición de endpoints REST desacoplados para integraciones futuras con el sistema académico institucional.
- **Consultas Conversacionales Fundamentadas:** Respuestas precisas en lenguaje natural con citación explícita de fragmentos de documentos, mitigando riesgos de alucinación.

---

## 3. OBJETIVOS DEL SISTEMA

### 3.1 Objetivo General
Desarrollar e implementar un Sistema Inteligente de Gestión y Análisis Documental para las Unidades Tecnológicas de Santander (UTS) que centralice el almacenamiento, clasifique automáticamente archivos heterogéneos mediante IA y permita consultas semánticas en lenguaje natural con trazabilidad técnica y arquitectónica completa.

### 3.2 Objetivos Específicos
1. **OE-01 (Seguridad y Almacenamiento):** Implementar un módulo seguro de autenticación basada en JWT y control de acceso basado en roles (RBAC) que gestione repositorios lógicos de archivos en formatos PDF, DOCX y TXT con límite de 20MB por archivo.
2. **OE-02 (Pipeline de Procesamiento y Clasificación):** Diseñar e integrar un pipeline automatizado de ingesta, OCR y extracción de texto capaz de clasificar documentos en al menos tres categorías taxonómicas (Administrativo, Técnico, Legal/Financiero) con una precisión mínima del 85%.
3. **OE-03 (Síntesis y Extracción Estructurada):** Incorporar servicios de Inteligencia Artificial para la generación automática de resúmenes ejecutivos y la extracción de entidades clave (metadatos estructurados JSON) según la tipología documental.
4. **OE-04 (Búsqueda Semántica y RAG):** Implementar un motor de búsqueda semántica y recuperación aumentada por generación (RAG) empleando bases de datos vectoriales y embeddings para responder preguntas en lenguaje natural con latencias menores a 2.5 segundos.
5. **OE-05 (Auditoría y Analítica):** Proveer un dashboard interactivo de métricas documentales y un sistema estricto de auditoría con registro detallado de estados y trazas de error de procesamiento.

---

## 4. ALCANCE DEL PRODUCTO Y EXCLUSIONES

### 4.1 Alcance del Producto
- Carga unitaria y masiva de archivos en formatos `PDF`, `DOCX` y `TXT` (máximo 20 MB por archivo).
- Pipeline asíncrono de extracción textual (con soporte OCR para PDFs escaneados).
- Generación de embeddings vectoriales y almacenamiento en Vector Store.
- Clasificación automática multiclase, generación de resumen ejecutivo y extracción de entidades en formato JSON.
- Módulo de consulta conversacional (Q&A) fundamentado en el contexto documental cargado.
- Dashboard administrativo con métricas de volumen, distribución de categorías y consumo de recursos.
- Registro transaccional de auditoría (Estados: `Cargado`, `En Proceso`, `Procesado`, `Error`).

### 4.2 Exclusiones Explícitas
- Edición colaborativa de documentos en tiempo real (tipo Google Docs).
- Soporte para formatos multimedia pesados (audio, video, ejecutables o archivos CAD).
- Firma digital criptográfica con validez jurídica de entidad certificadora externa.
- Modificación del contenido original de los archivos almacenados (los documentos se tratan como inmutables).

---

## 5. REQUISITOS FUNCIONALES (RF-01 a RF-11)

### RF-01: Autenticación y Autorización (JWT / RBAC)
- **Descripción:** El sistema debe autenticar a los usuarios mediante credenciales seguras y emitir tokens JWT con expiración definida. Debe autorizar operaciones según el rol asignado (`ADMIN`, `ANALISTA`, `CONSULTOR`).
- **Entradas:** Correo institucional, contraseña cifrada, rol solicitado.
- **Salidas:** Token JWT (Access Token + Refresh Token), objeto de perfil de usuario y permisos asociados.
- **Criterio de Aceptación:** Si las credenciales son válidas, el sistema retorna HTTP 200 y el token en menos de 500 ms. Si son inválidas, retorna HTTP 401 sin revelar el motivo específico.

### RF-02: Gestión de Repositorios y Carpetas Lógicas
- **Descripción:** El sistema debe permitir a los usuarios con permisos crear, listar, renombrar y estructurar carpetas jerárquicas lógicas para organizar los documentos institucionales.
- **Entradas:** Nombre de la carpeta, ID de carpeta padre (opcional), permisos de visibilidad.
- **Salidas:** Identificador UUID de la carpeta, ruta lógica normalizada y estado de creación.
- **Criterio de Aceptación:** Creación de carpetas sin duplicidad de nombres en el mismo nivel jerárquico; respuesta en menos de 300 ms.

### RF-03: Carga y Validación de Archivos
- **Descripción:** El sistema debe recibir archivos en formatos PDF, DOCX y TXT, validando tipo MIME real, integridad y tamaño máximo de 20 MB por archivo.
- **Entradas:** Archivo binario (Multipart form-data), metadatos de carpeta destino, ID de usuario.
- **Salidas:** Registro documental en base de datos con estado `Cargado`, hash SHA-256 e ID único.
- **Criterio de Aceptación:** Rechazo inmediato (HTTP 400/413) si el archivo excede 20MB o no cumple el formato permitido; almacenamiento seguro en el backend.

### RF-04: Extracción de Texto y Preprocesamiento (Parsing/OCR)
- **Descripción:** El sistema debe procesar el documento cargado, extrayendo texto nativo (para DOCX/TXT/PDF nativo) o ejecutando OCR (Tesseract / EasyOCR) para PDFs escaneados, normalizando el texto y dividiéndolo en fragmentos (*chunking* con solapamiento).
- **Entradas:** Archivo binario almacenado, configuración de chunking (tamaño: 500-1000 tokens, overlap: 100 tokens).
- **Salidas:** Texto plano extraído, lista de chunks normalizados con metadatos de página y posición.
- **Criterio de Aceptación:** Extracción completa del texto preservando orden de lectura; marcado de estado como `En Proceso` durante la ejecución.

### RF-05: Clasificación Automática Multiclase
- **Descripción:** El sistema debe analizar el contenido del documento mediante un modelo de lenguaje/clasificador IA y asignarlo automáticamente a una de las categorías mínimas: `Administrativo`, `Técnico`, `Legal/Financiero`.
- **Entradas:** Chunks iniciales y resumen preliminar del documento.
- **Salidas:** Etiqueta de categoría asignada, puntaje de confianza (0.0 a 1.0) y justificación sintética.
- **Criterio de Aceptación:** Precisión del modelo superior al 85% sobre el conjunto de validación; registro de la categoría en los metadatos del documento.

### RF-06: Generación de Resumen Ejecutivo por Documento
- **Descripción:** El sistema debe generar un resumen ejecutivo conciso (entre 150 y 300 palabras) que capture el propósito, las decisiones clave y las conclusiones del archivo procesado.
- **Entradas:** Texto completo o chunks representativos del documento.
- **Salidas:** Texto en formato Markdown con el resumen ejecutivo generado por el LLM.
- **Criterio de Aceptación:** Resumen sin alucinaciones, sintácticamente coherente y persistido en la ficha técnica del documento.

### RF-07: Extracción de Información Estructurada y Entidades Clave
- **Descripción:** El sistema debe extraer pares clave-valor y entidades nombradas específicas según la tipología documental (ej. Entidad emisora, fecha de vigencia, nombres de responsables, montos económicos, número de resolución) en formato JSON normalizado.
- **Entradas:** Texto del documento y esquema JSON de extracción.
- **Salidas:** Objeto JSON validado contra esquema con los metadatos estructurados.
- **Criterio de Aceptación:** Generación de JSON válido que cumpla con el esquema requerido sin errores de sintaxis en el 95% de los casos.

### RF-08: Consulta Semántica en Lenguaje Natural (RAG / Embeddings)
- **Descripción:** El sistema debe permitir a los usuarios formular preguntas en lenguaje natural sobre uno o varios documentos. El motor debe vectorizar la consulta, recuperar los fragmentos más similares en la base vectorial, armar el prompt contextualizado y generar una respuesta justificada con referencias exactas de origen.
- **Entradas:** Texto de la pregunta del usuario, filtros opcionales (carpeta, categoría, rango de fechas).
- **Salidas:** Respuesta en lenguaje natural con citas textuales y referencias a nombres de archivos y números de página.
- **Criterio de Aceptación:** Respuesta fundamentada exclusivamente en el contexto provisto en menos de 2.5 segundos para consultas sobre repositorios indexados.

### RF-09: Búsqueda Tradicional y Filtros Combinados
- **Descripción:** El sistema debe permitir búsquedas léxicas por coincidencia de palabras clave en el título, nombre de archivo, categoría, fecha de carga y metadatos extraídos.
- **Entradas:** Término de búsqueda, filtros de fecha, autor, categoría y estado.
- **Salidas:** Lista paginada de documentos coincidentes con resaltado de coincidencias.
- **Criterio de Aceptación:** Retorno de resultados en menos de 300 ms para bases de datos de hasta 50.000 registros documentales.

### RF-10: Dashboard de Analítica y Métricas
- **Descripción:** El sistema debe presentar una interfaz gráfica con indicadores visuales: volumen total de documentos, distribución porcentual por categoría, documentos procesados con éxito vs. errores, y tendencias de consulta.
- **Entradas:** Rango temporal seleccionado por el usuario.
- **Salidas:** Gráficos estadísticos interactivos, contadores numéricos y tablas de resumen.
- **Criterio de Aceptación:** Carga completa del dashboard en menos de 1.5 segundos; actualización reactiva de métricas.

### RF-11: Registro y Auditoría de Procesamiento
- **Descripción:** El sistema debe registrar cada transición de estado del documento (`Cargado` -> `En Proceso` -> `Procesado` | `Error`), almacenando marcas de tiempo, usuario responsable, servicio ejecutor y traza completa de error en caso de fallo.
- **Entradas:** Eventos de cambio de estado emitidos por los microservicios/módulos.
- **Salidas:** Log transaccional persistido en base de datos accesible por el Administrador.
- **Criterio de Aceptación:** Trazabilidad del 100% de los documentos con histórico inmutable de eventos.

---

## 6. REQUISITOS NO FUNCIONALES (RNF-01 a RNF-06)

| Código | Categoría | Requisito Detallado | Métrica / Criterio de Aceptación |
| :--- | :--- | :--- | :--- |
| **RNF-01** | **Seguridad** | Cifrado de contraseñas con algoritmos robustos (BCrypt, factor de costo $\ge 12$). Cifrado en tránsito mediante TLS 1.3 y en reposo (AES-256). Sanitización estricta de nombres de archivo y payloads para prevenir SQL Injection, XSS y Directory Traversal. | Cero vulnerabilidades críticas en análisis SAST/DAST; tokens JWT firmados con HMAC-SHA256/RSA256. |
| **RNF-02** | **Rendimiento** | El tiempo de respuesta para búsquedas semánticas y tradicionales debe ser $\le 2.5$ segundos en percentil 95 ($P_{95}$). La latencia del API Gateway para transacciones CRUD debe ser $\le 300$ ms. | Pruebas de carga con 50 usuarios concurrentes sin degradación del SLA. |
| **RNF-03** | **Disponibilidad** | La plataforma debe garantizar una disponibilidad del 99.5% en horario de operación académica y administrativa institucional. | Tiempo máximo de inactividad no programada $< 3.6$ horas al mes; arquitectura con reinicio automático de contenedores. |
| **RNF-04** | **Usabilidad** | Interfaz web responsiva desarrollada bajo principios de accesibilidad WCAG 2.1 nivel AA y heurísticas de Nielsen, con diseño adaptativo para resoluciones de escritorio y tabletas. | Puntuación System Usability Scale (SUS) $\ge 80/100$; navegación intuitiva con máximo 3 clics para acciones clave. |
| **RNF-05** | **Mantenibilidad** | Código fuente estructurado bajo Clean Architecture y principios SOLID, con cobertura de pruebas unitarias e integración $\ge 80\%$. Documentación exhaustiva en OpenAPI 3.0. | Índice de Mantenibilidad de Radon/SonarQube en grado 'A'; especificación Swagger interactiva funcional. |
| **RNF-06** | **Escalabilidad** | Arquitectura modular basada en microservicios o servicios desacoplados (Spring Boot + FastAPI) contenerizados mediante Docker, listos para escalamiento horizontal en Kubernetes o Docker Swarm. | Capacidad de procesar hasta 500 documentos/hora escalando réplicas del worker de IA. |

---

## 7. REGLAS DE NEGOCIO (RN-01 a RN-05)

- **RN-01 (Restricción de Formato y Peso):** Ningún archivo que supere los 20 MB o cuya firma binaria (Magic Bytes) no corresponda estrictamente a PDF (`%PDF`), DOCX (`PK..`) o TXT plano podrá ser admitido por la capa de ingesta.
- **RN-02 (Concurrencia y Encolamiento):** El procesamiento pesado de IA y OCR debe ejecutarse de forma asíncrona mediante un sistema de colas (ej. Celery / RabbitMQ / Spring Tasks) para no bloquear las solicitudes HTTP del usuario.
- **RN-03 (Política de Reintentos ante Fallas del LLM):** Si una llamada al proveedor de IA falla por saturación de tasa (HTTP 429) o indisponibilidad temporal (HTTP 503), el sistema aplicará un algoritmo de *Exponential Backoff* con un máximo de 3 reintentos antes de marcar el documento en estado `Error`.
- **RN-04 (Gobernanza y Privacidad Documental):** Ningún documento clasificado como confidencial o perteneciente a una carpeta con restricción de rol podrá ser indexado o expuesto en respuestas de búsqueda a usuarios con roles no autorizados (aislamiento vectorial por tenant/permiso).
- **RN-05 (Inmutabilidad de Archivos Procesados):** Una vez que un documento ha alcanzado el estado `Procesado`, su contenido binario y su hash SHA-256 no podrán ser sobrescritos. Para actualizar un documento, deberá generarse una nueva versión documental vinculada.
