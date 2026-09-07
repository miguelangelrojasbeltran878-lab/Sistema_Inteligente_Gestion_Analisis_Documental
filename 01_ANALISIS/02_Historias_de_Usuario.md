# DOCUMENTO DE HISTORIAS DE USUARIO (HU)
## Proyecto: Sistema Inteligente de Gestión y Análisis Documental
### Institución: Unidades Tecnológicas de Santander (UTS)
### Metodología: Ágil (Scrum / Criterios INVEST / BDD Gherkin)

---

## 1. MATRIZ RESUMEN DE HISTORIAS DE USUARIO

| ID | Épica | Título de la Historia | Rol Principal | Story Points | Prioridad |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **HU-01** | Seguridad y Acceso | Inicio de Sesión Seguro y Gestión de Tokens | Usuario General | 3 | Alta (Must) |
| **HU-02** | Gestión Documental | Organización y Estructuración en Carpetas Lógicas | Analista Documental | 5 | Alta (Must) |
| **HU-03** | Ingesta de Archivos | Carga y Validación de Archivos Heterogéneos | Analista Documental | 5 | Alta (Must) |
| **HU-04** | Inteligencia Artificial | Clasificación Automática Multiclase de Documentos | Analista Documental | 8 | Alta (Must) |
| **HU-05** | Inteligencia Artificial | Generación Automatizada de Resúmenes Ejecutivos | Consultor / Analista | 5 | Media (Should) |
| **HU-06** | Inteligencia Artificial | Extracción Estructurada de Entidades y Metadatos | Analista / Auditor | 8 | Alta (Must) |
| **HU-07** | Búsqueda y RAG | Consulta Semántica en Lenguaje Natural (Q&A) | Consultor / Auditor | 13 | Alta (Must) |
| **HU-08** | Analítica y Auditoría | Visualización de Dashboard de Métricas y Estado | Administrador | 5 | Media (Should) |

---

## 2. ESPECIFICACIÓN DETALLADA DE HISTORIAS DE USUARIO (BDD / GHERKIN)

### HU-01: Inicio de Sesión Seguro y Gestión de Tokens
- **Épica:** Seguridad y Acceso
- **Estimación:** 3 Story Points
- **Prioridad:** Alta (Must Have)
- **Declaración de Usuario:**
  > **Como** usuario del sistema (Administrador, Analista o Consultor),  
  > **quiero** autenticarme con mis credenciales institucionales seguras,  
  > **para** acceder a las funcionalidades del sistema según los permisos asignados a mi rol.

#### Criterios de Aceptación (BDD)
```gherkin
Escenario 1: Autenticación exitosa con emisión de token JWT
  Dado que el usuario se encuentra en la pantalla de login del sistema
  Y posee una cuenta activa con el correo "analista.uts@uts.edu.co" y contraseña válida
  Cuando ingresa sus credenciales y presiona el botón "Iniciar Sesión"
  Entonces el sistema valida la identidad del usuario en menos de 500 ms
  Y genera un token JWT firmado que contiene el rol "ANALISTA"
  Y redirige al usuario a su panel principal con la sesión iniciada correctamente.

Escenario 2: Intento de autenticación con credenciales inválidas
  Dado que el usuario se encuentra en la pantalla de login
  Cuando ingresa un correo o una contraseña que no coinciden en el sistema
  Y presiona el botón "Iniciar Sesión"
  Entonces el sistema no emite ningún token JWT
  Y responde con un código de error HTTP 401
  Y muestra en pantalla el mensaje de advertencia "Credenciales incorrectas. Verifique los datos ingresados".
```

---

### HU-02: Organización y Estructuración en Carpetas Lógicas
- **Épica:** Gestión Documental
- **Estimación:** 5 Story Points
- **Prioridad:** Alta (Must Have)
- **Declaración de Usuario:**
  > **Como** Analista de Información Documental,  
  > **quiero** crear y estructurar carpetas jerárquicas en el repositorio,  
  > **para** categorizar y segregar los archivos institucionales de manera ordenada.

#### Criterios de Aceptación (BDD)
```gherkin
Escenario 1: Creación exitosa de una nueva carpeta en la raíz
  Dado que el Analista ha iniciado sesión y tiene permisos de escritura en el módulo documental
  Cuando solicita crear una carpeta con el nombre "Proyectos_Grado_2026"
  Entonces el sistema genera un identificador único para la carpeta
  Y la muestra inmediatamente en el árbol de directorios
  Y registra el evento de creación con la fecha y el ID del usuario en la base de datos.

Escenario 2: Intento de creación de carpeta duplicada en el mismo nivel
  Dado que ya existe una carpeta llamada "Proyectos_Grado_2026" en la raíz del repositorio
  Cuando el Analista intenta crear otra carpeta con el mismo nombre "Proyectos_Grado_2026" en esa misma ubicación
  Entonces el sistema rechaza la operación con un error de validación
  Y muestra el mensaje "Ya existe una carpeta con este nombre en la ubicación actual".
```

