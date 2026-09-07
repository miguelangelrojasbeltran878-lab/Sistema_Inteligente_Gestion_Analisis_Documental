# ESPECIFICACIÓN DE CASOS DE USO DEL SISTEMA
## Proyecto: Sistema Inteligente de Gestión y Análisis Documental
### Institución: Unidades Tecnológicas de Santander (UTS)
### Estándar: UML / Plantilla RUP - Alistair Cockburn

---

## 1. TABLA RESUMEN DE CASOS DE USO

| Código | Nombre del Caso de Uso | Actor Principal | Actores Secundarios | Complejidad |
| :--- | :--- | :--- | :--- | :---: |
| **CU-01** | Autenticar Usuario e Inicializar Sesión | Usuario General | Servidor Auth / JWT | Baja |
| **CU-02** | Cargar y Parsear Documento al Repositorio | Analista Documental | Motor OCR / Storage | Media |
| **CU-03** | Ejecutar Pipeline de Análisis e Inferencia de IA | Sistema (Worker IA) | Proveedor LLM / DB | Alta |
| **CU-04** | Realizar Consulta Semántica Documental (RAG) | Consultor / Auditor | Motor Vectorial / LLM | Alta |
| **CU-05** | Gestionar Carpetas y Estructura Jerárquica | Analista Documental | Base de Datos | Baja |
| **CU-06** | Realizar Búsqueda Léxica y Filtrado | Consultor / Analista | Base de Datos | Baja |
| **CU-07** | Consultar Dashboard y Métricas de Rendimiento | Administrador | Servicio de Analítica | Media |
| **CU-08** | Auditar Logs y Trazas de Error del Pipeline | Administrador | Log Storage / DB | Media |

---

## 2. ESPECIFICACIÓN DETALLADA DE CASOS DE USO CENTRALES

---

### CU-01: Autenticar Usuario e Inicializar Sesión
- **ID:** CU-01
- **Nombre:** Autenticar Usuario e Inicializar Sesión
- **Actor Principal:** Usuario (Administrador, Analista o Consultor)
- **Actores Secundarios:** Servidor de Autenticación / Servicio JWT
- **Precondiciones:** El usuario debe estar previamente registrado y habilitado en el sistema institucional.
- **Disparador (Trigger):** El usuario ingresa a la aplicación web y envía el formulario de login.

#### Flujo Principal (Escenario Ideal)
1. El usuario navega a la URL de inicio de sesión de la plataforma.
2. La interfaz presenta los campos de captura: Correo Electrónico Institucional y Contraseña.
3. El usuario ingresa sus credenciales y presiona "Iniciar Sesión".
4. El Frontend valida que los campos no estén vacíos y tengan formato válido.
5. El Frontend envía la petición `POST /api/v1/auth/login` con las credenciales al Backend.
6. El Backend busca el usuario por email, recupera el hash BCrypt y compara la contraseña.
7. El Backend valida que la cuenta se encuentre activa.
8. El Backend genera un par de tokens JWT (Access Token y Refresh Token) con los claims del rol del usuario.
9. El Backend retorna HTTP 200 con los tokens y la información básica de perfil.
10. El Frontend almacena el Access Token en memoria/almacenamiento seguro y redirige al panel de control correspondiente al rol.

#### Flujos Alternativos
- **FA-01 (Uso de Refresh Token para renovación de sesión):**
  - En el paso 10, si el Access Token expira mientras el usuario está navegando, el interceptor del frontend envía el `POST /api/v1/auth/refresh` con el Refresh Token válido.
  - El backend valida el token de refresco y emite un nuevo Access Token sin interrumpir la experiencia de usuario.
- **FA-02 (Redirección según Rol):**
  - En el paso 10, si el rol es `ADMIN`, se redirige directamente a la vista de Auditoría y Dashboard de Métricas; si es `ANALISTA`, a la vista del Repositorio de Documentos; si es `CONSULTOR`, a la vista de Consulta Semántica.

#### Flujos de Excepción
- **FE-01 (Credenciales Incorrectas):**
  - En el paso 6, si el correo no existe o el hash de la contraseña no coincide, el Backend registra el intento fallido y retorna HTTP 401 Unauthorized. El Frontend muestra: "Credenciales inválidas".
- **FE-02 (Cuenta Bloqueada o Inactiva):**
  - En el paso 7, si el usuario tiene estado `INACTIVO`, el Backend retorna HTTP 403 Forbidden. El Frontend muestra: "Cuenta inhabilitada. Contacte al administrador de las UTS".
- **FE-03 (Fallo de Conexión a Base de Datos):**
  - En el paso 6, si la base de datos no responde, el Backend retorna HTTP 503 Service Unavailable y registra la excepción en los logs de auditoría.

#### Postcondiciones
- **Éxito:** Sesión iniciada formalmente, token JWT activo y usuario ubicado en su interfaz de trabajo.
- **Fallo:** No se emite token, se mantiene el formulario de login y se registra el intento en auditoría.

---

