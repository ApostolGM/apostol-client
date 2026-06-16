// components/panels/admin/AdminItemsTab.jsx
import { useState } from 'react';
import { admin } from '../../../api/admin.js';
import ItemForm from './ItemForm.jsx';
import useConfirm from '../../../hooks/useConfirm.jsx';

const ITEM_SLOTS = ['weapon', 'armor', 'exo', 'mod', 'ammo', 'consumable', 'item', 'currency'];

export default function AdminItemsTab({ items, ammoTypes, subcategories, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchPrice, setBatchPrice] = useState(0);
  const [filterSlot, setFilterSlot] = useState('all');
  const [filterSubcategory, setFilterSubcategory] = useState('all');
  const { confirm, ConfirmModal } = useConfirm();

  const getAvailableSubcategories = (slot) => {
    if (slot === 'weapon') return ['melee', 'ranged', 'thrown'];
    return subcategories.filter(s => s.slot === slot);
  };

  const openCreate = () => { setEditId(null); setEditData(null); setShowForm(true); };
  const openEdit = (item) => { setEditId(item.id); setEditData(item); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditId(null); setEditData(null); };

  const handleSave = async (data) => {
    const cleaned = { ...data };

    // Очищаем пустые строки в UUID-полях
    if (!cleaned.ammo_type_id) cleaned.ammo_type_id = null;
    if (!cleaned.mod_target) cleaned.mod_target = null;
    if (!cleaned.weapon_mod_subtype) cleaned.weapon_mod_subtype = null;
    if (!cleaned.weapon_type) cleaned.weapon_type = null;

    if (editId) await admin.updateItem(editId, cleaned);
    else await admin.createItem(cleaned);
    closeForm();
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!await confirm('Удалить предмет?')) return;
    await admin.deleteItem(id);
    onRefresh();
  };

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleBatchDelete = async () => {
    if (!selectedIds.length) return;
    if (!await confirm(`Удалить ${selectedIds.length} предметов?`)) return;
    await admin.batchDeleteItems(selectedIds);
    setSelectedIds([]);
    onRefresh();
  };

  const handleBatchPrice = async () => {
    if (!selectedIds.length) return;
    await admin.batchPriceItems(selectedIds, batchPrice);
    setSelectedIds([]);
    onRefresh();
  };

  const filteredItems = items.filter(item => {
    if (filterSlot !== 'all' && item.slot !== filterSlot) return false;
    if (filterSubcategory !== 'all' && item.subcategory !== filterSubcategory) return false;
    return true;
  });

  return (
    <div>
      <div className="flex gap-2 mb-3 flex-wrap items-end">
        <button onClick={openCreate} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded">
          {showForm ? 'Отмена' : '+ Предмет'}
        </button>
        <button onClick={handleBatchDelete} disabled={!selectedIds.length} className="text-xs bg-accent-red text-wasteland-900 px-3 py-1.5 rounded disabled:opacity-50">
          Удалить выбранные ({selectedIds.length})
        </button>
        <input type="number" value={batchPrice} onChange={e => setBatchPrice(parseInt(e.target.value)||0)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs w-20" placeholder="Цена" />
        <button onClick={handleBatchPrice} disabled={!selectedIds.length} className="text-xs bg-accent-green text-wasteland-900 px-3 py-1.5 rounded disabled:opacity-50">
          Установить цену
        </button>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        <select value={filterSlot} onChange={e => { setFilterSlot(e.target.value); setFilterSubcategory('all'); }} className="bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-xs">
          <option value="all">Все категории</option>
          {ITEM_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {filterSlot !== 'all' && filterSlot !== 'currency' && filterSlot !== 'exo' && getAvailableSubcategories(filterSlot).length > 0 && (
          <select value={filterSubcategory} onChange={e => setFilterSubcategory(e.target.value)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-xs">
            <option value="all">Все подкатегории</option>
            {getAvailableSubcategories(filterSlot).map(sc => (
              <option key={typeof sc === 'string' ? sc : sc.id} value={typeof sc === 'string' ? sc : sc.name}>
                {typeof sc === 'string' ? sc : sc.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {showForm && (
        <ItemForm
          initialData={editData}
          ammoTypes={ammoTypes}
          items={items}
          onSave={handleSave}
          onCancel={closeForm}
        />
      )}

      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
        {filteredItems.map(item => (
          <div key={item.id} className={`bg-wasteland-800 p-2 rounded border text-xs flex gap-2 ${selectedIds.includes(item.id) ? 'border-accent-orange' : 'border-wasteland-600'}`}>
            <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} />
            <div className="flex-1 flex justify-between items-center">
              <span className="text-wasteland-200">
                {item.icon && <span className="mr-1">{item.icon}</span>}
                {item.name}
                <span className="text-wasteland-500"> ({item.slot}{item.subcategory ? '/'+item.subcategory : ''})</span>
                <span className="text-accent-yellow text-xs ml-1">{item.trade_price}💎</span>
                {item.is_container && <span className="text-accent-green text-xs ml-1">📦</span>}
              </span>
              <div className="flex gap-1">
                <button onClick={() => openEdit(item)} className="text-wasteland-400 hover:text-wasteland-200">✏️</button>
                <button onClick={() => handleDelete(item.id)} className="text-accent-red hover:text-red-400">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {ConfirmModal}
    </div>
  );
}