---

### HU-03: Carga y Validación de Archivos Heterogéneos
- **Épica:** Ingesta de Archivos
- **Estimación:** 5 Story Points
- **Prioridad:** Alta (Must Have)
- **Declaración de Usuario:**
  > **Como** Analista de Información Documental,  
  > **quiero** cargar archivos individuales o por lotes en formatos PDF, DOCX y TXT,  
  > **para** que queden almacenados de forma segura e inicien el pipeline de análisis inteligente.

#### Criterios de Aceptación (BDD)
```gherkin
Escenario 1: Carga exitosa de un archivo PDF válido
  Dado que el usuario selecciona un archivo "resolucion_rectoral.pdf" de 4.5 MB
  Y especifica la carpeta de destino "Actas_y_Resoluciones"
  Cuando presiona el botón "Cargar Archivo"
  Entonces el sistema valida que el tipo MIME sea "application/pdf" y el peso sea <= 20 MB
  Y almacena el binario en el storage seguro
  Y crea el registro del documento con el estado "Cargado" y genera su hash SHA-256
  Y encola la tarea de procesamiento asíncrono.

Escenario 2: Rechazo por archivo con tamaño excedido
  Dado que el usuario intenta subir un archivo "tesis_completa.pdf" de 25.8 MB
  Cuando ejecuta la acción de carga
  Entonces el sistema intercepta la petición antes del guardado definitivo
  Y retorna un código de estado HTTP 413 (Payload Too Large)
  Y presenta la notificación de error "El archivo excede el tamaño máximo permitido de 20 MB".
```

---

### HU-04: Clasificación Automática Multiclase de Documentos
- **Épica:** Inteligencia Artificial
- **Estimación:** 8 Story Points
- **Prioridad:** Alta (Must Have)
- **Declaración de Usuario:**
  > **Como** Analista Documental,  
  > **quiero** que el sistema clasifique automáticamente los documentos cargados en categorías como Administrativo, Técnico o Legal/Financiero,  
  > **para** eliminar la necesidad de clasificación manual y asegurar la homogeneidad del archivo.

#### Criterios de Aceptación (BDD)
```gherkin
Escenario 1: Clasificación automática precisa de documento administrativo
  Dado que un documento con contenido referente a actas de comité y asignación presupuestal fue parseado exitosamente
  Cuando el motor de IA ejecuta el modelo de clasificación sobre el contenido
  Entonces el sistema asigna la categoría "Administrativo"
  Y almacena un score de confianza (ej. 0.94) y una justificación textual breve
  Y actualiza los metadatos del documento visualizables en la plataforma.

Escenario 2: Documento con texto ambiguo o confianza baja
  Dado que un documento procesado tiene texto disperso que genera una confianza de clasificación menor al 60% (0.60)
  Cuando el clasificador finaliza la inferencia
  Entonces el sistema etiqueta el documento como "Por Clasificar / Revisión Requerida"
  Y emite una alerta visual en la bandeja de entrada del Analista para validación manual.
```

---

### HU-05: Generación Automatizada de Resúmenes Ejecutivos
- **Épica:** Inteligencia Artificial
- **Estimación:** 5 Story Points
- **Prioridad:** Media (Should Have)
- **Declaración de Usuario:**
  > **Como** Consultor o Directivo Institucional,  
  > **quiero** disponer de un resumen ejecutivo sintetizado de cada documento cargado,  
  > **para** comprender el propósito y puntos clave del archivo sin necesidad de leerlo por completo.

#### Criterios de Aceptación (BDD)
```gherkin
Escenario 1: Generación exitosa de resumen para documento técnico extenso
  Dado que un archivo DOCX de 35 páginas ha completado la fase de extracción de texto
  Cuando el microservicio de IA ejecuta la rutina de síntesis mediante el LLM
  Entonces el sistema genera un resumen estructurado en Markdown de entre 150 y 300 palabras
  Y el resumen contiene el objetivo general, acuerdos clave y conclusiones principales
  Y queda disponible en la pestaña "Resumen Ejecutivo" del visor de documentos.

Escenario 2: Documento sin texto legible o vacío
  Dado que se procesó un archivo TXT con contenido en blanco o menor a 20 palabras
  Cuando el sistema intenta ejecutar la tarea de resumen
  Entonces el pipeline detecta que la longitud de tokens no alcanza el umbral mínimo
  Y asigna el estado "Resumen no disponible - Contenido insuficiente" sin consumir llamadas innecesarias al LLM.
```

