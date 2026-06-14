// src/components/ScenePanel.jsx (ПОЛНАЯ ПЕРЕРАБОТКА)
import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';
import useConfirm from '../hooks/useConfirm';
import usePrompt from '../hooks/usePrompt';

export default function ScenePanel({ campaignId, isMaster, socketRef, npcs, characters }) {
  // ===== СОСТОЯНИЯ =====
  const [sceneType, setSceneType] = useState('local');
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
  const [tokenSize, setTokenSize] = useState(36);
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [selectedNote, setSelectedNote] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [portalEdit, setPortalEdit] = useState(null);
  const [otherScenes, setOtherScenes] = useState([]); // порталы на других сценах

  // Панорама
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const bgImageRef = useRef(null);
  const canvasRef = useRef(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const isDrawing = useRef(false);
  const draggedToken = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const drawingsRef = useRef([]);
  const portalsRef = useRef([]);
  const currentPath = useRef([]);

  const { confirm, ConfirmModal } = useConfirm();
  const { prompt, PromptModal } = usePrompt();

  // ===== ЗАГРУЗКА =====
  const loadScene = useCallback(async () => {
    try {
      const data = await api.getScenes(campaignId, sceneType);
      if (data?.length > 0) {
        const s = data[0];
        setTokens(s.tokens || []);
        drawingsRef.current = s.drawings || [];
        portalsRef.current = s.portals || [];
        setSelectedBg(s.background_url ? { url: s.background_url, name: '' } : null);
      } else {
        setTokens([]);
        drawingsRef.current = [];
        portalsRef.current = [];
        setSelectedBg(null);
      }
      setPan({ x: 0, y: 0 });
      setZoom(1);
    } catch (e) { console.error(e); }
  }, [campaignId, sceneType]);

  const loadBackgrounds = async () => {
    try { const bgs = await api.getBackgrounds(campaignId); setBackgrounds(bgs); } catch {}
  };

  const loadOtherScenes = async () => {
    try {
      const otherType = sceneType === 'local' ? 'global' : 'local';
      const data = await api.getScenes(campaignId, otherType);
      if (data?.length > 0) {
        setOtherScenes(data[0].portals || []);
      } else {
        setOtherScenes([]);
      }
    } catch {}
  };

  useEffect(() => { loadScene(); loadBackgrounds(); loadOtherScenes(); }, [sceneType, campaignId]);

  // ===== WEBSOCKET =====
  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;
    const handlers = {
      scene_updated: (d) => { if (d.campaignId === campaignId && d.sceneType === sceneType) loadScene(); },
      scene_token_moved: (d) => { if (d.campaignId === campaignId && d.sceneType === sceneType) setTokens(d.tokens); },
      scene_drawings: (d) => { if (d.campaignId === campaignId && d.sceneType === sceneType) { drawingsRef.current = d.drawings; redrawCanvas(); } },
      scene_portals: (d) => { if (d.campaignId === campaignId && d.sceneType === sceneType) { portalsRef.current = d.portals; } },
    };
    Object.entries(handlers).forEach(([e, h]) => socket.on(e, h));
    return () => Object.entries(handlers).forEach(([e, h]) => socket.off(e, h));
  }, [campaignId, sceneType, socketRef]);

  // ===== СИНХРОНИЗАЦИЯ =====
  const syncAll = () => {
    if (!socketRef?.current) return;
    socketRef.current.emit('scene_token_move', { campaignId, sceneType, tokens });
    socketRef.current.emit('scene_drawings', { campaignId, sceneType, drawings: drawingsRef.current });
    socketRef.current.emit('scene_portals', { campaignId, sceneType, portals: portalsRef.current });
  };

  // ===== ХОЛСТ =====
  const getCanvasCoords = (clientX, clientY) => {
    const container = containerRef.current;
    const img = bgImageRef.current;
    if (!container || !img) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom
    };
  };

  const fitToScreen = () => {
    const container = containerRef.current;
    const img = bgImageRef.current;
    if (!container || !img) return;
    const fitZoom = Math.min(container.clientWidth / img.naturalWidth, container.clientHeight / img.naturalHeight, 1.5);
    setZoom(fitZoom);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (selectedBg?.url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { bgImageRef.current = img; redrawCanvas(); fitToScreen(); };
      img.onerror = () => setError('Не удалось загрузить изображение');
      img.src = selectedBg.url;
    } else {
      bgImageRef.current = null;
      clearCanvas();
    }
  }, [selectedBg]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const img = bgImageRef.current;
    if (!canvas || !img) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const d of drawingsRef.current) {
      if (d.tool === 'pencil' && d.points?.length > 1) {
        ctx.strokeStyle = d.color;
        ctx.lineWidth = d.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(d.points[0].x, d.points[0].y);
        for (let i = 1; i < d.points.length; i++) ctx.lineTo(d.points[i].x, d.points[i].y);
        ctx.stroke();
      }
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // ===== ПАНОРАМА =====
  const startPan = (e) => {
    if (tool !== 'select') return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };

  const movePan = (e) => {
    if (!isPanning.current) return;
    setPan({
      x: panStart.current.px + (e.clientX - panStart.current.x),
      y: panStart.current.py + (e.clientY - panStart.current.y)
    });
  };

  const endPan = () => { isPanning.current = false; };

  // ===== РИСОВАНИЕ =====
  const startDraw = (e) => {
    if (!isMaster || tool !== 'pencil') return;
    e.preventDefault();
    e.stopPropagation();
    const pos = getCanvasCoords(e.clientX, e.clientY);
    isDrawing.current = true;
    currentPath.current = [{ x: pos.x, y: pos.y }];
  };

  const moveDraw = (e) => {
    if (!isMaster || !isDrawing.current || tool !== 'pencil') return;
    e.preventDefault();
    const pos = getCanvasCoords(e.clientX, e.clientY);
    currentPath.current.push({ x: pos.x, y: pos.y });
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(currentPath.current[0].x, currentPath.current[0].y);
    for (let i = 1; i < currentPath.current.length; i++) ctx.lineTo(currentPath.current[i].x, currentPath.current[i].y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!isMaster || !isDrawing.current) return;
    isDrawing.current = false;
    if (currentPath.current.length > 1) {
      drawingsRef.current = [...drawingsRef.current, { tool: 'pencil', color, lineWidth, points: [...currentPath.current] }];
      syncAll();
    }
    currentPath.current = [];
  };

  // Ластик
  const eraseAt = (e) => {
    if (!isMaster || tool !== 'eraser') return;
    e.preventDefault();
    e.stopPropagation();
    const pos = getCanvasCoords(e.clientX, e.clientY);
    const radius = lineWidth * 6;
    const before = drawingsRef.current.length;
    drawingsRef.current = drawingsRef.current.filter(d => {
      if (d.tool !== 'pencil') return true;
      return !d.points?.some(p => Math.sqrt((p.x - pos.x) ** 2 + (p.y - pos.y) ** 2) < radius);
    });
    if (drawingsRef.current.length !== before) {
      redrawCanvas();
      syncAll();
    }
  };

  // ===== ТОКЕНЫ =====
  const addToken = (type, refId, name, colorVal) => {
    if (!isMaster) return;
    const newToken = {
      id: `${type}_${refId}_${Date.now()}`,
      type, ref_id: refId,
      label: (name || '?').substring(0, 2).toUpperCase(),
      color: colorVal,
      x: bgImageRef.current ? bgImageRef.current.naturalWidth * 0.5 : 400,
      y: bgImageRef.current ? bgImageRef.current.naturalHeight * 0.5 : 300,
      note: null, hidden: false
    };
    const newTokens = [...tokens, newToken];
    setTokens(newTokens);
    socketRef?.current?.emit('scene_token_move', { campaignId, sceneType, tokens: newTokens });
  };

  const startTokenDrag = (e, tokenId) => {
    if (!isMaster || tool !== 'select') return;
    e.preventDefault();
    e.stopPropagation();
    draggedToken.current = tokenId;
    const pos = getCanvasCoords(e.clientX, e.clientY);
    const token = tokens.find(t => t.id === tokenId);
    if (token) dragOffset.current = { x: pos.x - token.x, y: pos.y - token.y };
  };

  const moveTokenDrag = (e) => {
    if (!draggedToken.current || !isMaster) return;
    e.preventDefault();
    const pos = getCanvasCoords(e.clientX, e.clientY);
    setTokens(prev => prev.map(t => t.id === draggedToken.current
      ? { ...t, x: pos.x - dragOffset.current.x, y: pos.y - dragOffset.current.y }
      : t
    ));
  };

  const endTokenDrag = () => {
    if (draggedToken.current && socketRef?.current) {
      socketRef.current.emit('scene_token_move', { campaignId, sceneType, tokens });
    }
    draggedToken.current = null;
  };

  // ===== ПОРТАЛЫ =====
  const addPortal = () => {
    if (!isMaster) return;
    const newPortal = {
      id: `portal_${Date.now()}`,
      name: 'Портал',
      targetScene: sceneType === 'local' ? 'global' : 'local',
      linkName: '',
      x: bgImageRef.current ? bgImageRef.current.naturalWidth * 0.5 : 400,
      y: bgImageRef.current ? bgImageRef.current.naturalHeight * 0.5 : 300,
      visible: true
    };
    const newPortals = [...portalsRef.current, newPortal];
    portalsRef.current = newPortals;
    socketRef?.current?.emit('scene_portals', { campaignId, sceneType, portals: newPortals });
  };

  const updatePortal = (portalId, updates) => {
    const newPortals = portalsRef.current.map(p => p.id === portalId ? { ...p, ...updates } : p);
    portalsRef.current = newPortals;
    socketRef?.current?.emit('scene_portals', { campaignId, sceneType, portals: newPortals });
    setPortalEdit(null);
    setContextMenu(null);
  };

  const removePortal = (portalId) => {
    const newPortals = portalsRef.current.filter(p => p.id !== portalId);
    portalsRef.current = newPortals;
    socketRef?.current?.emit('scene_portals', { campaignId, sceneType, portals: newPortals });
    setPortalEdit(null);
    setContextMenu(null);
  };

  const handlePortalClick = (portal) => {
    if (!portal.targetScene || portal.targetScene === sceneType) return;
    setSceneType(portal.targetScene);
  };

  // ===== ЗАМЕТКИ =====
  const addNote = () => {
    if (!isMaster) return;
    const text = prompt('Текст заметки:');
    if (!text) return;
    const newToken = {
      id: `note_${Date.now()}`,
      type: 'note', label: '📝', color: '#ffcc00',
      x: bgImageRef.current ? bgImageRef.current.naturalWidth * 0.5 : 400,
      y: bgImageRef.current ? bgImageRef.current.naturalHeight * 0.5 : 300,
      note: text, hidden: false
    };
    const newTokens = [...tokens, newToken];
    setTokens(newTokens);
    socketRef?.current?.emit('scene_token_move', { campaignId, sceneType, tokens: newTokens });
  };

  // ===== СТИЛИ =====
  const getElementStyle = (x, y) => ({
    position: 'absolute',
    left: x,
    top: y,
    transform: 'translate(-50%, -50%)',
  });

  const availableTokens = [
    ...(characters || []).map(c => ({ type: 'character', id: c.id, name: c.name, color: '#33cc33' })),
    ...(npcs || []).filter(n => n.visibility === 'combat').map(n => ({ type: 'npc', id: n.id, name: n.name, color: '#cc3333' })),
  ];

  // ===== РЕНДЕР =====
  return (
    <div className="flex flex-col h-full bg-wasteland-900">
      {/* ТУЛБАР — компактный */}
      <div className="flex items-center gap-1 p-1.5 bg-wasteland-800 border-b border-wasteland-600 flex-wrap">
        <select value={sceneType} onChange={e => setSceneType(e.target.value)} className="bg-wasteland-700 text-wasteland-100 text-xs rounded p-1 border border-wasteland-600">
          <option value="local">Локальная</option>
          <option value="global">Глобальная</option>
        </select>
        {isMaster && (
          <>
            <button onClick={() => setShowBgLibrary(!showBgLibrary)} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300" title="Фоны">🖼️</button>
            <select value={tool} onChange={e => setTool(e.target.value)} className="bg-wasteland-700 text-wasteland-100 text-xs rounded p-1 border border-wasteland-600">
              <option value="select">✋</option>
              <option value="pencil">✏️</option>
              <option value="eraser">🧹</option>
            </select>
            {tool === 'pencil' && <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-5 h-5 rounded cursor-pointer" />}
            {(tool === 'pencil' || tool === 'eraser') && <input type="range" min="1" max="10" value={lineWidth} onChange={e => setLineWidth(parseInt(e.target.value))} className="w-12" />}
            <button onClick={addNote} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300" title="Заметка">📝</button>
            <button onClick={addPortal} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300" title="Портал">🌀</button>
            <button onClick={fitToScreen} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300" title="Вписать в экран">🔍</button>
            <span className="text-wasteland-500 text-xs">Размер:</span>
            <input type="range" min="16" max="72" value={tokenSize} onChange={e => setTokenSize(parseInt(e.target.value))} className="w-16" />
          </>
        )}
        <span className="text-wasteland-500 text-xs">☀️</span>
        <input type="range" min="20" max="150" value={brightness} onChange={e => setBrightness(parseInt(e.target.value))} className="w-16" />
        <span className="text-wasteland-400 text-xs">{Math.round(zoom * 100)}%</span>
        {error && <span className="text-accent-red text-xs ml-1">{error}</span>}
      </div>

      {/* БИБЛИОТЕКА ФОНОВ */}
      {showBgLibrary && isMaster && (
        <div className="bg-wasteland-800 p-2 border-b border-wasteland-600">
          <div className="flex flex-col sm:flex-row gap-1 mb-2">
            <input placeholder="Название" value={bgNameInput} onChange={e => setBgNameInput(e.target.value)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs flex-1" />
            <label className="bg-accent-orange hover:bg-orange-500 text-wasteland-900 text-xs font-bold px-3 py-1.5 rounded cursor-pointer text-center">
              📁 Файл
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const name = bgNameInput || file.name;
                setBgNameInput(name);
                const reader = new FileReader();
                reader.onload = async () => {
                  try {
                    const base64 = reader.result.split(',')[1];
                    await api.uploadFile(base64, name, campaignId);
                    setBgNameInput('');
                    loadBackgrounds();
                  } catch (err) { setError('Ошибка загрузки: ' + err.message); }
                };
                reader.readAsDataURL(file);
              }} />
            </label>
            <input placeholder="URL" value={bgUrlInput} onChange={e => setBgUrlInput(e.target.value)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs flex-1" />
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

      {/* ХОЛСТ */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden bg-wasteland-700 relative"
        style={{ touchAction: 'none' }}
        onWheel={(e) => {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -0.1 : 0.1;
          setZoom(prev => Math.max(0.2, Math.min(3, prev + delta)));
        }}
        onMouseDown={(e) => {
          if (tool === 'select') startPan(e);
          else if (tool === 'pencil') startDraw(e);
          else if (tool === 'eraser') eraseAt(e);
        }}
        onMouseMove={(e) => {
          if (isPanning.current) movePan(e);
          else if (isDrawing.current) moveDraw(e);
          else if (draggedToken.current) moveTokenDrag(e);
        }}
        onMouseUp={() => { endPan(); endDraw(); endTokenDrag(); }}
        onMouseLeave={() => { endPan(); endDraw(); endTokenDrag(); }}
        onContextMenu={e => e.preventDefault()}
        onClick={() => { setContextMenu(null); setPortalEdit(null); }}
      >
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', filter: `brightness(${brightness}%)` }}>
          {selectedBg ? (
            <img ref={bgImageRef} src={selectedBg.url} alt="Фон" className="block max-w-none" draggable={false} />
          ) : (
            <div className="flex items-center justify-center text-wasteland-500 text-sm" style={{ width: 400, height: 256 }}>Выберите фон</div>
          )}
          <canvas ref={canvasRef} className="absolute top-0 left-0" style={{ pointerEvents: tool === 'pencil' ? 'auto' : 'none' }} />

          {/* ПОРТАЛЫ */}
          {portalsRef.current.map(portal => (
            <div
              key={portal.id}
              onClick={(e) => { e.stopPropagation(); handlePortalClick(portal); }}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ type: 'portal', portal, x: e.clientX, y: e.clientY }); }}
              style={{
                ...getElementStyle(portal.x, portal.y),
                width: 34, height: 34,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(100,100,255,0.8), rgba(50,50,150,0.4))',
                border: '2px dashed #6666ff',
                display: (portal.visible || isMaster) ? 'flex' : 'none',
                alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 10, cursor: 'pointer', zIndex: 25,
                opacity: portal.visible ? 0.9 : 0.3,
              }}
              title={portal.name ? `${portal.name} → ${portal.targetScene}` : `→ ${portal.targetScene}`}
            >
              {portal.name?.substring(0, 4) || '🌀'}
            </div>
          ))}

          {/* ТОКЕНЫ */}
          {tokens.filter(t => !t.hidden || isMaster).map(token => (
            <div
              key={token.id}
              onMouseDown={(e) => startTokenDrag(e, token.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isMaster && token.type !== 'note') {
                  setContextMenu({ type: 'token', token, x: e.clientX, y: e.clientY });
                }
              }}
              onClick={(e) => { e.stopPropagation(); if (token.type === 'note') setSelectedNote(token); }}
              style={{
                ...getElementStyle(token.x, token.y),
                width: tokenSize, height: tokenSize,
                borderRadius: token.type === 'note' ? '30%' : '50%',
                backgroundColor: token.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold', color: 'white', fontSize: tokenSize * 0.35,
                border: `2px solid ${token.hidden ? '#ff0000' : 'white'}`,
                opacity: token.hidden ? 0.4 : 1,
                cursor: isMaster && tool === 'select' ? 'grab' : 'pointer',
                zIndex: 30, userSelect: 'none',
                boxShadow: '0 0 4px rgba(0,0,0,0.5)',
              }}
            >
              {token.label}
              {token.hidden && isMaster && <span style={{ position: 'absolute', top: -4, right: -4, fontSize: 10 }}>👁‍🗨</span>}
            </div>
          ))}
        </div>
      </div>

      {/* НИЖНЯЯ ПАНЕЛЬ ТОКЕНОВ */}
      {isMaster && (
        <div className="bg-wasteland-800 p-1.5 border-t border-wasteland-600 flex gap-1 overflow-x-auto">
          {availableTokens.map(t => (
            <button key={`${t.type}_${t.id}`} onClick={() => addToken(t.type, t.id, t.name, t.color)}
              className="flex items-center gap-1 bg-wasteland-700 hover:bg-wasteland-600 rounded px-1.5 py-0.5 text-xs flex-shrink-0">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }}></span>
              {t.name.substring(0, 8)}
            </button>
          ))}
        </div>
      )}

      {/* КОНТЕКСТНОЕ МЕНЮ */}
      {contextMenu && (
        <div
          className="fixed bg-wasteland-800 border border-wasteland-600 rounded shadow-lg z-50 py-1 min-w-[160px]"
          style={{ left: Math.min(contextMenu.x, window.innerWidth - 170), top: Math.min(contextMenu.y, window.innerHeight - 200) }}
          onClick={e => e.stopPropagation()}
        >
          {contextMenu.type === 'token' && (
            <>
              <button onClick={() => {
                const newTokens = tokens.map(t => t.id === contextMenu.token.id ? { ...t, hidden: !t.hidden } : t);
                setTokens(newTokens);
                socketRef?.current?.emit('scene_token_move', { campaignId, sceneType, tokens: newTokens });
                setContextMenu(null);
              }} className="w-full text-left text-xs px-2 py-1 hover:bg-wasteland-700 text-wasteland-300">
                {contextMenu.token.hidden ? '👁 Показать' : '👁‍🗨 Скрыть'}
              </button>
              <button onClick={() => {
                setTokens(tokens.filter(t => t.id !== contextMenu.token.id));
                socketRef?.current?.emit('scene_token_move', { campaignId, sceneType, tokens: tokens.filter(t => t.id !== contextMenu.token.id) });
                setContextMenu(null);
              }} className="w-full text-left text-xs px-2 py-1 hover:bg-wasteland-700 text-accent-red">
                🗑️ Удалить
              </button>
            </>
          )}
          {contextMenu.type === 'portal' && (
            <>
              <div className="text-wasteland-400 text-xs px-2 py-0.5 border-b border-wasteland-600">{contextMenu.portal.name || 'Портал'}</div>
              <button onClick={() => {
                setPortalEdit({ ...contextMenu.portal });
                setContextMenu(null);
              }} className="w-full text-left text-xs px-2 py-1 hover:bg-wasteland-700 text-wasteland-300">
                ✏️ Редактировать
              </button>
              <button onClick={() => updatePortal(contextMenu.portal.id, { visible: !contextMenu.portal.visible })} className="w-full text-left text-xs px-2 py-1 hover:bg-wasteland-700 text-wasteland-300">
                {contextMenu.portal.visible ? '👁‍🗨 Скрыть' : '👁 Показать'}
              </button>
              <button onClick={() => removePortal(contextMenu.portal.id)} className="w-full text-left text-xs px-2 py-1 hover:bg-wasteland-700 text-accent-red">
                🗑️ Удалить
              </button>
            </>
          )}
        </div>
      )}

      {/* РЕДАКТИРОВАНИЕ ПОРТАЛА */}
      {portalEdit && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setPortalEdit(null)}>
          <div className="bg-wasteland-800 border border-wasteland-600 rounded-lg p-4 max-w-xs w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-accent-yellow font-bold mb-3">Портал</h3>
            <div className="space-y-2">
              <input placeholder="Имя" value={portalEdit.name || ''} onChange={e => setPortalEdit({ ...portalEdit, name: e.target.value })} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-sm" />
              <select value={portalEdit.targetScene || ''} onChange={e => setPortalEdit({ ...portalEdit, targetScene: e.target.value })} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-sm">
                <option value="local">Локальная</option>
                <option value="global">Глобальная</option>
              </select>
              <label className="text-wasteland-400 text-xs">Связанный портал (на целевой сцене):</label>
              <select value={portalEdit.linkName || ''} onChange={e => setPortalEdit({ ...portalEdit, linkName: e.target.value })} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-sm">
                <option value="">— Без связи —</option>
                {portalEdit.targetScene !== sceneType && otherScenes.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
              <div className="flex gap-2 pt-2">
                <button onClick={() => updatePortal(portalEdit.id, { name: portalEdit.name, targetScene: portalEdit.targetScene, linkName: portalEdit.linkName })} className="flex-1 bg-accent-orange text-wasteland-900 font-bold py-1.5 rounded text-sm">OK</button>
                <button onClick={() => setPortalEdit(null)} className="bg-wasteland-600 text-wasteland-300 px-3 py-1.5 rounded text-sm">Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА ЗАМЕТКИ */}
      {selectedNote && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedNote(null)}>
          <div className="bg-wasteland-800 border border-wasteland-600 rounded-lg p-4 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-accent-yellow font-bold">Заметка</h3>
              <button onClick={() => setSelectedNote(null)} className="text-wasteland-400 hover:text-wasteland-200">✕</button>
            </div>
            <p className="text-wasteland-200 text-sm whitespace-pre-wrap">{selectedNote.note}</p>
            {isMaster && (
              <button onClick={() => {
                const newTokens = tokens.filter(t => t.id !== selectedNote.id);
                setTokens(newTokens);
                socketRef?.current?.emit('scene_token_move', { campaignId, sceneType, tokens: newTokens });
                setSelectedNote(null);
              }} className="mt-3 text-xs bg-accent-red/20 hover:bg-accent-red/40 text-accent-red px-2 py-1 rounded">Удалить</button>
            )}
          </div>
        </div>
      )}

      {ConfirmModal}
      {PromptModal}
    </div>
  );
}
