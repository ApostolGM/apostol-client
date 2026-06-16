// components/panels/InventoryPanel.jsx
import { useState, useEffect } from 'react';
import { characters } from '../../api/characters.js';
import WeightBar from '../ui/WeightBar.jsx';
import SlotRow from './inventory/SlotRow.jsx';

export default function InventoryPanel({ character, onRefresh, socketRef }) {
  const [inv, setInv] = useState([]);
  const [weightInfo, setWeightInfo] = useState(null);
  const [expandedContainers, setExpandedContainers] = useState({});

  useEffect(() => { setInv(character?.inventory || []); }, [character]);

  useEffect(() => {
    if (!socketRef?.current || !character?.id) return;
    const socket = socketRef.current;
    const handler = async (data) => {
      if (data.character_id === character.id) {
        const updated = await characters.get(character.id);
        setInv(updated?.inventory || []);
      }
    };
    socket.on('inventory_updated', handler);
    return () => socket.off('inventory_updated', handler);
  }, [socketRef, character?.id]);

  useEffect(() => {
    if (!character?.id) return;
    characters.getWeight(character.id).then(setWeightInfo).catch(() => {});
  }, [character?.id, inv]);

  const toggleContainer = (slotId) => setExpandedContainers(prev => ({ ...prev, [slotId]: !prev[slotId] }));

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
      {weightInfo && <WeightBar weightInfo={weightInfo} />}
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
                <div key={child.id} className="ml-4 mt-1 bg-wasteland-700 p-1.5 rounded text-xs flex justify-between items-center">
                  <span className="text-wasteland-200">{child.item?.name} ×{child.quantity}</span>
                  <button onClick={(e) => { e.stopPropagation(); /* use action */ }} className="text-accent-green hover:text-green-400 text-xs">Исп</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {(handsEquipped.length > 0 || bodyEquipped.length > 0 || exoEquipped.length > 0) && (
        <div>
          <h3 className="text-wasteland-400 text-xs uppercase mb-1 px-1">⚡ Экипировано</h3>
          {[...handsEquipped, ...bodyEquipped, ...exoEquipped].map(s => (
            <SlotRow key={s.id} slot={s} onRefresh={onRefresh} />
          ))}
        </div>
      )}

      {belt.length > 0 && (
        <div>
          <h3 className="text-wasteland-400 text-xs uppercase mb-1 px-1">Пояс ({belt.length}/{beltSlotsMax})</h3>
          {belt.map(s => <SlotRow key={s.id} slot={s} onRefresh={onRefresh} />)}
        </div>
      )}

      <div>
        <h3 className="text-wasteland-400 text-xs uppercase mb-1 px-1">Рюкзак</h3>
        {backpack.length === 0 && other.length === 0 && <p className="text-wasteland-600 text-xs px-1">Пусто</p>}
        {[...backpack, ...other].map(s => <SlotRow key={s.id} slot={s} onRefresh={onRefresh} />)}
      </div>
    </div>
  );
}
