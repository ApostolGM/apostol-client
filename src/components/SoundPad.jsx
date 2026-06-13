// src/components/SoundPad.jsx
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
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const audioRef = useRef(null);

  const load = async () => {
    try {
      const data = await api.getSounds(campaignId);
      setSounds(data);
    } catch (e) {
      console.error('Ошибка загрузки звуков:', e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [campaignId]);

  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;
    const onPlay = (data) => {
      if (data.campaignId === campaignId) {
        setPlaying(data.soundId);
        if (audioRef.current) {
          audioRef.current.src = data.url;
          audioRef.current.volume = muted ? 0 : data.volume * volume;
          audioRef.current.play().catch(e => console.error('Ошибка воспроизведения:', e));
        }
      }
    };
    const onStop = (data) => {
      if (data.campaignId === campaignId) {
        setPlaying(null);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }
    };
    socket.on('sound_play', onPlay);
    socket.on('sound_stop', onStop);
    return () => {
      socket.off('sound_play', onPlay);
      socket.off('sound_stop', onStop);
    };
  }, [campaignId, socketRef, muted, volume]);

  // Обновляем громкость у текущего аудио при изменении
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  const handlePlay = (sound) => {
    if (!isMaster) return;
    setPlaying(sound.id);
    if (socketRef?.current) {
      socketRef.current.emit('sound_play', { campaignId, soundId: sound.id, url: sound.file_url, volume });
    }
    if (audioRef.current) {
      audioRef.current.src = sound.file_url;
      audioRef.current.volume = muted ? 0 : volume;
      audioRef.current.play().catch(e => console.error('Ошибка воспроизведения:', e));
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
      audioRef.current.currentTime = 0;
    }
  };

  const handleAddSound = async () => {
    if (!form.name || !form.file_url) return;
    try {
      await api.createSound({ ...form, campaign_id: campaignId });
      setForm({ name: '', file_url: '', category: 'ambient' });
      setUploadedUrl('');
      setShowForm(false);
      load();
    } catch (e) {
      alert('Ошибка добавления: ' + e.message);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) {
      alert('Файл слишком большой. Максимум 40 МБ.');
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = await api.uploadSound(reader.result, file.name, campaignId, false);
        setForm(prev => ({ ...prev, name: prev.name || result.name, file_url: result.url }));
        setUploadedUrl(result.url);
      } catch (err) {
        alert('Ошибка загрузки файла: ' + (err.message || 'Неизвестная ошибка'));
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      alert('Ошибка чтения файла');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить звук?')) return;
    try {
      await api.deleteSound(id);
      if (playing === id) handleStop();
      load();
    } catch (e) {
      alert('Ошибка удаления: ' + e.message);
    }
  };

  const categories = [...new Set(sounds.map(s => s.category || 'общее'))];

  if (loading) return <p className="text-wasteland-400 text-center py-4">Загрузка...</p>;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-stylized text-accent-orange">Соундпад</h2>
        <div className="flex items-center gap-2">
          <span className="text-wasteland-500 text-xs">Громкость:</span>
          <input type="range" min="0" max="100" value={Math.round(volume * 100)} onChange={e => setVolume(parseInt(e.target.value) / 100)} className="w-16 md:w-20" />
          <button onClick={() => setMuted(!muted)} className={`text-xs px-2 py-1 rounded ${muted ? 'bg-accent-red text-wasteland-900' : 'bg-wasteland-700 text-wasteland-300'}`}>
            {muted ? '🔇' : '🔊'}
          </button>
          {isMaster && (
            <>
              <button onClick={() => { setShowForm(!showForm); setUploadedUrl(''); }} className="bg-accent-orange text-wasteland-900 text-sm font-bold px-3 py-1.5 rounded hover:bg-orange-500 transition">
                + Звук
              </button>
              {playing && (
                <button onClick={handleStop} className="bg-accent-red text-wasteland-900 text-sm font-bold px-3 py-1.5 rounded hover:bg-red-500 transition">
                  ⏹ Стоп
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {showForm && isMaster && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 space-y-3">
          <h3 className="text-wasteland-300 text-sm font-bold">Добавить звук</h3>

          <input
            placeholder="Название звука"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm"
          />

          <div className="space-y-2">
            <label className={`inline-block bg-wasteland-700 hover:bg-wasteland-600 text-wasteland-300 text-xs font-bold px-4 py-2 rounded cursor-pointer text-center ${uploading ? 'opacity-50' : ''}`}>
              {uploading ? '⏳ Загрузка...' : '📁 Выбрать аудиофайл'}
              <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>

            {uploadedUrl && (
              <div className="bg-accent-green/10 border border-accent-green/30 p-2 rounded text-xs text-accent-green">
                ✅ Файл загружен! Ссылка вставлена в поле URL.
              </div>
            )}

            <div>
              <label className="text-wasteland-400 text-xs">URL аудиофайла</label>
              <input
                placeholder="https://... или загрузите файл выше"
                value={form.file_url}
                onChange={e => setForm({ ...form, file_url: e.target.value })}
                className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm"
              />
              {form.file_url && (
                <button
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.src = form.file_url;
                      audioRef.current.volume = muted ? 0 : volume;
                      audioRef.current.play().catch(e => alert('Не удалось воспроизвести: ' + e.message));
                    }
                  }}
                  className="text-xs text-accent-yellow hover:underline mt-1"
                >
                  ▶ Предпрослушать
                </button>
              )}
            </div>
          </div>

          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm">
            <option value="ambient">Эмбиент</option>
            <option value="combat">Бой</option>
            <option value="music">Музыка</option>
            <option value="sfx">Эффекты</option>
            <option value="общее">Общее</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={handleAddSound}
              disabled={!form.name || !form.file_url}
              className="bg-accent-orange text-wasteland-900 font-bold px-4 py-2 rounded text-sm disabled:opacity-50 hover:bg-orange-500 transition"
            >
              ✅ Добавить в соундпад
            </button>
            <button
              onClick={() => { setShowForm(false); setUploadedUrl(''); }}
              className="bg-wasteland-600 text-wasteland-300 px-4 py-2 rounded text-sm hover:bg-wasteland-500 transition"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      <audio ref={audioRef} loop preload="auto" />

      {categories.length === 0 && !loading && (
        <p className="text-wasteland-500 text-center py-4">Нет звуков. Добавьте первый!</p>
      )}

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
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="text-accent-red text-xs mt-1 hover:underline">Удалить</button>
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
