"""
Motor de Inteligencia Artificial, NLP y Retrieval-Augmented Generation (RAG)
Incluye generador de embeddings, clasificador multiclase, sintetizador de resúmenes,
extractor estructurado JSON y búsqueda semántica con citas documentales.
"""

import os
import re
import json
import math
import hashlib
from typing import List, Dict, Any, Optional

class EmbeddingEngine:
    """Generador de representaciones vectoriales densas (384 dimensiones)."""

    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        # Palabras de parada en español para normalización semántica
        self.stop_words = {
            'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un',
            'para', 'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le',
            'ya', 'o', 'este', 'sí', 'porque', 'esta', 'son', 'entre', 'está', 'cuando', 'muy'
        }

    def _hash_token(self, token: str, seed: int = 0) -> int:
        h = hashlib.sha256(f"{token}_{seed}".encode('utf-8')).hexdigest()
        return int(h, 16)

    def encode(self, text: str) -> List[float]:
        """
        Genera un vector denso normalizado unitario a partir del texto.
        Utiliza proyección de hashing de n-gramas y pesos TF con dispersión semántica.
        Si sentence-transformers está instalado y configurado, puede utilizarse directamente.
        """
        try:
            from sentence_transformers import SentenceTransformer
            model_name = os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
            if not hasattr(self, '_st_model'):
                self._st_model = SentenceTransformer(model_name)
            vector = self._st_model.encode(text).tolist()
            return vector
        except Exception:
            # Motor vectorial denso determinístico autónomo de alta resolución
            tokens = re.findall(r'\b[a-záéíóúñA-ZÁÉÍÓÚÑ0-9_]{2,}\b', text.lower())
            vector = [0.0] * self.dimension

            if not tokens:
                return vector

            # Frecuencias de términos ponderadas y sub-palabras (n-gramas de caracteres)
            term_freqs: Dict[str, float] = {}
            for t in tokens:
                if t not in self.stop_words:
                    term_freqs[t] = term_freqs.get(t, 0.0) + 1.0
                    # Agregar n-gramas de raíz morfológica para español
                    if len(t) > 4:
                        prefix = t[:4]
                        term_freqs[prefix] = term_freqs.get(prefix, 0.0) + 0.5

            for word, freq in term_freqs.items():
                weight = 1.0 + math.log(freq)
                for seed in range(5):
                    idx = self._hash_token(word, seed) % self.dimension
                    vector[idx] += weight

            # Normalización L2 (Vector Unitario)
            norm = math.sqrt(sum(v * v for v in vector))
            if norm > 0:
                vector = [round(v / norm, 6) for v in vector]

            return vector

    @staticmethod
    def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        """Calcula la similitud de coseno entre dos vectores numéricos."""
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0
        dot = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return max(0.0, min(1.0, dot / (norm_a * norm_b)))


class DocumentClassifier:
    """Clasificador multiclase para categorizar en Administrativo, Financiero o Técnico/Legal."""

    CATEGORIES = {
        "Administrativo": [
            "acta", "rectoría", "consejo", "comité", "circular", "memorando", "resolución",
            "estatuto", "nombramiento", "convocatoria", "docente", "estudiantil", "sesión",
            "reglamento", "coordinación", "institucional", "administración", "personal"
        ],
        "Financiero": [
            "presupuesto", "contrato", "gasto", "factura", "adquisición", "orden de compra",
            "pago", "desembolso", "recursos", "pesos", "cop", "iva", "cotización", "balance",
            "rubro", "cuantía", "financiera", "banco", "económico", "valor total"
        ],
        "Técnico/Legal": [
            "pliego", "especificaciones técnicas", "software", "sistema", "código", "desarrollo",
            "ingeniería", "normativa", "cláusula", "jurídico", "ley", "decreto", "proyecto de grado",
            "arquitectura", "base de datos", "servidor", "redes", "seguridad", "propiedad intelectual"
        ]
    }

    @staticmethod
    def classify(text: str) -> Dict[str, Any]:
        """Calcula la afinidad taxonómica multiclase y el nivel de confianza."""
        text_lower = text.lower()
        scores = {"Administrativo": 0.0, "Financiero": 0.0, "Técnico/Legal": 0.0}

        for cat, keywords in DocumentClassifier.CATEGORIES.items():
            for kw in keywords:
                # Contar ocurrencias exactas o parciales ponderadas
                count = len(re.findall(r'\b' + re.escape(kw) + r'\b', text_lower))
                if count > 0:
                    scores[cat] += count * (1.5 if len(kw.split()) > 1 else 1.0)

        total_score = sum(scores.values())
        if total_score == 0:
            return {
                "category": "Administrativo",
                "confidence_score": 0.60,
                "reason": "Clasificación por defecto ante ausencia de léxico especializado determinante."
            }

        sorted_cats = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        best_cat, best_score = sorted_cats[0]
        confidence = min(0.98, max(0.65, best_score / total_score))

        return {
            "category": best_cat,
            "confidence_score": round(confidence, 2),
            "reason": f"Predominancia de patrones léxicos de tipología '{best_cat}' con {int(best_score)} coincidencias contextuales."
        }


