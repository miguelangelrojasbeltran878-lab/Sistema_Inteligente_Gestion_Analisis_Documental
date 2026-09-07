# MATRIZ DE TRAZABILIDAD DE REQUISITOS (RTM)
## Proyecto: Sistema Inteligente de Gestión y Análisis Documental
### Institución: Unidades Tecnológicas de Santander (UTS)
### Estándar: Requirements Traceability Matrix (RTM) Bidireccional

---

## 1. MARCO METODOLÓGICO DE LA TRAZABILIDAD

La trazabilidad de requisitos es el pilar de aseguramiento de calidad que garantiza que cada necesidad de negocio y objetivo institucional se transforme en especificaciones funcionales, casos de uso, código ejecutable y pruebas formales sin omisiones ni desviaciones no autorizadas (*scope creep*).

```
+-------------------+      +-------------------+      +-------------------+
|  OBJETIVO UTS     | ---> |    REQUISITO      | ---> |   HISTORIA DE     |
|  (Negocio / ERS)  |      |   FUNCIONAL (RF)  |      |   USUARIO (HU)    |
+-------------------+      +-------------------+      +-------------------+
                                                        |
                                                        v
+-------------------+      +-------------------+      +-------------------+
| PRUEBA / CONTROL  | <--- |   MÓDULO CÓDIGO   | <--- |   CASO DE USO     |
| (Unit/Integ/E2E)  |      |  (Arquitectura)   |      |      (CU)         |
+-------------------+      +-------------------+      +-------------------+
```

---

## 2. TABLA MAESTRA DE TRAZABILIDAD CRUZADA (FUNCIONAL)

| ID RF | Necesidad / Objetivo de Negocio | Historia de Usuario (HU) | Caso de Uso (CU) | Capa / Módulo de Arquitectura Responsable | Mecanismo de Verificación | Estado Línea Base |
| :---: | :--- | :---: | :---: | :--- | :--- | :---: |
| **RF-01** | OE-01: Control de acceso y seguridad institucional | **HU-01** | **CU-01** | Frontend (Auth View) / Backend API (Spring Security, JWT) / DB PostgreSQL | Pruebas Unitarias (JUnit) + Pruebas de Integración JWT | **Aprobado** |
| **RF-02** | OE-01: Estructuración lógica de repositorios | **HU-02** | **CU-05** | Frontend (Folder Tree) / Backend API (Folder Service) / DB PostgreSQL | Pruebas Unitarias + Pruebas de Integración CRUD | **Aprobado** |
| **RF-03** | OE-01: Ingesta segura de archivos heterogéneos | **HU-03** | **CU-02** | Frontend (Drag&Drop Upload) / Backend API (Multipart Validator) / Local Storage | Pruebas de Integración (Upload límites 20MB, Magic Bytes) | **Aprobado** |
| **RF-04** | OE-02: Extracción y parsing multiformato con OCR | **HU-03** | **CU-02**, **CU-03** | Módulo IA (FastAPI, PyMuPDF, python-docx, Tesseract OCR) | Pruebas Unitarias (PyTest extracción) + Test E2E de OCR | **Aprobado** |
| **RF-05** | OE-02: Categorización taxonómica automatizada | **HU-04** | **CU-03** | Módulo IA (Classifier Model, Scikit/LLM) / Backend API / DB | Pruebas Unitarias (Matriz de confusión, F1-Score $\ge 0.85$) | **Aprobado** |
| **RF-06** | OE-03: Síntesis ejecutiva de documentos | **HU-05** | **CU-03** | Módulo IA (LLM Summarizer Service) / DB PostgreSQL / Frontend | Pruebas de Inferencia de IA + Validación de esquema Markdown | **Aprobado** |
| **RF-07** | OE-03: Extracción estructurada de metadatos | **HU-06** | **CU-03** | Módulo IA (Pydantic, JSON Schema LLM) / DB PostgreSQL | Pruebas Unitarias de Validación JSON Schema (Pydantic) | **Aprobado** |
| **RF-08** | OE-04: Consultas semánticas y Q&A contextual | **HU-07** | **CU-04** | Frontend (Chat View) / Backend RAG / Embeddings / Vector DB (Qdrant/pgvector) / LLM | Pruebas de Integración RAG + Validación de latencia ($<2.5$s) | **Aprobado** |
| **RF-09** | OE-04: Recuperación de documentos por filtros | **HU-07** | **CU-06** | Frontend (Search Bar) / Backend API (Search Service) / DB PostgreSQL | Pruebas Unitarias SQL + Pruebas de Carga de búsqueda | **Aprobado** |
| **RF-10** | OE-05: Visibilidad de indicadores gerenciales | **HU-08** | **CU-07** | Frontend (Dashboard Charts) / Backend API (Analytics Service) | Pruebas E2E (Cypress / Playwright) + Validación de métricas | **Aprobado** |
| **RF-11** | OE-05: Trazabilidad, auditoría y control de fallos | **HU-08** | **CU-08** | Backend API (Audit Interceptor) / Worker IA / DB PostgreSQL Audit Table | Pruebas de Integración (Simulación de fallas y verificación de logs) | **Aprobado** |

---

## 3. MATRIZ DE TRAZABILIDAD DE REQUISITOS NO FUNCIONALES (RNF)

| Código RNF | Categoría | Componente / Capa Técnica Involucrada | Técnica de Implementación | Criterio de Validación / Prueba |
| :---: | :--- | :--- | :--- | :--- |
| **RNF-01** | Seguridad | Gateway, Auth Controller, Storage, Ingestion Module | BCrypt, JWT RSA256, TLS 1.3, Magic Bytes validation, Escapado de inputs | Escaneo SAST (SonarQube) sin vulnerabilidades críticas; OWASP ZAP test. |
| **RNF-02** | Rendimiento | Vector DB, Redis Cache, Workers Asíncronos, Spring Boot | Indexación HNSW en vectores, caché en consultas frecuentes, hilos async en Spring | Pruebas de carga (JMeter / k6): $P_{95} \le 2.5$s con 50 usuarios concurrentes. |
| **RNF-03** | Disponibilidad | Docker Compose / Orquestador, Healthchecks | Contenedores con política `restart: always`, endpoints de `/actuator/health` y `/healthz` | Prueba de desconexión y recuperación automática de servicios en $< 10$ segundos. |
| **RNF-04** | Usabilidad | Frontend React / Next.js / TailwindCSS | Diseño adaptativo, accesibilidad WCAG 2.1 AA, componentes visuales claros | Evaluación heurística de usabilidad y prueba SUS con usuarios finales ($\ge 80/100$). |
| **RNF-05** | Mantenibilidad | Todos los repositorios de código | Clean Architecture, DTOs, desacoplamiento de capas, OpenAPI 3.0 | Cobertura de código con JaCoCo y PyTest $\ge 80\%$, reporte SonarQube grado 'A'. |
| **RNF-06** | Escalabilidad | Microservicios / Workers de IA | Procesamiento desacoplado con colas Celery / RabbitMQ / Redis | Capacidad demostrada de escalar réplicas del worker de IA de 1 a 4 instancias. |

---

## 4. CONTROL DE VERIFICACIÓN Y APROBACIÓN DE LA LÍNEA BASE

- **Líder de Requisitos de Software:** Aprobado (Línea base cerrada para fase de Diseño).
- **Líder de Calidad y Pruebas (QA):** Aprobado (Criterios de aceptación y planes de prueba vinculados 100%).
- **Arquitecto de Software:** Aprobado (Alineación con microservicios Spring Boot, FastAPI y PostgreSQL/Vector Store).
