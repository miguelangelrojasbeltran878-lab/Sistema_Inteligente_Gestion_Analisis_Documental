# PRIORIZACIÓN DE REQUISITOS DEL SOFTWARE
## Proyecto: Sistema Inteligente de Gestión y Análisis Documental
### Institución: Unidades Tecnológicas de Santander (UTS)
### Técnicas: MoSCoW & Matriz de Valor vs. Complejidad

---

## 1. JUSTIFICACIÓN DE LA TÉCNICA DE PRIORIZACIÓN SELECCIONADA

Para garantizar la entrega temprana de valor institucional y gestionar adecuadamente el riesgo tecnológico asociado a la integración de modelos de Inteligencia Artificial y bases de datos vectoriales, se combinan dos metodologías complementarias:
1. **Método MoSCoW:** Permite establecer fronteras nítidas sobre los requisitos indispensables para el Producto Mínimo Viable (MVP) y las características complementarias.
2. **Matriz de Valor vs. Complejidad (Cuadrantes de Decisión):** Asigna una puntuación cuantificable de 1 a 5 para el *Valor de Negocio* y la *Complejidad Técnica/Arquitectónica*, permitiendo priorizar desarrollos clasificados como "Victorias Rápidas" (*Quick Wins*) y "Grandes Proyectos Estratégicos" antes que tareas accesorias.

---

## 2. CLASIFICACIÓN MoSCoW DE REQUISITOS FUNCIONALES

| Categoría MoSCoW | Código RF | Nombre del Requisito Funcional | Justificación Estratégica |
| :--- | :--- | :--- | :--- |
| **MUST HAVE**<br>*(Obligatorio para MVP)* | **RF-01** | Autenticación y Autorización (JWT/RBAC) | Sin seguridad y segregación de roles el sistema no puede operar en un entorno institucional. |
| | **RF-02** | Gestión de Repositorios y Carpetas | Estructura base para organizar y delimitar el contexto de los documentos. |
| | **RF-03** | Carga y Validación de Archivos (PDF, DOCX, TXT) | Ingesta primaria de los datos que alimentan el pipeline. |
| | **RF-04** | Extracción de Texto y OCR | Precondición ineludible para cualquier inferencia de IA posterior. |
| | **RF-05** | Clasificación Automática Multiclase | Núcleo de automatización para organizar taxonomías documentales. |
| | **RF-07** | Extracción de Información Estructurada (JSON) | Permite estructurar datos para integración con bases institucionales. |
| | **RF-08** | Consulta Semántica en Lenguaje Natural (RAG) | Diferenciador tecnológico y valor principal del proyecto. |
| **SHOULD HAVE**<br>*(Importante, no bloquea MVP)* | **RF-06** | Generación de Resumen Ejecutivo por Documento | Alto valor para directivos, pero el sistema puede operar la búsqueda sin este componente. |
| | **RF-09** | Búsqueda Tradicional y Filtros Combinados | Alternativa de consulta complementaria al motor semántico. |
| | **RF-11** | Registro y Auditoría de Procesamiento | Crítico para soporte y trazabilidad de fallas del pipeline. |
| **COULD HAVE**<br>*(Deseable si hay capacidad)* | **RF-10** | Dashboard de Analítica y Métricas | Aporta visibilidad gerencial; secundario frente a la funcionalidad analítica de IA. |
| **WON'T HAVE**<br>*(Excluido de la versión actual)* | **RF-EX01** | Edición Colaborativa en Tiempo Real | Fuera del alcance del sistema (gestor y analizador, no editor). |
| | **RF-EX02** | Firma Digital Criptográfica Externa | Requiere convenio con entidad de certificación externa (PKI). |

---

## 3. MATRIZ DE PONDERACIÓN (VALOR VS. COMPLEJIDAD)

Escala de evaluación: 1 (Muy Bajo) a 5 (Muy Alto).

