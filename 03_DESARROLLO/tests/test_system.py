import unittest
import os
import sys
import io
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.main import app
from document_processing.extractor import DocumentExtractor, TextSanitizer
from ai.rag_pipeline import (
    DynamicSemanticChunker, 
    DenseEmbeddingEngine, 
    DocumentClassifier, 
    ExecutiveSummarizer, 
    EntityExtractor, 
    CognitiveRAGPipeline,
    HybridSearchEngine,
    HallucinationGuardrail,
    SemanticGraphEngine
)

class TestUTSCognitiveDocumentIntelligence(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    # ---------------------------------------------------------
    # 1. Tests: Extractor Multiformato y Sanitizador
    # ---------------------------------------------------------
    def test_text_sanitizer(self):
        dirty_text = "Admi-\nnistración   de    las  \x00UTS\n\n\n\nResolución."
        clean = TextSanitizer.clean(dirty_text)
        self.assertNotIn("\x00", clean)
        self.assertIn("Administración", clean)
        self.assertIn("de las UTS", clean)

    def test_txt_extraction(self):
        extractor = DocumentExtractor()
        content = "Este es un documento oficial de las Unidades Tecnológicas de Santander UTS para el año fiscal 2026."
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as tf:
            tf.write(content)
            temp_name = tf.name

        try:
            pages = extractor.extract(temp_name)
            self.assertEqual(len(pages), 1)
            self.assertIn("Unidades Tecnológicas de Santander", pages[0]["text"])
            self.assertEqual(pages[0]["page_number"], 1)
        finally:
            if os.path.exists(temp_name):
                os.remove(temp_name)

    # ---------------------------------------------------------
    # 2. Tests: Chunking Semántico y Embeddings Densos
    # ---------------------------------------------------------
    def test_semantic_chunker(self):
        chunker = DynamicSemanticChunker(target_words=50, overlap_words=10)
        pages = [{
            "page_number": 1,
            "text": " ".join([f"palabra_{i}" for i in range(120)])
        }]
        chunks = chunker.chunk_document(pages)
        self.assertGreaterEqual(len(chunks), 2)
        self.assertEqual(chunks[0]["page_number"], 1)

    def test_dense_embeddings_384d(self):
        engine = DenseEmbeddingEngine(dimension=384)
        vec = engine.generate_embedding("Resolución rectoral de presupuesto institucional UTS")
        self.assertEqual(len(vec), 384)
        norm = sum(x * x for x in vec)**0.5
        self.assertTrue(abs(norm - 1.0) < 1e-3)

    # ---------------------------------------------------------
    # 3. Tests: Clasificador, Entidades y Resumen
    # ---------------------------------------------------------
    def test_classifier_multiclass(self):
        cat, conf = DocumentClassifier.classify("RESOLUCIÓN No 045 DE RECTORÍA. Se convoca al consejo directivo y académico.")
        self.assertEqual(cat, "ADMINISTRATIVO")
        self.assertGreaterEqual(conf, 0.60)

        cat_f, _ = DocumentClassifier.classify("BALANCE GENERAL Y RUBROS DE GASTO. Pago de factura y disponibilidad presupuestal.")
        self.assertEqual(cat_f, "FINANCIERO")

        cat_l, _ = DocumentClassifier.classify("CONTRATO DE PRESTACIÓN DE SERVICIOS. Cláusula penal, póliza de garantía y términos.")
        self.assertEqual(cat_l, "TECNICO_LEGAL")

    def test_entity_extractor(self):
        sample = "Contrato celebrado el 15 de marzo de 2026 con NIT 890.201.230 por un valor total de $150.000.000 COP con las Unidades Tecnológicas de Santander."
        entities = EntityExtractor.extract_entities(sample)
        self.assertIn("15 de marzo de 2026", entities["fechas"])
        self.assertTrue(any("150.000.000" in m for m in entities["montos"]))
        self.assertTrue(any("890" in n for n in entities["nits_cedulas"]))

    # ---------------------------------------------------------
    # 4. Tests: RAG Pipeline, Guardrail y Grafo 2D
    # ---------------------------------------------------------
    def test_hybrid_rag_and_guardrail(self):
        pipeline = CognitiveRAGPipeline()
        chunks = [
            {
                "id": "c1",
                "document_id": "doc-01",
                "page_number": 2,
                "chunk_index": 0,
                "content": "El Consejo Directivo aprobó una partida de 300 millones de pesos para la modernización de los laboratorios de software de las UTS.",
                "embedding": pipeline.embedding_engine.generate_embedding("partida presupuestal laboratorios de software UTS")
            }
        ]
        doc_registry = {"doc-01": "Acuerdo_Laboratorios_2026.pdf"}

        # Consulta con respuesta respaldada
        res = pipeline.answer_query("¿Cuánto se aprobó para los laboratorios de software?", chunks, doc_registry)
        self.assertIn("Acuerdo_Laboratorios_2026.pdf", res["answer"])
        self.assertGreaterEqual(res["faithfulness_score"], 0.60)
        self.assertFalse(res["is_hallucination"])

    def test_semantic_graph_projection(self):
        proj = SemanticGraphEngine.project_2d([0.1]*384, "ADMINISTRATIVO")
        self.assertIn("x", proj)
        self.assertIn("y", proj)
        self.assertEqual(proj["cluster"], 1)

    # ---------------------------------------------------------
    # 5. Integration Tests: API Endpoints con JWT RBAC
    # ---------------------------------------------------------
    def test_login_and_access(self):
        login_res = self.client.post("/api/v1/auth/login", json={
            "email": "admin@uts.edu.co",
            "password": "admin123"
        })
        self.assertEqual(login_res.status_code, 200)
        data = login_res.json()["data"]
        token = data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Listar carpetas
        folders_res = self.client.get("/api/v1/folders", headers=headers)
        self.assertEqual(folders_res.status_code, 200)

        # Dashboard Analytics
        analytics_res = self.client.get("/api/v1/analytics/dashboard", headers=headers)
        self.assertEqual(analytics_res.status_code, 200)

        # Mapa Semántico
        map_res = self.client.get("/api/v1/semantic-map", headers=headers)
        self.assertEqual(map_res.status_code, 200)

if __name__ == '__main__':
    unittest.main()
