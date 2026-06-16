// components/panels/inventory/SlotRow.jsx
import { useState } from 'react';
import { inventory } from '../../../api/inventory.js';

export default function SlotRow({ slot, onRefresh }) {
  const item = slot.item;
  const [busy, setBusy] = useState(false);
  const condition = slot.condition_percent ?? item?.condition_percent ?? 100;

  const act = async (fn) => {
    setBusy(true);
    try { await fn(); await onRefresh(); }
    catch (e) { console.error(e); }
    finally { setBusy(false); }
  };

  const canEquip = item?.slot === 'weapon' || item?.slot === 'armor' || item?.slot === 'exo';
  const isRanged = item?.slot === 'weapon' && item?.weapon_type === 'ranged';
  const isThrown = item?.slot === 'weapon' && item?.weapon_type === 'thrown';
  const isConsumable = item?.slot === 'consumable' || item?.slot === 'ammo';

  const getDurabilityColor = (d) => {
    if (!d && d !== 0) return 'text-wasteland-400';
    if (d >= 80) return 'text-accent-green';
    if (d >= 50) return 'text-accent-yellow';
    if (d >= 20) return 'text-accent-orange';
    return 'text-accent-red';
  };

  const getWeaponIcon = (t) => t === 'melee' ? '🔪' : t === 'ranged' ? '🔫' : t === 'thrown' ? '🎯' : '';

  return (
    <div className={`bg-wasteland-800 p-2 rounded border mb-1 ${slot.equipped ? 'border-accent-orange' : 'border-wasteland-600'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            {slot.equipped && <span className="text-accent-orange text-xs">⚡</span>}
            {item?.icon && <span className="mr-1">{item.icon}</span>}
            <span className="text-wasteland-100 text-sm font-bold truncate">{getWeaponIcon(item?.weapon_type)} {item?.name}</span>
            {item?.is_heavy && <span className="text-xs text-wasteland-400">(тяж)</span>}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0 text-xs mt-0.5">
            <span className="text-wasteland-400">{item?.slot}</span>
            {isRanged && <span className={(item?.current_ammo || 0) === 0 ? 'text-accent-red' : 'text-wasteland-300'}>🔫 {item?.current_ammo}/{item?.max_ammo}</span>}
            <span className={getDurabilityColor(condition)}>🔧 {condition}%</span>
            {item?.weight > 0 && <span className="text-wasteland-500">{item.weight} кг</span>}
          </div>
          {slot.quantity > 1 && <span className="text-wasteland-400 text-xs">×{slot.quantity}</span>}
          {(slot.mods || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {(slot.mods || []).map(mod => <span key={mod.id} className="bg-wasteland-700 text-accent-yellow text-xs px-1 rounded">{mod.name}</span>)}
            </div>
          )}
        </div>

        <div className="flex gap-1 ml-2 flex-shrink-0">
          {!slot.equipped && canEquip && <button onClick={() => act(() => inventory.equipItem(slot.id))} disabled={busy} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">⚡</button>}
          {slot.equipped && <button onClick={() => act(() => inventory.unequipItem(slot.id))} disabled={busy} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">📥</button>}
          {slot.equipped && (isRanged || isThrown) && <button onClick={() => act(() => inventory.useItem(slot.id))} disabled={busy} className="text-xs bg-accent-red/20 hover:bg-accent-red/40 px-2 py-1 rounded text-accent-red">Исп</button>}
          {!slot.equipped && isConsumable && <button onClick={() => act(() => inventory.useItem(slot.id))} disabled={busy} className="text-xs bg-accent-green/20 hover:bg-accent-green/40 px-2 py-1 rounded text-accent-green">Исп</button>}
          {slot.equipped && isRanged && (item?.current_ammo || 0) < (item?.max_ammo || 0) && <button onClick={() => act(() => inventory.reloadWeapon(slot.id, item?.ammo_type_id))} disabled={busy} className="text-xs bg-accent-yellow/20 hover:bg-accent-yellow/40 px-2 py-1 rounded text-accent-yellow">🔄</button>}
        </div>
      </div>
    </div>
  );
}
