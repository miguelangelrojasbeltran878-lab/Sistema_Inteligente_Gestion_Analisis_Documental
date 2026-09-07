# DESARROLLO DE LA CAPA CLIENTE FRONTEND (SPA)
## Proyecto: Sistema Inteligente de Gestión y Análisis Documental
### Institución: Unidades Tecnológicas de Santander (UTS)
### Stack: React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons

---

## 1. ARQUITECTURA DE CLIENTE Y COMPONENTES

El frontend está estructurado bajo principios de **Component-Driven Development** y **Separation of Concerns**:

```
frontend/src/
├── components/          # Componentes visuales y funcionales atómicos y modulares
│   ├── common/          # Layout, Navbar, Sidebar, ProtectedRoute, ToastAlert
│   ├── dashboard/       # MetricCard, CategoryPieChart, RecentActivityTable
│   ├── documents/       # FileDropzone, FolderTree, DocumentRow, UploadProgressBar
│   ├── analysis/        # SummaryViewer, JsonEntitiesTable, LogTimeline
│   └── chat/            # ChatWindow, MessageBubble, SourceCitationCard
├── context/             # AuthContext (Estado de sesión global y tokens)
├── hooks/               # useAuth, useDocuments, useMetrics, useRAGChat
├── pages/               # Vistas principales de enrutamiento
├── services/            # Clientes HTTP Axios con interceptores JWT
└── types/               # Tipado estricto TypeScript
```

---

## 2. IMPLEMENTACIÓN DE VISTAS Y EXPERIENCIA DE USUARIO (CÓDIGO REAL)

---

### 2.1 Vista de Autenticación y Rutas Protegidas

#### `src/context/AuthContext.tsx`
```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginResponse } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('uts_access_token'));

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const savedUser = localStorage.getItem('uts_user_profile');
      if (savedUser) setUser(JSON.parse(savedUser));
    }
  }, [token]);

  const login = async (email: string, passwordPlain: string) => {
    const res = await api.post<LoginResponse>('/auth/login', { email, password: passwordPlain });
    const { access_token, user: profile } = res.data.data;

    setToken(access_token);
    setUser(profile);
    localStorage.setItem('uts_access_token', access_token);
    localStorage.setItem('uts_user_profile', JSON.stringify(profile));
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('uts_access_token');
    localStorage.removeItem('uts_user_profile');
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  return context;
};
```

#### `src/components/common/ProtectedRoute.tsx`
```tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface Props {
  allowedRoles?: Array<'ADMIN' | 'ANALISTA' | 'CONSULTOR'>;
}

export const ProtectedRoute: React.FC<Props> = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
```

---

### 2.2 Componente de Carga de Archivos Drag & Drop

#### `src/components/documents/FileDropzone.tsx`
```tsx
import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

interface Props {
  folderId: string;
  onUploadSuccess: () => void;
}

export const FileDropzone: React.FC<Props> = ({ folderId, onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndUpload = async (file: File) => {
    const allowedExtensions = ['pdf', 'docx', 'txt'];
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';

    if (!allowedExtensions.includes(fileExt)) {
      setErrorMsg('Formato inválido. Solo se admiten archivos .PDF, .DOCX y .TXT.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) { // 20 MB
      setErrorMsg('El archivo supera el límite de 20 MB.');
      return;
    }

    setErrorMsg(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder_id', folderId);

    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
          setUploadProgress(percent);
        }
      });
      setUploadProgress(100);
      setTimeout(() => {
        setUploadProgress(null);
        onUploadSuccess();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Error al subir el archivo.');
      setUploadProgress(null);
    }
  };

  return (
    <div className="w-full bg-white rounded-xl border-2 border-dashed border-slate-300 p-6 flex flex-col items-center justify-center transition-all hover:border-emerald-600">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && validateAndUpload(e.target.files[0])}
      />
      <div 
        className="cursor-pointer flex flex-col items-center"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.[0]) validateAndUpload(e.dataTransfer.files[0]);
        }}
      >
        <UploadCloud className="w-12 h-12 text-emerald-700 mb-2 animate-pulse" />
        <p className="text-sm font-semibold text-slate-700">Haz clic para examinar o arrastra archivos aquí</p>
        <p className="text-xs text-slate-400 mt-1">Soporta PDF, DOCX y TXT (Máximo 20 MB)</p>
      </div>

      {uploadProgress !== null && (
        <div className="w-full mt-4">
          <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
            <span>Subiendo archivo e iniciando análisis IA...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-emerald-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
          <AlertTriangle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
```

