// components/panels/admin/AdminInventoryCellsTab.jsx
import { useState } from 'react';
import { admin } from '../../../api/admin.js';
import useConfirm from '../../../hooks/useConfirm.jsx';

export default function AdminInventoryCellsTab({ cells, itemSlots, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', slot_type: 'equipment', item_slot_id: '', max_items: 1, sort_order: 0 });
  const { confirm, ConfirmModal } = useConfirm();

  const openCreate = () => { setEditId(null); setForm({ name: '', slot_type: 'equipment', item_slot_id: '', max_items: 1, sort_order: 0 }); setShowForm(true); };
  const openEdit = (c) => { setEditId(c.id); setForm({ name: c.name, slot_type: c.slot_type, item_slot_id: c.item_slot_id || '', max_items: c.max_items || 1, sort_order: c.sort_order || 0 }); setShowForm(true); };

  const handleSave = async () => {
    const data = { ...form, item_slot_id: form.item_slot_id || null };
    if (editId) await admin.updateInventoryCell(editId, data);
    else await admin.createInventoryCell(data);
    setShowForm(false);
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!await confirm('Удалить ячейку?')) return;
    await admin.deleteInventoryCell(id);
    onRefresh();
  };

  return (
    <div>
      <button onClick={openCreate} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded mb-3">
        {showForm ? 'Отмена' : '+ Ячейка'}
      </button>

      {showForm && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
          <h3 className="text-wasteland-300 text-sm font-bold">{editId ? 'Редактировать' : 'Новая ячейка'}</h3>
          <input placeholder="Название (Голова, Плечи...)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
          <select value={form.slot_type} onChange={e => setForm({...form, slot_type: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
            <option value="equipment">Экипировка</option>
            <option value="backpack">Рюкзак</option>
            <option value="belt">Пояс</option>
          </select>
          <select value={form.item_slot_id} onChange={e => setForm({...form, item_slot_id: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
            <option value="">Любой предмет</option>
            {itemSlots.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="flex gap-2">
            <div className="flex-1"><label className="text-wasteland-400 text-xs">Макс. предметов</label><input type="number" min="1" value={form.max_items} onChange={e => setForm({...form, max_items: parseInt(e.target.value)||1})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" /></div>
            <div className="flex-1"><label className="text-wasteland-400 text-xs">Порядок</label><input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: parseInt(e.target.value)||0})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={!form.name} className="flex-1 bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">Сохранить</button>
            <button onClick={() => setShowForm(false)} className="flex-1 bg-wasteland-600 text-wasteland-300 py-2 rounded text-sm">Отмена</button>
          </div>
        </div>
      )}

      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
        {cells.map(c => (
          <div key={c.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
            <span className="text-wasteland-200">
              {c.name} <span className="text-wasteland-500">({c.slot_type}{c.item_slot ? ' → ' + c.item_slot.name : ''})</span>
            </span>
            <div className="flex gap-1">
              <button onClick={() => openEdit(c)} className="text-wasteland-400 hover:text-wasteland-200">✏️</button>
              <button onClick={() => handleDelete(c.id)} className="text-accent-red hover:text-red-400">🗑️</button>
            </div>
          </div>
        ))}
      </div>
      {ConfirmModal}
    </div>
  );
}
