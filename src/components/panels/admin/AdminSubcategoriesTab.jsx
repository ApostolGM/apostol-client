// components/panels/admin/AdminSubcategoriesTab.jsx
import { useState } from 'react';
import { subcategories } from '../../../api/subcategories.js';
import useConfirm from '../../../hooks/useConfirm.jsx';

export default function AdminSubcategoriesTab({ subcategories: subs, onRefresh }) {
  const [form, setForm] = useState({ slot: 'armor', name: '' });
  const { confirm, ConfirmModal } = useConfirm();

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    await subcategories.create(form.slot, form.name);
    setForm({ slot: 'armor', name: '' });
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!await confirm('Удалить подкатегорию?')) return;
    await subcategories.delete(id);
    onRefresh();
  };

  return (
    <div>
      <div className="flex gap-2 mb-3 items-end">
        <select value={form.slot} onChange={e => setForm({...form, slot: e.target.value})} className="bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
          <option value="armor">Броня</option>
          <option value="consumable">Расходник</option>
          <option value="item">Предмет</option>
          <option value="mod">Модификация</option>
        </select>
        <input placeholder="Название" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
        <button onClick={handleCreate} disabled={!form.name} className="bg-accent-orange text-wasteland-900 text-xs px-3 py-1.5 rounded">Добавить</button>
      </div>

      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
        {subs.map(sc => (
          <div key={sc.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
            <span className="text-wasteland-200">{sc.slot} / {sc.name}</span>
            <button onClick={() => handleDelete(sc.id)} className="text-accent-red hover:text-red-400">🗑️</button>
          </div>
        ))}
      </div>
      {ConfirmModal}
    </div>
  );
}
