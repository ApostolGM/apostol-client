// components/panels/admin/AdminIconsTab.jsx
import { useState } from 'react';
import { admin } from '../../../api/admin.js';
import { upload } from '../../../api/upload.js';
import useConfirm from '../../../hooks/useConfirm.jsx';

export default function AdminIconsTab({ icons, onRefresh }) {
  const [name, setName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [filterCat, setFilterCat] = useState('all');
  const { confirm, ConfirmModal } = useConfirm();

  const categories = [...new Set(icons.map(i => i.category || 'general'))];

  const uploadSingle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const uploadMultiple = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setProgress({ current: 0, total: files.length });

    for (let i = 0; i < files.length; i++) {
      setProgress({ current: i + 1, total: files.length });
      try {
        await processFile(files[i], false);
      } catch (err) {
        console.error('Ошибка загрузки ' + files[i].name, err);
      }
    }

    setUploading(false);
    setProgress({ current: 0, total: 0 });
    onRefresh();
  };

  const processFile = async (file, refreshAfter = true) => {
    if (file.size > 5 * 1024 * 1024) {
      alert(`Файл ${file.name} слишком большой (макс 5MB).`);
      return;
    }

    const reader = new FileReader();
    const base64 = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const fileName = name || file.name.replace(/\.(png|jpg|jpeg|webp)$/i, '');
    const result = await upload.file(base64, fileName, null);
    await admin.createIcon({ name: fileName, url: result.url, category: 'general' });
    if (name) setName('');

    if (refreshAfter) {
      onRefresh();
    }
  };

  const handleDelete = async (id) => {
    if (!await confirm('Удалить иконку?')) return;
    await admin.deleteIcon(id);
    onRefresh();
  };

  const filtered = filterCat === 'all' ? icons : icons.filter(i => (i.category || 'general') === filterCat);

  return (
    <div>
      {/* Загрузка */}
      <div className="flex gap-2 mb-3 items-end flex-wrap">
        <input
          placeholder="Название (для одного файла)"
          value={name}
          onChange={e => setName(e.target.value)}
          className="bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm flex-1 min-w-[150px]"
        />

        <label className="bg-accent-orange hover:bg-orange-500 text-wasteland-900 text-xs font-bold px-3 py-1.5 rounded cursor-pointer">
          📁 1 файл
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={uploadSingle} />
        </label>

        <label className={`bg-accent-green hover:bg-green-600 text-wasteland-900 text-xs font-bold px-3 py-1.5 rounded cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
          📚 Много файлов
          <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={uploadMultiple} disabled={uploading} />
        </label>
      </div>

      {/* Прогресс */}
      {uploading && (
        <div className="bg-wasteland-800 p-3 rounded border border-wasteland-600 mb-3">
          <div className="flex justify-between text-xs text-wasteland-300 mb-1">
            <span>⏳ Загрузка...</span>
            <span>{progress.current} / {progress.total}</span>
          </div>
          <div className="w-full h-2 bg-wasteland-900 rounded overflow-hidden">
            <div
              className="h-full bg-accent-green transition-all"
              style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Фильтры */}
      <div className="flex gap-1 mb-3 flex-wrap">
        <button onClick={() => setFilterCat('all')} className={`text-xs px-2 py-1 rounded ${filterCat === 'all' ? 'bg-accent-orange text-wasteland-900' : 'bg-wasteland-700 text-wasteland-300'}`}>
          Все ({icons.length})
        </button>
        {categories.map(c => (
          <button key={c} onClick={() => setFilterCat(c)} className={`text-xs px-2 py-1 rounded ${filterCat === c ? 'bg-accent-orange text-wasteland-900' : 'bg-wasteland-700 text-wasteland-300'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Сетка иконок */}
      {filtered.length === 0 ? (
        <p className="text-wasteland-500 text-center py-8">Нет иконок. Загрузите PNG-файлы.</p>
      ) : (
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[60vh] overflow-y-auto">
          {filtered.map(icon => (
            <div key={icon.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-center relative group hover:border-wasteland-500 transition">
              <img src={icon.url} alt={icon.name} className="w-12 h-12 object-contain mx-auto mb-1" />
              <p className="text-wasteland-400 text-xs truncate" title={icon.name}>{icon.name}</p>
              <button
                onClick={() => handleDelete(icon.id)}
                className="absolute top-1 right-1 text-accent-red text-xs bg-wasteland-900 rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {ConfirmModal}
    </div>
  );
}
