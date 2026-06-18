// components/panels/admin/AdminCurrenciesTab.jsx
import { useState } from 'react';
import { currencies } from '../../../api/currencies.js';
import { request } from '../../../api/index.js';
import useConfirm from '../../../hooks/useConfirm.jsx';

export default function AdminCurrenciesTab({ currencies: curs, onRefresh }) {
  const [form, setForm] = useState({ name: '', icon: '◆' });
  const [editId, setEditId] = useState(null);
  const { confirm, ConfirmModal } = useConfirm();

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    await currencies.create(form);
    setForm({ name: '', icon: '◆' }); onRefresh();
  };

  const handleEdit = (c) => { setEditId(c.id); setForm({ name: c.name, icon: c.icon }); };
  const handleSaveEdit = async () => {
    await request('/admin/currencies/' + editId, { method: 'PUT', body: JSON.stringify(form) });
    setEditId(null); setForm({ name: '', icon: '◆' }); onRefresh();
  };

  const handleDelete = async (id) => {
    if (!await confirm('Удалить?')) return;
    await currencies.delete(id);
    onRefresh();
  };

  return (
    <div>
      <div className="flex gap-2 mb-3 items-end">
        <input placeholder="Название" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
        <input placeholder="Иконка" value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} className="w-16 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
        <button onClick={editId ? handleSaveEdit : handleCreate} disabled={!form.name} className="bg-accent-orange text-wasteland-900 text-xs px-3 py-1.5 rounded">
          {editId ? '✓' : '+'}
        </button>
        {editId && <button onClick={() => { setEditId(null); setForm({ name: '', icon: '◆' }); }} className="text-wasteland-400 text-xs px-2">✕</button>}
      </div>

      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
        {curs.map(cur => (
          <div key={cur.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
            <span className="text-wasteland-200">{cur.icon} {cur.name}</span>
            <div className="flex gap-1">
              <button onClick={() => handleEdit(cur)} className="text-wasteland-400 hover:text-wasteland-200">✏</button>
              <button onClick={() => handleDelete(cur.id)} className="text-accent-red hover:text-red-400">✕</button>
            </div>
          </div>
        ))}
      </div>
      {ConfirmModal}
    </div>
  );
}
