// src/components/InventoryPanel.jsx
import { useState, useEffect } from 'react';
import { api } from '../api';

export default function InventoryPanel({ character, onRefresh, socketRef }) {
  const [inv, setInv] = useState([]);
  const [error, setError] = useState('');
  const [weightInfo, setWeightInfo] = useState(null);
  const [expandedContainers, setExpandedContainers] = useState({});

  // Загрузка инвентаря
  useEffect(() => { setInv(character?.inventory || []); }, [character]);

  // Realtime: обновление инвентаря
  useEffect(() => {
    if (!socketRef?.current || !character?.id) return;
    const socket = socketRef.current;
    const handler = async (data) => {
      if (data.character_id === character.id) {
        const updated = await api.getCharacter(character.id);
        setInv(updated?.inventory || []);
      }
    };
    socket.on('inventory_updated', handler);
    return () => socket.off('inventory_updated', handler);
  }, [socketRef, character?.id]);

  // Вес
  useEffect(() => {
    if (!character?.id) return;
    api.getCharacterWeight(character.id).then(setWeightInfo).catch(() => {});
  }, [character?.id, inv]);

  const toggleContainer = (slotId) => {
    setExpandedContainers(prev => ({ ...prev, [slotId]: !prev[slotId] }));
  };

  const getDurabilityColor = (d) => {
    if (!d && d !== 0) return 'text-wasteland-400';
    if (d >= 80) return 'text-accent-green';
    if (d >= 50) return 'text-accent-yellow';
    if (d >= 20) return 'text-accent-orange';
    return 'text-accent-red';
  };

  const getWeaponIcon = (t) => t === 'melee' ? '🔪' : t === 'ranged' ? '🔫' : t === 'thrown' ? '🎯' : '';

  const containerSlots = inv.filter(s => s.item?.is_container);
  const equipped = inv.filter(s => s.equipped && !s.item?.is_container);
  const backpack = inv.filter(s => !s.equipped && s.slot_type === 'рюкзак' && !s.item?.is_container);
  const belt = inv.filter(s => !s.equipped && s.slot_type === 'пояс' && !s.item?.is_container);
  const other = inv.filter(s => !s.equipped && !['рюкзак', 'пояс'].includes(s.slot_type) && !s.item?.is_container && !s.parent_slot_id);
  const handsEquipped = equipped.filter(s => ['правая_рука', 'левая_рука'].includes(s.slot_type));
  const bodyEquipped = equipped.filter(s => s.slot_type === 'тело');
  const exoEquipped = equipped.filter(s => s.slot_type === 'экзоскелет');
  const beltSlotsMax = character?.belt_slots_max || 3;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-stylized text-accent-orange">Инвентарь</h2>

      {weightInfo && (
        <div className="bg-wasteland-800 p-3 rounded-lg border border-wasteland-600">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-wasteland-400">Вес</span>
            <span className={`font-bold ${weightInfo.percent > 110 ? 'text-accent-red' : weightInfo.percent > 85 ? 'text-accent-yellow' : 'text-wasteland-300'}`}>
              {weightInfo.totalWeight.toFixed(1)} / {weightInfo.maxWeight} кг ({weightInfo.percent}%)
            </span>
          </div>
          <div className="w-full h-2 bg-wasteland-900 rounded overflow-hidden">
            <div className={`h-full rounded transition-all ${weightInfo.percent > 110 ? 'bg-accent-red' : weightInfo.percent > 85 ? 'bg-accent-yellow' : 'bg-accent-green'}`} style={{ width: `${Math.min(100, weightInfo.percent)}%` }} />
          </div>
          {weightInfo.penalty.label !== 'Норма' && (
            <p className={`text-xs mt-1 ${weightInfo.penalty.label.includes('Помеха') ? 'text-accent-red' : 'text-accent-yellow'}`}>⚠️ {weightInfo.penalty.label}</p>
          )}
        </div>
      )}

      {error && <p className="text-accent-red text-sm bg-wasteland-800 p-3 rounded">{error}</p>}
      {inv.length === 0 && <p className="text-wasteland-500 text-sm text-center py-4">Инвентарь пуст</p>}

      {containerSlots.length > 0 && (
        <div>
          <h3 className="text-wasteland-400 text-xs uppercase mb-1 px-1">📦 Контейнеры</h3>
          {containerSlots.map(s => (
            <div key={s.id} onClick={() => toggleContainer(s.id)} className="bg-wasteland-800 p-2 rounded border border-accent-green/30 mb-1 cursor-pointer">
              <div className="flex items-center gap-1">
                <span className="text-accent-green text-xs">{expandedContainers[s.id] ? '📂' : '📦'}</span>
                <span className="text-wasteland-100 text-sm font-bold">{s.item?.name}</span>
                <span className="text-wasteland-500 text-xs ml-auto">{(s.children || []).length} / {s.item?.container_slots || 0}</span>
              </div>
              {expandedContainers[s.id] && (s.children || []).map(child => (
                <div key={child.id} className="ml-4 mt-1 bg-wasteland-700 p-1.5 rounded text-xs flex justify-between">
                  <span className="text-wasteland-200">{child.item?.name} ×{child.quantity}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {(handsEquipped.length > 0 || bodyEquipped.length > 0 || exoEquipped.length > 0) && (
        <div>
          <h3 className="text-wasteland-400 text-xs uppercase mb-1 px-1">⚡ Экипировано</h3>
          {handsEquipped.map(s => <SlotRow key={s.id} slot={s} getDurabilityColor={getDurabilityColor} getWeaponIcon={getWeaponIcon} />)}
          {bodyEquipped.map(s => <SlotRow key={s.id} slot={s} getDurabilityColor={getDurabilityColor} getWeaponIcon={getWeaponIcon} />)}
          {exoEquipped.map(s => <SlotRow key={s.id} slot={s} getDurabilityColor={getDurabilityColor} getWeaponIcon={getWeaponIcon} />)}
        </div>
      )}

      {belt.length > 0 && (
        <div>
          <h3 className="text-wasteland-400 text-xs uppercase mb-1 px-1">Пояс ({belt.length}/{beltSlotsMax})</h3>
          {belt.map(s => <SlotRow key={s.id} slot={s} getDurabilityColor={getDurabilityColor} getWeaponIcon={getWeaponIcon} />)}
        </div>
      )}

      <div>
        <h3 className="text-wasteland-400 text-xs uppercase mb-1 px-1">Рюкзак</h3>
        {backpack.length === 0 && other.length === 0 && <p className="text-wasteland-600 text-xs px-1">Пусто</p>}
        {backpack.map(s => <SlotRow key={s.id} slot={s} getDurabilityColor={getDurabilityColor} getWeaponIcon={getWeaponIcon} />)}
        {other.map(s => <SlotRow key={s.id} slot={s} getDurabilityColor={getDurabilityColor} getWeaponIcon={getWeaponIcon} />)}
      </div>
    </div>
  );
}

function SlotRow({ slot, getDurabilityColor, getWeaponIcon }) {
  const item = slot.item;
  const condition = slot.condition_percent ?? item?.condition_percent ?? 100;
  const isRanged = item?.slot === 'weapon' && item?.weapon_type === 'ranged';

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
            <div className="flex flex-wrap gap-1 mt-1">{(slot.mods || []).map(mod => <span key={mod.id} className="bg-wasteland-700 text-accent-yellow text-xs px-1 rounded">{mod.name}</span>)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
