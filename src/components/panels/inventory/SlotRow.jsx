// components/panels/inventory/SlotRow.jsx
import { useState } from 'react';
import { inventory } from '../../../api/inventory.js';

export default function SlotRow({ slot, onRefresh }) {
  const item = slot.item;
  const [busy, setBusy] = useState(false);
  const [shotsCount, setShotsCount] = useState(item?.shots_per_action || 1);
  const condition = slot.condition_percent ?? item?.condition_percent ?? 100;

  const act = async (fn) => {
    setBusy(true);
    try { await fn(); await onRefresh(); }
    catch (e) { console.error(e); }
    finally { setBusy(false); }
  };

  const slotName = item?.item_slot?.name || item?.slot;
  const isRanged = slotName === 'weapon' && item?.weapon_type === 'ranged';
  const isThrown = slotName === 'weapon' && item?.weapon_type === 'thrown';
  const isConsumable = slotName === 'consumable';
  const maxShots = item?.shots_per_action || 1;
  const currentAmmo = item?.current_ammo || 0;
  const ammoPerShot = item?.ammo_per_shot || 1;
  const maxPossibleShots = Math.floor(currentAmmo / ammoPerShot);

  const getDurabilityColor = (d) => {
    if (!d && d !== 0) return 'text-wasteland-400';
    if (d >= 80) return 'text-accent-green';
    if (d >= 50) return 'text-accent-yellow';
    if (d >= 20) return 'text-accent-orange';
    return 'text-accent-red';
  };

  return (
    <div className={`bg-wasteland-800 p-2 rounded border mb-1 ${slot.equipped ? 'border-accent-orange' : 'border-wasteland-600'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            {slot.equipped && <span className="text-accent-orange text-xs">⚡</span>}
            {item?.icon && <span>{item.icon}</span>}
            <span className="text-wasteland-100 text-sm font-bold truncate">{item?.name}</span>
            {item?.is_heavy && <span className="text-xs text-wasteland-400">(тяж)</span>}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0 text-xs mt-0.5">
            <span className="text-wasteland-400">{slotName}</span>
            {isRanged && (
              <span className={currentAmmo === 0 ? 'text-accent-red' : 'text-wasteland-300'}>
                🔫 {currentAmmo}/{item?.max_ammo}
              </span>
            )}
            <span className={getDurabilityColor(condition)}>🔧 {condition}%</span>
            {item?.weight > 0 && <span className="text-wasteland-500">{item.weight} кг</span>}
          </div>
          {slot.quantity > 1 && <span className="text-wasteland-400 text-xs">×{slot.quantity}</span>}
          {(slot.mods || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {slot.mods.map(mod => <span key={mod.id} className="bg-wasteland-700 text-accent-yellow text-xs px-1 rounded">{mod.name}</span>)}
            </div>
          )}
        </div>

        <div className="flex gap-1 ml-2 flex-shrink-0 items-center">
          {!slot.equipped && (slotName === 'weapon' || slotName === 'armor' || slotName === 'exo') && (
            <button onClick={() => act(() => inventory.equipItem(slot.id))} disabled={busy} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">⚡</button>
          )}
          {slot.equipped && (
            <button onClick={() => act(() => inventory.unequipItem(slot.id))} disabled={busy} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">📥</button>
          )}
          {slot.equipped && isRanged && maxPossibleShots > 0 && (
            <>
              <input type="range" min="1" max={Math.min(maxShots, maxPossibleShots)} value={Math.min(shotsCount, maxPossibleShots)}
                onChange={e => setShotsCount(parseInt(e.target.value))} className="w-12 h-1" />
              <span className="text-wasteland-400 text-xs">{shotsCount}</span>
              <button onClick={() => act(() => inventory.useItem(slot.id, shotsCount))} disabled={busy}
                className="text-xs bg-accent-red/20 hover:bg-accent-red/40 px-2 py-1 rounded text-accent-red">
                Выстр
              </button>
            </>
          )}
          {slot.equipped && isRanged && maxPossibleShots === 0 && (
            <span className="text-accent-red text-xs">Нет патронов</span>
          )}
          {slot.equipped && isThrown && (
            <button onClick={() => act(() => inventory.useItem(slot.id))} disabled={busy} className="text-xs bg-accent-red/20 hover:bg-accent-red/40 px-2 py-1 rounded text-accent-red">Метнуть</button>
          )}
          {!slot.equipped && isConsumable && (
            <button onClick={() => act(() => inventory.useItem(slot.id))} disabled={busy} className="text-xs bg-accent-green/20 hover:bg-accent-green/40 px-2 py-1 rounded text-accent-green">Исп</button>
          )}
          {slot.equipped && isRanged && currentAmmo < (item?.max_ammo || 0) && (
            <button onClick={() => act(() => inventory.reloadWeapon(slot.id, item?.ammo_type_id))} disabled={busy} className="text-xs bg-accent-yellow/20 hover:bg-accent-yellow/40 px-2 py-1 rounded text-accent-yellow">🔄</button>
          )}
        </div>
      </div>
    </div>
  );
}
