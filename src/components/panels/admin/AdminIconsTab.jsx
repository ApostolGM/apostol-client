// components/panels/admin/AdminIconsTab.jsx
import { useState } from 'react';
import { admin } from '../../../api/admin.js';
import { upload } from '../../../api/upload.js';
import useConfirm from '../../../hooks/useConfirm.jsx';

export default function AdminIconsTab({ icons, onRefresh }) {
  const [name, setName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const { confirm, ConfirmModal } = useConfirm();

  const categories = [...new Set(icons.map(i => i.category || 'general'))];

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Файл слишком большой (макс 5MB).'); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result.split(',')[1];
        const result = await upload.file(base64, name || file.name, null);
        await admin.createIcon({ name: name || file.name, url: result.url, category: 'general' });
        setName('');
        onRefresh();
      } catch (err) { alert('Ошибка: ' + err.message); }
      finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id) => {
    if (!await confirm('Удалить иконку?')) return;
    await admin.deleteIcon(id);
    onRefresh();
  };

  const filtered = filterCat === 'all' ? icons : icons.filter(i => (i.category || 'general') === filterCat);

  return (
    <div>
      <div className="flex gap-2 mb-3 items-end flex-wrap">
        <input placeholder="Название" value={name} onChange={e => setName(e.target.value)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm flex-1 min-w-[150px]" />
        <label className={`bg-accent-orange hover:bg-orange-500 text-wasteland-900 text-xs font-bold px-3 py-1.5 rounded cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
          {uploading ? '⏳' : '📁 Загрузить PNG'}
          <input type="file" accept="image/png" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      <div className="flex gap-1 mb-3 flex-wrap">
        <button onClick={() => setFilterCat('all')} className={`text-xs px-2 py-1 rounded ${filterCat === 'all' ? 'bg-accent-orange text-wasteland-900' : 'bg-wasteland-700 text-wasteland-300'}`}>Все</button>
        {categories.map(c => (
          <button key={c} onClick={() => setFilterCat(c)} className={`text-xs px-2 py-1 rounded ${filterCat === c ? 'bg-accent-orange text-wasteland-900' : 'bg-wasteland-700 text-wasteland-300'}`}>{c}</button>
        ))}
      </div>

      <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-[60vh] overflow-y-auto">
        {filtered.map(icon => (
          <div key={icon.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-center relative group">
            <img src={icon.url} alt={icon.name} className="w-12 h-12 object-contain mx-auto mb-1" />
            <p className="text-wasteland-400 text-xs truncate">{icon.name}</p>
            <button onClick={() => handleDelete(icon.id)} className="absolute top-1 right-1 text-accent-red text-xs opacity-0 group-hover:opacity-100">✕</button>
          </div>
        ))}
      </div>
      {ConfirmModal}
    </div>
  );
}
