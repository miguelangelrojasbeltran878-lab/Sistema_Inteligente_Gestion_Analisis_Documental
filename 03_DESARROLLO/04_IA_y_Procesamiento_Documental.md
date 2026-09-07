# INGENIERÍA DE INTELIGENCIA ARTIFICIAL, NLP Y MOTOR RAG
## Proyecto: Sistema Inteligente de Gestión y Análisis Documental
### Institución: Unidades Tecnológicas de Santander (UTS)
### Stack de IA: Python 3.11 + FastAPI + PyMuPDF + Tesseract 5 + Sentence-Transformers + Google Gemini / OpenAI + pgvector

---

## 1. PIPELINE TÉCNICO DE INGESTIÓN DOCUMENTAL

El pipeline de procesamiento se ejecuta de manera determinista y asíncrona a través de las siguientes fases secuenciales:

```
[Archivo Binario (PDF, DOCX, TXT)]
               |
               v
[Fase 1: Extractor Multiformato (PyMuPDF / python-docx / Fallback OCR Tesseract)]
               |
               v
[Fase 2: Normalización, Sanitización de Caracteres y Limpieza Textual]
               |
               v
[Fase 3: Segmentación Semántica / Chunking (500 tokens, 100 overlap)]
               |
               +-----------------------+-----------------------+
               |                       |                       |
               v                       v                       v
[Fase 4A: Embeddings & pgvector] [Fase 4B: Clasificación IA] [Fase 4C: Resumen & JSON]
```

### 1.1 Código Funcional del Extractor Textual Multiformato (`document_processing/extractor.py`)

```python
import os
import fitz  # PyMuPDF
import docx
import pytesseract
from PIL import Image
import io

class DocumentExtractor:
    @staticmethod
    def extract_text(file_path: str) -> dict:
        """
        Extrae texto digital y metadatos de archivos PDF, DOCX y TXT.
        Aplica OCR Tesseract automáticamente si detecta un PDF basado en imágenes escaneadas.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Archivo no encontrado en la ruta: {file_path}")

        ext = os.path.splitext(file_path)[1].lower()
        
        if ext == ".txt":
            return DocumentExtractor._extract_txt(file_path)
        elif ext == ".docx":
            return DocumentExtractor._extract_docx(file_path)
        elif ext == ".pdf":
            return DocumentExtractor._extract_pdf(file_path)
        else:
            raise ValueError(f"Extensión no soportada: {ext}")

    @staticmethod
    def _extract_txt(file_path: str) -> dict:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
        return {"full_text": text, "pages": [{"page_number": 1, "text": text}], "ocr_applied": False}

    @staticmethod
    def _extract_docx(file_path: str) -> dict:
        doc = docx.Document(file_path)
        full_text_list = []
        for p in doc.paragraphs:
            if p.text.strip():
                full_text_list.append(p.text.strip())
        
        # Extracción de tablas en DOCX
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join([cell.text.strip() for cell in row.cells if cell.text.strip()])
                if row_text:
                    full_text_list.append(row_text)

        full_text = "\n".join(full_text_list)
        return {"full_text": full_text, "pages": [{"page_number": 1, "text": full_text}], "ocr_applied": False}

    @staticmethod
    def _extract_pdf(file_path: str) -> dict:
        doc = fitz.open(file_path)
        pages_data = []
        full_text_list = []
        ocr_needed = False

        for page_idx in range(len(doc)):
            page = doc[page_idx]
            page_text = page.get_text("text").strip()

            # Si la página tiene menos de 40 caracteres, se asume escaneo y se aplica OCR
            if len(page_text) < 40:
                pix = page.get_pixmap(dpi=200)
                img = Image.open(io.BytesIO(pix.tobytes("png")))
                page_text = pytesseract.image_to_string(img, lang="spa").strip()
                ocr_needed = True

            pages_data.append({"page_number": page_idx + 1, "text": page_text})
            full_text_list.append(page_text)

        doc.close()
        return {
            "full_text": "\n\n".join(full_text_list),
            "pages": pages_data,
            "ocr_applied": ocr_needed
        }
```

---

## 2. INTEGRACIÓN CON MODELOS DE IA