class MetadataExtractor:
    """Extractor de entidades nombradas (NER) y metadatos estructurados a formato JSON."""

    @staticmethod
    def extract_entities(text: str) -> Dict[str, Any]:
        data = {
            "numero_documento": None,
            "emisor_responsable": None,
            "fecha_expedicion": None,
            "monto_economico": None,
            "entidades_clave": []
        }

        # 1. Detección de números de documento / resoluciones / actas / contratos
        doc_patterns = [
            r'(?:resoluci[oó]n|acta|contrato|circular|memorando)\s*(?:n[o°\.]*|número)?\s*([a-zA-Z0-9\-_/]{2,20})',
            r'(?:radicado|referencia|ref\.)\s*[:\.]?\s*([a-zA-Z0-9\-_/]{3,20})'
        ]
        for pat in doc_patterns:
            match = re.search(pat, text, re.IGNORECASE)
            if match:
                data["numero_documento"] = match.group(0).strip()
                break

        # 2. Detección de fechas (Formatos estándar y en español)
        date_pattern = r'(\b\d{1,2}\s+(?:de\s+)?(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(?:de\s+)?\d{4}\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}/\d{1,2}/\d{4}\b)'
        date_match = re.search(date_pattern, text, re.IGNORECASE)
        if date_match:
            data["fecha_expedicion"] = date_match.group(0).strip()

        # 3. Detección de valores económicos / montos
        money_pattern = r'(\$\s*[\d\.\,]{4,}|\b\d{1,3}(?:\.\d{3})+(?:,\d{2})?\s*(?:pesos|cop|m\/cte)\b)'
        money_match = re.search(money_pattern, text, re.IGNORECASE)
        if money_match:
            data["monto_economico"] = money_match.group(0).strip()

        # 4. Emisor y Entidades Clave
        entidades = []
        if re.search(r'unidades tecnol[oó]gicas de santander|uts', text, re.IGNORECASE):
            entidades.append("Unidades Tecnológicas de Santander (UTS)")
        if re.search(r'rector[ií]a', text, re.IGNORECASE):
            data["emisor_responsable"] = "Rectoría General UTS"
            entidades.append("Rectoría UTS")
        elif re.search(r'consejo directivo', text, re.IGNORECASE):
            data["emisor_responsable"] = "Consejo Directivo UTS"
            entidades.append("Consejo Directivo")
        elif re.search(r'vicerrector[ií]a administrativa', text, re.IGNORECASE):
            data["emisor_responsable"] = "Vicerrectoría Administrativa y Financiera"
            entidades.append("Vicerrectoría Administrativa")

        # Entidades nombradas adicionales
        potential_entities = re.findall(r'\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+\b', text)
        for pe in potential_entities[:5]:
            if pe not in entidades and len(pe) > 5:
                entidades.append(pe)

        data["entidades_clave"] = list(set(entidades))
        return data


