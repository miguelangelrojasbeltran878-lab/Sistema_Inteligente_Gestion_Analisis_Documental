import React, { useRef, useEffect, useState } from 'react';
import { Sparkles, ZoomIn, ZoomOut, RotateCcw, Layers, Eye, RefreshCw, Filter } from 'lucide-react';

export default function SemanticCanvas({ token, onSelectDocument }) {
  const canvasRef = useRef(null);
  const [graphData, setGraphData] = useState({ documents: [], knowledge_graph: { nodes: [], links: [] } });
  const [nodesState, setNodesState] = useState([]);
  const [linksState, setLinksState] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    fetchSemanticData();
  }, []);

  const fetchSemanticData = async () => {
    try {
      const res = await fetch('/api/v1/semantic-map', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || { documents: [], knowledge_graph: { nodes: [], links: [] } };
        setGraphData(data);
        
        // Inicializar posiciones con layout con física de relajación
        const rawNodes = data.knowledge_graph?.nodes || [];
        const rawLinks = data.knowledge_graph?.links || [];

        // Crear copias mutables con velocidades y posiciones iniciales
        const initializedNodes = rawNodes.map((n, i) => {
          // Si x e y son 0 o muy cercanos, dispersar en espiral
          let px = n.x;
          let py = n.y;
          if (Math.abs(px) < 1 && Math.abs(py) < 1) {
            const angle = i * 1.5;
            const dist = 30 + (i * 15);
            px = Math.cos(angle) * dist;
            py = Math.sin(angle) * dist;
          }
          return {
            ...n,
            x: px,
            y: py,
            vx: 0,
            vy: 0
          };
        });

        // Aplicar 30 iteraciones de relajación de fuerzas para separar cualquier nodo superpuesto
        for (let iter = 0; iter < 40; iter++) {
          for (let i = 0; i < initializedNodes.length; i++) {
            for (let j = i + 1; j < initializedNodes.length; j++) {
              const na = initializedNodes[i];
              const nb = initializedNodes[j];
              const dx = nb.x - na.x;
              const dy = nb.y - na.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const minDist = na.type === 'document' && nb.type === 'document' ? 26 : 18;

              if (dist < minDist) {
                const force = (minDist - dist) / dist * 0.45;
                const fx = dx * force;
                const fy = dy * force;
                na.x -= fx;
                na.y -= fy;
                nb.x += fx;
                nb.y += fy;
              }
            }
          }
        }

        setNodesState(initializedNodes);
        setLinksState(rawLinks);
      }
    } catch (err) {
      console.error('Error loading semantic graph:', err);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const centerX = rect.width / 2 + offset.x;
    const centerY = rect.height / 2 + offset.y;

    const render = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Fondo Cuadrícula Holográfica
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;
      const gridSize = 40 * scale;
      const startX = (offset.x % gridSize);
      const startY = (offset.y % gridSize);

      for (let x = startX; x < rect.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, rect.height);
        ctx.stroke();
      }
      for (let y = startY; y < rect.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(rect.width, y);
        ctx.stroke();
      }

      const filteredNodes = nodesState.filter(n => {
        if (categoryFilter === 'ALL') return true;
        if (n.type === 'entity') return true;
        return n.category === categoryFilter;
      });

      const nodeScreenPositions = {};

      filteredNodes.forEach(node => {
        const screenX = centerX + (node.x * 5.5 * scale);
        const screenY = centerY + (node.y * 5.5 * scale);
        nodeScreenPositions[node.id] = { ...node, screenX, screenY };
      });

      // 1. Dibujar Enlaces de Grafo
      linksState.forEach(link => {
        const source = nodeScreenPositions[link.source];
        const target = nodeScreenPositions[link.target];
        if (source && target) {
          ctx.strokeStyle = 'rgba(10, 132, 255, 0.35)';
          ctx.lineWidth = 1.5 * scale;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(source.screenX, source.screenY);
          ctx.lineTo(target.screenX, target.screenY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // 2. Dibujar Nodos
      filteredNodes.forEach(node => {
        const pos = nodeScreenPositions[node.id];
        if (!pos) return;

        const isDoc = node.type === 'document';
        const isHovered = hoveredNode && hoveredNode.id === node.id;
        const radius = (isDoc ? 14 : 8) * scale * (isHovered ? 1.3 : 1.0);

        let color = '#0A84FF'; // Administrativo
        if (node.category === 'FINANCIERO') color = '#30D158';
        if (node.category === 'TECNICO_LEGAL') color = '#BF5AF2';
        if (node.type === 'entity') color = '#FF9F0A';

        // Resplandor
        const glow = ctx.createRadialGradient(pos.screenX, pos.screenY, radius * 0.2, pos.screenX, pos.screenY, radius * 2.8);
        glow.addColorStop(0, color + '77');
        glow.addColorStop(1, color + '00');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(pos.screenX, pos.screenY, radius * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(pos.screenX, pos.screenY, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Etiqueta Glassmorphic
        if (isDoc || isHovered || scale > 0.9) {
          const label = node.name.length > 20 ? node.name.substring(0, 18) + '...' : node.name;
          ctx.font = `500 ${Math.max(10, 11 * scale)}px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif`;
          const textWidth = ctx.measureText(label).width;
          const pillWidth = textWidth + 16;
          const pillHeight = 20 * scale;
          const pillX = pos.screenX - pillWidth / 2;
          const pillY = pos.screenY + radius + 6;

          // Fondo de la píldora
          ctx.fillStyle = 'rgba(10, 10, 15, 0.85)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 6);
          ctx.fill();
          ctx.stroke();

          // Texto
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, pos.screenX, pillY + (pillHeight / 2));
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodesState, linksState, offset, scale, hoveredNode, categoryFilter]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }

    const centerX = rect.width / 2 + offset.x;
    const centerY = rect.height / 2 + offset.y;

    let hit = null;
    for (const node of nodesState) {
      const screenX = centerX + (node.x * 5.5 * scale);
      const screenY = centerY + (node.y * 5.5 * scale);
      const dist = Math.hypot(mouseX - screenX, mouseY - screenY);
      const radius = (node.type === 'document' ? 18 : 12) * scale;

      if (dist <= radius) {
        hit = { ...node, screenX, screenY };
        break;
      }
    }

    setHoveredNode(hit);
    canvas.style.cursor = hit ? 'pointer' : (isDragging ? 'grabbing' : 'grab');
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (hoveredNode && hoveredNode.type === 'document' && onSelectDocument) {
      onSelectDocument(hoveredNode.id);
    }
  };

  return (
    <div className="relative w-full h-[620px] bg-[#050507] rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col">
      
      {/* Top Header Flotante del Lienzo */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="bg-black/70 backdrop-blur-2xl px-4 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3 pointer-events-auto shadow-xl">
          <div className="w-8 h-8 rounded-xl bg-apple-accent/20 flex items-center justify-center text-apple-accent">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white tracking-wide">Lienzo Semántico 2D & Grafo de Conocimiento</h3>
            <p className="text-[10px] text-apple-subtext font-mono">
              {nodesState.filter(n => n.type === 'document').length} documentos • Clústeres orbitales
            </p>
          </div>
        </div>

        {/* Filtros por Categoría */}
        <div className="bg-black/70 backdrop-blur-2xl p-1 rounded-2xl border border-white/10 flex items-center gap-1 pointer-events-auto shadow-xl">
          {['ALL', 'ADMINISTRATIVO', 'FINANCIERO', 'TECNICO_LEGAL'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition ${
                categoryFilter === cat 
                  ? 'bg-apple-accent text-white shadow-md' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat === 'ALL' ? 'Todos' : cat.replace('_', '/')}
            </button>
          ))}
        </div>

        {/* Controles de Zoom y Centrado */}
        <div className="bg-black/70 backdrop-blur-2xl p-1.5 rounded-2xl border border-white/10 flex items-center gap-1 pointer-events-auto shadow-xl">
          <button 
            onClick={() => setScale(s => Math.min(2.5, s + 0.2))} 
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition"
            title="Acercar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setScale(s => Math.max(0.4, s - 0.2))} 
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition"
            title="Alejar"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button 
            onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }} 
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition"
            title="Reiniciar Vista"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button 
            onClick={fetchSemanticData}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition"
            title="Recargar Grafo"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
      />

      {/* Tooltip Sensorial Flotante */}
      {hoveredNode && (
        <div 
          className="absolute z-20 pointer-events-none bg-black/90 backdrop-blur-2xl border border-white/15 p-3 rounded-2xl shadow-2xl max-w-xs transition-all"
          style={{
            left: Math.min(window.innerWidth - 320, hoveredNode.screenX + 15),
            top: Math.max(20, hoveredNode.screenY - 30)
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${
              hoveredNode.category === 'ADMINISTRATIVO' ? 'bg-[#0A84FF]' :
              hoveredNode.category === 'FINANCIERO' ? 'bg-[#30D158]' :
              hoveredNode.category === 'TECNICO_LEGAL' ? 'bg-[#BF5AF2]' : 'bg-[#FF9F0A]'
            }`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
              {hoveredNode.type === 'document' ? hoveredNode.category : 'Entidad Compartida'}
            </span>
          </div>
          <p className="text-xs font-semibold text-white leading-snug">{hoveredNode.name}</p>
          {hoveredNode.type === 'document' && (
            <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-apple-accent font-semibold">
              <span>Clic para abrir Inspector Cognitivo</span>
              <Eye className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      )}

      {/* Leyenda Inferior */}
      <div className="absolute bottom-4 left-4 z-10 bg-black/70 backdrop-blur-2xl px-4 py-2 rounded-2xl border border-white/10 flex flex-wrap items-center gap-4 text-[11px] text-white/80 shadow-xl">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0A84FF]" />
          <span>Administrativo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#30D158]" />
          <span>Financiero</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#BF5AF2]" />
          <span>Técnico/Legal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF9F0A]" />
          <span>Entidad Vinculante</span>
        </div>
      </div>
    </div>
  );
}