| Código RF | Nombre del Requisito | Valor de Negocio (V: 1-5) | Complejidad Técnica (C: 1-5) | Ratio ROI (V / C) | Cuadrante Estratégico |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **RF-01** | Autenticación y Autorización (JWT/RBAC) | 5 | 2 | 2.50 | Victoria Rápida (*Quick Win*) |
| **RF-02** | Gestión de Repositorios y Carpetas | 4 | 2 | 2.00 | Victoria Rápida (*Quick Win*) |
| **RF-03** | Carga y Validación de Archivos | 5 | 2 | 2.50 | Victoria Rápida (*Quick Win*) |
| **RF-04** | Extracción de Texto y OCR | 5 | 4 | 1.25 | Proyecto Estratégico (*Core*) |
| **RF-05** | Clasificación Automática Multiclase | 5 | 4 | 1.25 | Proyecto Estratégico (*Core*) |
| **RF-06** | Generación de Resumen Ejecutivo | 4 | 3 | 1.33 | Alto Valor / Mediana Complejidad |
| **RF-07** | Extracción de Entidades JSON | 5 | 4 | 1.25 | Proyecto Estratégico (*Core*) |
| **RF-08** | Consulta Semántica (RAG/Embeddings) | 5 | 5 | 1.00 | Proyecto Estratégico Mayor (*High Impact*) |
| **RF-09** | Búsqueda Tradicional y Filtros | 3 | 2 | 1.50 | Victoria Rápida (*Quick Win*) |
| **RF-10** | Dashboard de Analítica y Métricas | 3 | 3 | 1.00 | Tarea Complementaria |
| **RF-11** | Registro y Auditoría de Procesamiento | 4 | 3 | 1.33 | Tarea de Infraestructura/Calidad |

```
  VALOR PARA EL NEGOCIO (1 a 5)
   5 | [RF-01, RF-03]          [RF-04, RF-05, RF-07]     [RF-08]
   4 | [RF-02]                 [RF-06, RF-11]
   3 | [RF-09]                 [RF-10]
   2 |
   1 |
     +-------------------------------------------------------------
       1           2           3           4           5
                      COMPLEJIDAD TÉCNICA (1 a 5)
```

---

## 4. CRONOGRAMA PRELIMINAR DE ENTREGAS POR SPRINT / FASE

El proyecto se planifica en **4 Sprints de 2 semanas** de duración cada uno:

```
+---------------------------------------------------------------------------------------------------------+
| SPRINT 1 (Semanas 1-2): Cimientos, Seguridad y Gestión de Archivos                                     |
| Requisitos: RF-01, RF-02, RF-03, RF-11 (Base)                                                           |
| Entregables:                                                                                            |
| - Módulo Auth JWT / RBAC con Spring Boot y PostgreSQL.                                                 |
| - API y UI para creación de carpetas y carga validada de archivos (PDF, DOCX, TXT <= 20MB).             |
| - Base de datos relacional y bitácora de auditoría básica.                                              |
+---------------------------------------------------------------------------------------------------------+
                                                     |
                                                     v
+---------------------------------------------------------------------------------------------------------+
| SPRINT 2 (Semanas 3-4): Pipeline de Extracción y Clasificación Multiclase                               |
| Requisitos: RF-04, RF-05, RF-11 (Logs avanzados)                                                        |
| Entregables:                                                                                            |
| - Microservicio de IA en Python (FastAPI / Celery) para parsing de PDF/DOCX/TXT y OCR Tesseract.       |
| - Pipeline de chunking y clasificador multiclase (Administrativo, Técnico, Legal/Financiero).          |
| - Trazabilidad de estados: Cargado -> En Proceso -> Procesado / Error.                                   |
+---------------------------------------------------------------------------------------------------------+
                                                     |
                                                     v
+---------------------------------------------------------------------------------------------------------+
| SPRINT 3 (Semanas 5-6): Extracción de Entidades, Resúmenes y Motor RAG                                  |
| Requisitos: RF-06, RF-07, RF-08                                                                         |
| Entregables:                                                                                            |
| - Generación de resúmenes ejecutivos e inferencia estructurada de JSON schemas.                          |
| - Indexación de embeddings vectoriales en Vector Store (Qdrant/Chroma/pgvector).                        |
| - Endpoint y chat conversacional de preguntas y respuestas (Q&A con RAG y citas bibliográficas).        |
+---------------------------------------------------------------------------------------------------------+
                                                     |
                                                     v
+---------------------------------------------------------------------------------------------------------+
| SPRINT 4 (Semanas 7-8): Búsqueda Híbrida, Dashboard y Estabilización                                    |
| Requisitos: RF-09, RF-10, Estabilización RNF (Seguridad, Rendimiento, Pruebas E2E)                      |
| Entregables:                                                                                            |
| - Dashboard con métricas interactivas y gráficos de rendimiento del repositorio.                         |
| - Búsqueda tradicional con filtros combinados.                                                          |
| - Pruebas de estrés, seguridad SAST/DAST y afinamiento de latencias (< 2.5s).                            |
+---------------------------------------------------------------------------------------------------------+
```
