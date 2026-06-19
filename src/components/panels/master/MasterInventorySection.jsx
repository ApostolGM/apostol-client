// components/panels/master/MasterInventorySection.jsx
import { useState, useEffect } from 'react';
import { characters } from '../../../api/characters.js';
import { inventory } from '../../../api/inventory.js';
import { master } from '../../../api/master.js';
import MasterSlotRow from './MasterSlotRow.jsx';
import Modal from '../../ui/Modal.jsx';
import useConfirm from '../../../hooks/useConfirm.jsx';

export default function MasterInventorySection({ charId, inventory: inv, allItems, onRefresh }) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [weightInfo, setWeightInfo] = useState(null);
  const [search, setSearch] = useState('');
  const { confirm } = useConfirm();

  useEffect(() => {
    characters.getWeight(charId).then(setWeightInfo).catch(() => {});
  }, [charId, inv]);

  const handleAdd = async (itemId, qty) => {
    if (!itemId) return;
    await master.addItem(charId, itemId, qty || 1, 'рюкзак');
    setShowQuickAdd(false); setSearch('');
    onRefresh();
  };

  const handleConditionChange = async (slotId, value) => {
    await inventory.updateSlot(slotId, { condition_percent: value });
    onRefresh();
  };

  const handleQuantityChange = async (slotId, newQty) => {
    if (newQty < 1) return;
    await inventory.updateSlot(slotId, { quantity: newQty });
    onRefresh();
  };

  const handleRemoveSlot = async (slotId) => {
    if (!await confirm('Удалить предмет?')) return;
    await inventory.removeItem(slotId, 999);
    onRefresh();
  };

  const handleAddMod = async (slotId, slotItem) => {
    const targetSlotName = slotItem?.item_slot?.name;
    const availableMods = allItems.filter(i => {
      if (i.item_slot?.name !== 'mod') return false;
      if (!i.mod_item_slot_id) return true;
      return i.mod_item_slot_id === slotItem?.item_slot_id;
    });
    if (availableMods.length === 0) { alert('Нет подходящих модификаций'); return; }
    const modList = availableMods.map(m => `${m.name} (${m.id.substring(0, 8)})`).join('\n');
    const modId = prompt('Доступные модификации:\n' + modList + '\n\nВведите ID:');
    if (modId) {
      try { await inventory.addMod(slotId, modId.trim()); onRefresh(); }
      catch (e) { alert(e.message); }
    }
  };

  const handleRemoveMod = async (slotId, modId) => {
    await inventory.removeMod(slotId, modId);
    onRefresh();
  };

  const equipped = inv.filter(s => s.equipped);
  const backpack = inv.filter(s => !s.equipped);

  const filteredItems = allItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const itemsBySlot = {};
  for (const item of filteredItems) {
    const slot = item.item_slot?.name || 'other';
    if (!itemsBySlot[slot]) itemsBySlot[slot] = [];
    itemsBySlot[slot].push(item);
  }

  return (
    <div className="space-y-2">
      {weightInfo && (
        <div className="bg-wasteland-700 p-2 rounded text-xs">
          <span className="text-wasteland-400">Вес: </span>
          <span className={`font-bold ${weightInfo.percent > 110 ? 'text-accent-red' : weightInfo.percent > 85 ? 'text-accent-yellow' : 'text-wasteland-300'}`}>
            {weightInfo.totalWeight.toFixed(1)} / {weightInfo.maxWeight} кг ({weightInfo.percent}%)
          </span>
          {weightInfo.penalty.label !== 'Норма' && <span className="text-accent-red ml-2">⚠ {weightInfo.penalty.label}</span>}
        </div>
      )}

      <button onClick={() => setShowQuickAdd(true)} className="text-xs bg-accent-orange text-wasteland-900 px-2 py-1 rounded font-bold">
        + Быстрое добавление
      </button>

      {equipped.length > 0 && <p className="text-wasteland-500 text-xs mt-2">Экипировано:</p>}
      {equipped.map(s => <MasterSlotRow key={s.id} slot={s} onConditionChange={handleConditionChange} onQuantityChange={handleQuantityChange} onRemove={handleRemoveSlot} onAddMod={handleAddMod} onRemoveMod={handleRemoveMod} />)}
      {backpack.length > 0 && <p className="text-wasteland-500 text-xs mt-2">Рюкзак:</p>}
      {backpack.map(s => <MasterSlotRow key={s.id} slot={s} onConditionChange={handleConditionChange} onQuantityChange={handleQuantityChange} onRemove={handleRemoveSlot} onAddMod={handleAddMod} onRemoveMod={handleRemoveMod} />)}

      <Modal isOpen={showQuickAdd} onClose={() => setShowQuickAdd(false)} title="Выдать предмет">
        <div className="space-y-3">
          <input placeholder="Поиск предмета..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm" autoFocus />
          <div className="max-h-64 overflow-y-auto space-y-2">
            {Object.keys(itemsBySlot).length === 0 ? (
              <p className="text-wasteland-500 text-xs text-center py-4">Ничего не найдено</p>
            ) : (
              Object.entries(itemsBySlot).map(([slot, slotItems]) => (
                <div key={slot}>
                  <h5 className="text-wasteland-500 text-xs uppercase mb-1">{slot}</h5>
                  <div className="space-y-1">
                    {slotItems.map(item => (
                      <button key={item.id} onClick={() => handleAdd(item.id, 1)}
                        className="w-full text-left bg-wasteland-700 hover:bg-wasteland-600 p-2 rounded text-sm text-wasteland-200 transition flex justify-between items-center">
                        <span>{item.icon_data?.url ? <img src={item.icon_data.url} alt="" className="w-4 h-4 inline mr-1 object-contain" /> : ''}{item.name}</span>
                        <span className="text-wasteland-500 text-xs">{item.weight}кг</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
