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
  const [drawings, setDrawings] = useState([]);
  const [fogDataUrl, setFogDataUrl] = useState(null);
  const [tool, setTool] = useState('select');
  const [color, setColor] = useState('#ff0000');
  const [lineWidth, setLineWidth] = useState(3);
  const [error, setError] = useState('');
  const [brushSize, setBrushSize] = useState(40);
  const [noteText, setNoteText] = useState('');

  const canvasRef = useRef(null);
  const fogCanvasRef = useRef(null);
  const isDrawing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const draggedToken = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const loadScene = useCallback(async () => {
    try {
      const data = await api.getScenes(campaignId, sceneType);
      if (data && data.length > 0) {
        const s = data[0];
        setScene(s);
        setTokens(s.tokens || []);
        setDrawings(s.drawings || []);
        if (s.fog_of_war?.dataUrl) setFogDataUrl(s.fog_of_war.dataUrl);
        else setFogDataUrl(null);
        if (s.background_url) setSelectedBg({ url: s.background_url, name: '' });
        else setSelectedBg(null);
      } else {
        setScene(null); setTokens([]); setDrawings([]); setFogDataUrl(null); setSelectedBg(null);
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
    const h2 = (data) => { if (data.campaignId === campaignId && data.sceneType === sceneType) setTokens(data.tokens); };
    socket.on('scene_updated', h1);
    socket.on('scene_token_moved', h2);
    return () => { socket.off('scene_updated', h1); socket.off('scene_token_moved', h2); };
  }, [campaignId, sceneType, socketRef]);

  // Сохраняем туман войны как dataUrl
  const getFogDataUrl = () => {
    if (!fogCanvasRef.current) return null;
    return fogCanvasRef.current.toDataURL();
  };

  const saveScene = async () => {
    setError('');
    try {
      const fog = getFogDataUrl();
      await api.updateScene(campaignId, {
        scene_type: sceneType,
        background_url: selectedBg?.url || null,
        tokens,
        drawings,
        fog_of_war: fog ? { dataUrl: fog } : [],
      });
      if (socketRef?.current) {
        socketRef.current.emit('scene_update', { campaignId, sceneType, updates: {} });
      }
    } catch (e) { setError(e.message); }
  };

  // Инициализация холстов при смене фона
  useEffect(() => {
    if (!selectedBg?.url) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Холст рисования
      if (canvasRef.current) {
        const c = canvasRef.current;
        c.width = img.naturalWidth || 800;
        c.height = img.naturalHeight || 600;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);
        // Восстанавливаем рисунки
        for (const d of drawings) {
          if (d.tool === 'pencil' || d.tool === 'line') {
            ctx.strokeStyle = d.color;
            ctx.lineWidth = d.lineWidth;
            if (d.tool === 'line' && d.points?.length >= 2) {
              ctx.beginPath();
              ctx.moveTo(d.points[0].x, d.points[0].y);
              ctx.lineTo(d.points[1].x, d.points[1].y);
              ctx.stroke();
            }
          } else if (d.tool === 'note') {
            ctx.fillStyle = 'rgba(255,255,0,0.9)';
            ctx.fillRect(d.x, d.y, ctx.measureText(d.text).width + 10, 20);
            ctx.fillStyle = '#000';
            ctx.font = '12px monospace';
            ctx.fillText(d.text, d.x + 4, d.y + 14);
          }
        }
      }
      // Холст тумана
      if (fogCanvasRef.current) {
        const fc = fogCanvasRef.current;
        fc.width = img.naturalWidth || 800;
        fc.height = img.naturalHeight || 600;
        const fctx = fc.getContext('2d');
        if (fogDataUrl) {
          const fogImg = new Image();
          fogImg.onload = () => { fctx.drawImage(fogImg, 0, 0); };
          fogImg.src = fogDataUrl;
        } else {
          fctx.fillStyle = 'rgba(0,0,0,0.85)';
          fctx.fillRect(0, 0, fc.width, fc.height);
        }
      }
    };
    img.src = selectedBg.url;
  }, [selectedBg, fogDataUrl, drawings]);

  // Рисование
  const getCanvasPos = (e) => {
    const canvas = tool === 'eraser' ? fogCanvasRef.current : canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e) => {
    if (!isMaster) return;
    if (tool === 'select') return;

    const pos = getCanvasPos(e);
    isDrawing.current = true;
    startPos.current = pos;

    if (tool === 'note') {
      const text = prompt('Текст заметки:');
      if (text) {
        const d = { tool: 'note', x: pos.x, y: pos.y, text };
        setDrawings(prev => [...prev, d]);
      }
      isDrawing.current = false;
      return;
    }

    if (tool === 'pencil' || tool === 'line') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }

    if (tool === 'eraser') {
      const canvas = fogCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const handleMouseMove = (e) => {
    if (!isMaster || !isDrawing.current) return;
    if (tool === 'select' || tool === 'note') return;

    const pos = getCanvasPos(e);
    const canvas = tool === 'eraser' ? fogCanvasRef.current : canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const handleMouseUp = (e) => {
    if (!isMaster || !isDrawing.current) return;
    isDrawing.current = false;

    if (tool === 'line') {
      const pos = getCanvasPos(e);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setDrawings(prev => [...prev, {
        tool: 'line', color, lineWidth,
        points: [{ x: startPos.current.x, y: startPos.current.y }, { x: pos.x, y: pos.y }]
      }]);
    }

    if (tool === 'pencil') {
      setDrawings(prev => [...prev, { tool: 'pencil', color, lineWidth }]);
    }

    // Очищаем операцию ластика
    if (tool === 'eraser' && fogCanvasRef.current) {
      fogCanvasRef.current.getContext('2d').globalCompositeOperation = 'source-over';
    }
  };

  // Токены
  const addToken = (type, refId, name, colorVal) => {
    if (!isMaster) return;
    const img = canvasRef.current?.parentElement?.querySelector('img');
    const w = img?.naturalWidth || 800;
    const h = img?.naturalHeight || 600;
    setTokens(prev => [...prev, {
      id: `${type}_${refId}_${Date.now()}`,
      type, ref_id: refId,
      label: (name || '?').substring(0, 2).toUpperCase(),
      color: colorVal,
      x: w * 0.3 + Math.random() * w * 0.4,
      y: h * 0.3 + Math.random() * h * 0.4,
    }]);
  };

  const removeToken = (tokenId) => {
    setTokens(prev => prev.filter(t => t.id !== tokenId));
  };

  const handleTokenDragStart = (e, tokenId) => {
    if (!isMaster || tool !== 'select') return;
    e.preventDefault();
    draggedToken.current = tokenId;
    const img = canvasRef.current?.parentElement?.querySelector('img');
    const rect = img?.parentElement?.getBoundingClientRect();
    const scaleX = (img?.naturalWidth || 800) / (rect?.width || 800);
    const scaleY = (img?.naturalHeight || 600) / (rect?.height || 600);
    const token = tokens.find(t => t.id === tokenId);
    if (token) {
      dragOffset.current = {
        x: e.clientX * scaleX - token.x,
        y: e.clientY * scaleY - token.y,
      };
    }
  };

  const handleTokenDragMove = (e) => {
    if (!draggedToken.current || !isMaster) return;
    const img = canvasRef.current?.parentElement?.querySelector('img');
    const rect = img?.parentElement?.getBoundingClientRect();
    const scaleX = (img?.naturalWidth || 800) / (rect?.width || 800);
    const scaleY = (img?.naturalHeight || 600) / (rect?.height || 600);
    const x = e.clientX * scaleX - dragOffset.current.x;
    const y = e.clientY * scaleY - dragOffset.current.y;
    setTokens(prev => prev.map(t => t.id === draggedToken.current ? { ...t, x, y } : t));
  };

  const handleTokenDragEnd = () => {
    if (draggedToken.current && socketRef?.current) {
      const token = tokens.find(t => t.id === draggedToken.current);
      if (token) {
        socketRef.current.emit('scene_token_move', {
          campaignId, sceneType, tokenId: token.id, tokens: tokens.map(t => t.id === token.id ? token : t)
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
      <div className="flex items-center gap-2 p-2 bg-wasteland-800 border-b border-wasteland-600 flex-wrap">
        <select value={sceneType} onChange={e => { setSceneType(e.target.value); }} className="bg-wasteland-700 text-wasteland-100 text-sm rounded p-1 border border-wasteland-600">
          <option value="local">Локальная сцена</option>
          <option value="global">Глобальная карта</option>
        </select>
        {isMaster && (
          <>
            <button onClick={() => setShowBgLibrary(!showBgLibrary)} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">🖼️ Фон</button>
            <select value={tool} onChange={e => setTool(e.target.value)} className="bg-wasteland-700 text-wasteland-100 text-sm rounded p-1 border border-wasteland-600">
              <option value="select">Выбор</option>
              <option value="pencil">Карандаш</option>
              <option value="line">Линейка</option>
              <option value="eraser">Ластик</option>
              <option value="note">Заметка</option>
            </select>
            {(tool === 'pencil' || tool === 'line') && (
              <>
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
                <input type="range" min="1" max="10" value={lineWidth} onChange={e => setLineWidth(parseInt(e.target.value))} className="w-16" />
              </>
            )}
            {tool === 'eraser' && (
              <input type="range" min="10" max="100" value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value))} className="w-24" />
            )}
            <button onClick={saveScene} className="text-xs bg-accent-orange hover:bg-orange-500 text-wasteland-900 px-2 py-1 rounded font-bold">Сохранить</button>
          </>
        )}
        {error && <span className="text-accent-red text-xs">{error}</span>}
      </div>

      {/* Библиотека фонов */}
      {showBgLibrary && isMaster && (
        <div className="bg-wasteland-800 p-2 border-b border-wasteland-600">
          <div className="flex gap-2 mb-2">
            <input placeholder="Название" value={bgNameInput} onChange={e => setBgNameInput(e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-sm" />
            <input placeholder="URL картинки" value={bgUrlInput} onChange={e => setBgUrlInput(e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-sm" />
            <button onClick={async () => {
              if (bgNameInput && bgUrlInput) {
                await api.uploadBackground(campaignId, bgNameInput, bgUrlInput);
                setBgNameInput(''); setBgUrlInput('');
                loadBackgrounds();
              }
            }} className="bg-accent-orange text-wasteland-900 px-2 py-1 rounded text-xs font-bold">OK</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {backgrounds.map(bg => (
              <div key={bg.id} onClick={() => { setSelectedBg(bg); setFogDataUrl(null); }} className={`cursor-pointer p-1 border rounded ${selectedBg?.url === bg.url ? 'border-accent-orange' : 'border-wasteland-600'}`}>
                <img src={bg.url} alt={bg.name} className="h-12 w-20 object-cover rounded" />
                <p className="text-wasteland-400 text-xs text-center">{bg.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Холст сцены */}
      <div
        className="flex-1 relative overflow-auto bg-wasteland-800"
        style={{ minHeight: '400px' }}
        onMouseMove={(e) => { handleMouseMove(e); handleTokenDragMove(e); }}
        onMouseUp={(e) => { handleMouseUp(e); handleTokenDragEnd(); }}
        onMouseLeave={(e) => { handleMouseUp(e); handleTokenDragEnd(); }}
      >
        {selectedBg ? (
          <div className="relative inline-block min-w-full min-h-full">
            <img src={selectedBg.url} alt="Фон" className="block max-w-none" draggable={false} />
            <canvas ref={canvasRef} className="absolute top-0 left-0" style={{ pointerEvents: ['pencil','line','note'].includes(tool) ? 'auto' : 'none' }} onMouseDown={handleMouseDown} />
            <canvas ref={fogCanvasRef} className="absolute top-0 left-0" style={{ pointerEvents: tool === 'eraser' ? 'auto' : 'none' }} onMouseDown={handleMouseDown} />
            {tokens.map(token => (
              <div
                key={token.id}
                onMouseDown={(e) => handleTokenDragStart(e, token.id)}
                style={{
                  position: 'absolute', left: token.x - 20, top: token.y - 20,
                  width: 40, height: 40, borderRadius: '50%',
                  backgroundColor: token.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', color: 'white', fontSize: '14px',
                  border: '2px solid white', cursor: isMaster && tool === 'select' ? 'grab' : 'default',
                  zIndex: 30, userSelect: 'none', boxShadow: '0 0 4px rgba(0,0,0,0.5)',
                }}
              >
                {token.label}
                {isMaster && tool === 'select' && (
                  <button
                    onClick={(ev) => { ev.stopPropagation(); removeToken(token.id); }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-accent-red rounded-full text-white text-xs flex items-center justify-center"
                  >×</button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-wasteland-500">Выберите фон для сцены</div>
        )}
      </div>

      {/* Токены */}
      {isMaster && (
        <div className="bg-wasteland-800 p-2 border-t border-wasteland-600 flex gap-2 overflow-x-auto">
          <span className="text-wasteland-400 text-xs self-center">Токены:</span>
          {availableTokens.map(t => (
            <button key={`${t.type}_${t.id}`} onClick={() => addToken(t.type, t.id, t.name, t.color)} className="flex items-center gap-1 bg-wasteland-700 hover:bg-wasteland-600 rounded px-2 py-1 text-xs">
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: t.color }}></span>
              {t.name}
            </button>
          ))}
          <button onClick={() => availableTokens.forEach(t => addToken(t.type, t.id, t.name, t.color))} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded">+ Все</button>
          <button onClick={() => setTokens([])} className="text-xs bg-accent-red/20 hover:bg-accent-red/40 px-2 py-1 rounded text-accent-red">Очистить</button>
        </div>
      )}
    </div>
  );
}