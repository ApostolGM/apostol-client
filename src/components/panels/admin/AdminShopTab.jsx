// components/panels/admin/AdminShopTab.jsx
import { useState } from 'react';
import { shop } from '../../../api/shop.js';
import ItemListEditor from '../../editors/ItemListEditor.jsx';
import useConfirm from '../../../hooks/useConfirm.jsx';

export default function AdminShopTab({ presets, items, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', is_active: false, price_multiplier: 1.0, items: [] });
  const { confirm, ConfirmModal } = useConfirm();

  const openCreate = () => { setEditId(null); setForm({ name: '', is_active: false, price_multiplier: 1.0, items: [] }); setShowForm(true); };
  const openEdit = (p) => { setEditId(p.id); setForm({ name: p.name, is_active: p.is_active, price_multiplier: p.price_multiplier || 1.0, items: p.items || [] }); setShowForm(true); };

  const handleSave = async () => {
    if (editId) await shop.updatePreset(editId, form);
    else await shop.createPreset(form);
    setShowForm(false);
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!await confirm('Удалить пресет?')) return;
    await shop.deletePreset(id);
    onRefresh();
  };

  return (
    <div>
      <button onClick={openCreate} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded mb-3">
        {showForm ? 'Отмена' : '+ Пресет'}
      </button>

      {showForm && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
          <h3 className="text-wasteland-300 text-sm font-bold">{editId ? 'Редактировать' : 'Новый пресет'}</h3>
          <input placeholder="Название" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
          <label className="flex items-center gap-2 text-xs text-wasteland-300">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} />Активен
          </label>
          <input type="number" step="0.1" value={form.price_multiplier} onChange={e => setForm({...form, price_multiplier: parseFloat(e.target.value)||1.0})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
          <ItemListEditor items={form.items} allItems={items} onChange={(val) => setForm({...form, items: val})} showPrice={true} />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={!form.name} className="flex-1 bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">{editId ? 'Сохранить' : 'Создать'}</button>
            <button onClick={() => setShowForm(false)} className="flex-1 bg-wasteland-600 text-wasteland-300 py-2 rounded text-sm">Отмена</button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {presets.map(p => (
          <div key={p.id} className="bg-wasteland-800 p-3 rounded border border-wasteland-600 text-xs flex justify-between items-center">
            <div>
              <span className="text-wasteland-200 font-bold">{p.name}</span>
              <span className={`ml-2 text-xs ${p.is_active ? 'text-accent-green' : 'text-wasteland-500'}`}>{p.is_active ? 'Активен' : 'Скрыт'}</span>
              <span className="text-wasteland-500 ml-2">×{p.price_multiplier}</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(p)} className="text-wasteland-400 hover:text-wasteland-200">✏️</button>
              <button onClick={() => handleDelete(p.id)} className="text-accent-red hover:text-red-400">🗑️</button>
            </div>
          </div>
        ))}
      </div>
      {ConfirmModal}
    </div>
  );
}
