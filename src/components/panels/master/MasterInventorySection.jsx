// components/panels/master/MasterInventorySection.jsx
import { useState, useEffect } from 'react';
import { characters } from '../../../api/characters.js';
import { inventory } from '../../../api/inventory.js';
import { master } from '../../../api/master.js';
import MasterSlotRow from './MasterSlotRow.jsx';
import useConfirm from '../../../hooks/useConfirm.jsx';

export default function MasterInventorySection({ charId, inventory: inv, allItems, onRefresh }) {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [weightInfo, setWeightInfo] = useState(null);
  const { confirm } = useConfirm();

  useEffect(() => {
    characters.getWeight(charId).then(setWeightInfo).catch(() => {});
  }, [charId, inv]);

  const handleAdd = async () => {
    if (!selectedItem) return;
    await master.addItem(charId, selectedItem, quantity, 'рюкзак');
    setSelectedItem(''); setQuantity(1); setShowAdd(false);
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
    const targetSlot = slotItem?.slot;
    const weaponType = slotItem?.weapon_type;
    const availableMods = allItems.filter(i => {
      if (i.slot !== 'mod') return false;
      if (i.mod_target === 'any') return true;
      if (i.mod_target !== targetSlot) return false;
      if (i.mod_target === 'weapon' && i.weapon_mod_subtype && i.weapon_mod_subtype !== 'any' && i.weapon_mod_subtype !== weaponType) return false;
      return true;
    });
    if (availableMods.length === 0) { alert('Нет подходящих модификаций'); return; }
    const modList = availableMods.map(m => `${m.name} (${m.id.substring(0, 8)})`).join('\n');
    const modId = prompt('Доступные модификации:\n' + modList + '\n\nВведите ID модификации:');
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

  return (
    <div className="space-y-2">
      {weightInfo && (
        <div className="bg-wasteland-700 p-2 rounded text-xs">
          <span className="text-wasteland-400">Вес: </span>
          <span className={`font-bold ${weightInfo.percent > 110 ? 'text-accent-red' : weightInfo.percent > 85 ? 'text-accent-yellow' : 'text-wasteland-300'}`}>
            {weightInfo.totalWeight.toFixed(1)} / {weightInfo.maxWeight} кг ({weightInfo.percent}%)
          </span>
          {weightInfo.penalty.label !== 'Норма' && <span className="text-accent-red ml-2">⚠️ {weightInfo.penalty.label}</span>}
        </div>
      )}

      {showAdd && (
        <div className="flex gap-1 items-center mb-2">
          <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs flex-1">
            <option value="">Выбрать...</option>
            {allItems.map(i => <option key={i.id} value={i.id}>{i.name} ({i.slot})</option>)}
          </select>
          <input type="number" min="1" max="99" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs w-12" />
          <button onClick={handleAdd} className="bg-accent-orange text-wasteland-900 text-xs px-2 py-1 rounded">OK</button>
        </div>
      )}
      <button onClick={() => setShowAdd(!showAdd)} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">
        {showAdd ? 'Отмена' : '+ Предмет'}
      </button>

      {equipped.length > 0 && <p className="text-wasteland-500 text-xs mt-2">Экипировано:</p>}
      {equipped.map(s => <MasterSlotRow key={s.id} slot={s} onConditionChange={handleConditionChange} onQuantityChange={handleQuantityChange} onRemove={handleRemoveSlot} onAddMod={handleAddMod} onRemoveMod={handleRemoveMod} />)}
      {backpack.length > 0 && <p className="text-wasteland-500 text-xs mt-2">Рюкзак:</p>}
      {backpack.map(s => <MasterSlotRow key={s.id} slot={s} onConditionChange={handleConditionChange} onQuantityChange={handleQuantityChange} onRemove={handleRemoveSlot} onAddMod={handleAddMod} onRemoveMod={handleRemoveMod} />)}
    </div>
  );
}