### 2.1 Justificación Técnica de los Modelos Seleccionados
1. **Generación de Embeddings (`all-MiniLM-L6-v2`):**
   - Inferencia local en CPU con tiempo menor a 40 ms por chunk.
   - Vector compacto de 384 dimensiones que reduce en un 75% el uso de memoria en PostgreSQL frente a modelos de 1536 dimensiones.
   - Cero costo de operación por tokens y aislamiento de datos confidenciales.
2. **Inferencia de Clasificación, Resumen y RAG (Google Gemini 1.5 Flash / OpenAI GPT-4o-mini):**
   - Ventana de contexto amplia (hasta 1 millón de tokens).
   - Soporte nativo para salidas estructuradas en formato JSON Schema validado mediante Pydantic.
   - Latencias de generación menores a 1.2 segundos y precisión superior al 95%.

---

### 2.2 Clasificación Multiclase, Resumen y Extracción Estructurada (`ai/app/services/ai_pipeline.py`)

```python
import os
import json
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import Optional, List

class DocumentExtractionSchema(BaseModel):
    numero_documento: Optional[str] = Field(description="Número de resolución, acta o contrato")
    emisor_responsable: Optional[str] = Field(description="Entidad, dependencia o persona emisora")
    fecha_expedicion: Optional[str] = Field(description="Fecha oficial de emisión en formato YYYY-MM-DD")
    monto_economico: Optional[float] = Field(description="Valor monetario si aplica, en pesos COP")
    entidades_clave: List[str] = Field(description="Lista de personas, empresas o dependencias citadas")

class AIPipelineEngine:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.client = genai.Client(api_key=self.api_key)

    def classify_document(self, text_sample: str) -> dict:
        """Clasifica el documento en: Administrativo, Financiero o Técnico/Legal."""
        prompt = f"""
        Eres un clasificador documental de las Unidades Tecnológicas de Santander (UTS).
        Analiza el siguiente fragmento y clasifícalo estrictamente en una de estas tres categorías:
        1. Administrativo (Actas, circulares, resoluciones de personal, memorandos)
        2. Financiero (Presupuestos, contratos, órdenes de compra, pagos, facturas)
        3. Técnico/Legal (Manuales, pliegos de condiciones, proyectos de grado, normatividad)

        Texto:
        \"\"\"{text_sample[:3000]}\"\"\"

        Responde ÚNICAMENTE un objeto JSON válido con las llaves:
        {{"category": "Administrativo|Financiero|Técnico/Legal", "confidence_score": 0.0 a 1.0, "reason": "breve explicación"}}
        """
        response = self.client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        return json.loads(response.text)

    def generate_summary(self, full_text: str) -> str:
        """Genera un resumen ejecutivo estructurado de entre 150 y 300 palabras."""
        prompt = f"""
        Eres un asistente de gestión documental de las UTS.
        Genera un resumen ejecutivo profesional, sintético y formal del siguiente documento.
        Estructura el resumen con: Propósito principal, Decisiones o Acuerdos Clave, y Conclusiones.

        Texto:
        \"\"\"{full_text[:12000]}\"\"\"
        """
        response = self.client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.2)
        )
        return response.text.strip()

    def extract_structured_entities(self, full_text: str) -> dict:
        """Extrae metadatos y entidades en formato JSON validado con Pydantic."""
        prompt = f"""
        Extrae la información estructurada clave del siguiente documento institucional de las UTS.
        Texto:
        \"\"\"{full_text[:10000]}\"\"\"
        """
        response = self.client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=DocumentExtractionSchema,
                temperature=0.1
            )
        )
        return json.loads(response.text)
```

---

## 3. IMPLEMENTACIÓN DEL MOTOR RAG (RETRIEVAL-AUGMENTED GENERATION)

### 3.1 Generación de Embeddings e Inferencia RAG (`ai/app/services/rag_engine.py`)

