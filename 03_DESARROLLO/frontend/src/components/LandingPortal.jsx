import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Search,
  Lock,
  Zap,
  Users,
  Database,
  BarChart3,
  Bot
} from 'lucide-react';

export default function LandingPortal({ onLogin, error }) {
  const [selectedRole, setSelectedRole] = useState('admin');
  const [email, setEmail] = useState('admin@uts.edu.co');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    {
      id: 'admin',
      title: 'Administrador',
      email: 'admin@uts.edu.co',
      password: 'admin123',
      desc: 'Control total del sistema, auditoría y borrado'
    },
    {
      id: 'analista',
      title: 'Analista',
      email: 'analista@uts.edu.co',
      password: 'analista123',
      desc: 'Carga multiformato, análisis y Chat RAG'
    },
    {
      id: 'consultor',
      title: 'Consultor',
      email: 'consultor@uts.edu.co',
      password: 'consultor123',
      desc: 'Consultas semánticas y lectura institucional'
    }
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role.id);
    setEmail(role.email);
    setPassword(role.password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await onLogin(email, password);
    setIsLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-[#000000] text-white flex flex-col justify-between overflow-hidden">
      
      {/* Resplandor de Fondo Hiperrefinado (Apple Ambient Glow) */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-apple-accent/20 via-apple-purple/10 to-transparent blur-[140px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xl flex items-center justify-center text-apple-accent shadow-lg shadow-apple-accent/10">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white">UTS Intelligence</h1>
            <p className="text-[10px] text-apple-subtext uppercase tracking-widest font-mono">Gestión Documental Cognitiva</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
          <span className="w-2 h-2 rounded-full bg-apple-green animate-pulse" />
          <span>v2.0 Plataforma Activa</span>
        </div>
      </header>

      {/* Hero Central Monumental */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/80 backdrop-blur-xl mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-apple-accent" />
          <span>Inteligencia Artificial de Grado Empresarial para UTS</span>
        </div>

        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
          Tus documentos. <br />
          <span className="bg-gradient-to-r from-white via-white/90 to-apple-accent bg-clip-text text-transparent">
            Ahora con conciencia cognitiva.
          </span>
        </h2>

        <p className="text-base md:text-lg text-apple-subtext max-w-2xl font-normal leading-relaxed mb-10">
          Indexación semántica en tiempo real, extracción de entidades y consultas en lenguaje natural con citas de evidencia exacta y guardrails anti-alucinación.
        </p>

        {/* Selector de Rol Sensorial y Formulario de Acceso */}
        <div className="w-full max-w-md bg-[#09090D]/90 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl shadow-2xl space-y-6">
          
          {/* Selector de Roles */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider block text-left">
              Selecciona Perfil de Acceso
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/5">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRoleSelect(r)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold transition ${
                    selectedRole === r.id
                      ? 'bg-apple-accent text-white shadow-lg'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {r.title}
                </button>
              ))}
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-white/70 font-medium">Correo Electrónico Institucional</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-apple-accent transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/70 font-medium">Contraseña de Seguridad</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-apple-accent transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-apple-accent hover:bg-apple-accentHover disabled:opacity-50 text-white font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition shadow-lg shadow-apple-accent/25"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Ingresar a la Plataforma</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bento Grid Preview */}
        <div className="mt-16 w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-xl">
            <div className="w-10 h-10 rounded-2xl bg-[#0A84FF]/10 flex items-center justify-center text-apple-accent mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">Lienzo Semántico 2D</h4>
            <p className="text-xs text-apple-subtext leading-relaxed">
              Mapeo de documentos y clústeres en tiempo real mediante proyecciones de alta dimensionalidad.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-xl">
            <div className="w-10 h-10 rounded-2xl bg-[#30D158]/10 flex items-center justify-center text-apple-green mb-4">
              <Bot className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">RAG Anti-Alucinaciones</h4>
            <p className="text-xs text-apple-subtext leading-relaxed">
              Citas exactas con página y párrafo fuente auditado por guardrails de fidelidad fáctica.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-xl">
            <div className="w-10 h-10 rounded-2xl bg-[#BF5AF2]/10 flex items-center justify-center text-apple-purple mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">Telemetría en Vivo</h4>
            <p className="text-xs text-apple-subtext leading-relaxed">
              Transmisión de estados de extracción e indexación en streaming vía WebSockets.
            </p>
          </div>
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-xs text-apple-subtext gap-4">
        <span>© 2026 Unidades Tecnológicas de Santander (UTS) • Tecnología en Desarrollo de Software</span>
        <div className="flex items-center gap-6">
          <span>Arquitectura RAG Híbrida</span>
          <span>•</span>
          <span>pgvector Ready</span>
        </div>
      </footer>
    </div>
  );
}
