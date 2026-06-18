// components/panels/admin/AdminItemsTab.jsx
import { useState } from 'react';
import { admin } from '../../../api/admin.js';
import ItemForm from './ItemForm.jsx';
import useConfirm from '../../../hooks/useConfirm.jsx';

export default function AdminItemsTab({ items, ammoTypes, subcategories, itemSlots, icons, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchPrice, setBatchPrice] = useState(0);
  const [filterSlot, setFilterSlot] = useState('all');
  const [filterSubcategory, setFilterSubcategory] = useState('all');
  const { confirm, ConfirmModal } = useConfirm();

  const openCreate = () => { setEditId(null); setEditData(null); setShowForm(true); };
  const openEdit = (item) => { setEditId(item.id); setEditData(item); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditId(null); setEditData(null); };

  const handleSave = async (data) => {
    const cleaned = { ...data };

    // Очищаем все UUID-поля — пустые строки заменяем на null
    if (!cleaned.item_slot_id || cleaned.item_slot_id === '') cleaned.item_slot_id = null;
    if (!cleaned.ammo_type_id || cleaned.ammo_type_id === '') cleaned.ammo_type_id = null;
    if (!cleaned.mod_item_slot_id || cleaned.mod_item_slot_id === '') cleaned.mod_item_slot_id = null;
    if (!cleaned.icon_id || cleaned.icon_id === '') cleaned.icon_id = null;
    if (!cleaned.weapon_type || cleaned.weapon_type === '') cleaned.weapon_type = null;

    // Контейнер
    const containerSlotId = itemSlots.find(s => s.name === 'container')?.id;
    if (cleaned.item_slot_id !== containerSlotId) {
      cleaned.container_items = [];
    }

    // Убираем пустые строки в accepted_ammo_types
    if (cleaned.accepted_ammo_types) {
      cleaned.accepted_ammo_types = cleaned.accepted_ammo_types.filter(id => id && id !== '');
      if (cleaned.accepted_ammo_types.length === 0) cleaned.accepted_ammo_types = null;
    }

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

  const getSlotName = (item) => item.item_slot?.name || item.slot || '—';
  const getIconUrl = (item) => item.icon_data?.url || null;

  const filteredItems = items.filter(item => {
    const slotName = getSlotName(item);
    if (filterSlot !== 'all' && slotName !== filterSlot) return false;
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
          {itemSlots.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
      </div>

      {showForm && (
        <ItemForm
          initialData={editData}
          ammoTypes={ammoTypes}
          items={items}
          itemSlots={itemSlots}
          icons={icons}
          onSave={handleSave}
          onCancel={closeForm}
        />
      )}

      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
        {filteredItems.map(item => (
          <div key={item.id} className={`bg-wasteland-800 p-2 rounded border text-xs flex gap-2 ${selectedIds.includes(item.id) ? 'border-accent-orange' : 'border-wasteland-600'}`}>
            <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} />
            <div className="flex-1 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                {getIconUrl(item) && (
                  <img src={getIconUrl(item)} alt="" className="w-5 h-5 object-contain rounded" />
                )}
                <span className="text-wasteland-200">
                  {item.name}
                  <span className="text-wasteland-500 ml-1">({getSlotName(item)}{item.subcategory ? '/'+item.subcategory : ''})</span>
                  <span className="text-accent-yellow text-xs ml-1">{item.trade_price}◆</span>
                  {item.is_dynamic && <span className="text-accent-green text-xs ml-1">↻</span>}
                </span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(item)} className="text-wasteland-400 hover:text-wasteland-200">✏</button>
                <button onClick={() => handleDelete(item.id)} className="text-accent-red hover:text-red-400">✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {ConfirmModal}
    </div>
  );
}
