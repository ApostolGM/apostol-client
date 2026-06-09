import { useState, useEffect } from 'react';
import { api } from '../api';

const SLOT_ICONS = {
  'правая_рука': '🤚',
  'левая_рука': '✋',
  'тело': '👕',
  'пояс': '🎒',
  'рюкзак': '🎒',
  'разгрузка': '🦺',
};

const SLOT_LABELS = {
  'правая_рука': 'Правая рука',
  'левая_рука': 'Левая рука',
  'тело': 'Броня',
  'пояс': 'Пояс',
  'рюкзак': 'Рюкзак',
  'разгрузка': 'Разгрузка',
};

export default function InventoryPanel({ character, onRefresh }) {
  const [items, setItems] = useState([]);
  const [inv, setInv] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [dragSlot, setDragSlot] = useState(null);

  useEffect(() => { api.getItems().then(setItems).catch(console.error); }, []);
  useEffect(() => { setInv(character?.inventory || []); }, [character]);

  const config = character?.inventory_config || { пояс: 3, рюкзак: 10, разгрузка: 4 };
  const equippedSlots = ['правая_рука', 'левая_рука', 'тело'];

  const slotCounts = {};
  for (const slot of inv) {
    const key = slot.slot_type || 'рюкзак';
    slotCounts[key] = (slotCounts[key] || 0) + (slot.quantity || 1);
  }

  const totalWeight = inv.reduce((s, sl) => s + (sl.item?.weight||0)*(sl.quantity||1), 0);
  const maxWeight = character?.carry_weight_max || 50;
  const weightPercent = Math.min(100, (totalWeight/maxWeight)*100);

  const refresh = async () => { await onRefresh(); };

  const handleAdd = async () => {
    if (!selectedItem) return;
    setError('');
    try {
      await api.addItem(character.id, selectedItem, quantity, 'рюкзак');
      await refresh();
      setShowAdd(false);
      setSelectedItem('');
      setQuantity(1);
    } catch(e) { setError(e.message); }
  };

  const handleRemove = async (slotId) => { await api.removeItem(slotId, 1); await refresh(); };
  const handleEquip = async (slotId) => { await api.equipItem(slotId); await refresh(); };
  const handleUnequip = async (slotId) => { await api.unequipItem(slotId); await refresh(); };
  const handleReload = async (slotId) => { setError(''); try { await api.reloadWeapon(slotId); await refresh(); } catch(e) { setError(e.message); } };
  const handleShoot = async (slotId) => { setError(''); try { const res = await api.shootWeapon(slotId); await refresh(); } catch(e) { setError(e.message); } };
  const handleConsume = async (slotId) => { await api.consumeItem(slotId); await refresh(); };

  const handleDragStart = (slot) => { setDragSlot(slot); };
  const handleDrop = async (targetSlotType) => {
    if (!dragSlot || dragSlot.slot_type === targetSlotType) { setDragSlot(null); return; }
    await api.moveItem(dragSlot.id, targetSlotType);
    await refresh();
    setDragSlot(null);
  };

  const renderSlotGrid = (slotType, maxSlots) => {
    const slots = inv.filter(s => s.slot_type === slotType && !s.equipped);
    const used = slots.reduce((s, sl) => s + (sl.quantity||1), 0);
    const free = Math.max(0, maxSlots - used);
    const cells = [];

    let idx = 0;
    for (const slot of slots) {
      for (let q = 0; q < (slot.quantity||1); q++) {
        cells.push({ type: 'item', slot, key: `${slot.id}-${q}` });
        idx++;
      }
    }
    for (let i = 0; i < free; i++) {
      cells.push({ type: 'empty', key: `empty-${slotType}-${i}` });
    }

    return (
      <div
        className="bg-wasteland-800 p-3 rounded-lg border border-wasteland-600"
        onDragOver={e => e.preventDefault()}
        onDrop={() => handleDrop(slotType)}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-wasteland-300 text-sm font-bold">{SLOT_ICONS[slotType] || '📦'} {SLOT_LABELS[slotType] || slotType}</span>
          <span className={`text-xs ${used >= maxSlots ? 'text-accent-red' : used > maxSlots*0.7 ? 'text-accent-yellow' : 'text-wasteland-400'}`}>
            {used}/{maxSlots}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cells.map(cell => (
            <div
              key={cell.key}
              className={`w-10 h-10 rounded border flex items-center justify-center text-xs cursor-pointer transition
                ${cell.type === 'item'
                  ? 'bg-wasteland-700 border-wasteland-500 hover:border-accent-orange hover:bg-wasteland-600'
                  : 'bg-wasteland-900 border-dashed border-wasteland-600 opacity-40'
                }`}
              draggable={cell.type === 'item'}
              onDragStart={() => cell.type === 'item' && handleDragStart(cell.slot)}
              onClick={() => {
                if (cell.type === 'item') {
                  const s = cell.slot;
                  if (s.item?.is_weapon && !s.equipped) handleEquip(s.id);
                  else if (s.item?.is_armor && !s.equipped) handleEquip(s.id);
                  else if (s.item?.is_consumable) handleConsume(s.id);
                }
              }}
              title={cell.type === 'item' ? cell.slot.item?.name : 'Пусто'}
            >
              {cell.type === 'item' ? (
                <span title={cell.slot.item?.name}>
                  {cell.slot.item?.is_weapon ? (cell.slot.item?.weapon_type === 'ranged' ? '🔫' : cell.slot.item?.weapon_type === 'thrown' ? '🎯' : '🔪')
                   : cell.slot.item?.type === 'броня' ? '🛡️'
                   : cell.slot.item?.is_consumable ? '💊'
                   : cell.slot.item?.type === 'патроны' ? '💠'
                   : cell.slot.item?.type === 'еда' ? '🥫'
                   : cell.slot.item?.type === 'вода' ? '💧'
                   : '📦'}
                </span>
              ) : ''}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const equipped = (type) => inv.filter(s => s.slot_type === type && s.equipped);

  const renderEquipped = (type) => {
    const slots = equipped(type);
    return (
      <div
        className="bg-wasteland-800 p-2 rounded-lg border border-wasteland-600"
        onDragOver={e => e.preventDefault()}
        onDrop={() => handleDrop(type)}
      >
        <span className="text-wasteland-400 text-xs">{SLOT_ICONS[type]} {SLOT_LABELS[type]}</span>
        {slots.length === 0 ? (
          <div className="w-full h-10 border border-dashed border-wasteland-600 rounded mt-1 flex items-center justify-center text-wasteland-500 text-xs">Пусто</div>
        ) : slots.map(s => (
          <div key={s.id} className="bg-wasteland-700 border border-accent-orange rounded p-1.5 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-wasteland-100 text-xs font-bold">{s.item?.name}</span>
              <div className="flex gap-1">
                {s.item?.weapon_type === 'ranged' && (
                  <>
                    <button onClick={() => handleShoot(s.id)} className="text-xs bg-accent-red/20 hover:bg-accent-red/40 px-1.5 py-0.5 rounded text-accent-red" title="Выстрелить">💥</button>
                    <button onClick={() => handleReload(s.id)} className="text-xs bg-accent-yellow/20 hover:bg-accent-yellow/40 px-1.5 py-0.5 rounded text-accent-yellow" title="Перезарядить">🔄</button>
                  </>
                )}
                {s.item?.weapon_type === 'melee' && (
                  <button onClick={() => handleShoot(s.id)} className="text-xs bg-accent-red/20 hover:bg-accent-red/40 px-1.5 py-0.5 rounded text-accent-red" title="Ударить">💥</button>
                )}
                <button onClick={() => handleUnequip(s.id)} className="text-xs bg-wasteland-600 hover:bg-wasteland-500 px-1.5 py-0.5 rounded text-wasteland-300" title="Снять">📥</button>
              </div>
            </div>
            {s.item?.weapon_type === 'ranged' && (
              <div className="flex items-center gap-1 mt-1">
                <div className="flex-1 h-1.5 bg-wasteland-900 rounded overflow-hidden">
                  <div
                    className={`h-full rounded ${(s.item?.current_ammo||0) === 0 ? 'bg-accent-red' : 'bg-accent-yellow'}`}
                    style={{ width: `${((s.item?.current_ammo||0) / (s.item?.max_ammo||1)) * 100}%` }}
                  />
                </div>
                <span className="text-wasteland-400 text-xs">{s.item?.current_ammo||0}/{s.item?.max_ammo||0}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-stylized text-accent-orange">Инвентарь</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-accent-orange text-wasteland-900 text-xs font-bold px-3 py-1.5 rounded hover:bg-orange-500 transition">
          {showAdd ? '✕' : '+ Добавить'}
        </button>
      </div>

      <div className="bg-wasteland-800 p-2 rounded-lg border border-wasteland-600">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-wasteland-400">Вес</span>
          <span className={weightPercent > 90 ? 'text-accent-red' : weightPercent > 70 ? 'text-accent-yellow' : 'text-wasteland-300'}>
            {totalWeight.toFixed(1)}/{maxWeight} кг
          </span>
        </div>
        <div className="w-full h-1.5 bg-wasteland-900 rounded overflow-hidden">
          <div className={`h-full rounded ${weightPercent > 90 ? 'bg-accent-red' : weightPercent > 70 ? 'bg-accent-yellow' : 'bg-accent-green'}`} style={{ width: `${weightPercent}%` }} />
        </div>
      </div>

      {error && <p className="text-accent-red text-xs bg-wasteland-800 p-2 rounded">{error}</p>}

      {showAdd && (
        <div className="bg-wasteland-800 p-3 rounded-lg border border-wasteland-600 space-y-2">
          <select className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm" value={selectedItem} onChange={e => setSelectedItem(e.target.value)}>
            <option value="">Выберите предмет...</option>
            {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.type}) {i.weight}кг</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input type="number" min="1" max="99" value={quantity} onChange={e => setQuantity(parseInt(e.target.value)||1)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 w-14 text-center text-sm" />
            <button onClick={handleAdd} disabled={!selectedItem} className="flex-1 bg-accent-orange text-wasteland-900 font-bold py-2 rounded text-sm disabled:opacity-50">Добавить</button>
          </div>
        </div>
      )}

      {/* Экипировка */}
      <div className="grid grid-cols-3 gap-2">
        {renderEquipped('правая_рука')}
        {renderEquipped('левая_рука')}
        {renderEquipped('тело')}
      </div>

      {/* Сумки */}
      <div className="space-y-2">
        {renderSlotGrid('пояс', config.пояс || 3)}
        {renderSlotGrid('разгрузка', config.разгрузка || 4)}
        {renderSlotGrid('рюкзак', config.рюкзак || 10)}
      </div>

      {inv.length === 0 && <p className="text-wasteland-500 text-xs text-center py-2">Инвентарь пуст</p>}
    </div>
  );
}
