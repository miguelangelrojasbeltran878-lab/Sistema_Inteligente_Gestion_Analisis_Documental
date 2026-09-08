import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  X, 
  Bot, 
  User, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
  BookOpen
} from 'lucide-react';

export default function RAGChatModal({ isOpen, onClose, token, onOpenInspector }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola! Soy el asistente inteligente RAG de las UTS. Pregúntame sobre cualquier resolución, presupuesto, contrato o acta cargada en el repositorio. Mis respuestas están respaldadas 100% en evidencia documental citada.',
      sources: [],
      faithfulness_score: 1.0,
      latency_ms: null
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    '¿Cuál es el valor total del contrato y sus plazos?',
    '¿Cuáles son las resoluciones de rectoría aprobadas?',
    '¿Qué entidades o contratistas están vinculados?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const q = textToSend || query;
    if (!q.trim() || isTyping) return;

    const userMessage = { role: 'user', content: q };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/v1/rag/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ query: q })
      });

      if (!res.ok) throw new Error('Error al procesar la consulta semántica.');

      const json = await res.json();
      const payload = json.data;

      const aiMessage = {
        role: 'assistant',
        content: payload.answer,
        sources: payload.sources || [],
        faithfulness_score: payload.faithfulness_score,
        is_hallucination: payload.is_hallucination,
        latency_ms: payload.latency_ms
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Ocurrió un error al contactar al motor de búsqueda semántica: ' + err.message,
          sources: [],
          faithfulness_score: 0.0
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-3xl h-[85vh] bg-[#07070A] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-up">
        
        {/* Header del Chat RAG */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-apple-accent to-apple-purple flex items-center justify-center text-white shadow-lg shadow-apple-accent/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white tracking-wide">Conversational Studio RAG</h3>
                <span className="px-2 py-0.5 rounded-full bg-apple-green/10 text-apple-green border border-apple-green/20 text-[10px] font-bold">
                  Búsqueda Híbrida Activa
                </span>
              </div>
              <p className="text-[11px] text-apple-subtext">Citas exactas con Guardrail Anti-Alucinación</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo de Mensajes */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, index) => (
            <div 
              key={index}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  msg.role === 'user' 
                    ? 'bg-apple-accent text-white' 
                    : 'bg-white/10 text-white/90 border border-white/10'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-apple-accent" />}
                </div>

                <div className="space-y-2">
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-apple-accent text-white font-medium rounded-tr-none shadow-lg'
                      : 'bg-white/[0.04] border border-white/10 text-white/90 rounded-tl-none font-normal'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>

                  {/* Telemetría y Fidelidad del Asistente */}
                  {msg.role === 'assistant' && msg.latency_ms && (
                    <div className="flex items-center gap-3 px-1 text-[10px] text-apple-subtext">
                      <span className="flex items-center gap-1 text-apple-green">
                        <ShieldCheck className="w-3 h-3" /> Fidelidad: {(msg.faithfulness_score * 100).toFixed(0)}%
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-apple-orange" /> {msg.latency_ms}ms
                      </span>
                    </div>
                  )}

                  {/* Fuentes y Citas Documentales Interactivas */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-apple-subtext tracking-wider">
                        <BookOpen className="w-3 h-3 text-apple-accent" /> Evidencia Documental Citada:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.map((src, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => onOpenInspector && onOpenInspector(src.document_id)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-apple-accent/20 border border-white/10 hover:border-apple-accent/40 text-[11px] text-white/90 flex items-center gap-1.5 transition text-left"
                          >
                            <FileText className="w-3 h-3 text-apple-accent" />
                            <span className="font-semibold truncate max-w-[160px]">{src.document_name}</span>
                            <span className="text-apple-subtext font-mono">(Pág. {src.page_number})</span>
                            <ChevronRight className="w-3 h-3 text-white/40" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-3 text-apple-subtext text-xs">
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-apple-accent animate-pulse" />
              </div>
              <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <span className="w-1.5 h-1.5 bg-apple-accent rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-apple-accent rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-apple-accent rounded-full animate-bounce [animation-delay:0.4s]" />
                <span className="ml-2 text-[11px] text-white/70">Consultando base vectorial y verificando guardrails...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Sugerencias Rápidas */}
        {messages.length <= 2 && (
          <div className="px-6 py-2 flex flex-wrap gap-2 border-t border-white/5 bg-black/20">
            {suggestedQuestions.map((sq, i) => (
              <button
                key={i}
                onClick={() => handleSend(sq)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/70 hover:text-white transition"
              >
                {sq}
              </button>
            ))}
          </div>
        )}

        {/* Barra de Entrada de Consulta */}
        <div className="p-4 border-t border-white/10 bg-black/50">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Haz una pregunta sobre resoluciones, contratos o balances..."
              className="flex-1 bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-apple-accent transition"
            />
            <button
              type="submit"
              disabled={!query.trim() || isTyping}
              className="p-3 bg-apple-accent hover:bg-apple-accentHover disabled:opacity-40 text-white rounded-2xl transition shadow-lg shadow-apple-accent/25"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
