import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Layers, 
  Sparkles, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  Database,
  Hash,
  Download,
  AlertCircle,
  TrendingUp,
  Tag,
  Building,
  User,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';

export default function InspectorModal({ documentId, isOpen, onClose, token }) {
  const [docData, setDocData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('SUMMARY'); // 'SUMMARY', 'ENTITIES', 'LOGS'

  useEffect(() => {
    if (isOpen && documentId) {
      fetchAnalysis();
    }
  }, [isOpen, documentId]);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/documents/' + documentId + '/analysis', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) throw new Error('No se pudo recuperar el análisis cognitivo.');
      const json = await res.json();
      setDocData(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-2xl h-full bg-[#08080C] border-l border-white/10 shadow-2xl flex flex-col overflow-hidden animate-slide-left">
        
        {/* Header del Inspector */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-apple-accent/15 flex items-center justify-center text-apple-accent">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">Inspector Cognitivo IA</h2>
              <p className="text-xs text-apple-subtext">Metadatos, entidades y resumen ejecutivo profundo</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Pestañas */}
        <div className="px-6 pt-3 border-b border-white/5 flex gap-6 bg-black/20">
          <button
            onClick={() => setActiveTab('SUMMARY')}
            className={`pb-3 text-xs font-medium transition border-b-2 ${
              activeTab === 'SUMMARY'
                ? 'border-apple-accent text-apple-accent'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Resumen & Síntesis
          </button>
          <button
            onClick={() => setActiveTab('ENTITIES')}
            className={`pb-3 text-xs font-medium transition border-b-2 ${
              activeTab === 'ENTITIES'
                ? 'border-apple-accent text-apple-accent'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Entidades & Metadatos
          </button>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`pb-3 text-xs font-medium transition border-b-2 ${
              activeTab === 'LOGS'
                ? 'border-apple-accent text-apple-accent'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Telemetría de Auditoría
          </button>
        </div>

        {/* Contenedor Principal con Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-8 h-8 border-2 border-apple-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-apple-subtext">Analizando capas de conocimiento...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : docData && (
            <>
              {/* Tarjeta de Identificación Rápida */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/80">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white truncate max-w-sm">{docData.original_name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-apple-subtext">
                      <span>{docData.page_count} páginas</span>
                      <span>•</span>
                      <span>{(docData.file_size_bytes / (1024 * 1024)).toFixed(2)} MB</span>
                      <span>•</span>
                      <span>{new Date(docData.created_at).toLocaleDateString('es-CO')}</span>
                    </div>
                  </div>
                </div>

                <a 
                  href={'/api/v1/documents/' + docData.id + '/download'}
                  className="px-3.5 py-2 rounded-xl bg-apple-accent/15 text-apple-accent hover:bg-apple-accent hover:text-white text-xs font-semibold flex items-center gap-2 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </a>
              </div>

              {/* Categoría y Confianza */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-apple-subtext tracking-wider">Categoría Asignada</span>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      docData.category === 'ADMINISTRATIVO' ? 'bg-[#0A84FF]/20 text-[#0A84FF]' :
                      docData.category === 'FINANCIERO' ? 'bg-[#30D158]/20 text-[#30D158]' :
                      docData.category === 'TECNICO_LEGAL' ? 'bg-[#BF5AF2]/20 text-[#BF5AF2]' : 'bg-white/10 text-white'
                    }`}>
                      {docData.category}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-apple-subtext tracking-wider">Score de Confianza</span>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-lg font-bold text-white">
                      {(docData.category_confidence * 100).toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-apple-green flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verificado
                    </span>
                  </div>
                </div>
              </div>

              {/* Contenido según pestaña */}
              {activeTab === 'SUMMARY' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-apple-accent" />
                      Resumen Ejecutivo Sintetizado
                    </h4>
                    <p className="text-xs text-white/80 leading-relaxed font-normal">
                      {docData.executive_summary}
                    </p>
                  </div>

                  {docData.key_insights && docData.key_insights.length > 0 && (
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                        Puntos Clave y Decisiones
                      </h4>
                      {docData.key_insights.map((insight, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-white/70">
                          <CheckCircle2 className="w-3.5 h-3.5 text-apple-green flex-shrink-0 mt-0.5" />
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'ENTITIES' && (
                <div className="space-y-4">
                  {/* Tipo Documental */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-apple-subtext">Tipo Documental Identificado</span>
                    <p className="text-sm font-semibold text-white mt-1">
                      {docData.entities?.tipo_documental || 'Documento No Estructurado'}
                    </p>
                  </div>

                  {/* Fechas */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-apple-subtext flex items-center gap-1.5 mb-2">
                      <Calendar className="w-3.5 h-3.5 text-apple-accent" /> Fechas Clave Extraídas
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {docData.entities?.fechas?.length > 0 ? (
                        docData.entities.fechas.map((f, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/90">
                            {f}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-white/40 italic">No se detectaron fechas explícitas</span>
                      )}
                    </div>
                  </div>

                  {/* Montos */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-apple-subtext flex items-center gap-1.5 mb-2">
                      <DollarSign className="w-3.5 h-3.5 text-apple-green" /> Cifras y Montos Dinerarios
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {docData.entities?.montos?.length > 0 ? (
                        docData.entities.montos.map((m, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-apple-green/10 border border-apple-green/20 text-xs font-semibold text-apple-green">
                            {m}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-white/40 italic">No se detectaron cifras dinerarias</span>
                      )}
                    </div>
                  </div>

                  {/* Personas / Empresas */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-apple-subtext flex items-center gap-1.5 mb-2">
                      <Building className="w-3.5 h-3.5 text-apple-purple" /> Personas, Empresas e Instituciones
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {docData.entities?.personas_empresas?.length > 0 ? (
                        docData.entities.personas_empresas.map((p, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-apple-purple/10 border border-apple-purple/20 text-xs text-white/90">
                            {p}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-white/40 italic">No se detectaron personas o empresas</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'LOGS' && (
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-apple-orange" />
                    Trazabilidad del Pipeline
                  </h4>
                  {docData.processing_logs && docData.processing_logs.length > 0 ? (
                    docData.processing_logs.map((log, i) => (
                      <div key={i} className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-apple-accent" />
                          <div>
                            <span className="font-semibold text-white">{log.stage}</span>
                            <p className="text-[11px] text-white/60">{log.message}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-apple-subtext font-mono">{log.duration_ms}ms</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-white/40 italic">No hay logs registrados para este documento.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
