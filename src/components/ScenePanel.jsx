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
  const [tool, setTool] = useState('select');
  const [color, setColor] = useState('#ff0000');
  const [lineWidth, setLineWidth] = useState(3);
  const canvasRef = useRef(null);
  const fogCanvasRef = useRef(null);
  const isDrawing = useRef(false);
  const draggedToken = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });

  const loadScene = useCallback(async () => {
    const data = await api.getScenes(campaignId, sceneType);
    if (data && data.length > 0) {
      const s = data[0];
      setScene(s);
      setTokens(s.tokens || []);
      if (s.background_url) setSelectedBg({ url: s.background_url, name: '' });
      else setSelectedBg(null);
    } else {
      setScene(null);
      setTokens([]);
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

  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;
    socket.on('scene_updated', (data) => {
      if (data.campaignId === campaignId && data.sceneType === sceneType) loadScene();
    });
    return () => { socket.off('scene_updated'); };
  }, [campaignId, sceneType, socketRef]);

  const saveScene = async () => {
    await api.updateScene(campaignId, {
      scene_type: sceneType,
      background_url: selectedBg?.url || null,
      tokens,
      drawings: [],
      fog_of_war: [],
    });
    if (socketRef?.current) {
      socketRef.current.emit('scene_update', { campaignId, sceneType, updates: {} });
    }
  };

  const addToken = (type, refId, name, color) => {
    if (!isMaster) return;
    const newToken = {
      id: `${type}_${refId}_${Date.now()}`,
      type,
      ref_id: refId,
      label: (name || '??').substring(0, 2).toUpperCase(),
      color,
      x: 50 + Math.random() * 200,
      y: 50 + Math.random() * 200,
    };
    setTokens(prev => [...prev, newToken]);
  };

  const handleTokenMouseDown = (e, tokenId) => {
    if (!isMaster || tool !== 'select') return;
    e.preventDefault();
    draggedToken.current = tokenId;
    startPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasMouseMove = (e) => {
    if (!draggedToken.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    startPos.current = { x: e.clientX, y: e.clientY };
    setTokens(prev => prev.map(t => {
      if (t.id === draggedToken.current) {
        return { ...t, x: t.x + dx, y: t.y + dy };
      }
      return t;
    }));
  };

  const handleCanvasMouseUp = () => {
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
            <button onClick={() => setShowBgLibrary(!showBgLibrary)} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">
              🖼️ Фон
            </button>
            <select value={tool} onChange={e => setTool(e.target.value)} className="bg-wasteland-700 text-wasteland-100 text-sm rounded p-1 border border-wasteland-600">
              <option value="select">Выбор</option>
              <option value="pencil">Карандаш</option>
              <option value="eraser">Ластик</option>
            </select>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
            <input type="range" min="1" max="10" value={lineWidth} onChange={e => setLineWidth(parseInt(e.target.value))} className="w-20" />
            <button onClick={saveScene} className="text-xs bg-accent-orange hover:bg-orange-500 text-wasteland-900 px-2 py-1 rounded font-bold">Сохранить</button>
          </>
        )}
      </div>

      {/* Библиотека фонов */}
      {showBgLibrary && isMaster && (
        <div className="bg-wasteland-800 p-2 border-b border-wasteland-600">
          <div className="flex gap-2 mb-2">
            <input placeholder="Название" value={bgNameInput} onChange={e => setBgNameInput(e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-sm" />
            <input placeholder="URL картинки" value={bgUrlInput} onChange={e => setBgUrlInput(e.target.value)} className="flex-2 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-sm" />
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
              <div key={bg.id} onClick={() => setSelectedBg(bg)} className={`cursor-pointer p-1 border rounded ${selectedBg?.url === bg.url ? 'border-accent-orange' : 'border-wasteland-600'}`}>
                <img src={bg.url} alt={bg.name} className="h-12 w-20 object-cover rounded" />
                <p className="text-wasteland-400 text-xs text-center">{bg.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Холст сцены */}
      <div
        className="flex-1 relative overflow-hidden bg-wasteland-800"
        style={{ minHeight: '400px' }}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        {selectedBg ? (
          <div className="relative w-full h-full">
            <img
              src={selectedBg.url}
              alt="Фон"
              className="absolute top-0 left-0 w-full h-full object-contain"
              draggable={false}
            />
            {/* Токены */}
            {tokens.map(token => (
              <div
                key={token.id}
                onMouseDown={(e) => handleTokenMouseDown(e, token.id)}
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
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-wasteland-500">
            Выберите фон для сцены
          </div>
        )}
      </div>

      {/* Боковая панель токенов */}
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
          <button onClick={() => setTokens([])} className="text-xs bg-accent-red/20 hover:bg-accent-red/40 px-2 py-1 rounded text-accent-red">
            Очистить
          </button>
        </div>
      )}
    </div>
  );
}