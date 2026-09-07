# PERFILES DE USUARIO, PERSONAS Y ANÁLISIS DE STAKEHOLDERS
## Proyecto: Sistema Inteligente de Gestión y Análisis Documental
### Institución: Unidades Tecnológicas de Santander (UTS)
### Estándar: User Personas & Matriz de Responsabilidades RACI

---

## 1. MAPA DE ACTORES Y ROLES DEL SISTEMA

El sistema define tres perfiles de usuarios humanos primarios y un actor del sistema:

```
+-----------------------------------------------------------------------------------+
|                            MAPA DE ACTORES DEL SISTEMA                            |
+-----------------------------------------------------------------------------------+
                                         |
         +-------------------------------+-------------------------------+
         |                               |                               |
+------------------+           +-------------------+           +--------------------+
|  ADMINISTRADOR   |           |     ANALISTA      |           | CONSULTOR / AUDITOR|
|   DEL SISTEMA    |           |    DOCUMENTAL     |           |                    |
+------------------+           +-------------------+           +--------------------+
| - Gestión usuarios           | - Ingesta masiva  |           | - Búsquedas RAG    |
| - Auditoría/Logs             | - Clasificación   |           | - Resúmenes        |
| - Monitoreo IA/APIs          | - Extracción JSON |           | - Lectura/Reportes |
| - Salud del backend          | - Gestión carpetas|           | - Verificación     |
+------------------+           +-------------------+           +--------------------+
```

---

## 2. FICHAS TÉCNICAS DE "USER PERSONA"

---

### Perfil 1: Administrador del Sistema
![Persona 1: Carlos Mendoza](https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150) *(Representación conceptual)*

| Atributo | Detalle |
| :--- | :--- |
| **Nombre Ficticio** | **Ing. Carlos Mendoza Villamizar** |
| **Rol Institucional** | Administrador de Infraestructura TI y Seguridad - UTS |
| **Edad / Formación** | 38 años / Ingeniero de Sistemas, Especialista en Seguridad Informática |
| **Nivel Tecnológico** | **Avanzado (Senior):** Manejo fluido de Linux, Docker, bases de datos SQL/NoSQL, APIs REST y monitoreo de servidores. |
| **Objetivos en el Software** | 1. Garantizar la disponibilidad (99.5%) y seguridad del repositorio.<br>2. Supervisar el consumo de tokens y costos asociados al servicio de IA.<br>3. Gestionar accesos basados en roles (RBAC) y auditar trazas de error en el procesamiento. |
| **Frustraciones Habituales** | - Falta de observabilidad y logs crípticos cuando fallan procesos asíncronos.<br>- Sobrecarga de soporte por usuarios que no pueden cargar archivos por problemas de formato.<br>- Respuestas lentas del backend que generan quejas institucionales. |
| **Casos de Uso Frecuentes** | - `CU-01`: Autenticar Usuario con credenciales administrativas.<br>- `CU-07`: Consultar Dashboard y Métricas de Rendimiento.<br>- `CU-08`: Auditar Logs y Trazas de Error del Pipeline. |
| **Cita Representativa** | *"Necesito que la plataforma sea blindada, que los errores de IA se aíslen sin tumbar el backend y que cada acción quede auditada con fecha y responsable."* |

---

### Perfil 2: Analista de Información Documental
![Persona 2: Laura Gómez](https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150) *(Representación conceptual)*

