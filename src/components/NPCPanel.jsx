// src/components/ScenePanel.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';

export default function ScenePanel({ campaignId, isMaster, socketRef, npcs, characters }) {
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
  const [showDrawings, setShowDrawings] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [portalEdit, setPortalEdit] = useState(null);

  // Панорама (drag-to-pan)
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panStartOffset = useRef({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const bgImageRef = useRef(null);
  const isDrawing = useRef(false);
  const draggedToken = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const drawingsRef = useRef([]);
  const portalsRef = useRef([]);

  // Загрузка сцены
  const loadScene = useCallback(async () => {
    try {
      const data = await api.getScenes(campaignId, sceneType);
      if (data && data.length > 0) {
        const s = data[0];
        const sceneTokens = s.tokens || [];
        setTokens(sceneTokens);
        drawingsRef.current = s.drawings || [];
        portalsRef.current = s.portals || [];
        if (s.background_url) {
          setSelectedBg({ url: s.background_url, name: '' });
        } else {
          setSelectedBg(null);
        }
        const initialState = { tokens: sceneTokens, drawings: s.drawings || [], portals: s.portals || [] };
        setHistory([initialState]);
        setHistoryIndex(0);
        redrawAll();
      } else {
        setTokens([]);
        drawingsRef.current = [];
        portalsRef.current = [];
        setSelectedBg(null);
        clearCanvas();
        setHistory([{ tokens: [], drawings: [], portals: [] }]);
        setHistoryIndex(0);
      }
      // Сброс панорамы при смене сцены
      setPanX(0);
      setPanY(0);
    } catch (e) { console.error(e); }
  }, [campaignId, sceneType]);

  const loadBackgrounds = async () => {
    try { const bgs = await api.getBackgrounds(campaignId); setBackgrounds(bgs); } catch (e) { console.error(e); }
  };

  useEffect(() => { loadScene(); loadBackgrounds(); }, [sceneType, campaignId]);

  // WebSocket
  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;
    const h1 = (data) => { if (data.campaignId === campaignId && data.sceneType === sceneType) loadScene(); };
    const h2 = (data) => {
      if (data.campaignId === campaignId && data.sceneType === sceneType && data.tokens) setTokens(data.tokens);
    };
    const h3 = (data) => {
      if (data.campaignId === campaignId && data.sceneType === sceneType && data.drawings) {
        drawingsRef.current = data.drawings;
        redrawAll();
      }
    };
    const h4 = (data) => {
      if (data.campaignId === campaignId && data.sceneType === sceneType && data.portals) {
        portalsRef.current = data.portals;
      }
    };
    socket.on('scene_updated', h1);
    socket.on('scene_token_moved', h2);
    socket.on('scene_drawings', h3);
    socket.on('scene_portals', h4);
    return () => {
      socket.off('scene_updated', h1);
      socket.off('scene_token_moved', h2);
      socket.off('scene_drawings', h3);
      socket.off('scene_portals', h4);
    };
  }, [campaignId, sceneType, socketRef]);

  // История
  const pushHistory = (newState) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setTokens(state.tokens);
      drawingsRef.current = state.drawings;
      portalsRef.current = state.portals;
      redrawAll();
      syncAll();
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setTokens(state.tokens);
      drawingsRef.current = state.drawings;
      portalsRef.current = state.portals;
      redrawAll();
      syncAll();
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (!isMaster) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isMaster, historyIndex, history]);

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const redrawAll = () => {
    if (!canvasRef.current || !bgImageRef.current) return;
    const canvas = canvasRef.current;
    const img = bgImageRef.current;
    canvas.width = img.naturalWidth || img.width || 800;
    canvas.height = img.naturalHeight || img.height || 600;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (showDrawings) {
      for (const d of drawingsRef.current) drawShape(ctx, d);
    }
  };

  const drawShape = (ctx, d) => {
    if (d.tool === 'pencil' && d.points?.length > 0) {
      ctx.strokeStyle = d.color || '#ff0000';
      ctx.lineWidth = d.lineWidth || 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.moveTo(d.points[0].x, d.points[0].y);
      for (let i = 1; i < d.points.length; i++) ctx.lineTo(d.points[i].x, d.points[i].y);
      ctx.stroke();
    }
  };

  // Автосохранение через WebSocket
  const autoSaveScene = () => {
    if (socketRef?.current) {
      socketRef.current.emit('scene_update', { campaignId, sceneType, updates: {} });
    }
  };

  const syncAll = () => {
    if (socketRef?.current) {
      socketRef.current.emit('scene_token_move', { campaignId, sceneType, tokens });
      socketRef.current.emit('scene_drawings', { campaignId, sceneType, drawings: drawingsRef.current });
      socketRef.current.emit('scene_portals', { campaignId, sceneType, portals: portalsRef.current });
    }
    autoSaveScene();
  };

  const syncTokens = (newTokens) => {
    setTokens(newTokens);
    const newState = { tokens: newTokens, drawings: drawingsRef.current, portals: portalsRef.current };
    pushHistory(newState);
    if (socketRef?.current) {
      socketRef.current.emit('scene_token_move', { campaignId, sceneType, tokens: newTokens });
      socketRef.current.emit('scene_update', { campaignId, sceneType, updates: { tokens: newTokens } });
    }
  };

  const syncDrawings = () => {
    const newState = { tokens, drawings: drawingsRef.current, portals: portalsRef.current };
    pushHistory(newState);
    if (socketRef?.current) {
      socketRef.current.emit('scene_drawings', { campaignId, sceneType, drawings: drawingsRef.current });
      socketRef.current.emit('scene_update', { campaignId, sceneType, updates: { drawings: drawingsRef.current } });
    }
  };

  const syncPortals = (newPortals) => {
    portalsRef.current = newPortals;
    const newState = { tokens, drawings: drawingsRef.current, portals: newPortals };
    pushHistory(newState);
    if (socketRef?.current) {
      socketRef.current.emit('scene_portals', { campaignId, sceneType, portals: newPortals });
      socketRef.current.emit('scene_update', { campaignId, sceneType, updates: { portals: newPortals } });
    }
  };

  // Снапшоты
  const takeSnapshot = () => {
    const name = prompt('Название снапшота:');
    if (!name) return;
    const snapshot = {
      id: Date.now().toString(),
      name,
      tokens: JSON.parse(JSON.stringify(tokens)),
      drawings: JSON.parse(JSON.stringify(drawingsRef.current)),
      portals: JSON.parse(JSON.stringify(portalsRef.current)),
    };
    const newSnapshots = [...snapshots, snapshot];
    setSnapshots(newSnapshots);
    localStorage.setItem(`snapshots_${campaignId}_${sceneType}`, JSON.stringify(newSnapshots));
  };

  const loadSnapshot = (snapshot) => {
    if (!confirm(`Загрузить снапшот "${snapshot.name}"? Текущее состояние будет потеряно.`)) return;
    setTokens(snapshot.tokens);
    drawingsRef.current = snapshot.drawings;
    portalsRef.current = snapshot.portals;
    redrawAll();
    const newState = { tokens: snapshot.tokens, drawings: snapshot.drawings, portals: snapshot.portals };
    pushHistory(newState);
    syncAll();
  };

  const deleteSnapshot = (id) => {
    const newSnapshots = snapshots.filter(s => s.id !== id);
    setSnapshots(newSnapshots);
    localStorage.setItem(`snapshots_${campaignId}_${sceneType}`, JSON.stringify(newSnapshots));
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`snapshots_${campaignId}_${sceneType}`);
      if (saved) setSnapshots(JSON.parse(saved));
    } catch (e) {}
  }, [campaignId, sceneType]);

  useEffect(() => {
    if (!selectedBg?.url) { clearCanvas(); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { bgImageRef.current = img; redrawAll(); };
    img.onerror = () => setError('Не удалось загрузить изображение');
    img.src = selectedBg.url;
  }, [selectedBg]);

  // Зум колёсиком
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.3, Math.min(3, prev + delta)));
  };

  // Пересчёт координат с учётом панорамы и зума
  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    // Положение мыши относительно контейнера
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    // Переводим в координаты холста
    const scaleX = canvas.width / (rect.width / zoom);
    const scaleY = canvas.height / (rect.height / zoom);
    return {
      x: (mouseX - panX) * scaleX / zoom,
      y: (mouseY - panY) * scaleY / zoom
    };
  };

  const getTokenPos = (e) => getCanvasPos(e);

  // Панорамирование
  const startPan = (e) => {
    if (tool !== 'select' || !isMaster) return;
    // Не панорамируем, если клик по токену или порталу
    if (e.target.closest('[data-token]') || e.target.closest('[data-portal]')) return;
    e.preventDefault();
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
    panStartOffset.current = { x: panX, y: panY };
  };

  const movePan = (e) => {
    if (!isPanning.current) return;
    e.preventDefault();
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPanX(panStartOffset.current.x + dx);
    setPanY(panStartOffset.current.y + dy);
  };

  const endPan = () => {
    isPanning.current = false;
  };

  // Рисование
  const currentPath = useRef([]);

  const startDraw = (e) => {
    if (!isMaster || (tool !== 'pencil' && tool !== 'eraser')) return;
    e.preventDefault();
    const pos = getCanvasPos(e);
    isDrawing.current = true;
    currentPath.current = [{ x: pos.x, y: pos.y }];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = tool === 'eraser' ? '#000000' : color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 4 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const moveDraw = (e) => {
    if (!isMaster || !isDrawing.current || (tool !== 'pencil' && tool !== 'eraser')) return;
    e.preventDefault();
    const pos = getCanvasPos(e);
    currentPath.current.push({ x: pos.x, y: pos.y });
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!isMaster || !isDrawing.current) return;
    isDrawing.current = false;
    if (currentPath.current.length > 0 && tool === 'pencil') {
      drawingsRef.current = [...drawingsRef.current, { tool: 'pencil', color, lineWidth, points: currentPath.current }];
      syncDrawings();
    }
    if (tool === 'eraser' && currentPath.current.length > 0) {
      const eraserPath = currentPath.current;
      drawingsRef.current = drawingsRef.current.filter(d => {
        if (d.tool !== 'pencil' || !d.points?.length) return true;
        for (const dp of d.points) {
          for (const ep of eraserPath) {
            if (Math.sqrt((dp.x - ep.x) ** 2 + (dp.y - ep.y) ** 2) < (lineWidth * 4 + (d.lineWidth || 3))) return false;
          }
        }
        return true;
      });
      redrawAll();
      syncDrawings();
    }
    currentPath.current = [];
    if (canvasRef.current) canvasRef.current.getContext('2d').globalCompositeOperation = 'source-over';
  };

  // Порталы
  const addPortal = (e) => {
    if (!isMaster || tool !== 'portal') return;
    e.preventDefault();
    const pos = getTokenPos(e);
    const portalName = prompt('Имя/ID портала:', 'Портал');
    if (!portalName) return;
    const targetScene = prompt('Тип сцены для перехода (local/global):', sceneType === 'local' ? 'global' : 'local');
    if (!targetScene || !['local', 'global'].includes(targetScene)) return;
    const linkName = prompt('Имя связанного портала (на целевой сцене):', portalName);
    if (!linkName) return;
    const newPortal = { id: `portal_${Date.now()}`, name: portalName, targetScene, linkName, x: pos.x, y: pos.y, visible: true };
    const newPortals = [...portalsRef.current, newPortal];
    syncPortals(newPortals);
  };

  const updatePortal = (portalId, updates) => {
    const newPortals = portalsRef.current.map(p => p.id === portalId ? { ...p, ...updates } : p);
    syncPortals(newPortals);
    setPortalEdit(null);
  };

  const removePortal = (portalId) => {
    const newPortals = portalsRef.current.filter(p => p.id !== portalId);
    syncPortals(newPortals);
    setPortalEdit(null);
  };

  const handlePortalClick = (portal) => {
    if (!portal.targetScene || portal.targetScene === sceneType) return;
    setSceneType(portal.targetScene);
  };

  // Заметки
  const addNoteToken = (e) => {
    if (!isMaster || tool !== 'note') return;
    e.preventDefault();
    const pos = getTokenPos(e);
    const text = prompt('Текст заметки:');
    if (text) {
      const newToken = { id: `note_${Date.now()}`, type: 'note', label: '📝', color: '#ffcc00', x: pos.x, y: pos.y, note: text, hidden: false };
      syncTokens([...tokens, newToken]);
    }
  };

  // Токены
  const addToken = (type, refId, name, colorVal) => {
    if (!isMaster) return;
    const canvas = canvasRef.current;
    const w = canvas?.width || 800;
    const h = canvas?.height || 600;
    const newToken = { id: `${type}_${refId}_${Date.now()}`, type, ref_id: refId, label: (name || '?').substring(0, 2).toUpperCase(), color: colorVal, x: w * 0.3 + Math.random() * w * 0.4, y: h * 0.3 + Math.random() * h * 0.4, note: null, hidden: false };
    syncTokens([...tokens, newToken]);
  };

  const toggleTokenVisibility = (tokenId) => {
    const newTokens = tokens.map(t => t.id === tokenId ? { ...t, hidden: !t.hidden } : t);
    syncTokens(newTokens);
  };

  const removeToken = (tokenId) => {
    syncTokens(tokens.filter(t => t.id !== tokenId));
  };

  // Контекстное меню
  const handleTokenContext = (e, token) => {
    if (!isMaster) return;
    e.preventDefault();
    setContextMenu({ type: 'token', token, x: e.clientX, y: e.clientY });
  };

  const handlePortalContext = (e, portal) => {
    if (!isMaster) return;
    e.preventDefault();
    setContextMenu({ type: 'portal', portal, x: e.clientX, y: e.clientY });
  };

  const handleRollFromToken = async (token, skillName, modifier) => {
    try {
      const d20 = Math.floor(Math.random() * 20) + 1;
      const sum = d20 + modifier;
      if (socketRef?.current) {
        socketRef.current.emit('dice_roll', {
          campaignId,
          userId: 'master',
          username: `${token.label} (${token.type === 'npc' ? 'NPC' : 'Игрок'})`,
          skillName,
          formula: `d20 (${d20}) + ${modifier}`,
          sum,
          hidden: false,
        });
      }
    } catch (e) { console.error(e); }
    setContextMenu(null);
  };

  const getTokenSkills = (token) => {
    if (token.type === 'npc') {
      const npc = npcs?.find(n => n.id === token.ref_id);
      return (npc?.skills || []).map(s => ({ name: s.name, modifier: s.modifier || 0 }));
    }
    if (token.type === 'character') {
      const char = characters?.find(c => c.id === token.ref_id);
      return (char?.skills || []).map(s => ({ name: s.name, modifier: s.totalModifier || s.modifier || 0 }));
    }
    return [];
  };

  const startTokenDrag = (e, tokenId) => {
    if (!isMaster || tool !== 'select') return;
    if (e.button === 2) return;
    e.preventDefault();
    e.stopPropagation();
    draggedToken.current = tokenId;
    const pos = getTokenPos(e);
    const token = tokens.find(t => t.id === tokenId);
    if (token) dragOffset.current = { x: pos.x - token.x, y: pos.y - token.y };
  };

  const moveTokenDrag = (e) => {
    if (!draggedToken.current || !isMaster) return;
    e.preventDefault();
    const pos = getTokenPos(e);
    setTokens(prev => prev.map(t => t.id === draggedToken.current ? { ...t, x: pos.x - dragOffset.current.x, y: pos.y - dragOffset.current.y } : t));
  };

  const endTokenDrag = () => {
    if (draggedToken.current) {
      const newState = { tokens, drawings: drawingsRef.current, portals: portalsRef.current };
      pushHistory(newState);
      if (socketRef?.current) {
        socketRef.current.emit('scene_token_move', { campaignId, sceneType, tokens });
        socketRef.current.emit('scene_update', { campaignId, sceneType, updates: { tokens } });
      }
    }
    draggedToken.current = null;
  };

  const availableTokens = [
    ...(characters || []).map(c => ({ type: 'character', id: c.id, name: c.name, color: '#33cc33' })),
    ...(npcs || []).filter(n => n.visibility === 'combat').map(n => ({ type: 'npc', id: n.id, name: n.name, color: '#cc3333' })),
  ];

  // Стили с учётом зума и панорамы
  const getScaledStyle = (x, y, size, extra = {}) => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return { display: 'none' };
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width / zoom);
    const scaleY = canvas.height / (rect.height / zoom);
    const scaledSize = size / zoom;
    return {
      position: 'absolute',
      left: (x / scaleX * zoom) + panX - scaledSize / 2,
      top: (y / scaleY * zoom) + panY - scaledSize / 2,
      width: scaledSize,
      height: scaledSize,
      ...extra
    };
  };

  const getTokenStyle = (token) => {
    return getScaledStyle(token.x, token.y, tokenSize, {
      borderRadius: token.type === 'note' ? '30%' : '50%',
      backgroundColor: token.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 'bold', color: token.type === 'note' ? '#000' : 'white',
      fontSize: Math.max(8, (tokenSize / zoom) * 0.35),
      border: `2px solid ${token.hidden ? '#ff0000' : 'white'}`,
      opacity: token.hidden ? 0.4 : 1,
      cursor: isMaster && tool === 'select' ? 'grab' : 'pointer',
      zIndex: 30, userSelect: 'none', boxShadow: '0 0 4px rgba(0,0,0,0.5)', touchAction: 'none',
    });
  };

  const getPortalStyle = (portal) => {
    const size = 34;
    return getScaledStyle(portal.x, portal.y, size, {
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(100,100,255,0.8), rgba(50,50,150,0.4))',
      border: '2px dashed #6666ff',
      display: (portal.visible || isMaster) ? 'flex' : 'none',
      alignItems: 'center', justifyContent: 'center',
      color: 'white', fontSize: Math.max(6, (size / zoom) * 0.25),
      cursor: 'pointer', zIndex: 25, userSelect: 'none',
      opacity: portal.visible ? 0.8 : 0.3,
      textAlign: 'center', overflow: 'hidden', wordBreak: 'break-all', lineHeight: 1.1,
    });
  };

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
              <option value="portal">🌀</option>
            </select>
            {(tool === 'pencil' || tool === 'eraser') && (
              <>
                {tool === 'pencil' && <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-5 h-5 rounded cursor-pointer" />}
                <input type="range" min="1" max="10" value={lineWidth} onChange={e => setLineWidth(parseInt(e.target.value))} className="w-12" />
              </>
            )}
            <button onClick={() => setShowDrawings(!showDrawings)} className={`text-xs px-2 py-1 rounded ${showDrawings ? 'bg-wasteland-600 text-wasteland-300' : 'bg-wasteland-800 text-wasteland-500'}`}>
              {showDrawings ? '📐' : '📐‍🗑️'}
            </button>
            <button onClick={undo} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-1.5 py-0.5 rounded text-wasteland-300">↩</button>
            <button onClick={redo} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-1.5 py-0.5 rounded text-wasteland-300">↪</button>
            <button onClick={takeSnapshot} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-1.5 py-0.5 rounded text-wasteland-300">📸</button>
            <button onClick={() => setShowSnapshots(!showSnapshots)} className={`text-xs px-1.5 py-0.5 rounded ${showSnapshots ? 'bg-accent-orange text-wasteland-900' : 'bg-wasteland-700 text-wasteland-300'}`}>
              📋{snapshots.length > 0 ? `(${snapshots.length})` : ''}
            </button>
            <span className="text-wasteland-500 text-xs">Размер:</span>
            <input type="range" min="16" max="72" value={tokenSize} onChange={e => setTokenSize(parseInt(e.target.value))} className="w-16" />
          </>
        )}
        <span className="text-wasteland-500 text-xs">Зум:</span>
        <input type="range" min="30" max="300" value={Math.round(zoom * 100)} onChange={e => setZoom(parseInt(e.target.value) / 100)} className="w-16" />
        <span className="text-wasteland-400 text-xs">{Math.round(zoom * 100)}%</span>
        <span className="text-wasteland-500 text-xs">☀️</span>
        <input type="range" min="20" max="150" value={brightness} onChange={e => setBrightness(parseInt(e.target.value))} className="w-16" />
        {error && <span className="text-accent-red text-xs ml-1">{error}</span>}
      </div>

      {/* Снапшоты */}
      {showSnapshots && (
        <div className="bg-wasteland-800 p-2 border-b border-wasteland-600 max-h-32 overflow-y-auto">
          <h4 className="text-wasteland-400 text-xs uppercase mb-1">Снапшоты</h4>
          {snapshots.length === 0 && <p className="text-wasteland-500 text-xs">Нет снапшотов</p>}
          {snapshots.map(s => (
            <div key={s.id} className="flex justify-between items-center bg-wasteland-700 p-1 rounded mb-1 text-xs">
              <span className="text-wasteland-300">{s.name}</span>
              <div className="flex gap-1">
                <button onClick={() => loadSnapshot(s)} className="text-accent-green hover:text-green-400">📥</button>
                <button onClick={() => deleteSnapshot(s.id)} className="text-accent-red hover:text-red-400">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Библиотека фонов */}
      {showBgLibrary && isMaster && (
        <div className="bg-wasteland-800 p-2 border-b border-wasteland-600">
          {/* ... форма загрузки фона без изменений ... */}
        </div>
      )}

      {/* Холст с панорамой — Owlbear-style */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden bg-wasteland-800 relative"
        style={{ touchAction: 'none' }}
        onWheel={handleWheel}
        onMouseDown={(e) => {
          if (e.button === 1 || (e.button === 0 && tool === 'select')) {
            startPan(e);
            return;
          }
          if (tool === 'note') addNoteToken(e);
          else if (tool === 'portal') addPortal(e);
          else if (tool === 'pencil' || tool === 'eraser') startDraw(e);
        }}
        onMouseMove={(e) => {
          if (isPanning.current) { movePan(e); return; }
          moveDraw(e);
          moveTokenDrag(e);
        }}
        onMouseUp={() => { endDraw(); endTokenDrag(); endPan(); }}
        onMouseLeave={() => { endDraw(); endTokenDrag(); endPan(); }}
        onTouchStart={(e) => {
          if (e.touches.length === 2) { startPan(e); return; }
          if (tool === 'note') addNoteToken(e);
          else if (tool === 'portal') addPortal(e);
          else if (tool === 'pencil' || tool === 'eraser') startDraw(e);
        }}
        onTouchMove={(e) => {
          if (isPanning.current) { movePan(e); return; }
          moveDraw(e);
          moveTokenDrag(e);
        }}
        onTouchEnd={() => { endDraw(); endTokenDrag(); endPan(); }}
        onClick={() => { setContextMenu(null); setPortalEdit(null); }}
      >
        <div
          className="absolute top-0 left-0"
          style={{
            transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
            transformOrigin: '0 0',
            filter: `brightness(${brightness}%)`
          }}
        >
          {selectedBg ? (
            <img ref={bgImageRef} src={selectedBg.url} alt="Фон" className="block max-w-none" draggable={false} />
          ) : (
            <div className="flex items-center justify-center h-64 text-wasteland-500 text-sm" style={{ width: '400px' }}>
              Выберите фон
            </div>
          )}
          <canvas ref={canvasRef} className="absolute top-0 left-0" style={{ pointerEvents: ['pencil', 'eraser'].includes(tool) ? 'auto' : 'none' }} />

          {/* Порталы */}
          {portalsRef.current.map(portal => (
            <div key={portal.id} data-portal style={getPortalStyle(portal)}
              onClick={(e) => { e.stopPropagation(); handlePortalClick(portal); }}
              onContextMenu={(e) => handlePortalContext(e, portal)}
              title={`${portal.name} → ${portal.targetScene}:${portal.linkName}`}>
              {portal.name?.substring(0, 4)}
            </div>
          ))}

          {/* Токены */}
          {tokens.filter(t => !t.hidden || isMaster).map(token => (
            <div key={token.id} data-token
              onMouseDown={(e) => startTokenDrag(e, token.id)}
              onTouchStart={(e) => startTokenDrag(e, token.id)}
              onContextMenu={(e) => handleTokenContext(e, token)}
              onClick={(e) => { e.stopPropagation(); if (token.type === 'note' && token.note) setSelectedNote(token); }}
              style={getTokenStyle(token)}>
              {token.label}
              {token.hidden && isMaster && <span className="absolute -top-1 -right-1 text-xs">👁‍🗨</span>}
            </div>
          ))}
        </div>
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
          <button onClick={() => syncTokens([])} className="text-xs bg-accent-red/20 hover:bg-accent-red/40 px-2 py-0.5 rounded text-accent-red flex-shrink-0">✕</button>
        </div>
      )}

      {/* Контекстное меню, редактор порталов, модалка заметок — без изменений */}
      {/* ... */}
    </div>
  );
}
