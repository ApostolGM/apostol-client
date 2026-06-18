// components/panels/admin/AdminCharacteristicsTab.jsx
import { useState } from 'react';
import { characteristics } from '../../../api/characteristics.js';
import { request } from '../../../api/index.js';
import useConfirm from '../../../hooks/useConfirm.jsx';

export default function AdminCharacteristicsTab({ characteristics: chars, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', short_name: '', description: '' });
  const [editId, setEditId] = useState(null);
  const { confirm, ConfirmModal } = useConfirm();

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    await characteristics.create(form);
    setForm({ name: '', short_name: '', description: '' });
    setShowForm(false);
    onRefresh();
  };

  const handleEdit = (ch) => { setEditId(ch.id); setForm({ name: ch.name, short_name: ch.short_name, description: ch.description || '' }); setShowForm(true); };
  const handleSaveEdit = async () => {
    await request('/admin/characteristics/' + editId, { method: 'PUT', body: JSON.stringify(form) });
    setEditId(null); setShowForm(false);
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!await confirm('Удалить?')) return;
    await characteristics.delete(id);
    onRefresh();
  };

  return (
    <div>
      <button onClick={() => { setEditId(null); setForm({ name: '', short_name: '', description: '' }); setShowForm(!showForm); }} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded mb-3">
        {showForm ? 'Отмена' : '+ Характеристика'}
      </button>

      {showForm && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
          <input placeholder="Название" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
          <input placeholder="Кратко (СИЛ, ЛВК...)" value={form.short_name} onChange={e => setForm({...form, short_name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
          <input placeholder="Описание" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
          <button onClick={editId ? handleSaveEdit : handleCreate} disabled={!form.name} className="w-full bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">
            {editId ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      )}

      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
        {chars.map(ch => (
          <div key={ch.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
            <span className="text-wasteland-200">{ch.short_name} — {ch.name}</span>
            <div className="flex gap-1">
              <button onClick={() => handleEdit(ch)} className="text-wasteland-400 hover:text-wasteland-200">✏</button>
              <button onClick={() => handleDelete(ch.id)} className="text-accent-red hover:text-red-400">✕</button>
            </div>
          </div>
        ))}
      </div>
      {ConfirmModal}
    </div>
  );
}
