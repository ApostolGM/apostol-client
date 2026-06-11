import { useState, useEffect, useRef } from 'react';
import { api } from '../api';

export default function SoundPad({ campaignId, isMaster, socketRef }) {
  const [sounds, setSounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', file_url: '', category: 'ambient' });
  const [playing, setPlaying] = useState(null);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef(null);

  const load = async () => {
    const data = await api.getSounds(campaignId);
    setSounds(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [campaignId]);

  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;
    socket.on('sound_play', (data) => {
      if (data.campaignId === campaignId) {
        setPlaying(data.soundId);
        if (audioRef.current && !muted) {
          audioRef.current.src = data.url;
          audioRef.current.volume = data.volume * volume;
          audioRef.current.play().catch(() => {});
        }
      }
    });
    socket.on('sound_stop', (data) => {
      if (data.campaignId === campaignId) {
        setPlaying(null);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
      }
    });
    return () => {
      socket.off('sound_play');
      socket.off('sound_stop');
    };
  }, [campaignId, socketRef, muted, volume]);

  const handlePlay = (sound) => {
    if (!isMaster) return;
    setPlaying(sound.id);
    if (socketRef?.current) {
      socketRef.current.emit('sound_play', {
        campaignId,
        soundId: sound.id,
        url: sound.file_url,
        volume: volume,
      });
    }
    if (audioRef.current) {
      audioRef.current.src = sound.file_url;
      audioRef.current.volume = volume;
      audioRef.current.play().catch(() => {});
    }
  };

  const handleStop = () => {
    if (!isMaster) return;
    setPlaying(null);
    if (socketRef?.current) {
      socketRef.current.emit('sound_stop', { campaignId });
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  };

  const handleAdd = async () => {
    if (!form.name || !form.file_url) return;
    await api.createSound({ ...form, campaign_id: campaignId });
    setForm({ name: '', file_url: '', category: 'ambient' });
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    await api.deleteSound(id);
    load();
  };

  const categories = [...new Set(sounds.map(s => s.category || 'общее'))];

  if (loading) return <p className="text-wasteland-400 text-center py-4">Загрузка...</p>;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-stylized text-accent-orange">Соундпад</h2>
        <div className="flex items-center gap-2">
          <span className="text-wasteland-500 text-xs">Громкость:</span>
          <input type="range" min="0" max="100" value={Math.round(volume * 100)} onChange={e => setVolume(parseInt(e.target.value) / 100)} className="w-20" />
          <button onClick={() => setMuted(!muted)} className={`text-xs px-2 py-1 rounded ${muted ? 'bg-accent-red text-wasteland-900' : 'bg-wasteland-700 text-wasteland-300'}`}>
            {muted ? '🔇' : '🔊'}
          </button>
          {isMaster && (
            <>
              <button onClick={() => setShowForm(!showForm)} className="bg-accent-orange text-wasteland-900 text-sm font-bold px-4 py-2 rounded hover:bg-orange-500 transition">
                + Звук
              </button>
              {playing && (
                <button onClick={handleStop} className="bg-accent-red text-wasteland-900 text-sm font-bold px-4 py-2 rounded hover:bg-red-500 transition">
                  ⏹ Стоп
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {showForm && isMaster && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 space-y-3">
          <input placeholder="Название" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm" />
          <input placeholder="URL аудиофайла" value={form.file_url} onChange={e => setForm({ ...form, file_url: e.target.value })} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm" />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm">
            <option value="ambient">Эмбиент</option>
            <option value="combat">Бой</option>
            <option value="music">Музыка</option>
            <option value="sfx">Эффекты</option>
            <option value="общее">Общее</option>
          </select>
          <button onClick={handleAdd} className="bg-accent-orange text-wasteland-900 font-bold px-4 py-2 rounded text-sm">Добавить</button>
        </div>
      )}

      <audio ref={audioRef} loop />

      {categories.map(cat => {
        const catSounds = sounds.filter(s => (s.category || 'общее') === cat);
        if (catSounds.length === 0) return null;
        return (
          <div key={cat}>
            <h3 className="text-wasteland-400 text-xs uppercase mb-1">{cat}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {catSounds.map(s => (
                <div key={s.id} className={`p-2 rounded border cursor-pointer text-center text-sm transition ${playing === s.id ? 'bg-accent-green/20 border-accent-green' : 'bg-wasteland-700 border-wasteland-600 hover:border-wasteland-500'}`}>
                  <div onClick={() => handlePlay(s)} className="truncate text-wasteland-200">
                    {playing === s.id ? '🔊 ' : '🎵 '}{s.name}
                  </div>
                  {isMaster && (
                    <button onClick={() => handleDelete(s.id)} className="text-accent-red text-xs mt-1 hover:underline">Удалить</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
