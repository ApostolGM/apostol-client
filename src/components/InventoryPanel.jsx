import { useState, useEffect } from 'react';
import { api } from '../api';

export default function InventoryPanel({ character, onRefresh }) {
  const [items, setItems] = useState([]);
  const [inv, setInv] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => { api.getItems().then(setItems).catch(console.error); }, []);
  useEffect(() => { setInv(character?.inventory || []); }, [character]);

  const totalWeight = inv.reduce((s, sl) => s + (sl.item?.weight || 0) * (sl.quantity || 1), 0);
  const maxWeight = character?.carry_weight_max || 50;
  const weightPercent = Math.min(100, (totalWeight / maxWeight) * 100);

  const refresh = async () => { await onRefresh(); };

  const handleAdd = async () => {
    if (!selectedItem || !character) return;
    setLoading(true); setError('');
    try { await api.addItem(character.id, selectedItem, quantity, 'рюкзак'); await refresh(); setShowAdd(false); setSelectedItem(''); setQuantity(1); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const getDurabilityColor = (d) => {
    if (!d) return 'text-wasteland-400';
    if (d === 'отличное') return 'text-accent-green';
    if (d === 'хорошее') return 'text-accent-yellow';
    if (d === 'изношенное') return 'text-accent-orange';
    if (d === 'сломанное') return 'text-accent-red';
    return 'text-wasteland-400';
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-stylized text-accent-orange">Инвентарь</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-accent-orange text-wasteland-900 text-sm font-bold px-4 py-2 rounded hover:bg-orange-500 transition">
          {showAdd ? '✕' : '+ Добавить'}
        </button>
      </div>

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

      {showAdd && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 space-y-3">
          <h3 className="text-wasteland-300 text-sm">Добавить предмет</h3>
          <select className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm" value={selectedItem} onChange={e => setSelectedItem(e.target.value)}>
            <option value="">Выберите...</option>
            {items.map(item => <option key={item.id} value={item.id}>{item.name} ({item.type}) — {item.weight} кг</option>)}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-wasteland-400 text-sm">Кол-во:</span>
            <input type="number" min="1" max="99" value={quantity} onChange={e => setQuantity(parseInt(e.target.value)||1)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 w-16 text-center" />
          </div>
          <button onClick={handleAdd} disabled={!selectedItem || loading} className="w-full bg-accent-orange text-wasteland-900 font-bold py-2 rounded text-sm hover:bg-orange-500 transition disabled:opacity-50">{loading ? '...' : 'Добавить'}</button>
        </div>
      )}

      {inv.length === 0 && <p className="text-wasteland-500 text-sm text-center py-4">Инвентарь пуст</p>}

      {/* Экипировка */}
      {(handsEquipped.length > 0 || bodyEquipped.length > 0 || exoEquipped.length > 0) && (
        <div>
          <h3 className="text-wasteland-400 text-xs uppercase mb-1 px-1">⚡ Экипировано</h3>
          {handsEquipped.map(s => <SlotRow key={s.id} slot={s} refresh={refresh} getDurabilityColor={getDurabilityColor} getWeaponIcon={getWeaponIcon} />)}
          {bodyEquipped.map(s => <SlotRow key={s.id} slot={s} refresh={refresh} getDurabilityColor={getDurabilityColor} getWeaponIcon={getWeaponIcon} />)}
          {exoEquipped.map(s => <SlotRow key={s.id} slot={s} refresh={refresh} getDurabilityColor={getDurabilityColor} getWeaponIcon={getWeaponIcon} />)}
        </div>
      )}

      {/* Пояс */}
      {belt.length > 0 && (
        <div>
          <h3 className="text-wasteland-400 text-xs uppercase mb-1 px-1">Пояс</h3>
          {belt.map(s => <SlotRow key={s.id} slot={s} refresh={refresh} getDurabilityColor={getDurabilityColor} getWeaponIcon={getWeaponIcon} />)}
        </div>
      )}

      {/* Рюкзак */}
      <div>
        <h3 className="text-wasteland-400 text-xs uppercase mb-1 px-1">Рюкзак</h3>
        {backpack.length === 0 && <p className="text-wasteland-600 text-xs px-1">Пусто</p>}
        {backpack.map(s => <SlotRow key={s.id} slot={s} refresh={refresh} getDurabilityColor={getDurabilityColor} getWeaponIcon={getWeaponIcon} />)}
        {other.map(s => <SlotRow key={s.id} slot={s} refresh={refresh} getDurabilityColor={getDurabilityColor} getWeaponIcon={getWeaponIcon} />)}
      </div>
    </div>
  );
}

function SlotRow({ slot, refresh, getDurabilityColor, getWeaponIcon }) {
  const item = slot.item;
  const [busy, setBusy] = useState(false);

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
            {item?.durability && <span className={getDurabilityColor(item.durability)}>🔧 {item.durability}</span>}
            {item?.weight > 0 && <span className="text-wasteland-500">{item.weight} кг</span>}
          </div>
          {slot.quantity > 1 && <span className="text-wasteland-400 text-xs">×{slot.quantity}</span>}
        </div>

        <div className="flex gap-1 ml-2 flex-shrink-0">
          {/* Экипировать */}
          {!slot.equipped && (item?.is_weapon || item?.is_armor || item?.type === 'броня' || item?.type === 'экзоскелет') && (
            <button onClick={() => act(() => api.equipItem(slot.id))} disabled={busy} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">⚡</button>
          )}
          {/* Снять */}
          {slot.equipped && (
            <button onClick={() => act(() => api.unequipItem(slot.id))} disabled={busy} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">📥</button>
          )}
          {/* Использовать */}
          {slot.equipped && (item?.weapon_type === 'ranged' || item?.weapon_type === 'thrown') && (
            <button onClick={() => act(() => api.useItem(slot.id))} disabled={busy} className="text-xs bg-accent-red/20 hover:bg-accent-red/40 px-2 py-1 rounded text-accent-red">Исп</button>
          )}
          {!slot.equipped && item?.type === 'расходник' && (
            <button onClick={() => act(() => api.useItem(slot.id))} disabled={busy} className="text-xs bg-accent-green/20 hover:bg-accent-green/40 px-2 py-1 rounded text-accent-green">Исп</button>
          )}
          {/* Перезарядить */}
          {slot.equipped && item?.weapon_type === 'ranged' && (item?.current_ammo || 0) < (item?.max_ammo || 0) && (
            <button onClick={() => act(() => api.reloadWeapon(slot.id))} disabled={busy} className="text-xs bg-accent-yellow/20 hover:bg-accent-yellow/40 px-2 py-1 rounded text-accent-yellow">🔄</button>
          )}
          {/* Удалить */}
          <button onClick={() => act(() => api.removeItem(slot.id, 1))} disabled={busy} className="text-xs bg-wasteland-700 hover:bg-accent-red/50 px-2 py-1 rounded text-wasteland-400">🗑️</button>
        </div>
      </div>
    </div>
  );
}
