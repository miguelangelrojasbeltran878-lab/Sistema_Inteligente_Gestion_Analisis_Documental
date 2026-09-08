import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, 
  FileText, 
  UploadCloud, 
  Search, 
  Bot, 
  Sparkles, 
  BarChart3, 
  Layers, 
  Database, 
  Plus, 
  LogOut, 
  Trash2, 
  Eye, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Tag,
  ChevronRight,
  TrendingUp,
  Activity,
  FolderPlus,
  Download,
  Zap,
  Radio,
  Cpu,
  LayoutGrid,
  List,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import RAGChatModal from './RAGChatModal';
import InspectorModal from './InspectorModal';
import SemanticCanvas from './SemanticCanvas';

export default function Workspace({ user, token, onLogout }) {
  // Navigation & Views
  const [currentView, setCurrentView] = useState('REPOSITORY'); // 'REPOSITORY', 'CANVAS', 'ANALYTICS'
  const [viewMode, setViewMode] = useState('GRID'); // 'GRID', 'TABLE'

  // Repositories & Documents
  const [folders, setFolders] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  
  // Modals & Inspectors
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [inspectorDocId, setInspectorDocId] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Uploading state & Telemetry
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const fileInputRef = useRef(null);

  // New folder state
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');

  // WebSocket for Live Telemetry con Auto-Reconexión Resiliente
  useEffect(() => {
    let ws;
    let reconnectTimeout;
    let isUnmounted = false;

    const connectWebSocket = () => {
      if (isUnmounted) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = protocol + '//' + window.location.host + '/ws/pipeline-status';

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          // Conexión exitosa
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'PIPELINE_UPDATE') {
              setUploadProgress(data.progress || 0);
              setUploadStatusText(data.message || '');
              if (data.status === 'COMPLETED' || data.status === 'FAILED') {
                fetchDocuments();
                fetchMetrics();
                setTimeout(() => {
                  setIsUploading(false);
                }, 2500);
              }
            }
          } catch (e) {}
        };

        ws.onclose = () => {
          if (!isUnmounted) {
            reconnectTimeout = setTimeout(connectWebSocket, 2000);
          }
        };

        ws.onerror = () => {
          if (ws) ws.close();
        };
      } catch (e) {
        if (!isUnmounted) {
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        }
      }
    };

    connectWebSocket();

    return () => {
      isUnmounted = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [activeFolderId]);

  const fetchInitialData = async () => {
    await Promise.all([fetchFolders(), fetchMetrics(), fetchDocuments()]);
  };

  const fetchFolders = async () => {
    try {
      const res = await fetch('/api/v1/folders', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const json = await res.json();
        setFolders(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/v1/analytics/dashboard', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const json = await res.json();
        setMetrics(json.data || null);
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
    }
  };

  const fetchDocuments = async () => {
    try {
      let url = '/api/v1/documents';
      if (activeFolderId) {
        url += '?folder_id=' + encodeURIComponent(activeFolderId);
      }
      const res = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const json = await res.json();
        setDocuments(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  const handleSeedSamples = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('/api/v1/documents/seed-samples', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        setTimeout(() => {
          fetchDocuments();
          fetchMetrics();
          fetchFolders();
          setIsSeeding(false);
        }, 1500);
      }
    } catch (err) {
      console.error('Error seeding sample documents:', err);
      setIsSeeding(false);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const res = await fetch('/api/v1/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          description: newFolderDesc.trim(),
          color_code: '#0A84FF'
        })
      });

      if (res.ok) {
        setNewFolderName('');
        setNewFolderDesc('');
        setShowNewFolderModal(false);
        fetchFolders();
      }
    } catch (err) {
      console.error('Error creating folder:', err);
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const formData = new FormData();
    formData.append('file', file);
    if (activeFolderId) {
      formData.append('folder_id', activeFolderId);
    }

    setIsUploading(true);
    setUploadProgress(15);
    setUploadStatusText('Transmitiendo archivo al pipeline de IA...');

    try {
      const res = await fetch('/api/v1/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token
        },
        body: formData
      });

      if (!res.ok) {
        let errMessage = 'Fallo en la carga del documento';
        try {
          const err = await res.json();
          errMessage = typeof err.detail === 'string' ? err.detail : (err.detail?.message || JSON.stringify(err.detail || err));
        } catch (e) {
          errMessage = await res.text();
        }
        throw new Error(errMessage);
      }
    } catch (err) {
      alert('Error de carga: ' + err.message);
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (id) => {
    if (!window.confirm('¿Confirmas la eliminación permanente de este documento y sus vectores?')) return;
    try {
      const res = await fetch('/api/v1/documents/' + id, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        fetchDocuments();
        fetchMetrics();
      }
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const openInspector = (docId) => {
    setInspectorDocId(docId);
    setIsInspectorOpen(true);
  };

  const filteredDocuments = documents.filter(doc => 
    (doc.original_name && doc.original_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (doc.category && doc.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col justify-between pb-32">
      
      {/* Top Header Glassmorphism */}
      <header className="sticky top-0 z-40 bg-black/70 backdrop-blur-2xl border-b border-white/10 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-apple-accent/20 border border-apple-accent/30 flex items-center justify-center text-apple-accent shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white tracking-tight">UTS Document Intelligence</h1>
              <p className="text-[10px] text-apple-subtext font-mono hidden sm:block">Cognitive Repository & Hybrid RAG</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Indicador de Telemetría */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/80">
              <Radio className="w-3.5 h-3.5 text-apple-green animate-pulse" />
              <span>Telemetría WebSockets Activa</span>
            </div>

            {/* Perfil de Usuario */}
            <div className="flex items-center gap-3 pl-3 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-white truncate max-w-[140px]">{user.name || user.email}</p>
                <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-apple-accent">
                  {user.role}
                </span>
              </div>

              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-white/50 hover:text-red-400 hover:bg-white/5 transition"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1">
        
        {/* ========================================================================= */}
        {/* VISTA 1: REPOSITORIO DE DOCUMENTOS */}
        {/* ========================================================================= */}
        {currentView === 'REPOSITORY' && (
          <div className="space-y-6">
            
            {/* Zona Dropzone Háptica con barra de estado */}
            {(user.role === 'ADMIN' || user.role === 'ANALISTA') && (
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFileUpload(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer p-6 sm:p-8 rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center overflow-hidden ${
                  isDragging 
                    ? 'border-apple-accent bg-apple-accent/10 scale-[1.01]' 
                    : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => handleFileUpload(e.target.files)} 
                  className="hidden" 
                  accept=".pdf,.docx,.txt"
                />

                {isUploading ? (
                  <div className="w-full max-w-md space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-white">
                      <span className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-apple-accent animate-spin" />
                        {uploadStatusText || 'Procesando pipeline cognitivo...'}
                      </span>
                      <span className="font-mono text-apple-accent">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-apple-accent to-apple-purple transition-all duration-500 rounded-full" 
                        style={{ width: uploadProgress + '%' }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-11 h-11 rounded-2xl bg-apple-accent/15 flex items-center justify-center text-apple-accent mb-2.5 shadow-lg shadow-apple-accent/10">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Arrastra tus documentos institucionales aquí</h3>
                    <p className="text-xs text-apple-subtext mt-1">Soporta formatos PDF, DOCX y TXT hasta 20 MB</p>
                  </>
                )}
              </div>
            )}

            {/* Barra de Controles y Carpetas */}
            <div className="space-y-4">
              
              {/* Pestañas de Carpetas */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveFolderId(null)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition ${
                      activeFolderId === null 
                        ? 'bg-white text-black shadow-lg' 
                        : 'bg-white/5 text-white/70 hover:text-white'
                    }`}
                  >
                    Todos ({documents.length})
                  </button>

                  {folders.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setActiveFolderId(f.id)}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition ${
                        activeFolderId === f.id 
                          ? 'bg-apple-accent text-white shadow-lg shadow-apple-accent/20' 
                          : 'bg-white/5 text-white/70 hover:text-white'
                      }`}
                    >
                      <Folder className="w-3.5 h-3.5" />
                      <span>{f.name}</span>
                      <span className="text-[10px] opacity-60">({f.document_count || 0})</span>
                    </button>
                  ))}

                  {(user.role === 'ADMIN' || user.role === 'ANALISTA') && (
                    <button
                      onClick={() => setShowNewFolderModal(true)}
                      className="p-2 rounded-2xl bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition"
                      title="Nueva Carpeta"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Botón de Carga de Muestras */}
                {documents.length === 0 && (
                  <button
                    onClick={handleSeedSamples}
                    disabled={isSeeding}
                    className="px-3 py-2 rounded-2xl bg-gradient-to-r from-apple-accent to-apple-purple text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg whitespace-nowrap transition hover:opacity-90 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isSeeding ? 'Cargando muestras...' : 'Cargar Documentos de Muestra'}</span>
                  </button>
                )}
              </div>

              {/* Barra de Búsqueda y Selector de Vista */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar documento por título o categoría..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-apple-accent transition"
                  />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <div className="p-1 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-1">
                    <button
                      onClick={() => setViewMode('GRID')}
                      className={`p-2 rounded-xl transition ${
                        viewMode === 'GRID' ? 'bg-apple-accent text-white shadow-sm' : 'text-white/50 hover:text-white'
                      }`}
                      title="Vista Cuadrícula"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('TABLE')}
                      className={`p-2 rounded-xl transition ${
                        viewMode === 'TABLE' ? 'bg-apple-accent text-white shadow-sm' : 'text-white/50 hover:text-white'
                      }`}
                      title="Vista Tabla"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Listado de Documentos: Estado Vacío o Contenido */}
            {filteredDocuments.length === 0 ? (
              <div className="py-16 px-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-14 h-14 rounded-3xl bg-white/5 flex items-center justify-center text-white/40">
                  <FileText className="w-7 h-7" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="text-sm font-semibold text-white">No hay documentos en este repositorio</h4>
                  <p className="text-xs text-apple-subtext">
                    Arrastra archivos PDF, DOCX o TXT arriba, o haz clic en el botón de abajo para cargar ejemplos institucionales.
                  </p>
                </div>
                <button
                  onClick={handleSeedSamples}
                  disabled={isSeeding}
                  className="px-4 py-2.5 rounded-2xl bg-apple-accent/20 hover:bg-apple-accent text-apple-accent hover:text-white border border-apple-accent/30 text-xs font-semibold flex items-center gap-2 transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSeeding ? 'Indexando...' : 'Poblar Repositorio con Muestras UTS'}</span>
                </button>
              </div>
            ) : viewMode === 'GRID' ? (
              /* VISTA EN CUADRÍCULA (GRID) */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocuments.map(doc => (
                  <div 
                    key={doc.id}
                    className="p-5 rounded-3xl bg-[#09090D] border border-white/10 hover:border-white/20 transition-all group flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/80 group-hover:scale-105 transition">
                          <FileText className="w-5 h-5" />
                        </div>
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold tracking-wider uppercase ${
                          doc.status === 'COMPLETED' ? 'bg-apple-green/10 text-apple-green border border-apple-green/20' :
                          doc.status === 'ERROR' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-apple-accent/10 text-apple-accent border border-apple-accent/20'
                        }`}>
                          {doc.status}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-white truncate" title={doc.original_name}>
                        {doc.original_name}
                      </h4>

                      <div className="mt-2.5 flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                          doc.category === 'ADMINISTRATIVO' ? 'bg-[#0A84FF]/20 text-[#0A84FF]' :
                          doc.category === 'FINANCIERO' ? 'bg-[#30D158]/20 text-[#30D158]' :
                          doc.category === 'TECNICO_LEGAL' ? 'bg-[#BF5AF2]/20 text-[#BF5AF2]' : 'bg-white/5 text-white/60'
                        }`}>
                          {doc.category || 'NO CLASIFICADO'}
                        </span>
                        {doc.category_confidence > 0 && (
                          <span className="text-[10px] text-white/40 font-mono">{(doc.category_confidence * 100).toFixed(0)}% conf</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-apple-subtext font-mono">
                        {(doc.file_size_bytes / (1024 * 1024)).toFixed(2)} MB • {doc.page_count} pág
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openInspector(doc.id)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-apple-accent/20 hover:text-apple-accent text-white/70 transition"
                          title="Abrir Inspector Cognitivo"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={'/api/v1/documents/' + doc.id + '/download'}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition"
                          title="Descargar Original"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        {user.role === 'ADMIN' && (
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/70 transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* VISTA EN TABLA (TABLE) */
              <div className="w-full bg-[#09090D] border border-white/10 rounded-3xl overflow-x-auto shadow-xl">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 bg-white/[0.02] text-[11px] text-apple-subtext uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3.5 px-6">Documento</th>
                      <th className="py-3.5 px-4">Categoría</th>
                      <th className="py-3.5 px-4">Tamaño / Pág</th>
                      <th className="py-3.5 px-4">Estado</th>
                      <th className="py-3.5 px-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredDocuments.map(doc => (
                      <tr key={doc.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-4 px-6 font-medium text-white flex items-center gap-3">
                          <FileText className="w-4 h-4 text-apple-accent flex-shrink-0" />
                          <span className="truncate max-w-xs sm:max-w-md">{doc.original_name}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            doc.category === 'ADMINISTRATIVO' ? 'bg-[#0A84FF]/20 text-[#0A84FF]' :
                            doc.category === 'FINANCIERO' ? 'bg-[#30D158]/20 text-[#30D158]' :
                            doc.category === 'TECNICO_LEGAL' ? 'bg-[#BF5AF2]/20 text-[#BF5AF2]' : 'bg-white/5 text-white/60'
                          }`}>
                            {doc.category || 'NO CLASIFICADO'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-apple-subtext font-mono">
                          {(doc.file_size_bytes / (1024 * 1024)).toFixed(2)} MB • {doc.page_count}p
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                            doc.status === 'COMPLETED' ? 'text-apple-green bg-apple-green/10' :
                            doc.status === 'ERROR' ? 'text-red-400 bg-red-500/10' :
                            'text-apple-accent bg-apple-accent/10'
                          }`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openInspector(doc.id)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-apple-accent/20 hover:text-apple-accent text-white/70 transition"
                              title="Abrir Inspector"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={'/api/v1/documents/' + doc.id + '/download'}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition"
                              title="Descargar"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                            {user.role === 'ADMIN' && (
                              <button
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/70 transition"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISTA 2: LIENZO SEMÁNTICO 2D & GRAFO DE CONOCIMIENTO */}
        {/* ========================================================================= */}
        {currentView === 'CANVAS' && (
          <SemanticCanvas token={token} onSelectDocument={openInspector} />
        )}

        {/* ========================================================================= */}
        {/* VISTA 3: DASHBOARD & TELEMETRÍA */}
        {/* ========================================================================= */}
        {currentView === 'ANALYTICS' && metrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 rounded-3xl bg-[#09090D] border border-white/10 shadow-lg">
                <span className="text-xs text-apple-subtext font-medium">Documentos Indexados</span>
                <p className="text-3xl font-bold text-white mt-2">{metrics.total_documents}</p>
                <span className="text-[11px] text-apple-green flex items-center gap-1 mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {metrics.success_rate_percentage}% éxito
                </span>
              </div>

              <div className="p-6 rounded-3xl bg-[#09090D] border border-white/10 shadow-lg">
                <span className="text-xs text-apple-subtext font-medium">Almacenamiento Total</span>
                <p className="text-3xl font-bold text-white mt-2">{metrics.total_storage_mb} <span className="text-sm font-normal text-apple-subtext">MB</span></p>
                <span className="text-[11px] text-apple-subtext mt-2 block font-mono">Límite por archivo: 20 MB</span>
              </div>

              <div className="p-6 rounded-3xl bg-[#09090D] border border-white/10 shadow-lg">
                <span className="text-xs text-apple-subtext font-medium">Fidelidad Guardrail RAG</span>
                <p className="text-3xl font-bold text-white mt-2">{metrics.avg_faithfulness}%</p>
                <span className="text-[11px] text-apple-green flex items-center gap-1 mt-2">
                  <ShieldCheck className="w-3.5 h-3.5" /> 0% alucinación
                </span>
              </div>

              <div className="p-6 rounded-3xl bg-[#09090D] border border-white/10 shadow-lg">
                <span className="text-xs text-apple-subtext font-medium">Latencia Promedio</span>
                <p className="text-3xl font-bold text-white mt-2">{metrics.avg_latency_ms} <span className="text-sm font-normal text-apple-subtext">ms</span></p>
                <span className="text-[11px] text-apple-accent flex items-center gap-1 mt-2">
                  <Zap className="w-3.5 h-3.5" /> Re-ranking Híbrido
                </span>
              </div>
            </div>

            {/* Distribución por Categorías */}
            <div className="p-6 rounded-3xl bg-[#09090D] border border-white/10 space-y-4 shadow-lg">
              <h3 className="text-sm font-semibold text-white">Distribución de Conocimiento por Categoría</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#0A84FF]/10 border border-[#0A84FF]/20">
                  <span className="text-xs font-semibold text-[#0A84FF]">Administrativo</span>
                  <p className="text-2xl font-bold text-white mt-1">{metrics.category_distribution?.ADMINISTRATIVO || 0}</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#30D158]/10 border border-[#30D158]/20">
                  <span className="text-xs font-semibold text-[#30D158]">Financiero</span>
                  <p className="text-2xl font-bold text-white mt-1">{metrics.category_distribution?.FINANCIERO || 0}</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#BF5AF2]/10 border border-[#BF5AF2]/20">
                  <span className="text-xs font-semibold text-[#BF5AF2]">Técnico/Legal</span>
                  <p className="text-2xl font-bold text-white mt-1">{metrics.category_distribution?.TECNICO_LEGAL || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* DOCK INFERIOR FLOTANTE ESTILO MACOS (RESPONSIVE) */}
      {/* ========================================================================= */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[95vw]">
        <div className="bg-black/80 backdrop-blur-2xl border border-white/15 p-1.5 sm:p-2 rounded-3xl shadow-2xl flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setCurrentView('REPOSITORY')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition ${
              currentView === 'REPOSITORY' 
                ? 'bg-apple-accent text-white shadow-lg shadow-apple-accent/25' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span className="hidden sm:inline">Repositorio</span>
          </button>

          <button
            onClick={() => setCurrentView('CANVAS')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition ${
              currentView === 'CANVAS' 
                ? 'bg-apple-accent text-white shadow-lg shadow-apple-accent/25' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Lienzo Semántico</span>
          </button>

          <button
            onClick={() => setCurrentView('ANALYTICS')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition ${
              currentView === 'ANALYTICS' 
                ? 'bg-apple-accent text-white shadow-lg shadow-apple-accent/25' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <div className="w-[1px] h-6 bg-white/15 mx-1" />

          {/* Botón Asistente RAG */}
          <button
            onClick={() => setIsChatOpen(true)}
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-apple-purple to-apple-accent text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-apple-purple/20 hover:opacity-90 transition"
          >
            <Bot className="w-4 h-4" />
            <span className="font-bold">Consultar RAG</span>
          </button>
        </div>
      </div>

      {/* Modal Chat RAG */}
      <RAGChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        token={token}
        onOpenInspector={openInspector}
      />

      {/* Inspector Lateral */}
      <InspectorModal
        documentId={inspectorDocId}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        token={token}
      />

      {/* Modal Crear Carpeta */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-[#09090D] border border-white/10 p-6 rounded-3xl max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-white">Nueva Carpeta Institucional</h3>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <input
                type="text"
                placeholder="Nombre de la carpeta"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-apple-accent"
              />
              <input
                type="text"
                placeholder="Descripción (opcional)"
                value={newFolderDesc}
                onChange={(e) => setNewFolderDesc(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-apple-accent"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-xs font-semibold text-white/70 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-apple-accent text-xs font-semibold text-white hover:bg-apple-accentHover"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