---

### 2.3 Vista de Detalle Documental y Análisis de IA

#### `src/pages/DocumentDetailPage.tsx`
```tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { DocumentAnalysis } from '../types';
import { FileText, CheckCircle2, Tag, Calendar, User, DollarSign } from 'lucide-react';

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await api.get(`/documents/${id}/analysis`);
        setAnalysis(res.data.data);
      } catch (err) {
        console.error('Error al cargar análisis documental:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando análisis de IA...</div>;
  if (!analysis) return <div className="p-8 text-center text-rose-500">Documento en proceso o no encontrado.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-900" />
          <div>
            <h1 className="text-lg font-bold text-slate-800">Detalle y Análisis de Inteligencia Artificial</h1>
            <p className="text-xs text-slate-400">ID Documento: {analysis.document_id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Categoría Asignada:</span>
          <span className="px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
            {analysis.category} ({Math.round(analysis.confidence_score * 100)}% certeza)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Resumen Ejecutivo */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-blue-950 flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Resumen Ejecutivo (IA)
          </h2>
          <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 whitespace-pre-line">
            {analysis.summary}
          </div>
        </div>

        {/* Entidades Extraídas */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-blue-950 flex items-center gap-2 mb-3">
            <Tag className="w-5 h-5 text-blue-600" /> Metadatos y Entidades Extraídas (JSON)
          </h2>
          <div className="space-y-2">
            {Object.entries(analysis.extracted_data).map(([key, val]) => (
              <div key={key} className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-lg text-xs border border-slate-100">
                <span className="font-semibold text-slate-600 capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="text-slate-800 font-medium">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

### 2.4 Módulo de Consulta Inteligente y Chat RAG

#### `src/components/chat/RAGChatWindow.tsx`
```tsx
import React, { useState } from 'react';
import { Send, Bot, User, BookOpen } from 'lucide-react';
import { api } from '../../services/api';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  sources?: Array<{ file_name: string; page_number: number; chunk_text: string }>;
}

export const RAGChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: '¡Hola! Soy el asistente inteligente de las UTS. Pregúntame cualquier dato sobre las resoluciones, actas o documentos cargados.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userQuestion = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userQuestion }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/documents/query', { question: userQuestion });
      const { answer, sources } = res.data.data;

      setMessages(prev => [
        ...prev,
        { sender: 'assistant', text: answer, sources }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'assistant', text: 'Lo siento, no pude procesar la consulta semántica en este momento.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[650px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-blue-950 text-white flex items-center gap-2">
        <Bot className="w-6 h-6 text-emerald-400" />
        <span className="font-bold text-sm">Consultas en Lenguaje Natural (RAG Institucional)</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                IA
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl p-4 text-sm ${m.sender === 'user' ? 'bg-blue-900 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'}`}>
              <p className="leading-relaxed">{m.text}</p>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                  <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> Fuentes y Citas Documentales:
                  </span>
                  {m.sources.map((s, sIdx) => (
                    <div key={sIdx} className="text-[11px] bg-emerald-50 text-emerald-900 p-2 rounded border border-emerald-200">
                      <strong>{s.file_name}</strong> (Página {s.page_number}): "{s.chunk_text.substring(0, 100)}..."
                    </div>
                  ))}
                </div>
              )}
            </div>
            {m.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-blue-950 text-white flex items-center justify-center text-xs font-bold shrink-0">
                U
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold p-2">
            <div className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></div>
            Consultando base vectorial y sintetizando respuesta...
          </div>
        )}
      </div>

      <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Escribe tu consulta sobre los documentos..."
          className="flex-1 text-sm border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-600"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" /> Enviar
        </button>
      </div>
    </div>
  );
};
```
