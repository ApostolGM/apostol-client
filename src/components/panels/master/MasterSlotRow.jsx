// components/panels/master/MasterSlotRow.jsx
import { useState, useEffect } from 'react';

export default function MasterSlotRow({ slot, onConditionChange, onQuantityChange, onRemove, onAddMod, onRemoveMod }) {
  const item = slot.item;
  const condition = slot.condition_percent ?? item?.condition_percent ?? 100;
  const [showMods, setShowMods] = useState(false);
  const [localCond, setLocalCond] = useState(condition);
  const [qty, setQty] = useState(slot.quantity || 1);

  useEffect(() => { setLocalCond(condition); setQty(slot.quantity || 1); }, [condition, slot.quantity]);

  const handleQtyBlur = () => { if (qty !== slot.quantity) onQuantityChange(slot.id, qty); };
  const isRanged = item?.slot === 'weapon' && item?.weapon_type === 'ranged';

  return (
    <div className="bg-wasteland-700 p-2 rounded text-xs">
      <div className="flex justify-between items-center">
        <span className="text-wasteland-200 font-bold">
          {item?.icon && <span className="mr-1">{item.icon}</span>}
          {item?.name}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-wasteland-400">{slot.equipped ? '⚡' : ''}</span>
          <input type="number" value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)} onBlur={handleQtyBlur} className="bg-wasteland-900 border border-wasteland-600 rounded p-0.5 text-wasteland-100 text-xs w-10 text-center" min="1" />
          <button onClick={() => onRemove(slot.id)} className="text-accent-red hover:text-red-400 ml-1">✕</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-2 text-xs mt-0.5 text-wasteland-500">
        <span>{item?.slot}</span>
        {isRanged && <span>🔫 {item?.current_ammo}/{item?.max_ammo}</span>}
        {item?.ammo_type && <span>({item.ammo_type?.name})</span>}
        <span>{item?.weight} кг</span>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-wasteland-500">Состояние:</span>
        <input type="range" min="0" max="100" value={localCond} onChange={(e) => setLocalCond(parseInt(e.target.value))} onMouseUp={() => onConditionChange(slot.id, localCond)} onTouchEnd={() => onConditionChange(slot.id, localCond)} className="flex-1 h-1 rounded" style={{ accentColor: localCond > 50 ? '#33cc33' : localCond > 20 ? '#cc6600' : '#cc3333' }} />
        <span className="text-wasteland-300 w-8">{localCond}%</span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <button onClick={() => setShowMods(!showMods)} className="text-wasteland-400 hover:text-wasteland-200 text-xs">
          {showMods ? '▲' : '▼'} Моды ({(slot.mods || []).length})
        </button>
        <button onClick={() => onAddMod(slot.id, item)} className="text-accent-green text-xs hover:underline">+ Мод</button>
        {showMods && (
          <div className="mt-1 space-y-1 w-full">
            {(slot.mods || []).map(mod => (
              <div key={mod.id} className="flex justify-between items-center bg-wasteland-800 p-1 rounded">
                <span className="text-wasteland-300">{mod.name}</span>
                <button onClick={() => onRemoveMod(slot.id, mod.id)} className="text-accent-red text-xs">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
