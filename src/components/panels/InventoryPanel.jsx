// components/panels/InventoryPanel.jsx
import { useState, useEffect } from 'react';
import { characters } from '../../api/characters.js';
import { inventory } from '../../api/inventory.js';
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

  const refresh = async () => { await onRefresh(); };

  const toggleContainer = (slotId) => setExpandedContainers(prev => ({ ...prev, [slotId]: !prev[slotId] }));

  const containers = inv.filter(s => s.item?.slot === 'container');
  const equipped = inv.filter(s => s.equipped);
  const backpack = inv.filter(s => !s.equipped && s.slot_type === 'рюкзак' && s.item?.slot !== 'container');
  const belt = inv.filter(s => !s.equipped && s.slot_type === 'пояс');
  const other = inv.filter(s => !s.equipped && !['рюкзак', 'пояс'].includes(s.slot_type) && s.item?.slot !== 'container' && !s.parent_slot_id);

  const handsEquipped = equipped.filter(s => ['правая_рука', 'левая_рука'].includes(s.slot_type));
  const bodyEquipped = equipped.filter(s => s.slot_type === 'тело');
  const exoEquipped = equipped.filter(s => s.slot_type === 'экзоскелет');
  const beltSlotsMax = character?.belt_slots_max || 3;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-stylized text-accent-orange">Инвентарь</h2>
      {weightInfo && <WeightBar weightInfo={weightInfo} />}
      {inv.length === 0 && <p className="text-wasteland-500 text-sm text-center py-4">Инвентарь пуст</p>}

      {/* Контейнеры */}
      {containers.length > 0 && (
        <div>
          <h3 className="text-wasteland-400 text-xs uppercase mb-1 px-1">📦 Контейнеры</h3>
          {containers.map(s => (
            <ContainerSlot
              key={s.id}
              slot={s}
              expanded={!!expandedContainers[s.id]}
              onToggle={() => toggleContainer(s.id)}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}

      {/* Экипировка */}
      {(handsEquipped.length > 0 || bodyEquipped.length > 0 || exoEquipped.length > 0) && (
        <div>
          <h3 className="text-wasteland-400 text-xs uppercase mb-1 px-1">⚡ Экипировано</h3>
          {[...handsEquipped, ...bodyEquipped, ...exoEquipped].map(s => (
            <SlotRow key={s.id} slot={s} onRefresh={refresh} />
          ))}
        </div>
      )}

      {/* Пояс */}
      {belt.length > 0 && (
        <div>
          <h3 className="text-wasteland-400 text-xs uppercase mb-1 px-1">Пояс ({belt.length}/{beltSlotsMax})</h3>
          {belt.map(s => <SlotRow key={s.id} slot={s} onRefresh={refresh} />)}
        </div>
      )}

      {/* Рюкзак */}
      <div>
        <h3 className="text-wasteland-400 text-xs uppercase mb-1 px-1">Рюкзак</h3>
        {backpack.length === 0 && other.length === 0 && <p className="text-wasteland-600 text-xs px-1">Пусто</p>}
        {[...backpack, ...other].map(s => <SlotRow key={s.id} slot={s} onRefresh={refresh} />)}
      </div>
    </div>
  );
}

function ContainerSlot({ slot, expanded, onToggle, onRefresh }) {
  const item = slot.item;
  const children = slot.children || [];

  const handleTake = async (childSlotId, qty) => {
    await inventory.takeFromContainer(slot.id, childSlotId, qty);
    onRefresh();
  };

  const handleUse = async (childSlotId) => {
    await inventory.useFromContainer(slot.id, childSlotId);
    onRefresh();
  };

  return (
    <div className="bg-wasteland-800 rounded border border-accent-green/30 mb-1">
      <div onClick={onToggle} className="p-2 cursor-pointer flex items-center gap-1">
        <span className="text-accent-green text-xs">{expanded ? '📂' : '📦'}</span>
        <span className="text-wasteland-100 text-sm font-bold">
          {item?.icon && <span className="mr-1">{item.icon}</span>}
          {item?.name}
        </span>
        <span className="text-wasteland-500 text-xs ml-auto">{children.length} предм.</span>
        <span className="text-wasteland-400 text-xs ml-2">{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div className="px-2 pb-2 space-y-1">
          {children.length === 0 ? (
            <p className="text-wasteland-500 text-xs py-2 text-center">Пусто</p>
          ) : (
            children.map(child => {
              const isConsumable = child.item?.slot === 'consumable';
              const isAmmo = child.item?.slot === 'ammo';
              return (
                <div key={child.id} className="bg-wasteland-700 p-1.5 rounded text-xs flex justify-between items-center">
                  <span className="text-wasteland-200">
                    {child.item?.icon && <span className="mr-1">{child.item.icon}</span>}
                    {child.item?.name} ×{child.quantity}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleTake(child.id, 1)}
                      className="text-accent-orange hover:text-orange-400 text-xs px-1"
                      title="Достать"
                    >
                      ←
                    </button>
                    {isConsumable && (
                      <button
                        onClick={() => handleUse(child.id)}
                        className="text-accent-green hover:text-green-400 text-xs px-1"
                        title="Использовать"
                      >
                        Исп
                      </button>
                    )}
                    {isAmmo && (
                      <button
                        onClick={() => handleUse(child.id)}
                        className="text-accent-yellow hover:text-yellow-400 text-xs px-1"
                        title="Перезарядить"
                      >
                        🔄
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
