// src/components/InventoryPanel.jsx
import { useState, useEffect } from 'react';
import { api } from '../api';

export default function InventoryPanel({ character, onRefresh, socketRef, allItems, ammoTypes }) {
  const [inv, setInv] = useState([]);
  const [weightInfo, setWeightInfo] = useState(null);
  const [error, setError] = useState('');
  const [showModMenu, setShowModMenu] = useState(null);
  const [reloadMenu, setReloadMenu] = useState(null);

  useEffect(() => { setInv(character?.inventory || []); }, [character]);

  // Вес
  useEffect(() => {
    if (character?.id) {
      api.getCharacterWeight(character.id).then(setWeightInfo).catch(() => {});
    }
  }, [character?.id, inv]);

  // Сокет
  useEffect(() => {
    if (!socketRef?.current) return;
    const handler = (data) => { if (data.character_id === character?.id) onRefresh(); };
    socketRef.current.on('inventory_updated', handler);
    return () => socketRef.current?.off('inventory_updated', handler);
  }, [socketRef, character?.id, onRefresh]);

  const refresh = async () => { await onRefresh(); };

  const getDurabilityColor = (d) => {
    if (!d && d !== 0) return 'text-wasteland-400';
    if (d >= 80) return 'text-accent-green';
    if (d >= 50) return 'text-accent-yellow';
    if (d >= 20) return 'text-accent-orange';
    return 'text-accent-red';
  };

  const getWeaponIcon = (t) => t === 'melee' ? '🔪' : t === 'ranged' ? '🔫' : t === 'thrown' ? '🎯' : '';

  const getWeightColor = (p) => {
    if (p <= 70) return 'text-accent-green';
    if (p <= 85) return 'text-accent-yellow';
    if (p <= 95) return 'text-accent-orange';
    return 'text-accent-red';
  };

  const equipped = inv.filter(s => s.equipped);
  const backpack = inv.filter(s => !s.equipped && s.slot_type === 'рюкзак');
  const belt = inv.filter(s => !s.equipped && s.slot_type === 'пояс');
  const other = inv.filter(s => !s.equipped && !['рюкзак','пояс'].includes(s.slot_type));
  const handsEquipped = equipped.filter(s => ['правая_рука','левая_рука'].includes(s.slot_type));
  const bodyEquipped = equipped.filter(s => s.slot_type === 'тело');
  const exoEquipped = equipped.filter(s => s.slot_type === 'экзоскелет');

  const getAvailableMods = (slot) => {
    if (!slot?.item) return [];
    return (allItems || []).filter(i => {
      if (i.slot !== 'mod') return false;
      if (i.mod_target === 'any') return true;
      if (i.mod_target === 'weapon' && slot.item.slot === 'weapon') {
        if (!i.weapon_mod_subtype || i.weapon_mod_subtype === 'any') return true;
        return i.weapon_mod_subtype === slot.item.weapon_type;
      }
      return i.mod_target === slot.item.slot;
    });
  };

  const getAvailableAmmo = (slot) => {
    if (!slot?.item || slot.item.slot !== 'weapon' || slot.item.weapon_type !== 'ranged') return [];
    const accepted = slot.item.accepted_ammo_types || [];
    return (character?.inventory || []).filter(s => {
      if (!s.equipped && s.item?.slot === 'ammo') {
        if (accepted.length > 0) return accepted.includes(s.item.ammo_type_id);
        return s.item.ammo_type_id === slot.item.ammo_type_id;
      }
      return false;
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-stylized text-accent-orange">Инвентарь</h2>

      {/* Вес */}
      {weightInfo && (
        <div className="bg-wasteland-800 p-3 rounded-lg border border-wasteland-600">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-wasteland-400">Вес</span>
            <span className={`font-bold ${getWeightColor(weightInfo.percent)}`}>
              {weightInfo.totalWeight.toFixed(1)} / {weightInfo.maxWeight} кг ({weightInfo.percent}%)
            </span>
          </div>
          <div className="w-full h-2 bg-wasteland-900 rounded overflow-hidden">
            <div
              className={`h-full rounded transition-all ${weightInfo.percent > 95 ? 'bg-accent-red' : weightInfo.percent > 70 ? 'bg-accent-yellow' : 'bg-accent-green'}`}
              style={{ width: `${Math.min(100, weightInfo.percent)}%` }}
            />
          </div>
          {weightInfo.penalty.label !== 'Норма' && (
            <p className="text-accent-red text-xs mt-1">⚠️ {weightInfo.penalty.label}</p>
          )}
        </div>
      )}

      {error && <p className="text-accent-red text-sm bg-wasteland-800 p-3 rounded">{error}</p>}
      {inv.length === 0 && <p className="text-wasteland-500 text-sm text-center py-4">Инвентарь пуст</p>}

      {(handsEquipped.length > 0 || bodyEquipped.length > 0 || exoEquipped.length > 0) && (
        <div>
          <h3 className="text-wasteland-400 text-xs uppercase mb-1 px-1">⚡ Экипировано</h3>
          {handsEquipped.map(s => <SlotRow key={s.id} slot={s} refresh={refresh} getDurabilityColor={getDurabilityColor} getWeaponIcon={getWeaponIcon} showModMenu={showModMenu} setShowModMenu={setShowModMenu} reloadMenu={reloadMenu} setReloadMenu={setReloadMenu} getAvailableMods={getAvailableMods} getAvailableAmmo={getAvailableAmmo} />)}
          {bodyEquipped.map(s => <SlotRow key={s.id} slot={s} refresh={refresh} getDurabilityColor={getDurabilityColor} getWeaponIcon={getWeaponIcon} showModMenu={showModMenu} setShowModMenu={setShowModMenu} reloadMenu={reloadMenu} setReloadMenu={setReloadMenu} getAvailableMods={getAvailableMods} getAvailableAmmo={getAvailableAmmo} />)}
          {exoEquipped.map(s => <SlotRow key={s.id} slot={s} refresh={refresh} getDurabilityColor={getDurabilityColor} getWeaponIcon={getWeaponIcon} showModMenu={showModMenu} setShowModMenu={setShowModMenu} reloadMenu={reloadMenu} setReloadMenu={setReloadMenu} getAvailableMods={getAvailableMods} getAvailableAmmo={getAvailableAmmo} />)}
        </div>
      )}

      {belt.length > 0 && (
        <div>
          <h3 className="text-wasteland-400 text-xs uppercase mb-1 px-1">Пояс ({belt.length}/{character?.belt_slots_max || 3})</h3>
          {belt.map(s => <SlotRow key={s.id} slot={s} refresh={refresh} getDurabilityColor={getDurabilityColor} getWeaponIcon={getWeaponIcon} showModMenu={showModMenu} setShowModMenu={setShowModMenu} reloadMenu={reloadMenu} setReloadMenu={setReloadMenu} getAvailableMods={getAvailableMods} getAvailableAmmo={getAvailableAmmo} />)}
        </div>
      )}

      <div>
        <h3 className="text-wasteland-400 text-xs uppercase mb-1 px-1">Рюкзак</h3>
        {backpack.length === 0 && other.length === 0 && <p className="text-wasteland-600 text-xs px-1">Пусто</p>}
        {backpack.map(s => <SlotRow key={s.id} slot={s} refresh={refresh} getDurabilityColor={getDurabilityColor} getWeaponIcon={getWeaponIcon} showModMenu={showModMenu} setShowModMenu={setShowModMenu} reloadMenu={reloadMenu} setReloadMenu={setReloadMenu} getAvailableMods={getAvailableMods} getAvailableAmmo={getAvailableAmmo} />)}
        {other.map(s => <SlotRow key={s.id} slot={s} refresh={refresh} getDurabilityColor={getDurabilityColor} getWeaponIcon={getWeaponIcon} showModMenu={showModMenu} setShowModMenu={setShowModMenu} reloadMenu={reloadMenu} setReloadMenu={setReloadMenu} getAvailableMods={getAvailableMods} getAvailableAmmo={getAvailableAmmo} />)}
      </div>
    </div>
  );
}

function SlotRow({ slot, refresh, getDurabilityColor, getWeaponIcon, showModMenu, setShowModMenu, reloadMenu, setReloadMenu, getAvailableMods, getAvailableAmmo }) {
  const item = slot.item;
  const [busy, setBusy] = useState(false);
  const condition = slot.condition_percent ?? item?.condition_percent ?? 100;

  const act = async (fn) => {
    setBusy(true);
    try { await fn(); await refresh(); } catch (e) { console.error(e); }
    finally { setBusy(false); }
  };

  const availableMods = getAvailableMods(slot);
  const availableAmmo = getAvailableAmmo(slot);

  return (
    <div className={`bg-wasteland-800 p-2 rounded border mb-1 ${slot.equipped ? 'border-accent-orange' : 'border-wasteland-600'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            {slot.equipped && <span className="text-accent-orange text-xs">⚡</span>}
            <span className="text-wasteland-100 text-sm font-bold truncate">{getWeaponIcon(item?.weapon_type)} {item?.name}</span>
            {item?.is_heavy && <span className="text-xs text-wasteland-400">(тяж)</span>}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0 text-xs mt-0.5">
            {item?.slot && <span className="text-wasteland-400">{item.slot === 'weapon' ? 'оружие' : item.slot === 'armor' ? 'броня' : item.slot === 'exo' ? 'экзо' : item.slot}</span>}
            {item?.weapon_type === 'ranged' && (
              <span className={item?.current_ammo === 0 ? 'text-accent-red' : 'text-wasteland-300'}>
                🔫 {item?.current_ammo}/{item?.max_ammo} {item?.ammo_type?.name ? `(${item.ammo_type.name})` : ''}
              </span>
            )}
            <span className={getDurabilityColor(condition)}>🔧 {condition}%</span>
            {item?.weight > 0 && <span className="text-wasteland-500">{item.weight} кг</span>}
          </div>
          {(slot.mods || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {(slot.mods || []).map(mod => (
                <span key={mod.id} className="text-xs bg-wasteland-700 text-accent-yellow px-1 py-0.5 rounded flex items-center gap-1">
                  {mod.name}
                  <button onClick={() => act(() => api.removeMod(slot.id, mod.id))} className="text-accent-red hover:text-red-400">✕</button>
                </span>
              ))}
            </div>
          )}
          {slot.quantity > 1 && <span className="text-wasteland-400 text-xs">×{slot.quantity}</span>}
        </div>

        <div className="flex gap-1 ml-2 flex-shrink-0">
          {!slot.equipped && (item?.slot === 'weapon' || item?.slot === 'armor' || item?.slot === 'exo') && (
            <button onClick={() => act(() => api.equipItem(slot.id))} disabled={busy} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">⚡</button>
          )}
          {slot.equipped && (
            <button onClick={() => act(() => api.unequipItem(slot.id))} disabled={busy} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">📥</button>
          )}
          {slot.equipped && (item?.weapon_type === 'ranged' || item?.weapon_type === 'thrown') && (
            <button onClick={() => act(() => api.useItem(slot.id))} disabled={busy} className="text-xs bg-accent-red/20 hover:bg-accent-red/40 px-2 py-1 rounded text-accent-red">Исп</button>
          )}
          {!slot.equipped && item?.slot === 'consumable' && (
            <button onClick={() => act(() => api.useItem(slot.id))} disabled={busy} className="text-xs bg-accent-green/20 hover:bg-accent-green/40 px-2 py-1 rounded text-accent-green">Исп</button>
          )}
          {slot.equipped && item?.weapon_type === 'ranged' && (item?.current_ammo || 0) < (item?.max_ammo || 0) && availableAmmo.length > 0 && (
            <div className="relative">
              <button onClick={() => setReloadMenu(reloadMenu === slot.id ? null : slot.id)} disabled={busy} className="text-xs bg-accent-yellow/20 hover:bg-accent-yellow/40 px-2 py-1 rounded text-accent-yellow">🔄</button>
              {reloadMenu === slot.id && (
                <div className="absolute right-0 top-full mt-1 bg-wasteland-700 border border-wasteland-600 rounded p-1 z-40 min-w-[150px]">
                  {availableAmmo.map(ammo => (
                    <button key={ammo.id} onClick={() => { act(() => api.reloadWeapon(slot.id, ammo.item.ammo_type_id)); setReloadMenu(null); }} className="block w-full text-left text-xs px-2 py-1 hover:bg-wasteland-600 text-wasteland-200">
                      {ammo.item.name} (×{ammo.quantity})
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {availableMods.length > 0 && (
            <div className="relative">
              <button onClick={() => setShowModMenu(showModMenu === slot.id ? null : slot.id)} disabled={busy} className="text-xs bg-accent-green/20 hover:bg-accent-green/40 px-2 py-1 rounded text-accent-green">+</button>
              {showModMenu === slot.id && (
                <div className="absolute right-0 top-full mt-1 bg-wasteland-700 border border-wasteland-600 rounded p-1 z-40 min-w-[150px] max-h-32 overflow-y-auto">
                  {availableMods.map(mod => (
                    <button key={mod.id} onClick={() => { act(() => api.addMod(slot.id, mod.id)); setShowModMenu(null); }} className="block w-full text-left text-xs px-2 py-1 hover:bg-wasteland-600 text-wasteland-200">
                      {mod.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
