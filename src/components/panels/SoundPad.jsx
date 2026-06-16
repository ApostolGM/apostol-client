// components/panels/SoundPad.jsx
import { useState, useEffect, useRef } from 'react';
import { sounds } from '../../api/sounds.js';
import { playlists } from '../../api/playlists.js';
import { upload } from '../../api/upload.js';
import useConfirm from '../../hooks/useConfirm.jsx';

export default function SoundPad({ campaignId, isMaster, socketRef }) {
  const [soundList, setSoundList] = useState([]);
  const [playlistsList, setPlaylistsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', file_url: '', category: 'ambient', playlist_id: '' });
  const [playing, setPlaying] = useState(null);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [playlistMode, setPlaylistMode] = useState(null);
  const audioRef = useRef(null);
  const { confirm, ConfirmModal } = useConfirm();

  const load = async () => {
    try {
      const [s, p] = await Promise.all([sounds.getAll(campaignId), playlists.getAll().catch(() => [])]);
      setSoundList(s); setPlaylistsList(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [campaignId]);

  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;
    const onPlay = (data) => {
      if (data.campaignId !== campaignId) return;
      setPlaying(data.soundId);
      if (audioRef.current) {
        audioRef.current.src = data.url;
        audioRef.current.volume = muted ? 0 : data.volume * volume;
        audioRef.current.play().catch(() => {});
      }
    };
    const onStop = (data) => {
      if (data.campaignId !== campaignId) return;
      setPlaying(null); setPlaylistMode(null);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    };
    socket.on('sound_play', onPlay);
    socket.on('sound_stop', onStop);
    return () => { socket.off('sound_play', onPlay); socket.off('sound_stop', onStop); };
  }, [campaignId, socketRef, muted, volume]);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = muted ? 0 : volume; }, [volume, muted]);

  const handlePlay = (sound) => {
    if (!isMaster) return;
    setPlaying(sound.id); setPlaylistMode(null);
    if (socketRef?.current) socketRef.current.emit('sound_play', { campaignId, soundId: sound.id, url: sound.file_url, volume });
    if (audioRef.current) { audioRef.current.src = sound.file_url; audioRef.current.volume = muted ? 0 : volume; audioRef.current.play().catch(() => {}); }
  };

  const handleStop = () => {
    if (!isMaster) return;
    setPlaying(null); setPlaylistMode(null);
    if (socketRef?.current) socketRef.current.emit('sound_stop', { campaignId });
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
  };

  const startPlaylist = (pl, mode) => {
    if (!isMaster) return;
    const tracks = (pl.sounds || []).filter(s => s.file_url);
    if (tracks.length === 0) return;
    const firstIndex = mode === 'random' ? Math.floor(Math.random() * tracks.length) : 0;
    setPlaylistMode({ playlistId: pl.id, mode, currentIndex: firstIndex, tracks });
    handlePlay(tracks[firstIndex]);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isMaster || !playlistMode) return;
    const onEnded = () => {
      const { mode, currentIndex, tracks } = playlistMode;
      let nextIndex = mode === 'random' ? Math.floor(Math.random() * tracks.length) : currentIndex + 1;
      if (nextIndex >= tracks.length) nextIndex = 0;
      setPlaylistMode(prev => ({ ...prev, currentIndex: nextIndex }));
      handlePlay(tracks[nextIndex]);
    };
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [playlistMode, isMaster]);

  const handleAddSound = async () => {
    if (!form.name || !form.file_url) return;
    try { await sounds.create({ ...form, campaign_id: campaignId }); setForm({ name: '', file_url: '', category: 'ambient', playlist_id: '' }); setUploadedUrl(''); setShowForm(false); load(); }
    catch (e) { alert('Ошибка: ' + e.message); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) { alert('Файл слишком большой.'); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try { const result = await upload.sound(reader.result, file.name, campaignId, false); setForm(prev => ({ ...prev, name: prev.name || result.name, file_url: result.url })); setUploadedUrl(result.url); }
      catch (err) { alert('Ошибка: ' + err.message); }
      finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id) => {
    if (!await confirm('Удалить звук?')) return;
    await sounds.delete(id);
    if (playing === id) handleStop();
    load();
  };

  const categories = [...new Set(soundList.map(s => s.category || 'общее'))];
  const filteredSounds = soundList.filter(s => {
    if (filterCategory !== 'all' && (s.category || 'общее') !== filterCategory) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const soundsByCategory = {};
  for (const s of filteredSounds) {
    const cat = s.category || 'общее';
    if (!soundsByCategory[cat]) soundsByCategory[cat] = [];
    soundsByCategory[cat].push(s);
  }

  if (loading) return <p className="text-wasteland-400 text-center py-4">Загрузка...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-stylized text-accent-orange">Соундпад</h2>
        <div className="flex items-center gap-2">
          <input placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs w-28 md:w-40" />
          <input type="range" min="0" max="100" value={Math.round(volume * 100)} onChange={e => setVolume(parseInt(e.target.value) / 100)} className="w-16 md:w-20" />
          <button onClick={() => setMuted(!muted)} className={`text-xs px-2 py-1 rounded ${muted ? 'bg-accent-red text-wasteland-900' : 'bg-wasteland-700 text-wasteland-300'}`}>{muted ? '🔇' : '🔊'}</button>
          {isMaster && (
            <>
              <button onClick={() => { setShowForm(!showForm); setUploadedUrl(''); }} className="bg-accent-orange text-wasteland-900 text-sm font-bold px-3 py-1.5 rounded">+ Звук</button>
              {playing && <button onClick={handleStop} className="bg-accent-red text-wasteland-900 text-sm font-bold px-3 py-1.5 rounded">⏹ Стоп</button>}
            </>
          )}
        </div>
      </div>

      {playing && (
        <div className="bg-accent-green/10 border border-accent-green/30 p-2 rounded text-sm text-accent-green flex items-center gap-2">
          <span>🔊</span><span className="truncate">{soundList.find(s => s.id === playing)?.name || 'Неизвестный трек'}</span>
          {playlistMode && <span className="text-xs text-wasteland-400">(плейлист: {playlistMode.mode === 'random' ? '🔀' : '🔁'})</span>}
        </div>
      )}

      {showForm && isMaster && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 space-y-3">
          <h3 className="text-wasteland-300 text-sm font-bold">Добавить звук</h3>
          <input placeholder="Название" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm" />
          <label className={`inline-block bg-wasteland-700 hover:bg-wasteland-600 text-wasteland-300 text-xs font-bold px-4 py-2 rounded cursor-pointer text-center ${uploading ? 'opacity-50' : ''}`}>
            {uploading ? '⏳ Загрузка...' : '📁 Выбрать аудиофайл'}
            <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
          {uploadedUrl && <div className="bg-accent-green/10 border border-accent-green/30 p-2 rounded text-xs text-accent-green">✅ Файл загружен!</div>}
          <input placeholder="URL аудиофайла" value={form.file_url} onChange={e => setForm({...form, file_url: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm" />
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm">
            <option value="ambient">Эмбиент</option><option value="combat">Бой</option><option value="music">Музыка</option><option value="sfx">Эффекты</option><option value="общее">Общее</option>
          </select>
          <select value={form.playlist_id} onChange={e => setForm({...form, playlist_id: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm">
            <option value="">Без плейлиста</option>
            {playlistsList.map(pl => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={handleAddSound} disabled={!form.name || !form.file_url} className="bg-accent-orange text-wasteland-900 font-bold px-4 py-2 rounded text-sm disabled:opacity-50">✅ Добавить</button>
            <button onClick={() => { setShowForm(false); setUploadedUrl(''); }} className="bg-wasteland-600 text-wasteland-300 px-4 py-2 rounded text-sm">Отмена</button>
          </div>
        </div>
      )}

      <audio ref={audioRef} preload="auto" />

      {playlistsList.length > 0 && (
        <div>
          <h3 className="text-wasteland-400 text-xs uppercase mb-2">📋 Плейлисты</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {playlistsList.map(pl => (
              <div key={pl.id} className="bg-wasteland-700 rounded px-3 py-1.5 text-xs flex items-center gap-1">
                <span className="text-wasteland-200">{pl.name}</span>
                {(pl.sounds || []).length > 0 && isMaster && (
                  <>
                    <button onClick={() => startPlaylist(pl, 'sequential')} className="text-accent-green hover:text-green-400 ml-1">▶</button>
                    <button onClick={() => startPlaylist(pl, 'random')} className="text-accent-yellow hover:text-yellow-400 ml-0.5">🔀</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto">
        <button onClick={() => setFilterCategory('all')} className={`text-xs px-3 py-1 rounded ${filterCategory === 'all' ? 'bg-accent-orange text-wasteland-900' : 'bg-wasteland-700 text-wasteland-300'}`}>Всё</button>
        {categories.map(cat => <button key={cat} onClick={() => setFilterCategory(cat)} className={`text-xs px-3 py-1 rounded ${filterCategory === cat ? 'bg-accent-orange text-wasteland-900' : 'bg-wasteland-700 text-wasteland-300'}`}>{cat}</button>)}
      </div>

      {Object.keys(soundsByCategory).length === 0 && <p className="text-wasteland-500 text-center py-4">Нет звуков</p>}
      {Object.entries(soundsByCategory).map(([cat, catSounds]) => (
        <div key={cat}>
          <h3 className="text-wasteland-400 text-xs uppercase mb-1">{cat}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {catSounds.map(s => (
              <div key={s.id} className={`p-2 rounded border cursor-pointer text-center text-sm transition ${playing === s.id ? 'bg-accent-green/20 border-accent-green' : 'bg-wasteland-700 border-wasteland-600 hover:border-wasteland-500'}`}>
                <div onClick={() => handlePlay(s)} className="truncate text-wasteland-200">{playing === s.id ? '🔊 ' : '🎵 '}{s.name}</div>
                {isMaster && <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="text-accent-red text-xs mt-1 hover:underline">Удалить</button>}
              </div>
            ))}
          </div>
        </div>
      ))}
      {ConfirmModal}
    </div>
  );
}
