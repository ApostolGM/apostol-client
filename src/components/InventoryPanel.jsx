import { useState, useEffect } from 'react';
import { api } from '../api';

export default function InventoryPanel({ character, onRefresh }) {
  const [inv, setInv] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => { setInv(character?.inventory || []); }, [character]);

  const totalWeight = inv.reduce((s, sl) => s + (sl.item?.weight || 0) * (sl.quantity || 1), 0);
  const maxWeight = character?.carry_weight_max || 50;
  const weightPercent = Math.min(100, (totalWeight / maxWeight) * 100);

  const refresh = async () => { await onRefresh(); };

  const getDurabilityColor = (d) => {
    if (!d && d !== 0) return 'text-wasteland-400';
    if (d >= 80) return 'text-accent-green';
    if (d >= 50) return 'text-accent-yellow';
    if (d >= 20) return 'text-accent-orange';
    return 'text-accent-red';
  };

  const getWeaponIcon = (t) => t === 'melee' ? '🔪' : t === 'ranged' ? '🔫' : t === 'thrown' ? '🎯' : '';

  const equipped = inv.filter(s => s.equipped);
  const backpack = inv.filter(s => !s.equipped && s.slot_type === 'рюкзак');
  const belt = inv.filter(s => !s.equipped && s.slot_type === 'пояс');
  const other = inv.filter(s => !s.equipped && !['рюкзак','пояс'].includes(s.slot_type));

  const handsEquipped = equipped.filter(s => ['правая_рука','левая_рука'].includes(s.slot_type));
  const bodyEquipped = equipped.filter(s => s.slot_type === 'тело');
  const exoEquipped = equipped.filter(s => s.slot_type === 'экзоскелет');

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-stylized text-accent-orange">Инвентарь</h2>

      <div className="bg-wasteland-800 p-3 rounded-lg border border-wasteland-600">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-wasteland-400">Вес</span>
          <span className={`font-bold ${weightPercent > 90 ? 'text-accent-red' : weightPercent > 70 ? 'text-accent-yellow' : 'text-wasteland-300'}`}>{totalWeight.toFixed(1)} / {maxWeight} кг</span>
        </div>
        <div className="w-full h-2 bg-wasteland-900 rounded overflow-hidden">
          <div className={`h-full rounded transition-all ${weightPercent > 90 ? 'bg-accent-red' : weightPercent > 70 ? 'bg-accent-yellow' : 'bg-accent-green'}`} style={{ width: `${weightPercent}%` }} />
        </div>
      </div>

      {error && <p className="text-accent-red text-sm bg-wasteland-800 p-3 rounded">{error}</p>}

      {inv.length === 0 && <p className="text-wasteland-500 text-sm text-center py-4">Инвентарь пуст</p>}

      {(handsEquipped.length > 0 || bodyEquipped.length > 0 || exoEquipped.length > 0) && (
        <div>
          <h3 className="text-wasteland-400 text-xs uppercase mb-1 px-1">⚡ Экипировано</h3>
          {handsEquipped.map(s => <SlotRow key={s.id} slot={s} refresh={refresh} getDurabilityColor={getDurabilityColor} getWeaponIcon={getWeaponIcon} />)}
          {bodyEquipped.map(s => <SlotRow key={s.id} slot={s} refresh={refresh} getDurabilityColor={getDurabilityColor} getWeaponIcon={getWeaponIcon} />)}
          {exoEquipped.map(s => <SlotRow key={s.id} slot={s} refresh={refresh} getDurabilityColor={getDurabilityColor} getWeaponIcon={getWeaponIcon} />)}
        </div>
      )}

      {belt.length > 0 && (
        <div>
          <h3 className="text-wasteland-400 text-xs uppercase mb-1 px-1">Пояс</h3>
          {belt.map(s => <SlotRow key={s.id} slot={s} refresh={refresh} getDurabilityColor={getDurabilityColor} getWeaponIcon={getWeaponIcon} />)}
        </div>
      )}

      <div>
        <h3 className="text-wasteland-400 text-xs uppercase mb-1 px-1">Рюкзак</h3>
        {backpack.length === 0 && other.length === 0 && <p className="text-wasteland-600 text-xs px-1">Пусто</p>}
        {backpack.map(s => <SlotRow key={s.id} slot={s} refresh={refresh} getDurabilityColor={getDurabilityColor} getWeaponIcon={getWeaponIcon} />)}
        {other.map(s => <SlotRow key={s.id} slot={s} refresh={refresh} getDurabilityColor={getDurabilityColor} getWeaponIcon={getWeaponIcon} />)}
      </div>
    </div>
  );
}

function SlotRow({ slot, refresh, getDurabilityColor, getWeaponIcon }) {
  const item = slot.item;
  const [busy, setBusy] = useState(false);
  const condition = slot.condition_percent ?? item?.condition_percent ?? 100;

  const act = async (fn) => {
    setBusy(true);
    try { await fn(); await refresh(); } catch (e) { console.error(e); }
    finally { setBusy(false); }
  };

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
            {item?.type && <span className="text-wasteland-400">{item.type}</span>}
            {item?.weapon_type === 'ranged' && <span className={item?.current_ammo === 0 ? 'text-accent-red' : 'text-wasteland-300'}>🔫 {item?.current_ammo}/{item?.max_ammo}</span>}
            <span className={getDurabilityColor(condition)}>🔧 {condition}%</span>
            {item?.weight > 0 && <span className="text-wasteland-500">{item.weight} кг</span>}
          </div>
          {slot.quantity > 1 && <span className="text-wasteland-400 text-xs">×{slot.quantity}</span>}
        </div>

        <div className="flex gap-1 ml-2 flex-shrink-0">
          {!slot.equipped && (item?.is_weapon || item?.is_armor || item?.type === 'броня' || item?.type === 'экзоскелет') && (
            <button onClick={() => act(() => api.equipItem(slot.id))} disabled={busy} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">⚡</button>
          )}
          {slot.equipped && (
            <button onClick={() => act(() => api.unequipItem(slot.id))} disabled={busy} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">📥</button>
          )}
          {slot.equipped && (item?.weapon_type === 'ranged' || item?.weapon_type === 'thrown') && (
            <button onClick={() => act(() => api.useItem(slot.id))} disabled={busy} className="text-xs bg-accent-red/20 hover:bg-accent-red/40 px-2 py-1 rounded text-accent-red">Исп</button>
          )}
          {!slot.equipped && item?.type === 'расходник' && item?.trade_category !== 'патроны' && (
            <button onClick={() => act(() => api.useItem(slot.id))} disabled={busy} className="text-xs bg-accent-green/20 hover:bg-accent-green/40 px-2 py-1 rounded text-accent-green">Исп</button>
          )}
          {slot.equipped && item?.weapon_type === 'ranged' && (item?.current_ammo || 0) < (item?.max_ammo || 0) && (
            <button onClick={() => act(() => api.reloadWeapon(slot.id))} disabled={busy} className="text-xs bg-accent-yellow/20 hover:bg-accent-yellow/40 px-2 py-1 rounded text-accent-yellow">🔄</button>
          )}
        </div>
      </div>
    </div>
  );
}