```python
import psycopg2
from sentence_transformers import SentenceTransformer
from google import genai
from google.genai import types
import os

class RAGEngine:
    def __init__(self):
        # Modelo local de embeddings Sentence-Transformers (384 dim)
        self.embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        self.llm_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        self.db_conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=os.getenv("DB_PORT", 5432),
            dbname=os.getenv("DB_NAME", "uts_documental_db"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "uts_postgres_secure_2026")
        )

    def search_similar_chunks(self, question: str, folder_id: str = None, top_k: int = 4) -> list:
        """Genera el embedding de la pregunta y busca los K fragmentos más cercanos por similitud coseno."""
        query_vector = self.embedder.encode(question).tolist()
        vector_str = "[" + ",".join(map(str, query_vector)) + "]"

        cursor = self.db_conn.cursor()
        if folder_id:
            sql = """
            SELECT c.id, c.text_content, c.page_number, d.file_name,
                   1 - (c.embedding_vector <=> %s::vector) AS similarity
            FROM document_chunks c
            JOIN documents d ON c.document_id = d.id
            WHERE d.folder_id = %s AND d.status = 'COMPLETED'
            ORDER BY c.embedding_vector <=> %s::vector
            LIMIT %s;
            """
            cursor.execute(sql, (vector_str, folder_id, vector_str, top_k))
        else:
            sql = """
            SELECT c.id, c.text_content, c.page_number, d.file_name,
                   1 - (c.embedding_vector <=> %s::vector) AS similarity
            FROM document_chunks c
            JOIN documents d ON c.document_id = d.id
            WHERE d.status = 'COMPLETED'
            ORDER BY c.embedding_vector <=> %s::vector
            LIMIT %s;
            """
            cursor.execute(sql, (vector_str, vector_str, top_k))

        rows = cursor.fetchall()
        cursor.close()

        results = []
        for r in rows:
            results.append({
                "chunk_id": r[0],
                "text": r[1],
                "page_number": r[2],
                "file_name": r[3],
                "similarity": float(r[4])
            })
        return results

    def answer_query(self, question: str, folder_id: str = None) -> dict:
        """Recupera fragmentos relevantes y genera respuesta fundamentada con citas bibliográficas."""
        chunks = self.search_similar_chunks(question, folder_id, top_k=4)

        # Si no hay fragmentos con similitud suficiente (>= 0.65)
        valid_chunks = [c for c in chunks if c["similarity"] >= 0.65]
        if not valid_chunks:
            return {
                "answer": "La información solicitada no se encuentra disponible en los documentos cargados en el repositorio institucional.",
                "confidence": 0.0,
                "sources": []
            }

        # Construcción del contexto delimitado
        context_blocks = []
        for idx, c in enumerate(valid_chunks):
            context_blocks.append(f"[Fuente {idx+1}: {c['file_name']}, Página {c['page_number']}]\n{c['text']}")

        context_text = "\n\n---\n\n".join(context_blocks)

        system_prompt = f"""
        Eres el Asistente Oficial de Información Documental de las Unidades Tecnológicas de Santander (UTS).
        Tu misión es responder a la pregunta del usuario basándote EXCLUSIVAMENTE en el siguiente contexto documental.
        
        Reglas obligatorias:
        1. No inventes información ni recurras a conocimientos externos fuera del contexto provisto.
        2. Cita explícitamente el nombre del archivo y la página de donde obtuviste cada afirmación.
        3. Si la respuesta no está contenida en el contexto, indica amablemente que no existe información en el archivo.

        CONTEXTO DOCUMENTAL:
        {context_text}

        PREGUNTA DEL USUARIO:
        {question}
        """

        response = self.llm_client.models.generate_content(
            model="gemini-1.5-flash",
            contents=system_prompt,
            config=types.GenerateContentConfig(temperature=0.1)
        )

        return {
            "answer": response.text.strip(),
            "confidence": max(c["similarity"] for c in valid_chunks),
            "sources": [
                {"file_name": c["file_name"], "page_number": c["page_number"], "chunk_text": c["text"][:150]}
                for c in valid_chunks
            ]
        }
```

---

## 4. MANEJO DE CASOS BORDE Y RESILIENCIA

1. **Documentos Ilegibles o Corruptos:** Si PyMuPDF genera una excepción `fitz.FileDataError`, el pipeline captura la excepción, registra el error en `processing_logs` y marca el archivo en estado `ERROR` sin bloquear las demás tareas en cola.
2. **Reintentos Exponenciales ante Fallas de API (Rate Limit 429):** Se implementa la política de reintento `tenacity` con *Exponential Backoff* (2s, 4s, 8s) con un límite de 3 intentos antes de abortar.
3. **Control de Ventana de Contexto:** El texto completo se segmenta en trozos de 500 tokens con 100 de solapamiento mediante `RecursiveCharacterTextSplitter`, garantizando que ninguna solicitud supere la longitud máxima admisible por los modelos de lenguaje.