### CU-02: Cargar y Parsear Documento al Repositorio
- **ID:** CU-02
- **Nombre:** Cargar y Parsear Documento al Repositorio
- **Actor Principal:** Analista de Información Documental
- **Actores Secundarios:** Gestor de Archivos (Storage), Motor OCR / Text Extractor, Base de Datos
- **Precondiciones:** El usuario debe estar autenticado con rol `ADMIN` o `ANALISTA` y tener seleccionada una carpeta destino válida.
- **Disparador (Trigger):** El usuario arrastra o selecciona un archivo (PDF, DOCX o TXT) y confirma la carga.

#### Flujo Principal (Escenario Ideal)
1. El usuario accede al módulo "Gestión Documental" y selecciona la carpeta de destino.
2. El usuario presiona el botón "Subir Archivo" y selecciona un archivo desde su equipo local.
3. El Frontend realiza una prevalidación de la extensión del archivo y tamaño ($\le 20$ MB).
4. El Frontend envía la petición multipart (`POST /api/v1/documents/upload`) con el binario y los metadatos de carpeta.
5. El Backend valida la cabecera real (Magic Bytes) y calcula el hash criptográfico SHA-256 del archivo.
6. El Backend verifica que no exista un documento idéntico duplicado en la misma carpeta.
7. El Backend persiste el archivo binario en el sistema de almacenamiento persistente.
8. El Backend crea el registro del documento en la base de datos con estado `Cargado` y genera su UUID.
9. El Backend envía un mensaje al sistema de colas asíncronas para iniciar el pipeline de extracción y análisis.
10. El Backend responde al Frontend con HTTP 201 Created y los detalles del documento.
11. La interfaz muestra la notificación "Documento cargado exitosamente. En proceso de análisis".

#### Flujos Alternativos
- **FA-01 (Carga Masiva por Lote):**
  - En el paso 2, el usuario selecciona múltiples archivos simultáneamente.
  - El sistema ejecuta la secuencia de validación y persistencia individualmente por cada archivo, reportando el progreso acumulado en la interfaz.
- **FA-02 (Carga de Archivo TXT Plano):**
  - En el paso 5, si el archivo es TXT, el sistema omite rutinas de extracción binaria complejas y pasa directamente a la fase de chunking textual.

#### Flujos de Excepción
- **FE-01 (Formato de Archivo No Permitido):**
  - En el paso 5, si el archivo tiene extensión cambiada (ej. un `.exe` renombrado a `.pdf`), el validador de Magic Bytes lo detecta y rechaza la petición con HTTP 400 Bad Request ("Formato de archivo no admitido").
- **FE-02 (Tamaño Excedido):**
  - En el paso 3 o 4, si el archivo supera los 20 MB, se interrumpe la transferencia y se retorna HTTP 413 Payload Too Large.
- **FE-03 (Almacenamiento Lleno o Inaccesible):**
  - En el paso 7, si el disco o almacenamiento falla, el Backend realiza un rollback de la transacción y retorna HTTP 500 con log de auditoría.

#### Postcondiciones
- **Éxito:** Archivo persistido de forma inmutable, registro creado con estado `Cargado` y evento encolado para inferencia de IA.
- **Fallo:** Ningún archivo residual guardado y notificación clara del motivo al usuario.

---

### CU-03: Ejecutar Pipeline de Análisis e Inferencia de IA
- **ID:** CU-03
- **Nombre:** Ejecutar Pipeline de Análisis e Inferencia de IA (Clasificación, Resumen y Extracción)
- **Actor Principal:** Sistema (Worker de Procesamiento Asíncrono)
- **Actores Secundarios:** Motor OCR (Tesseract), Modelo de Embeddings, Proveedor LLM, Vector Database, Base de Datos Relacional
- **Precondiciones:** Documento registrado con estado `Cargado` en la base de datos y archivo físico disponible.
- **Disparador (Trigger):** Llegada de un mensaje de procesamiento a la cola de tareas asíncronas.

#### Flujo Principal (Escenario Ideal)
1. El Worker de procesamiento toma el mensaje de la cola y actualiza el estado del documento a `En Proceso`.
2. El Worker invoca el módulo extractor de texto:
   - Si es PDF nativo, extrae el flujo de caracteres mediante *pdfplumber / PyMuPDF*.
   - Si es PDF escaneado (imágenes sin capa de texto), ejecuta OCR página por página.
   - Si es DOCX, extrae párrafos y tablas mediante *python-docx*.
3. El texto extraído es limpiado, normalizado y segmentado en chunks estructurados (500 tokens con overlap de 100).
4. El Worker genera los embeddings vectoriales de cada chunk utilizando el modelo de embeddings.
5. Los vectores y metadatos de chunk son indexados en la Vector Database (ej. Qdrant / Chroma / pgvector).
6. El Worker ejecuta el modelo clasificador de IA para catalogar el documento en `Administrativo`, `Técnico` o `Legal/Financiero`.
7. El Worker ejecuta el prompt estructurado en el LLM para generar el Resumen Ejecutivo.
8. El Worker ejecuta el prompt con JSON Schema para extraer las entidades clave según la categoría asignada.
9. El Worker consolida todos los metadatos (categoría, score, resumen, entidades JSON) y actualiza el registro en la base de datos relacional con estado `Procesado`.
10. El Worker emite un evento de notificación (vía WebSocket/SSE) informando que el documento ha sido analizado.

