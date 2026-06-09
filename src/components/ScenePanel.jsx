import { useState, useEffect, useRef } from 'react';
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
  const [error, setError] = useState('');

  const loadScene = async () => {
    try {
      const data = await api.getScenes(campaignId, sceneType);
      if (data && data.length > 0) {
        setScene(data[0]);
        setTokens(data[0].tokens || []);
        if (data[0].background_url) setSelectedBg({ url: data[0].background_url, name: '' });
        else setSelectedBg(null);
      } else {
        setScene(null);
        setTokens([]);
        setSelectedBg(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadBackgrounds = async () => {
    try {
      const bgs = await api.getBackgrounds(campaignId);
      setBackgrounds(bgs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadScene();
    loadBackgrounds();
  }, [sceneType, campaignId]);

  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;
    const handler = (data) => {
      if (data.campaignId === campaignId && data.sceneType === sceneType) loadScene();
    };
    socket.on('scene_updated', handler);
    return () => socket.off('scene_updated', handler);
  }, [campaignId, sceneType, socketRef]);

  const saveScene = async () => {
    setError('');
    try {
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
    } catch (e) {
      setError(e.message);
    }
  };

  const addToken = (type, refId, name, colorVal) => {
    if (!isMaster) return;
    setTokens(prev => [...prev, {
      id: type + '_' + refId + '_' + Date.now(),
      type,
      ref_id: refId,
      label: (name || '??').substring(0, 2).toUpperCase(),
      color: colorVal,
      x: 50 + Math.random() * 200,
      y: 50 + Math.random() * 200,
    }]);
  };

  const handleTokenDrag = (e, tokenId) => {
    if (!isMaster || tool !== 'select') return;
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    const x = e.clientX - rect.left - 20;
    const y = e.clientY - rect.top - 20;
    setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, x, y } : t));
  };

  const availableTokens = [
    ...(characters || []).map(c => ({ type: 'character', id: c.id, name: c.name, color: '#33cc33' })),
    ...(npcs || []).filter(n => n.visibility === 'combat').map(n => ({ type: 'npc', id: n.id, name: n.name, color: '#cc3333' })),
  ];

  return (
    <div className="flex flex-col h-full bg-wasteland-900">
      <div className="flex items-center gap-2 p-2 bg-wasteland-800 border-b border-wasteland-600 flex-wrap">
        <select value={sceneType} onChange={e => setSceneType(e.target.value)} className="bg-wasteland-700 text-wasteland-100 text-sm rounded p-1 border border-wasteland-600">
          <option value="local">Локальная</option>
          <option value="global">Глобальная</option>
        </select>
        {isMaster && (
          <>
            <button onClick={() => setShowBgLibrary(!showBgLibrary)} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">
              Фон
            </button>
            <select value={tool} onChange={e => setTool(e.target.value)} className="bg-wasteland-700 text-wasteland-100 text-sm rounded p-1 border border-wasteland-600">
              <option value="select">Выбор</option>
              <option value="move">Двигать</option>
            </select>
            <button onClick={saveScene} className="text-xs bg-accent-orange hover:bg-orange-500 text-wasteland-900 px-2 py-1 rounded font-bold">Сохранить</button>
          </>
        )}
        {error && <span className="text-accent-red text-xs">{error}</span>}
      </div>

      {showBgLibrary && isMaster && (
        <div className="bg-wasteland-800 p-2 border-b border-wasteland-600">
          <div className="flex gap-2 mb-2">
            <input placeholder="Название" value={bgNameInput} onChange={e => setBgNameInput(e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-sm" />
            <input placeholder="URL картинки" value={bgUrlInput} onChange={e => setBgUrlInput(e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-sm" />
            <button onClick={async () => {
              if (bgNameInput && bgUrlInput) {
                await api.uploadBackground(campaignId, bgNameInput, bgUrlInput);
                setBgNameInput('');
                setBgUrlInput('');
                loadBackgrounds();
              }
            }} className="bg-accent-orange text-wasteland-900 px-2 py-1 rounded text-xs font-bold">
              OK
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

      <div className="flex-1 relative overflow-hidden bg-wasteland-800" style={{ minHeight: '400px' }}>
        {selectedBg ? (
          <div className="relative w-full h-full">
            <img src={selectedBg.url} alt="Фон" className="absolute top-0 left-0 w-full h-full object-contain" draggable={false} />
            {tokens.map(token => (
              <div
                key={token.id}
                onMouseDown={(e) => { if (tool === 'move') handleTokenDrag(e, token.id); }}
                style={{
                  position: 'absolute', left: token.x, top: token.y,
                  width: 40, height: 40, borderRadius: '50%',
                  backgroundColor: token.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', color: 'white', fontSize: '14px',
                  border: '2px solid white',
                  cursor: tool === 'move' ? 'grab' : 'default',
                  zIndex: 20, userSelect: 'none',
                }}
              >
                {token.label}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-wasteland-500">
            Выберите фон
          </div>
        )}
      </div>

      {isMaster && (
        <div className="bg-wasteland-800 p-2 border-t border-wasteland-600 flex gap-2 overflow-x-auto">
          <span className="text-wasteland-400 text-xs self-center">Токены:</span>
          {availableTokens.map(t => (
            <button key={t.type + '_' + t.id} onClick={() => addToken(t.type, t.id, t.name, t.color)} className="flex items-center gap-1 bg-wasteland-700 hover:bg-wasteland-600 rounded px-2 py-1 text-xs">
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: t.color }}></span>
              {t.name}
            </button>
          ))}
          <button onClick={() => setTokens([])} className="text-xs bg-accent-red/20 hover:bg-accent-red/40 px-2 py-1 rounded text-accent-red">Очистить</button>
        </div>
      )}
    </div>
  );
}