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
  const [selectedNote, setSelectedNote] = useState(null);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const bgImageRef = useRef(null);
  const isDrawing = useRef(false);
  const draggedToken = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const drawingsRef = useRef([]);

  // Загрузка сцены
  const loadScene = useCallback(async () => {
    try {
      const data = await api.getScenes(campaignId, sceneType);
      if (data && data.length > 0) {
        const s = data[0];
        setTokens(s.tokens || []);
        drawingsRef.current = s.drawings || [];
        if (s.background_url) {
          setSelectedBg({ url: s.background_url, name: '' });
        } else {
          setSelectedBg(null);
        }
        redrawAll();
      } else {
        setTokens([]);
        drawingsRef.current = [];
        setSelectedBg(null);
        clearCanvas();
      }
    } catch (e) { console.error(e); }
  }, [campaignId, sceneType]);

  const loadBackgrounds = async () => {
    try { const bgs = await api.getBackgrounds(campaignId); setBackgrounds(bgs); } catch (e) { console.error(e); }
  };

  useEffect(() => { loadScene(); loadBackgrounds(); }, [sceneType, campaignId]);

  // WebSocket слушатели
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

  // Очистка холста
  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Перерисовка всего
  const redrawAll = () => {
    if (!canvasRef.current || !bgImageRef.current) return;
    const canvas = canvasRef.current;
    const img = bgImageRef.current;
    
    // Устанавливаем размер холста по изображению
    canvas.width = img.naturalWidth || img.width || 800;
    canvas.height = img.naturalHeight || img.height || 600;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем сохранённые рисунки
    for (const d of drawingsRef.current) {
      drawShape(ctx, d);
    }
  };

  // Отрисовка одной фигуры
  const drawShape = (ctx, d) => {
    if (d.tool === 'pencil' && d.points?.length > 0) {
      ctx.strokeStyle = d.color || '#ff0000';
      ctx.lineWidth = d.lineWidth || 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.moveTo(d.points[0].x, d.points[0].y);
      for (let i = 1; i < d.points.length; i++) {
        ctx.lineTo(d.points[i].x, d.points[i].y);
      }
      ctx.stroke();
    }
  };

  // Сохранение сцены
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

  // Загрузка изображения
  useEffect(() => {
    if (!selectedBg?.url) {
      clearCanvas();
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      bgImageRef.current = img;
      redrawAll();
    };
    img.onerror = () => {
      setError('Не удалось загрузить изображение');
    };
    img.src = selectedBg.url;
  }, [selectedBg]);

  // Получение координат относительно холста
  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Масштабирование координат
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Получение координат для токенов (относительно контейнера)
  const getTokenPos = (e) => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Рисование
  const currentPath = useRef([]);

  const startDraw = (e) => {
    if (!isMaster) return;
    if (tool !== 'pencil' && tool !== 'eraser') return;
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
    if (!isMaster || !isDrawing.current) return;
    if (tool !== 'pencil' && tool !== 'eraser') return;
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

    // Сохраняем рисунок (только для карандаша)
    if (currentPath.current.length > 0 && tool === 'pencil') {
      drawingsRef.current = [...drawingsRef.current, {
        tool: 'pencil',
        color,
        lineWidth,
        points: currentPath.current,
      }];
    }
    
    // Для ластика: удаляем задеты рисунки
    if (tool === 'eraser' && currentPath.current.length > 0) {
      const eraserPath = currentPath.current;
      drawingsRef.current = drawingsRef.current.filter(d => {
        if (d.tool !== 'pencil' || !d.points?.length) return true;
        // Проверяем, есть ли пересечение
        for (const dp of d.points) {
          for (const ep of eraserPath) {
            const dx = dp.x - ep.x;
            const dy = dp.y - ep.y;
            if (Math.sqrt(dx * dx + dy * dy) < (lineWidth * 4 + (d.lineWidth || 3))) {
              return false; // Удаляем рисунок
            }
          }
        }
        return true;
      });
      // Перерисовываем
      redrawAll();
    }

    currentPath.current = [];
    // Восстанавливаем композит
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
    const canvas = canvasRef.current;
    const w = canvas?.width || 800;
    const h = canvas?.height || 600;
    setTokens(prev => [...prev, {
      id: `${type}_${refId}_${Date.now()}`,
      type,
      ref_id: refId,
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
      t.id === draggedToken.current ? {
        ...t,
        x: pos.x - dragOffset.current.x,
        y: pos.y - dragOffset.current.y
      } : t
    ));
  };

  const endTokenDrag = () => {
    if (draggedToken.current && socketRef?.current) {
      const token = tokens.find(t => t.id === draggedToken.current);
      if (token) {
        socketRef.current.emit('scene_token_move', {
          campaignId,
          sceneType,
          tokenId: token.id,
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
        onMouseDown={(e) => {
          if (tool === 'note') addNoteToken(e);
          else if (tool === 'pencil' || tool === 'eraser') startDraw(e);
        }}
        onMouseMove={(e) => { moveDraw(e); moveTokenDrag(e); }}
        onMouseUp={() => { endDraw(); endTokenDrag(); }}
        onMouseLeave={() => { endDraw(); endTokenDrag(); }}
        onTouchStart={(e) => {
          if (tool === 'note') addNoteToken(e);
          else if (tool === 'pencil' || tool === 'eraser') startDraw(e);
        }}
        onTouchMove={(e) => { moveDraw(e); moveTokenDrag(e); }}
        onTouchEnd={() => { endDraw(); endTokenDrag(); }}
      >
        <div className="relative inline-block min-w-full min-h-full">
          {selectedBg && (
            <img
              ref={bgImageRef}
              src={selectedBg.url}
              alt="Фон"
              className="block max-w-none"
              draggable={false}
            />
          )}
          {!selectedBg && (
            <div className="flex items-center justify-center h-64 text-wasteland-500 text-sm">Выберите фон</div>
          )}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0"
            style={{ pointerEvents: ['pencil', 'eraser'].includes(tool) ? 'auto' : 'none' }}
          />
          {/* Токены */}
          {tokens.map(token => {
            const canvas = canvasRef.current;
            const scaleX = canvas ? canvas.width / (containerRef.current?.getBoundingClientRect().width || 800) : 1;
            const scaleY = canvas ? canvas.height / (containerRef.current?.getBoundingClientRect().height || 600) : 1;

            return (
              <div
                key={token.id}
                onMouseDown={(e) => startTokenDrag(e, token.id)}
                onTouchStart={(e) => startTokenDrag(e, token.id)}
                onClick={() => { if (token.type === 'note' && token.note) setSelectedNote(token); }}
                style={{
                  position: 'absolute',
                  left: token.x / scaleX - 18,
                  top: token.y / scaleY - 18,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: token.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  color: token.type === 'note' ? '#000' : 'white',
                  fontSize: token.type === 'note' ? '16px' : '12px',
                  border: '2px solid white',
                  cursor: isMaster && tool === 'select' ? 'grab' : 'pointer',
                  zIndex: 30,
                  userSelect: 'none',
                  boxShadow: '0 0 4px rgba(0,0,0,0.5)',
                  touchAction: 'none',
                }}
              >
                {token.label}
              </div>
            );
          })}
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
