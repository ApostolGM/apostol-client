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

  const containerSlotName = 'container';
  const containers = inv.filter(s => s.item?.item_slot?.name === containerSlotName);
  const equipped = inv.filter(s => s.equipped && s.item?.item_slot?.name !== containerSlotName);
  const backpack = inv.filter(s => !s.equipped && s.item?.item_slot?.name !== containerSlotName && !s.parent_slot_id);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-stylized text-accent-orange">Инвентарь</h2>
      {weightInfo && <WeightBar weightInfo={weightInfo} />}
      {inv.length === 0 && <p className="text-wasteland-500 text-sm text-center py-4">Инвентарь пуст</p>}

      {containers.length > 0 && (
        <div>
          <h3 className="text-wasteland-400 text-xs uppercase mb-1 px-1">📦 Контейнеры</h3>
          {containers.map(s => (
            <div key={s.id} className="bg-wasteland-800 rounded border border-accent-green/30 mb-1">
              <div onClick={() => toggleContainer(s.id)} className="p-2 cursor-pointer flex items-center gap-1">
                <span className="text-accent-green text-xs">{expandedContainers[s.id] ? '📂' : '📦'}</span>
                {s.item?.icon_data?.url && <img src={s.item.icon_data.url} alt="" className="w-4 h-4 object-contain" />}
                <span className="text-wasteland-100 text-sm font-bold">{s.item?.name}</span>
                <span className="text-wasteland-500 text-xs ml-auto">{(s.children || []).length} предм.</span>
              </div>
              {expandedContainers[s.id] && (
                <div className="px-2 pb-2 space-y-1">
                  {(s.children || []).length === 0 ? (
                    <p className="text-wasteland-500 text-xs py-2 text-center">Пусто</p>
                  ) : (
                    s.children.map(child => (
                      <div key={child.id} className="bg-wasteland-700 p-1.5 rounded text-xs flex justify-between items-center">
                        <span className="text-wasteland-200">
                          {child.item?.icon_data?.url && <img src={child.item.icon_data.url} alt="" className="w-3 h-3 inline object-contain mr-1" />}
                          {child.item?.name} ×{child.quantity}
                        </span>
                        <div className="flex gap-1">
                          <button onClick={() => inventory.takeFromContainer(s.id, child.id, 1).then(refresh)} className="text-accent-orange text-xs px-1">←</button>
                          {(child.item?.item_slot?.name === 'consumable' || child.item?.item_slot?.name === 'ammo') && (
                            <button onClick={() => inventory.useFromContainer(s.id, child.id).then(refresh)} className="text-accent-green text-xs px-1">Исп</button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {equipped.length > 0 && (
        <div>
          <h3 className="text-wasteland-400 text-xs uppercase mb-1 px-1">⚡ Экипировано</h3>
          {equipped.map(s => <SlotRow key={s.id} slot={s} onRefresh={refresh} />)}
        </div>
      )}

      <div>
        <h3 className="text-wasteland-400 text-xs uppercase mb-1 px-1">Рюкзак</h3>
        {backpack.length === 0 && <p className="text-wasteland-600 text-xs px-1">Пусто</p>}
        {backpack.map(s => <SlotRow key={s.id} slot={s} onRefresh={refresh} />)}
      </div>
    </div>
  );
}
