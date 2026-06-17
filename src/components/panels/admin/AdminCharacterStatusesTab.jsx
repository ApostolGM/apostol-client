// components/panels/admin/AdminCharacterStatusesTab.jsx
import { useState } from 'react';
import { admin } from '../../../api/admin.js';
import useConfirm from '../../../hooks/useConfirm.jsx';

export default function AdminCharacterStatusesTab({ statuses, onRefresh }) {
  const [form, setForm] = useState({ name: '', icon: '💎', default_value: 100, min_value: 0, max_value: 100, sort_order: 0 });
  const [showForm, setShowForm] = useState(false);
  const { confirm, ConfirmModal } = useConfirm();

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    await admin.createCharacterStatus(form);
    setForm({ name: '', icon: '💎', default_value: 100, min_value: 0, max_value: 100, sort_order: 0 });
    setShowForm(false);
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!await confirm('Удалить статус?')) return;
    await admin.deleteCharacterStatus(id);
    onRefresh();
  };

  return (
    <div>
      <button onClick={() => setShowForm(!showForm)} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded mb-3">
        {showForm ? 'Отмена' : '+ Статус'}
      </button>

      {showForm && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
          <input placeholder="Название" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
          <div className="flex gap-2">
            <div className="flex-1"><label className="text-wasteland-400 text-xs">Иконка</label><input value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" /></div>
            <div className="flex-1"><label className="text-wasteland-400 text-xs">По умолчанию</label><input type="number" value={form.default_value} onChange={e => setForm({...form, default_value: parseInt(e.target.value)||0})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" /></div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1"><label className="text-wasteland-400 text-xs">Мин</label><input type="number" value={form.min_value} onChange={e => setForm({...form, min_value: parseInt(e.target.value)||0})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" /></div>
            <div className="flex-1"><label className="text-wasteland-400 text-xs">Макс</label><input type="number" value={form.max_value} onChange={e => setForm({...form, max_value: parseInt(e.target.value)||0})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" /></div>
          </div>
          <button onClick={handleCreate} disabled={!form.name} className="w-full bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">Создать</button>
        </div>
      )}

      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
        {statuses.map(st => (
          <div key={st.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
            <span className="text-wasteland-200">{st.icon} {st.name} ({st.default_value})</span>
            <button onClick={() => handleDelete(st.id)} className="text-accent-red hover:text-red-400">🗑️</button>
          </div>
        ))}
      </div>
      {ConfirmModal}
    </div>
  );
}
