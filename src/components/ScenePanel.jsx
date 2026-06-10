import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';

export default function ScenePanel({ campaignId, isMaster, socketRef, npcs, characters }) {
  const [sceneType, setSceneType] = useState('local');
  const [scene, setScene] = useState(null);
  const [backgrounds, setBackgrounds] = useState([]);
  const [showBgLibrary, setShowBgLibrary] = useState(false);
  const [bgUrlInput, setBgUrlInput] = useState('');
  const [bgNameInput, setBgNameInput] = useState('');
  const [selectedBg, setSelectedBg] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [error, setError] = useState('');
  const [tool, setTool] = useState('select');
  const [color, setColor] = useState('#ff0000');
  const [lineWidth, setLineWidth] = useState(3);
  const [selectedNote, setSelectedNote] = useState(null);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const isDrawing = useRef(false);
  const draggedToken = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const lastTouchTime = useRef(0);
  const drawingsRef = useRef([]);

  const loadScene = useCallback(async () => {
    try {
      const data = await api.getScenes(campaignId, sceneType);
      if (data && data.length > 0) {
        const s = data[0];
        setScene(s);
        setTokens(s.tokens || []);
        drawingsRef.current = s.drawings || [];
        if (s.background_url) setSelectedBg({ url: s.background_url, name: '' });
        else setSelectedBg(null);
        redrawCanvas(s.drawings || []);
      } else {
        setScene(null); setTokens([]); drawingsRef.current = []; setSelectedBg(null);
        clearCanvas();
      }
    } catch (e) { console.error(e); }
  }, [campaignId, sceneType]);

  const loadBackgrounds = async () => {
    try { const bgs = await api.getBackgrounds(campaignId); setBackgrounds(bgs); } catch (e) { console.error(e); }
  };

  useEffect(() => { loadScene(); loadBackgrounds(); }, [sceneType, campaignId]);

  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;
    const h1 = (data) => { if (data.campaignId === campaignId && data.sceneType === sceneType) loadScene(); };
    const h2 = (data) => {
      if (data.campaignId === campaignId && data.sceneType === sceneType && data.tokens) setTokens(data.tokens);
    };
    socket.on('scene_updated', h1);
    socket.on('scene_token_moved', h2);
    return () => { socket.off('scene_updated', h1); socket.off('scene_token_moved', h2); };
  }, [campaignId, sceneType, socketRef]);

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const redrawCanvas = (drawings) => {
    if (!canvasRef.current || !selectedBg?.url) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const d of drawings) {
      if (d.tool === 'pencil' && d.points?.length > 0) {
        ctx.strokeStyle = d.color || '#ff0000';
        ctx.lineWidth = d.lineWidth || 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(d.points[0].x, d.points[0].y);
        for (let i = 1; i < d.points.length; i++) {
          ctx.lineTo(d.points[i].x, d.points[i].y);
        }
        ctx.stroke();
      }
    }
  };

  const saveScene = async () => {
    setError('');
    try {
      await api.updateScene(campaignId, {
        scene_type: sceneType,
        background_url: selectedBg?.url || null,
        tokens,
        drawings: drawingsRef.current,
        fog_of_war: [],
      });
      if (socketRef?.current) {
        socketRef.current.emit('scene_update', { campaignId, sceneType, updates: {} });
      }
    } catch (e) { setError(e.message); }
  };

  // Инициализация холста при смене фона
  useEffect(() => {
    if (!selectedBg?.url) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth || 800;
      const h = img.naturalHeight || 600;
      if (canvasRef.current) {
        canvasRef.current.width = w;
        canvasRef.current.height = h;
        redrawCanvas(drawingsRef.current);
      }
    };
    img.src = selectedBg.url;
  }, [selectedBg]);

  const getEventPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const getTokenPos = (e) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const img = container.querySelector('img');
    const scaleX = (img?.naturalWidth || 800) / (rect.width || 1);
    const scaleY = (img?.naturalHeight || 600) / (rect.height || 1);
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Рисование карандашом
  const currentPath = useRef([]);

  const startDraw = (e) => {
    if (!isMaster) return;
    if (tool !== 'pencil' && tool !== 'eraser') return;
    e.preventDefault();

    const pos = getEventPos(e);
    isDrawing.current = true;
    currentPath.current = [{ x: pos.x, y: pos.y }];

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = tool === 'eraser' ? '#000000' : color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const moveDraw = (e) => {
    if (!isMaster || !isDrawing.current) return;
    if (tool !== 'pencil' && tool !== 'eraser') return;
    e.preventDefault();

    const pos = getEventPos(e);
    currentPath.current.push({ x: pos.x, y: pos.y });

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = (e) => {
    if (!isMaster || !isDrawing.current) return;
    isDrawing.current = false;

    if (currentPath.current.length > 0 && tool === 'pencil') {
      drawingsRef.current = [...drawingsRef.current, {
        tool: 'pencil',
        color,
        lineWidth,
        points: currentPath.current,
      }];
    }

    // Для ластика: удаляем рисунки, которые были задеты
    if (tool === 'eraser' && currentPath.current.length > 0) {
      const eraserPath = currentPath.current;
      drawingsRef.current = drawingsRef.current.filter(d => {
        if (d.tool !== 'pencil' || !d.points?.length) return true;
        // Проверяем пересечение
        return !d.points.some(p => {
          return eraserPath.some(ep => {
            const dx = p.x - ep.x;
            const dy = p.y - ep.y;
            return Math.sqrt(dx * dx + dy * dy) < (lineWidth * 3 + (d.lineWidth || 3));
          });
        });
      });
      redrawCanvas(drawingsRef.current);
    }

    currentPath.current = [];
    if (canvasRef.current) {
      canvasRef.current.getContext('2d').globalCompositeOperation = 'source-over';
    }
  };

  // Заметки
  const addNoteToken = (e) => {
    if (!isMaster || tool !== 'note') return;
    e.preventDefault();
    const pos = getTokenPos(e);
    const text = prompt('Текст заметки:');
    if (text) {
      setTokens(prev => [...prev, {
        id: `note_${Date.now()}`,
        type: 'note',
        label: '📝',
        color: '#ffcc00',
        x: pos.x,
        y: pos.y,
        note: text,
      }]);
    }
  };

  // Токены персонажей/NPC
  const addToken = (type, refId, name, colorVal) => {
    if (!isMaster) return;
    const img = containerRef.current?.querySelector('img');
    const w = img?.naturalWidth || 800;
    const h = img?.naturalHeight || 600;
    setTokens(prev => [...prev, {
      id: `${type}_${refId}_${Date.now()}`,
      type, ref_id: refId,
      label: (name || '?').substring(0, 2).toUpperCase(),
      color: colorVal,
      x: w * 0.3 + Math.random() * w * 0.4,
      y: h * 0.3 + Math.random() * h * 0.4,
      note: null,
    }]);
  };

  const removeToken = (tokenId) => {
    setTokens(prev => prev.filter(t => t.id !== tokenId));
  };

  const startTokenDrag = (e, tokenId) => {
    if (!isMaster || tool !== 'select') return;
    e.preventDefault();
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTouchTime.current < 300) {
      removeToken(tokenId);
      lastTouchTime.current = 0;
      return;
    }
    lastTouchTime.current = now;
    draggedToken.current = tokenId;
    const pos = getTokenPos(e);
    const token = tokens.find(t => t.id === tokenId);
    if (token) {
      dragOffset.current = { x: pos.x - token.x, y: pos.y - token.y };
    }
  };

  const moveTokenDrag = (e) => {
    if (!draggedToken.current || !isMaster) return;
    e.preventDefault();
    const pos = getTokenPos(e);
    setTokens(prev => prev.map(t =>
      t.id === draggedToken.current ? { ...t, x: pos.x - dragOffset.current.x, y: pos.y - dragOffset.current.y } : t
    ));
  };

  const endTokenDrag = () => {
    if (draggedToken.current && socketRef?.current) {
      const token = tokens.find(t => t.id === draggedToken.current);
      if (token) {
        socketRef.current.emit('scene_token_move', {
          campaignId, sceneType, tokenId: token.id,
          tokens: tokens.map(t => t.id === token.id ? token : t)
        });
      }
    }
    draggedToken.current = null;
  };

  const availableTokens = [
    ...(characters || []).map(c => ({ type: 'character', id: c.id, name: c.name, color: '#33cc33' })),
    ...(npcs || []).filter(n => n.visibility === 'combat').map(n => ({ type: 'npc', id: n.id, name: n.name, color: '#cc3333' })),
  ];

  return (
    <div className="flex flex-col h-full bg-wasteland-900">
      {/* Панель инструментов */}
      <div className="flex items-center gap-1 p-1.5 bg-wasteland-800 border-b border-wasteland-600 flex-wrap">
        <select value={sceneType} onChange={e => setSceneType(e.target.value)} className="bg-wasteland-700 text-wasteland-100 text-xs rounded p-1 border border-wasteland-600">
          <option value="local">Локальная</option>
          <option value="global">Глобальная</option>
        </select>
        {isMaster && (
          <>
            <button onClick={() => setShowBgLibrary(!showBgLibrary)} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">🖼️</button>
            <select value={tool} onChange={e => setTool(e.target.value)} className="bg-wasteland-700 text-wasteland-100 text-xs rounded p-1 border border-wasteland-600">
              <option value="select">✋</option>
              <option value="pencil">✏️</option>
              <option value="eraser">🧹</option>
              <option value="note">📝</option>
            </select>
            {(tool === 'pencil' || tool === 'eraser') && (
              <>
                {tool === 'pencil' && <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-5 h-5 rounded cursor-pointer" />}
                <input type="range" min="1" max="10" value={lineWidth} onChange={e => setLineWidth(parseInt(e.target.value))} className="w-12" />
              </>
            )}
            <button onClick={saveScene} className="text-xs bg-accent-orange hover:bg-orange-500 text-wasteland-900 px-2 py-1 rounded font-bold">💾</button>
          </>
        )}
        {error && <span className="text-accent-red text-xs ml-1">{error}</span>}
      </div>

      {/* Библиотека фонов */}
      {showBgLibrary && isMaster && (
        <div className="bg-wasteland-800 p-2 border-b border-wasteland-600">
          <div className="flex flex-col sm:flex-row gap-1 mb-2">
            <input placeholder="Название" value={bgNameInput} onChange={e => setBgNameInput(e.target.value)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs flex-1" />
            <input placeholder="URL картинки" value={bgUrlInput} onChange={e => setBgUrlInput(e.target.value)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs flex-1" />
            <button onClick={async () => {
              if (bgNameInput && bgUrlInput) {
                await api.uploadBackground(campaignId, bgNameInput, bgUrlInput);
                setBgNameInput(''); setBgUrlInput('');
                loadBackgrounds();
              }
            }} className="bg-accent-orange text-wasteland-900 px-2 py-1 rounded text-xs font-bold">OK</button>
          </div>
          <div className="flex flex-wrap gap-1">
            {backgrounds.map(bg => (
              <div key={bg.id} onClick={() => setSelectedBg(bg)} className={`cursor-pointer p-0.5 border rounded ${selectedBg?.url === bg.url ? 'border-accent-orange' : 'border-wasteland-600'}`}>
                <img src={bg.url} alt={bg.name} className="h-10 w-16 object-cover rounded" />
                <p className="text-wasteland-500 text-xs text-center truncate w-16">{bg.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Холст */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-wasteland-800"
        style={{ minHeight: '300px', touchAction: isMaster ? 'none' : 'auto' }}
        onMouseDown={(e) => { if (tool === 'note') addNoteToken(e); else startDraw(e); }}
        onMouseMove={(e) => { moveDraw(e); moveTokenDrag(e); }}
        onMouseUp={(e) => { endDraw(e); endTokenDrag(); }}
        onMouseLeave={(e) => { endDraw(e); endTokenDrag(); }}
        onTouchStart={(e) => { if (tool === 'note') addNoteToken(e); else startDraw(e); }}
        onTouchMove={(e) => { moveDraw(e); moveTokenDrag(e); }}
        onTouchEnd={(e) => { endDraw(e); endTokenDrag(); }}
      >
        {selectedBg ? (
          <div className="relative inline-block min-w-full min-h-full">
            <img src={selectedBg.url} alt="Фон" className="block max-w-none" draggable={false} />
            <canvas ref={canvasRef} className="absolute top-0 left-0" style={{ pointerEvents: ['pencil','eraser'].includes(tool) ? 'auto' : 'none' }} />
            {/* Токены */}
            {tokens.map(token => (
              <div
                key={token.id}
                onMouseDown={(e) => startTokenDrag(e, token.id)}
                onTouchStart={(e) => startTokenDrag(e, token.id)}
                onClick={() => { if (token.type === 'note' && token.note) setSelectedNote(token); }}
                style={{
                  position: 'absolute', left: token.x - 18, top: token.y - 18,
                  width: 36, height: 36, borderRadius: '50%',
                  backgroundColor: token.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', color: token.type === 'note' ? '#000' : 'white',
                  fontSize: token.type === 'note' ? '16px' : '12px',
                  border: '2px solid white',
                  cursor: isMaster && tool === 'select' ? 'grab' : 'pointer',
                  zIndex: 30, userSelect: 'none',
                  boxShadow: '0 0 4px rgba(0,0,0,0.5)',
                  touchAction: 'none',
                }}
              >
                {token.label}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-wasteland-500 text-sm">Выберите фон</div>
        )}
      </div>

      {/* Нижняя панель токенов */}
      {isMaster && (
        <div className="bg-wasteland-800 p-1.5 border-t border-wasteland-600 flex gap-1 overflow-x-auto">
          <span className="text-wasteland-500 text-xs self-center">+</span>
          {availableTokens.map(t => (
            <button key={`${t.type}_${t.id}`} onClick={() => addToken(t.type, t.id, t.name, t.color)} className="flex items-center gap-1 bg-wasteland-700 hover:bg-wasteland-600 rounded px-1.5 py-0.5 text-xs flex-shrink-0">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }}></span>
              {t.name.substring(0, 8)}
            </button>
          ))}
          <button onClick={() => setTokens([])} className="text-xs bg-accent-red/20 hover:bg-accent-red/40 px-2 py-0.5 rounded text-accent-red flex-shrink-0">✕</button>
        </div>
      )}

      {/* Модалка заметки */}
      {selectedNote && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedNote(null)}>
          <div className="bg-wasteland-800 border border-wasteland-600 rounded-lg p-4 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-accent-yellow font-bold">Заметка</h3>
              <button onClick={() => setSelectedNote(null)} className="text-wasteland-400 hover:text-wasteland-200">✕</button>
            </div>
            <p className="text-wasteland-200 text-sm whitespace-pre-wrap">{selectedNote.note}</p>
            {isMaster && (
              <button
                onClick={() => {
                  removeToken(selectedNote.id);
                  setSelectedNote(null);
                }}
                className="mt-3 text-xs bg-accent-red/20 hover:bg-accent-red/40 text-accent-red px-2 py-1 rounded"
              >
                Удалить
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}