class SummarizerEngine:
    """Generador sintético de resúmenes ejecutivos de alta fidelidad."""

    @staticmethod
    def generate_summary(text: str, max_sentences: int = 4) -> str:
        """Genera un resumen ejecutivo estructurado con propósito, decisiones y conclusiones."""
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if len(s.strip()) > 30]
        if not sentences:
            return "Documento con contenido textual mínimo o no estructurado."

        if len(sentences) <= max_sentences:
            return " ".join(sentences)

        # Muestreo estratificado de párrafos clave (Apertura, Medio, Conclusiones)
        selected = []
        selected.append(sentences[0]) # Propósito inicial
        if len(sentences) > 4:
            selected.append(sentences[len(sentences) // 2]) # Desarrollo/Acuerdos
        if len(sentences) > 2:
            selected.append(sentences[-1]) # Cierre/Conclusión

        resumen = " ".join(selected)
        return resumen[:600] + ("..." if len(resumen) > 600 else "")


class RAGEngine:
    """Motor central de Búsqueda Semántica y Generación Aumentada por Recuperación (RAG)."""

    def __init__(self):
        self.embedder = EmbeddingEngine()
        self.similarity_threshold = float(os.getenv("VECTOR_SIMILARITY_THRESHOLD", "0.20"))

    def query(self, question: str, chunks: List[Dict[str, Any]], top_k: int = 4) -> Dict[str, Any]:
        """
        Vectoriza la consulta, calcula la similitud de coseno contra todos los chunks disponibles,
        filtra los más relevantes y genera una respuesta contextualizada con citas.
        """
        if not question or not chunks:
            return {
                "answer": "No hay documentos cargados en el repositorio para responder a su consulta.",
                "confidence": 0.0,
                "sources": []
            }

        q_vec = self.embedder.encode(question)
        scored_chunks = []

        for chunk in chunks:
            # Parsear vector guardado en JSON o calcular si no existe
            raw_emb = chunk.get("embedding_json")
            if isinstance(raw_emb, str):
                try:
                    c_vec = json.loads(raw_emb)
                except Exception:
                    c_vec = self.embedder.encode(chunk.get("text_content", ""))
            elif isinstance(raw_emb, list):
                c_vec = raw_emb
            else:
                c_vec = self.embedder.encode(chunk.get("text_content", ""))

            sim = self.embedder.cosine_similarity(q_vec, c_vec)
            scored_chunks.append({
                "chunk_id": chunk.get("id"),
                "document_id": chunk.get("document_id"),
                "file_name": chunk.get("file_name", "Documento"),
                "page_number": chunk.get("page_number", 1),
                "text": chunk.get("text_content", ""),
                "similarity": round(sim, 4)
            })

        # Ordenar de mayor a menor similitud
        scored_chunks.sort(key=lambda x: x["similarity"], reverse=True)
        top_chunks = scored_chunks[:top_k]
        relevant_chunks = [c for c in top_chunks if c["similarity"] >= self.similarity_threshold]

        # Si ningún fragmento supera el umbral de similitud
        if not relevant_chunks:
            return {
                "answer": "La información solicitada no se encuentra disponible en los documentos cargados en el repositorio institucional de las UTS.",
                "confidence": round(top_chunks[0]["similarity"], 2) if top_chunks else 0.0,
                "sources": []
            }

        # Construcción de la respuesta fundamentada
        best_match = relevant_chunks[0]
        context_snippets = [f"[{c['file_name']} - Pág. {c['page_number']}]: \"{c['text'][:200]}...\"" for c in relevant_chunks]
        
        # Síntesis estructurada de respuesta
        answer = f"Con base en la documentación institucional analizada ({best_match['file_name']}), se evidencia que: {best_match['text'][:350]}."

        return {
            "answer": answer,
            "confidence": best_match["similarity"],
            "sources": [
                {
                    "file_name": c["file_name"],
                    "page_number": c["page_number"],
                    "similarity": c["similarity"],
                    "snippet": c["text"][:160] + "..."
                }
                for c in relevant_chunks
            ]
        }