#### Flujos Alternativos
- **FA-01 (Activación Automática de OCR):**
  - En el paso 2, el extractor detecta que el PDF no contiene texto digital. Se activa automáticamente el motor OCR para convertir las imágenes de las páginas en texto procesable.
- **FA-02 (Reintento Exponencial por Límite de Tasa de API):**
  - En los pasos 6, 7 u 8, si la API del LLM retorna HTTP 429 (Rate Limit), el Worker aplica un retraso exponencial ($2^n$ segundos) y reintenta la operación hasta 3 veces antes de fallar.

#### Flujos de Excepción
- **FE-01 (Documento Corrupto o Ilegible):**
  - En el paso 2, si el archivo no puede ser abierto o decodificado, el Worker aborta el pipeline, actualiza el estado a `Error`, registra la traza de excepción técnica y finaliza la tarea.
- **FE-02 (Fallo Crítico en Proveedor de IA tras 3 Reintentos):**
  - En el paso 7 u 8, si el proveedor de IA permanece caído, se marca el documento como `Error` ("Fallo en servicio de inferencia IA") y se notifica al Administrador en el Dashboard.

#### Postcondiciones
- **Éxito:** Documento en estado `Procesado`, embeddings indexados en la base vectorial, resumen y entidades JSON persistidos en PostgreSQL.
- **Fallo:** Documento en estado `Error`, traza de auditoría detallada guardada y recursos liberados.

---

### CU-04: Realizar Consulta Semántica Documental (Q&A con RAG)
- **ID:** CU-04
- **Nombre:** Realizar Consulta Semántica Documental (Q&A con RAG)
- **Actor Principal:** Consultor / Auditor / Analista
- **Actores Secundarios:** Motor de Embeddings, Vector Database, Proveedor LLM
- **Precondiciones:** El usuario debe estar autenticado y debe existir al menos un documento en estado `Procesado` dentro de su alcance de permisos.
- **Disparador (Trigger):** El usuario escribe una pregunta en lenguaje natural en la interfaz de chat/búsqueda y hace clic en "Consultar".

#### Flujo Principal (Escenario Ideal)
1. El usuario introduce la pregunta: ej. "¿Cuáles son las condiciones de entrega del informe técnico final?".
2. El Frontend envía la solicitud `POST /api/v1/rag/query` con la pregunta y los filtros de contexto seleccionados.
3. El Backend valida la estructura de la consulta y verifica los permisos del usuario sobre las carpetas involucradas.
4. El módulo de IA genera el embedding vectorial de la pregunta del usuario.
5. El sistema realiza una búsqueda por similitud de coseno en la Vector Database, aplicando filtros de metadata (permisos/carpetas) y recuperando los $K$ fragmentos más relevantes ($K=4$).
6. El sistema evalúa los scores de similitud: todos superan el umbral de relevancia mínimo ($\ge 0.70$).
7. El sistema construye el System Prompt inyectando los fragmentos documentales recuperados como contexto delimitado e instruyendo al LLM a responder exclusivamente con base en ellos.
8. El LLM genera una respuesta redactada en lenguaje natural, citando los identificadores de origen `[Documento, Página]`.
9. El Backend retorna la respuesta, la lista de fuentes citadas y el tiempo de respuesta al Frontend.
10. La interfaz renderiza la respuesta enriquecida con tarjetas interactivas que permiten al usuario ver el fragmento original al hacer clic.

#### Flujos Alternativos
- **FA-01 (Filtrado Específico por Carpeta o Documento Único):**
  - En el paso 2, el usuario activa el filtro "Consultar solo en este documento". La búsqueda vectorial en el paso 5 restringe el espacio de búsqueda únicamente a los chunks del UUID seleccionado.
- **FA-02 (Pregunta de Aclaración o Conversación Multiturno):**
  - En el paso 1, el usuario hace una repregunta contextual ("¿Y qué plazo tiene para corregirlo?"). El backend reescribe la consulta semántica incorporando el historial inmediato antes de vectorizar.

#### Flujos de Excepción
- **FE-01 (Sin Información Suficiente en el Repositorio):**
  - En el paso 6, si la similitud de los fragmentos recuperados no supera el umbral de corte, el sistema no llama al generador LLM y retorna inmediatamente: "No se encontró información relevante en los documentos institucionales para responder a su consulta".
- **FE-02 (Fallo de Red con la Base de Datos Vectorial):**
  - En el paso 5, si la base de datos vectorial no responde antes del timeout de 2.0 segundos, el sistema responde con HTTP 504 Gateway Timeout y muestra: "El motor de búsqueda semántica no se encuentra disponible temporalmente".

#### Postcondiciones
- **Éxito:** Respuesta fundamentada entregada al usuario en $< 2.5$ segundos con citas documentales exactas; registro de la consulta en la bitácora de auditoría.
- **Fallo:** Mensaje de contingencia controlado entregado al usuario sin divulgación de errores internos del sistema.