---

### HU-06: Extracción Estructurada de Entidades y Metadatos
- **Épica:** Inteligencia Artificial
- **Estimación:** 8 Story Points
- **Prioridad:** Alta (Must Have)
- **Declaración de Usuario:**
  > **Como** Auditor o Analista de la UTS,  
  > **quiero** que el sistema extraiga entidades clave (fechas, responsables, valores económicos, entidades externas) en formato JSON estructurado,  
  > **para** facilitar auditorías cruzadas y exportación de datos clave a otros sistemas.

#### Criterios de Aceptación (BDD)
```gherkin
Escenario 1: Extracción de entidades en documento de tipo Legal/Financiero
  Dado que el documento clasificado como "Legal/Financiero" corresponde a un contrato institucional
  Cuando el modelo de IA procesa la extracción siguiendo el esquema JSON predefinido
  Entonces el sistema devuelve un objeto JSON validado con campos como: "numero_contrato", "fecha_firma", "partes_involucradas", "cuantia" y "vigencia"
  Y los datos se almacenan en la base de datos relacional vinculados al documento.

Escenario 2: Extracción con esquema fallido o campos faltantes
  Dado que el documento no contiene explícitamente alguno de los campos requeridos (ej. no indica cuantía económica)
  Cuando el motor de extracción procesa el archivo
  Entonces el sistema asigna el valor "null" a dicho campo
  Y valida exitosamente el JSON resultante contra el schema sin provocar excepciones en el backend.
```

---

### HU-07: Consulta Semántica en Lenguaje Natural (Q&A con RAG)
- **Épica:** Búsqueda y RAG
- **Estimación:** 13 Story Points
- **Prioridad:** Alta (Must Have)
- **Declaración de Usuario:**
  > **Como** Consultor o Investigador institucional,  
  > **quiero** hacer preguntas en lenguaje natural sobre la base documental institucional,  
  > **para** obtener respuestas precisas fundamentadas y sustentadas con citas exactas de los documentos fuente.

#### Criterios de Aceptación (BDD)
```gherkin
Escenario 1: Consulta semántica con respuesta fundamentada y cita bibliográfica
  Dado que el repositorio contiene documentos indexados con sus embeddings vectoriales
  Cuando el usuario pregunta: "¿Cuáles son los requisitos de graduación según el reglamento vigente?"
  Entonces el sistema recupera los 4 fragmentos vectoriales más relevantes por similitud de coseno
  Y el LLM genera una respuesta clara respondiendo directamente a la pregunta
  Y la interfaz muestra la respuesta acompañada de la fuente: "[Reglamento_Estudiantil_UTS.pdf, Página 18, Párrafo 2]"
  Y el tiempo de respuesta total es menor a 2.5 segundos.

Escenario 2: Pregunta sobre información no contenida en los documentos
  Dado que el usuario formula una pregunta cuya temática no existe en los documentos del repositorio
  Cuando el motor RAG calcula la similitud vectorial y detecta que los fragmentos no superan el umbral de relevancia (score < 0.65)
  Entonces el sistema genera la respuesta: "La información solicitada no se encuentra disponible en los documentos cargados en el repositorio institucional"
  Y no inventa ni alucina datos externos.
```

---

### HU-08: Visualización de Dashboard de Métricas y Estado
- **Épica:** Analítica y Auditoría
- **Estimación:** 5 Story Points
- **Prioridad:** Media (Should Have)
- **Declaración de Usuario:**
  > **Como** Administrador del Sistema,  
  > **quiero** consultar un dashboard interactivo con estadísticas de carga, distribución de categorías y estado de auditoría,  
  > **para** monitorear la salud del sistema y la actividad documental de las UTS.

#### Criterios de Aceptación (BDD)
```gherkin
Escenario 1: Carga y visualización correcta de métricas del dashboard
  Dado que el Administrador accede a la sección "Métricas y Auditoría"
  Cuando la vista se inicializa
  Entonces el frontend consume los endpoints analíticos del backend
  Y renderiza gráficos de barras con la distribución por categorías (Administrativo, Técnico, Legal/Financiero)
  Y muestra tarjetas con el total de archivos, porcentaje de éxito en procesamiento (ej. 98.2%) y tiempo medio de inferencia
  Y la carga total de la vista se completa en menos de 1.5 segundos.

Escenario 2: Filtrado dinámico por rango de fechas en el dashboard
  Dado que el Administrador está visualizando el dashboard
  Cuando selecciona un rango de fechas correspondiente al último mes ("01/08/2026 - 31/08/2026")
  Entonces el sistema recalcula inmediatamente las estadísticas y actualiza los gráficos sin recargar la página completa.
```
