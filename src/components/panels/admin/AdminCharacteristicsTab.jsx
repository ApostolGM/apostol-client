// components/panels/admin/AdminCharacteristicsTab.jsx
import { useState } from 'react';
import { characteristics } from '../../../api/characteristics.js';
import useConfirm from '../../../hooks/useConfirm.jsx';

export default function AdminCharacteristicsTab({ characteristics: chars, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', short_name: '', description: '' });
  const { confirm, ConfirmModal } = useConfirm();

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    await characteristics.create(form);
    setForm({ name: '', short_name: '', description: '' });
    setShowForm(false);
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!await confirm('Удалить характеристику?')) return;
    await characteristics.delete(id);
    onRefresh();
  };

  return (
    <div>
      <button onClick={() => setShowForm(!showForm)} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded mb-3">
        {showForm ? 'Отмена' : '+ Характеристика'}
      </button>

      {showForm && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
          <input placeholder="Название" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
          <input placeholder="Кратко (СИЛ, ЛВК...)" value={form.short_name} onChange={e => setForm({...form, short_name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
          <input placeholder="Описание" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
          <button onClick={handleCreate} disabled={!form.name} className="w-full bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">Создать</button>
        </div>
      )}

      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
        {chars.map(ch => (
          <div key={ch.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
            <span className="text-wasteland-200">{ch.short_name} — {ch.name}</span>
            <button onClick={() => handleDelete(ch.id)} className="text-accent-red hover:text-red-400">🗑️</button>
          </div>
        ))}
      </div>
      {ConfirmModal}
    </div>
  );
}