| Atributo | Detalle |
| :--- | :--- |
| **Nombre Ficticio** | **Laura Patricia Gómez Serrano** |
| **Rol Institucional** | Asistente de Gestión Documental y Archivo Central - UTS |
| **Edad / Formación** | 29 años / Tecnóloga en Gestión de Información, estudiante de Ingeniería |
| **Nivel Tecnológico** | **Intermedio:** Manejo cotidiano de suites ofimáticas, gestores de contenido web y repositorios en la nube (Google Drive/SharePoint). |
| **Objetivos en el Software** | 1. Cargar cientos de documentos (PDF, DOCX, TXT) de forma rápida y organizada.<br>2. Validar que la IA clasifique adecuadamente entre actas, manuales y contratos.<br>3. Obtener metadatos estructurados (JSON) para homologar con el sistema académico. |
| **Frustraciones Habituales** | - Reprocesar documentos manualmente cuando el OCR o extractor falla silenciosamente.<br>- Interfaces confusas con demasiados pasos para organizar carpetas.<br>- Falta de notificación clara cuando un archivo queda en estado de error. |
| **Casos de Uso Frecuentes** | - `CU-02`: Cargar y Parsear Documento al Repositorio.<br>- `CU-03`: Monitorear Inferencia de Clasificación y Extracción.<br>- `CU-05`: Gestionar Carpetas y Estructura Jerárquica. |
| **Cita Representativa** | *"Subo cientos de resoluciones cada mes. La clasificación automática y la extracción de números de acta me ahorran semanas enteras de trabajo manual."* |

---

### Perfil 3: Consultor / Auditor Institucional
![Persona 3: Dr. Fernando Ruiz](https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150) *(Representación conceptual)*

| Atributo | Detalle |
| :--- | :--- |
| **Nombre Ficticio** | **Dr. Fernando Ruiz Beltrán** |
| **Rol Institucional** | Par Académico / Auditor Interno de Calidad - UTS |
| **Edad / Formación** | 46 años / Magíster en Educación y Evaluación de la Calidad |
| **Nivel Tecnológico** | **Básico - Medio:** Usuario de aplicaciones de oficina y navegadores web; busca simplicidad y respuestas inmediatas. |
| **Objetivos en el Software** | 1. Encontrar rápidamente respuestas a preguntas normativas y curriculares complejas.<br>2. Leer resúmenes ejecutivos precisos antes de emitir conceptos técnicos.<br>3. Verificar la procedencia y citas exactas (página y documento) de los datos entregados por la IA. |
| **Frustraciones Habituales** | - Búsquedas por palabras clave que devuelven cientos de documentos irrelevantes.<br>- Información desactualizada o respuestas de IA imprecisas (alucinaciones).<br>- Dificultad para comprobar en qué página exacta está la cláusula o norma citada. |
| **Casos de Uso Frecuentes** | - `CU-04`: Realizar Consulta Semántica Documental (Q&A con RAG).<br>- `CU-06`: Realizar Búsqueda Léxica y Filtrado Combinado.<br>- Lectura de Resúmenes Ejecutivos generados automáticamente. |
| **Cita Representativa** | *"No tengo tiempo para leer 80 páginas por cada proyecto; quiero preguntarle al sistema en lenguaje natural y que me muestre el párrafo exacto que sustenta la respuesta."* |

---

## 3. MATRIZ RACI DE INTERACCIÓN FUNCIONAL

Definición de roles en la matriz:
- **R (Responsible / Responsable de Ejecución):** Quien realiza la tarea directamente.
- **A (Accountable / Aprobador o Responsable Final):** Quien responde por el resultado final y toma decisiones.
- **C (Consulted / Consultado):** Quien aporta información clave para la tarea.
- **I (Informed / Informado):** Quien recibe la notificación del resultado de la acción.

| Módulo / Funcionalidad del Sistema | Administrador TI | Analista Documental | Consultor / Auditor | Worker IA / Backend |
| :--- | :---: | :---: | :---: | :---: |
| **M01: Autenticación y Gestión RBAC** | **A / R** | I | I | R |
| **M02: Gestión de Estructura de Carpetas** | A | **R** | I | I |
| **M03: Carga y Validación de Archivos** | I | **A / R** | I | R |
| **M04: Extracción de Texto y OCR** | I | C | I | **A / R** |
| **M05: Clasificación Multiclase IA** | I | **A** | I | **R** |
| **M06: Generación de Resúmenes y JSON** | I | A | C | **R** |
| **M07: Búsqueda Semántica y RAG (Q&A)** | I | C | **A / R** | **R** |
| **M08: Dashboard y Reportes de Auditoría** | **A / R** | I | I | R |
| **M09: Gestión de Trazas de Error y Reintentos** | **A / R** | I | I | R |
