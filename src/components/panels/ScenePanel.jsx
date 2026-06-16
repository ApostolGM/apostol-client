// components/panels/ScenePanel.jsx
import { useState, useEffect } from 'react';
import { scenes } from '../../api/scenes.js';
import { backgrounds } from '../../api/backgrounds.js';
import { upload } from '../../api/upload.js';

export default function ScenePanel({ campaignId, isMaster }) {
  const [sceneType, setSceneType] = useState('local');
  const [selectedBg, setSelectedBg] = useState(null);
  const [bgList, setBgList] = useState([]);
  const [showBgLibrary, setShowBgLibrary] = useState(false);
  const [bgNameInput, setBgNameInput] = useState('');
  const [bgUrlInput, setBgUrlInput] = useState('');
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);

  useEffect(() => { backgrounds.getByCampaign(campaignId).then(setBgList).catch(() => {}); }, [campaignId]);

  useEffect(() => {
    scenes.get(campaignId, sceneType).then(data => {
      if (data?.length > 0 && data[0].background_url) setSelectedBg({ url: data[0].background_url, name: '' });
      else setSelectedBg(null);
    }).catch(() => {});
  }, [campaignId, sceneType]);

  const saveBackground = async (bg) => {
    setSelectedBg(bg);
    try { await scenes.update(campaignId, { scene_type: sceneType, background_url: bg?.url || null, tokens: [], drawings: [], portals: [] }); } catch {}
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = bgNameInput || file.name;
    setBgNameInput(name);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result.split(',')[1];
        const result = await upload.file(base64, name, campaignId);
        setBgNameInput(''); setSelectedBg({ url: result.url, name }); saveBackground({ url: result.url, name });
        backgrounds.getByCampaign(campaignId).then(setBgList).catch(() => {});
      } catch (err) { setError('Ошибка: ' + err.message); }
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSave = () => {
    if (bgNameInput && bgUrlInput) {
      saveBackground({ url: bgUrlInput, name: bgNameInput });
      upload.background(campaignId, bgNameInput, bgUrlInput);
      setBgNameInput(''); setBgUrlInput('');
      backgrounds.getByCampaign(campaignId).then(setBgList).catch(() => {});
    }
  };

  return (
    <div className="flex flex-col h-full bg-wasteland-900">
      <div className="flex items-center gap-2 p-2 bg-wasteland-800 border-b border-wasteland-600">
        <select value={sceneType} onChange={e => setSceneType(e.target.value)} className="bg-wasteland-700 text-wasteland-100 text-xs rounded p-1 border border-wasteland-600">
          <option value="local">Локальная</option><option value="global">Глобальная</option>
        </select>
        {isMaster && <button onClick={() => setShowBgLibrary(!showBgLibrary)} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">{showBgLibrary ? 'Скрыть' : '🖼️ Фоны'}</button>}
        <span className="text-wasteland-500 text-xs">☀️</span>
        <input type="range" min="20" max="150" value={brightness} onChange={e => setBrightness(parseInt(e.target.value))} className="w-20" />
        <span className="text-wasteland-400 text-xs">{Math.round(zoom * 100)}%</span>
        <input type="range" min="10" max="200" value={Math.round(zoom * 100)} onChange={e => setZoom(parseInt(e.target.value) / 100)} className="w-24" />
        {error && <span className="text-accent-red text-xs">{error}</span>}
      </div>

      {showBgLibrary && isMaster && (
        <div className="bg-wasteland-800 p-2 border-b border-wasteland-600">
          <div className="flex gap-1 mb-2 flex-wrap">
            <input placeholder="Название" value={bgNameInput} onChange={e => setBgNameInput(e.target.value)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs flex-1 min-w-[100px]" />
            <label className="bg-accent-orange hover:bg-orange-500 text-wasteland-900 text-xs font-bold px-3 py-1.5 rounded cursor-pointer">
              📁 Файл<input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
            <span className="text-wasteland-500 text-xs self-center">URL:</span>
            <input placeholder="https://..." value={bgUrlInput} onChange={e => setBgUrlInput(e.target.value)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs flex-1 min-w-[150px]" />
            <button onClick={handleUrlSave} className="bg-accent-orange text-wasteland-900 px-2 py-1 rounded text-xs font-bold">OK</button>
          </div>
          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
            {bgList.map(bg => (
              <div key={bg.id} onClick={() => saveBackground(bg)} className={`cursor-pointer p-0.5 border rounded ${selectedBg?.url === bg.url ? 'border-accent-orange' : 'border-wasteland-600'}`}>
                <img src={bg.url} alt={bg.name} className="h-10 w-16 object-cover rounded" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden bg-wasteland-700 flex items-center justify-center">
        {selectedBg ? (
          <img src={selectedBg.url} alt="Фон" className="max-w-full max-h-full object-contain" style={{ transform: `scale(${zoom})`, filter: `brightness(${brightness}%)`, transition: 'transform 0.2s' }} draggable={false} />
        ) : (
          <div className="text-center text-wasteland-500">
            <p className="text-lg mb-2">🌄</p>
            <p className="text-sm">Выберите фон для сцены</p>
            {isMaster && <button onClick={() => setShowBgLibrary(true)} className="text-xs text-accent-orange hover:underline mt-2">Открыть библиотеку фонов</button>}
          </div>
        )}
      </div>
    </div>
  );
}
