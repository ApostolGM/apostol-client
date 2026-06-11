import { useState, useEffect } from 'react';
import { api } from '../api';

export default function HandoutsPanel({ campaignId, isMaster }) {
  const [handouts, setHandouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', image_url: '', category: 'общее', is_visible: false });
  const [editing, setEditing] = useState(null);
  const [selectedHandout, setSelectedHandout] = useState(null);

  const load = async () => {
    const data = await api.getHandouts(campaignId);
    setHandouts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [campaignId]);

  const handleSave = async () => {
    if (editing) {
      await api.updateHandout(editing, form);
    } else {
      await api.createHandout({ ...form, campaign_id: campaignId });
    }
    resetForm();
    load();
  };

  const handleEdit = (h) => {
    setEditing(h.id);
    setForm({ title: h.title, content: h.content || '', image_url: h.image_url || '', category: h.category || 'общее', is_visible: h.is_visible });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить хендаут?')) return;
    await api.deleteHandout(id);
    load();
  };

  const handleToggleVisible = async (h) => {
    await api.updateHandout(h.id, { is_visible: !h.is_visible });
    load();
  };

  const resetForm = () => {
    setForm({ title: '', content: '', image_url: '', category: 'общее', is_visible: false });
    setEditing(null);
    setShowForm(false);
  };

  if (loading) return <p className="text-wasteland-400 text-center py-4">Загрузка...</p>;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-stylized text-accent-orange">Хендауты</h2>
        {isMaster && (
          <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-accent-orange text-wasteland-900 text-sm font-bold px-4 py-2 rounded hover:bg-orange-500 transition">
            + Хендаут
          </button>
        )}
      </div>

      {showForm && isMaster && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 space-y-3">
          <h3 className="text-wasteland-300 font-stylized">{editing ? 'Редактировать' : 'Новый хендаут'}</h3>
          <input placeholder="Название" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm" />
          <textarea placeholder="Текст" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm" rows={3} />
          <input placeholder="URL картинки" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm" />
          <div className="flex gap-2 items-center">
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
              <option value="общее">Общее</option>
              <option value="письмо">Письмо</option>
              <option value="карта">Карта</option>
              <option value="дневник">Дневник</option>
              <option value="важное">Важное</option>
            </select>
            <label className="flex items-center gap-1 text-sm text-wasteland-300">
              <input type="checkbox" checked={form.is_visible} onChange={e => setForm({ ...form, is_visible: e.target.checked })} />
              Видно игрокам
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="bg-accent-orange text-wasteland-900 font-bold px-4 py-2 rounded text-sm">Сохранить</button>
            <button onClick={resetForm} className="bg-wasteland-600 text-wasteland-300 px-4 py-2 rounded text-sm">Отмена</button>
          </div>
        </div>
      )}

      {/* Для игроков — только видимые */}
      {(isMaster ? handouts : handouts.filter(h => h.is_visible)).length === 0 && (
        <p className="text-wasteland-500 text-center py-4">Нет доступных хендаутов</p>
      )}

      {(isMaster ? handouts : handouts.filter(h => h.is_visible)).map(h => (
        <div key={h.id} className="bg-wasteland-800 p-3 rounded-lg border border-wasteland-600">
          <div className="flex justify-between items-start">
            <div className="cursor-pointer flex-1" onClick={() => setSelectedHandout(h)}>
              <div className="flex items-center gap-2">
                <h3 className="text-wasteland-100 font-bold text-sm">{h.title}</h3>
                <span className="text-wasteland-500 text-xs bg-wasteland-700 px-1.5 py-0.5 rounded">{h.category}</span>
                {!h.is_visible && isMaster && <span className="text-accent-red text-xs">🔒</span>}
              </div>
              {h.image_url && (
                <img src={h.image_url} alt={h.title} className="mt-2 rounded max-h-32 object-cover" />
              )}
            </div>
            {isMaster && (
              <div className="flex gap-1 flex-shrink-0 ml-2">
                <button onClick={() => handleToggleVisible(h)} className="text-xs px-2 py-1 rounded bg-wasteland-700 text-wasteland-300" title={h.is_visible ? 'Скрыть' : 'Показать'}>
                  {h.is_visible ? '👁' : '👁‍🗨'}
                </button>
                <button onClick={() => handleEdit(h)} className="text-xs px-2 py-1 rounded bg-wasteland-700 text-wasteland-300">✏️</button>
                <button onClick={() => handleDelete(h.id)} className="text-xs px-2 py-1 rounded bg-wasteland-700 text-accent-red">🗑️</button>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Модалка просмотра */}
      {selectedHandout && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedHandout(null)}>
          <div className="bg-wasteland-800 border border-wasteland-600 rounded-lg p-4 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-accent-orange font-bold text-lg">{selectedHandout.title}</h3>
              <button onClick={() => setSelectedHandout(null)} className="text-wasteland-400 hover:text-wasteland-200">✕</button>
            </div>
            {selectedHandout.image_url && (
              <img src={selectedHandout.image_url} alt={selectedHandout.title} className="rounded mb-3 max-h-64 w-full object-contain" />
            )}
            {selectedHandout.content && (
              <p className="text-wasteland-200 text-sm whitespace-pre-wrap">{selectedHandout.content}</p>
            )}
            <p className="text-wasteland-500 text-xs mt-2">Категория: {selectedHandout.category}</p>
          </div>
        </div>
      )}
    </div>
  );
}
