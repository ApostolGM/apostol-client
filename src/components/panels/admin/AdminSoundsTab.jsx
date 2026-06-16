// components/panels/admin/AdminSoundsTab.jsx
import { useState } from 'react';
import { admin } from '../../../api/admin.js';
import { upload } from '../../../api/upload.js';
import useConfirm from '../../../hooks/useConfirm.jsx';

export default function AdminSoundsTab({ sounds, playlists: pls, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'ambient', playlist_id: '' });
  const [uploading, setUploading] = useState(false);
  const { confirm, ConfirmModal } = useConfirm();

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) { alert('Файл слишком большой.'); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await upload.sound(reader.result, form.name || file.name, null, true);
        setForm({ name: '', category: 'ambient', playlist_id: '' });
        setShowForm(false);
        onRefresh();
      } catch (err) { alert('Ошибка загрузки: ' + err.message); }
      finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id) => {
    if (!await confirm('Удалить звук?')) return;
    await admin.deleteSound(id);
    onRefresh();
  };

  return (
    <div>
      <button onClick={() => setShowForm(!showForm)} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded mb-3">
        {showForm ? 'Отмена' : '+ Загрузить звук'}
      </button>

      {showForm && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
          <h3 className="text-wasteland-300 text-sm font-bold">Загрузить глобальный звук</h3>
          <input placeholder="Название" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
          <label className={`inline-block bg-wasteland-700 hover:bg-wasteland-600 text-wasteland-300 text-xs font-bold px-4 py-2 rounded cursor-pointer text-center ${uploading ? 'opacity-50' : ''}`}>
            {uploading ? '⏳ Загрузка...' : '📁 Выбрать аудиофайл'}
            <input type="file" accept="audio/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
            <option value="ambient">Эмбиент</option><option value="combat">Бой</option><option value="music">Музыка</option><option value="sfx">Эффекты</option><option value="общее">Общее</option>
          </select>
          <select value={form.playlist_id} onChange={e => setForm({...form, playlist_id: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
            <option value="">Без плейлиста</option>
            {pls.map(pl => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
          </select>
        </div>
      )}

      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
        {sounds.map(s => (
          <div key={s.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
            <span className="text-wasteland-200">{s.name}</span>
            <button onClick={() => handleDelete(s.id)} className="text-accent-red hover:text-red-400">🗑️</button>
          </div>
        ))}
      </div>
      {ConfirmModal}
    </div>
  );
}
