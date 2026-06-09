import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';

export default function ScenePanel({ campaignId, isMaster, socketRef, npcs, characters }) {
  const [sceneType, setSceneType] = useState('local'); // local или global
  const [scene, setScene] = useState(null);
  const [backgrounds, setBackgrounds] = useState([]);
  const [showBgLibrary, setShowBgLibrary] = useState(false);
  const [bgUrlInput, setBgUrlInput] = useState('');
  const [bgNameInput, setBgNameInput] = useState('');
  const [selectedBg, setSelectedBg] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [fogDataUrl, setFogDataUrl] = useState(null);
  const [tool, setTool] = useState('select'); // select, pencil, eraser, line, note
  const [color, setColor] = useState('#ff0000');
  const [lineWidth, setLineWidth] = useState(3);

  const canvasRef = useRef(null);
  const fogCanvasRef = useRef(null);
  const isDrawing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const draggedToken = useRef(null);

  // Загрузка сцены и фонов
  const loadScene = useCallback(async () => {
    const data = await api.getScenes(campaignId, sceneType);
    if (data && data.length > 0) {
      const s = data[0];
      setScene(s);
      setTokens(s.tokens || []);
      setDrawings(s.drawings || []);
      if (s.fog_of_war && s.fog_of_war.dataUrl) {
        setFogDataUrl(s.fog_of_war.dataUrl);
      } else {
        setFogDataUrl(null);
      }
      if (s.background_url) setSelectedBg({ url: s.background_url });
    } else {
      setScene(null);
      setTokens([]);
      setDrawings([]);
      setFogDataUrl(null);
      setSelectedBg(null);
    }
  }, [campaignId, sceneType]);

  const loadBackgrounds = async () => {
    const bgs = await api.getBackgrounds(campaignId);
    setBackgrounds(bgs);
  };

  useEffect(() => {
    loadScene();
    loadBackgrounds();
  }, [sceneType]);

  // WebSocket: принимаем изменения сцены
  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;

    socket.on('scene_token_moved', (data) => {
      if (data.campaignId === campaignId && data.sceneType === sceneType) {
        setTokens(prev => prev.map(t => t.id === data.tokenId ? { ...t, x: data.x, y: data.y } : t));
      }
    });

    socket.on('scene_updated', (data) => {
      if (data.campaignId === campaignId && data.sceneType === sceneType) {
        loadScene();
      }
    });

    socket.on('scene_drawn', (data) => {
      if (data.campaignId === campaignId && data.sceneType === sceneType) {
        setDrawings(prev => [...prev, data.drawingData]);
      }
    });

    return () => {
      socket.off('scene_token_moved');
      socket.off('scene_updated');
      socket.off('scene_drawn');
    };
  }, [campaignId, sceneType, socketRef]);

  // Сохранение сцены
  const saveScene = async () => {
    const fogData = fogCanvasRef.current ? fogCanvasRef.current.toDataURL() : null;
    const payload = {
      scene_type: sceneType,
      background_url: selectedBg?.url || null,
      tokens,
      drawings,
      fog_of_war: fogData ? { dataUrl: fogData } : [],
    };
    await api.updateScene(campaignId, payload);
    if (socketRef?.current) {
      socketRef.current.emit('scene_update', { campaignId, sceneType, updates: payload });
    }
  };

  // Добавление токена
  const addToken = (type, refId, name, color) => {
    if (!isMaster) return;
    const newToken = {
      id: `${type}_${refId}_${Date.now()}`,
      type,
      ref_id: refId,
      label: name.substring(0, 2).toUpperCase(),
      color,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      visible: true,
    };
    setTokens(prev => [...prev, newToken]);
  };

  // Удаление токена
  const removeToken = (tokenId) => {
    setTokens(prev => prev.filter(t => t.id !== tokenId));
  };

  // Перемещение токена (мастер)
  const handleTokenDragStart = (e, tokenId) => {
    if (!isMaster || tool !== 'select') return;
    draggedToken.current = tokenId;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    startPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleTokenDragMove = (e) => {
    if (!draggedToken.current || !isMaster) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTokens(prev => prev.map(t => t.id === draggedToken.current ? { ...t, x, y } : t));
  };

  const handleTokenDragEnd = () => {
    if (draggedToken.current && socketRef?.current) {
      const token = tokens.find(t => t.id === draggedToken.current);
      if (token) {
        socketRef.current.emit('scene_token_move', {
          campaignId,
          sceneType,
          tokenId: token.id,
          x: token.x,
          y: token.y,
        });
      }
    }
    draggedToken.current = null;
  };

  // Рисование (карандаш, ластик, линия)
  const handleCanvasMouseDown = (e) => {
    if (!isMaster || tool === 'select') return;
    const canvas = tool === 'eraser' ? fogCanvasRef.current : canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    isDrawing.current = true;
    startPos.current = { x, y };

    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 30;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing.current || !isMaster) return;
    const canvas = tool === 'eraser' ? fogCanvasRef.current : canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    // Сохраняем новое рисование
    if (tool !== 'eraser') {
      const drawingData = { tool, color, lineWidth, points: [] }; // упрощенно, можно хранить dataUrl
      setDrawings(prev => [...prev, drawingData]);
      if (socketRef?.current) {
        socketRef.current.emit('scene_draw', { campaignId, sceneType, drawingData });
      }
    }
  };

  // Добавление заметки
  const addNote = (e) => {
    if (!isMaster || tool !== 'note') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const text = prompt('Текст заметки:');
    if (text) {
      const noteData = { tool: 'note', x, y, text };
      setDrawings(prev => [...prev, noteData]);
      if (socketRef?.current) {
        socketRef.current.emit('scene_draw', { campaignId, sceneType, drawingData: noteData });
      }
    }
  };

  // Инициализация туманного холста при изменении фона
  useEffect(() => {
    if (!fogCanvasRef.current || !selectedBg?.url) return;
    const canvas = fogCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (fogDataUrl) {
        const fogImg = new Image();
        fogImg.onload = () => {
          ctx.drawImage(fogImg, 0, 0);
        };
        fogImg.src = fogDataUrl;
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };
    img.src = selectedBg.url;
  }, [selectedBg, fogDataUrl]);

  // Сбор доступных токенов (персонажи + NPC видимые для боя)
  const availableTokens = [
    ...characters.map(c => ({ type: 'character', id: c.id, name: c.name, color: '#33cc33' })),
    ...npcs.filter(n => n.visibility === 'combat').map(n => ({ type: 'npc', id: n.id, name: n.name, color: '#cc3333' })),
  ];

  return (
    <div className="flex flex-col h-full bg-wasteland-900">
      {/* Панель инструментов */}
      <div className="flex items-center gap-2 p-2 bg-wasteland-800 border-b border-wasteland-600 flex-wrap">
        <select
          value={sceneType}
          onChange={e => setSceneType(e.target.value)}
          className="bg-wasteland-700 text-wasteland-100 text-sm rounded p-1 border border-wasteland-600"
        >
          <option value="local">Локальная сцена</option>
          <option value="global">Глобальная карта</option>
        </select>

        {isMaster && (
          <>
            <button
              onClick={() => setShowBgLibrary(!showBgLibrary)}
              className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300"
            >
              🖼️ Фон
            </button>
            <select
              value={tool}
              onChange={e => setTool(e.target.value)}
              className="bg-wasteland-700 text-wasteland-100 text-sm rounded p-1 border border-wasteland-600"
            >
              <option value="select">Выбор</option>
              <option value="pencil">Карандаш</option>
              <option value="eraser">Ластик (туман)</option>
              <option value="line">Линейка</option>
              <option value="note">Заметка</option>
            </select>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
            <input type="range" min="1" max="10" value={lineWidth} onChange={e => setLineWidth(e.target.value)} className="w-20" />
            <button onClick={saveScene} className="text-xs bg-accent-orange hover:bg-orange-500 text-wasteland-900 px-2 py-1 rounded font-bold">Сохранить</button>
          </>
        )}
      </div>

      {/* Библиотека фонов */}
      {showBgLibrary && isMaster && (
        <div className="bg-wasteland-800 p-2 border-b border-wasteland-600">
          <div className="flex gap-2 mb-2">
            <input
              placeholder="Название"
              value={bgNameInput}
              onChange={e => setBgNameInput(e.target.value)}
              className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-sm"
            />
            <input
              placeholder="URL картинки"
              value={bgUrlInput}
              onChange={e => setBgUrlInput(e.target.value)}
              className="flex-2 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-sm"
            />
            <button
              onClick={async () => {
                if (bgNameInput && bgUrlInput) {
                  await api.uploadBackground(campaignId, bgNameInput, bgUrlInput);
                  setBgNameInput('');
                  setBgUrlInput('');
                  loadBackgrounds();
                }
              }}
              className="bg-accent-orange text-wasteland-900 px-2 py-1 rounded text-xs font-bold"
            >
              Загрузить
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {backgrounds.map(bg => (
              <div
                key={bg.id}
                onClick={() => { setSelectedBg(bg); setFogDataUrl(null); }}
                className={`cursor-pointer p-1 border rounded ${selectedBg?.url === bg.url ? 'border-accent-orange' : 'border-wasteland-600'}`}
              >
                <img src={bg.url} alt={bg.name} className="h-12 w-20 object-cover rounded" />
                <p className="text-wasteland-400 text-xs text-center">{bg.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Холст сцены */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: '400px' }}>
        {selectedBg ? (
          <div className="relative w-full h-full">
            <img
              src={selectedBg.url}
              alt="Фон"
              className="absolute top-0 left-0 w-full h-full object-contain"
              draggable={false}
            />
            <canvas
              ref={fogCanvasRef}
              className="absolute top-0 left-0 w-full h-full"
              style={{ pointerEvents: tool === 'eraser' ? 'auto' : 'none' }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
              onMouseDown={tool === 'note' ? addNote : handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
            {/* Токены */}
            {tokens.map(token => (
              <div
                key={token.id}
                onMouseDown={(e) => handleTokenDragStart(e, token.id)}
                style={{
                  position: 'absolute',
                  left: token.x,
                  top: token.y,
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: token.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  color: 'white',
                  fontSize: '14px',
                  border: '2px solid white',
                  cursor: isMaster && tool === 'select' ? 'move' : 'default',
                  zIndex: 20,
                  userSelect: 'none',
                }}
              >
                {token.label}
              </div>
            ))}
            {/* Рисунки (заметки) */}
            {drawings.filter(d => d.tool === 'note').map((note, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: note.x,
                  top: note.y,
                  background: 'rgba(255,255,0,0.8)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontSize: 12,
                  zIndex: 25,
                }}
              >
                {note.text}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-wasteland-500">
            Выберите фон для сцены
          </div>
        )}
      </div>

      {/* Боковая панель токенов (только мастер) */}
      {isMaster && (
        <div className="bg-wasteland-800 p-2 border-t border-wasteland-600 flex gap-2 overflow-x-auto">
          <p className="text-wasteland-400 text-xs self-center mr-2">Токены:</p>
          {availableTokens.map(t => (
            <button
              key={`${t.type}_${t.id}`}
              onClick={() => addToken(t.type, t.id, t.name, t.color)}
              className="flex items-center gap-1 bg-wasteland-700 hover:bg-wasteland-600 rounded px-2 py-1 text-xs"
            >
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: t.color }}></span>
              {t.name}
            </button>
          ))}
          <button
            onClick={() => {
              const activeTokens = tokens.map(t => t.ref_id);
              availableTokens.forEach(t => {
                if (!activeTokens.includes(t.id)) addToken(t.type, t.id, t.name, t.color);
              });
            }}
            className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded"
          >
            + Все
          </button>
          <button
            onClick={() => setTokens([])}
            className="text-xs bg-accent-red/20 hover:bg-accent-red/40 px-2 py-1 rounded text-accent-red"
          >
            Очистить
          </button>
        </div>
      )}
    </div>
  );
}