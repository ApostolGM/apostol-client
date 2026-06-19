// components/panels/inventory/SlotRow.jsx
import { useState } from 'react';
import { inventory } from '../../../api/inventory.js';

export default function SlotRow({ slot, onRefresh }) {
  const item = slot.item;
  const [busy, setBusy] = useState(false);
  const [shotsCount, setShotsCount] = useState(1);
  const condition = slot.condition_percent ?? item?.condition_percent ?? 100;

  const rules = item?.item_slot?.rules || {};
  const actions = rules.actions || [];
  const canEquip = rules.equippable || false;

  const act = async (fn) => {
    setBusy(true);
    try { await fn(); await onRefresh(); }
    catch (e) { console.error(e); }
    finally { setBusy(false); }
  };

  const getDurabilityColor = (d) => {
    if (!d && d !== 0) return 'text-wasteland-400';
    if (d >= 80) return 'text-accent-green';
    if (d >= 50) return 'text-accent-yellow';
    if (d >= 20) return 'text-accent-orange';
    return 'text-accent-red';
  };

  const getIconUrl = () => item?.icon_data?.url || null;

  // Для оружия с патронами
  const currentAmmo = item?.current_ammo || 0;
  const maxAmmo = item?.max_ammo || 0;
  const ammoPerShot = item?.ammo_per_shot || 1;
  const maxShots = item?.shots_per_action || 1;
  const maxPossibleShots = maxAmmo > 0 ? Math.floor(currentAmmo / ammoPerShot) : 0;

  // Есть ли действие attack
  const attackAction = actions.find(a => a.name === 'attack');
  const reloadAction = actions.find(a => a.name === 'reload');
  const hasRangedAttack = attackAction?.consume_ammo && attackAction?.roll_per_shot;
  const hasThrowAttack = attackAction?.destroy_on_use;

  return (
    <div className={`bg-wasteland-800 p-2 rounded border mb-1 ${slot.equipped ? 'border-accent-orange' : 'border-wasteland-600'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            {slot.equipped && <span className="text-accent-orange text-xs">⚡</span>}
            {getIconUrl() && <img src={getIconUrl()} alt="" className="w-4 h-4 object-contain" />}
            <span className="text-wasteland-100 text-sm font-bold truncate">{item?.name}</span>
            {item?.is_heavy && <span className="text-xs text-wasteland-400">(тяж)</span>}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0 text-xs mt-0.5">
            <span className="text-wasteland-400">{item?.item_slot?.name || item?.slot}</span>
            {maxAmmo > 0 && (
              <span className={currentAmmo === 0 ? 'text-accent-red' : 'text-wasteland-300'}>
                ◉ {currentAmmo}/{maxAmmo}
              </span>
            )}
            <span className={getDurabilityColor(condition)}>⚙ {condition}%</span>
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
          {/* Экипировка */}
          {!slot.equipped && canEquip && (
            <button onClick={() => act(() => inventory.equipItem(slot.id))} disabled={busy}
              className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">
              ⚡
            </button>
          )}
          {slot.equipped && (
            <button onClick={() => act(() => inventory.unequipItem(slot.id))} disabled={busy}
              className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">
              ⇣
            </button>
          )}

          {/* Атака с патронами */}
          {slot.equipped && hasRangedAttack && maxPossibleShots > 0 && (
            <>
              <input type="range" min="1" max={Math.min(maxShots, maxPossibleShots)}
                value={Math.min(shotsCount, maxPossibleShots)}
                onChange={e => setShotsCount(parseInt(e.target.value))} className="w-12 h-1" />
              <span className="text-wasteland-400 text-xs">{Math.min(shotsCount, maxPossibleShots)}</span>
              <button onClick={() => act(() => inventory.useItem(slot.id, shotsCount))} disabled={busy}
                className="text-xs bg-accent-red/20 hover:bg-accent-red/40 px-2 py-1 rounded text-accent-red">
                {attackAction.label || 'Атака'}
              </button>
            </>
          )}
          {slot.equipped && hasRangedAttack && maxPossibleShots === 0 && (
            <span className="text-accent-red text-xs">Нет патронов</span>
          )}

          {/* Метательное */}
          {slot.equipped && hasThrowAttack && (
            <button onClick={() => act(() => inventory.useItem(slot.id))} disabled={busy}
              className="text-xs bg-accent-red/20 hover:bg-accent-red/40 px-2 py-1 rounded text-accent-red">
              {attackAction.label || 'Метнуть'}
            </button>
          )}

          {/* Перезарядка */}
          {slot.equipped && reloadAction && currentAmmo < maxAmmo && (
            <button onClick={() => act(() => inventory.reloadWeapon(slot.id, item?.ammo_type_id))} disabled={busy}
              className="text-xs bg-accent-yellow/20 hover:bg-accent-yellow/40 px-2 py-1 rounded text-accent-yellow">
              ↻
            </button>
          )}

          {/* Обычное использование (для не-оружия с действиями) */}
          {!slot.equipped && actions.length > 0 && !canEquip && (
            <button onClick={() => act(() => inventory.useItem(slot.id))} disabled={busy}
              className="text-xs bg-accent-green/20 hover:bg-accent-green/40 px-2 py-1 rounded text-accent-green">
              {actions[0].label || 'Исп'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
