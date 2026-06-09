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

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    setInv(character?.inventory || []);
  }, [character]);

  const loadItems = async () => {
    try {
      const data = await api.getItems();
      setItems(data);
    } catch (e) {
      console.error(e);
    }
  };

  const totalWeight = inv.reduce((sum, slot) => {
    return sum + (slot.item?.weight || 0) * (slot.quantity || 1);
  }, 0);

  const maxWeight = character?.carry_weight_max || 50;
  const weightPercent = Math.min(100, (totalWeight / maxWeight) * 100);

  const handleAddItem = async () => {
    if (!selectedItem || !character) return;
    setLoading(true);
    setError('');
    try {
      await api.addItem(character.id, selectedItem, quantity, 'рюкзак');
      await onRefresh();
      setShowAdd(false);
      setSelectedItem('');
      setQuantity(1);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (slotId, qty) => {
    await api.removeItem(slotId, qty);
    await onRefresh();
  };

  const handleEquip = async (slotId) => {
    await api.equipItem(slotId);
    await onRefresh();
  };

  const handleUnequip = async (slotId) => {
    await api.unequipItem(slotId);
    await onRefresh();
  };

  const handleReload = async (slotId) => {
    setError('');
    try {
      await api.reloadWeapon(slotId);
      await onRefresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const getDurabilityColor = (d) => {
    if (!d) return 'text-wasteland-400';
    if (d === 'отличное') return 'text-accent-green';
    if (d === 'хорошее') return 'text-accent-yellow';
    if (d === 'изношенное') return 'text-accent-orange';
    if (d === 'сломанное') return 'text-accent-red';
    return 'text-wasteland-400';
  };

  const getWeaponIcon = (type) => {
    if (type === 'melee') return '🔪';
    if (type === 'ranged') return '🔫';
    if (type === 'thrown') return '🎯';
    return '';
  };

  const grouped = {};
  for (const slot of inv) {
    const key = slot.slot_type || 'рюкзак';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(slot);
  }

  const slotOrder = ['правая_рука', 'левая_рука', 'тело', 'пояс', 'рюкзак'];
  const slotLabels = {
    'правая_рука': 'Правая рука',
    'левая_рука': 'Левая рука',
    'тело': 'Тело (броня)',
    'пояс': 'Пояс',
    'рюкзак': 'Рюкзак',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-stylized text-accent-orange">Инвентарь</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-accent-orange text-wasteland-900 text-sm font-bold px-4 py-2 rounded hover:bg-orange-500 transition"
        >
          {showAdd ? '✕ Закрыть' : '+ Добавить'}
        </button>
      </div>

      {/* Вес */}
      <div className="bg-wasteland-800 p-3 rounded-lg border border-wasteland-600">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-wasteland-400">Вес</span>
          <span className={`font-bold ${weightPercent > 90 ? 'text-accent-red' : weightPercent > 70 ? 'text-accent-yellow' : 'text-wasteland-300'}`}>
            {totalWeight.toFixed(1)} / {maxWeight} кг
          </span>
        </div>
        <div className="w-full h-2 bg-wasteland-900 rounded overflow-hidden">
          <div
            className={`h-full rounded transition-all ${weightPercent > 90 ? 'bg-accent-red' : weightPercent > 70 ? 'bg-accent-yellow' : 'bg-accent-green'}`}
            style={{ width: `${weightPercent}%` }}
          />
        </div>
      </div>

      {error && <p className="text-accent-red text-sm bg-wasteland-800 p-3 rounded">{error}</p>}

      {/* Добавление предмета */}
      {showAdd && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 space-y-3">
          <h3 className="text-wasteland-300 text-sm">Добавить предмет</h3>
          <select
            className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm"
            value={selectedItem}
            onChange={e => setSelectedItem(e.target.value)}
          >
            <option value="">Выберите предмет...</option>
            {items.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.type}) — {item.trade_price || 0} РК, {item.weight} кг
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <label className="text-wasteland-400 text-sm">Кол-во:</label>
            <input
              type="number" min="1" max="99"
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value) || 1)}
              className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 w-16 text-center"
            />
          </div>
          <button
            onClick={handleAddItem}
            disabled={!selectedItem || loading}
            className="w-full bg-accent-orange text-wasteland-900 font-bold py-2 rounded text-sm hover:bg-orange-500 transition disabled:opacity-50"
          >
            {loading ? '...' : 'Добавить'}
          </button>
        </div>
      )}

      {/* Слоты инвентаря */}
      {inv.length === 0 && (
        <p className="text-wasteland-500 text-sm text-center py-4">Инвентарь пуст</p>
      )}

      {slotOrder.map(slotType => {
        const slots = grouped[slotType] || [];
        if (slots.length === 0 && slotType !== 'правая_рука' && slotType !== 'левая_рука' && slotType !== 'тело') return null;

        return (
          <div key={slotType}>
            <h3 className="text-wasteland-400 text-xs uppercase mb-1 px-1">{slotLabels[slotType] || slotType}</h3>
            {slotType === 'правая_рука' && slots.length === 0 && (
              <div className="bg-wasteland-800/50 border border-dashed border-wasteland-600 rounded p-2 text-wasteland-500 text-xs text-center">Пусто</div>
            )}
            {slotType === 'левая_рука' && slots.length === 0 && (
              <div className="bg-wasteland-800/50 border border-dashed border-wasteland-600 rounded p-2 text-wasteland-500 text-xs text-center">Пусто</div>
            )}
            {slotType === 'тело' && slots.length === 0 && (
              <div className="bg-wasteland-800/50 border border-dashed border-wasteland-600 rounded p-2 text-wasteland-500 text-xs text-center">Нет брони</div>
            )}
            {slots.map(slot => (
              <div
                key={slot.id}
                className={`bg-wasteland-800 p-2 rounded border mb-1 ${slot.equipped ? 'border-accent-orange' : 'border-wasteland-600'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      {slot.equipped && <span className="text-accent-orange text-xs">⚡</span>}
                      <span className="text-wasteland-100 text-sm font-bold truncate">
                        {getWeaponIcon(slot.item?.weapon_type)} {slot.item?.name}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0 text-xs mt-0.5">
                      {slot.item?.type && <span className="text-wasteland-400">{slot.item.type}</span>}
                      {slot.item?.damage && <span className="text-accent-red">💥 {slot.item.damage}</span>}
                      {slot.item?.is_weapon && slot.item?.weapon_type === 'ranged' && (
                        <span className={slot.item?.current_ammo === 0 ? 'text-accent-red' : 'text-wasteland-300'}>
                          🔫 {slot.item?.current_ammo}/{slot.item?.max_ammo}
                        </span>
                      )}
                      {slot.item?.armor_value && <span className="text-blue-400">🛡️ {slot.item.armor_value}</span>}
                      {slot.item?.durability && (
                        <span className={getDurabilityColor(slot.item.durability)}>🔧 {slot.item.durability}</span>
                      )}
                      {slot.item?.weight > 0 && <span className="text-wasteland-500">{slot.item.weight} кг</span>}
                    </div>
                    {slot.quantity > 1 && (
                      <span className="text-wasteland-400 text-xs">×{slot.quantity}</span>
                    )}
                  </div>

                  <div className="flex gap-1 ml-2 flex-shrink-0">
                    {slot.item?.is_weapon && !slot.equipped && (
                      <button onClick={() => handleEquip(slot.id)} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300" title="Экипировать">⚡</button>
                    )}
                    {slot.item?.is_armor && !slot.equipped && (
                      <button onClick={() => handleEquip(slot.id)} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300" title="Надеть">👕</button>
                    )}
                    {slot.equipped && (
                      <button onClick={() => handleUnequip(slot.id)} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300" title="Снять">📥</button>
                    )}
                    {slot.item?.weapon_type === 'ranged' && slot.equipped && (slot.item?.current_ammo || 0) < (slot.item?.max_ammo || 0) && (
                      <button onClick={() => handleReload(slot.id)} className="text-xs bg-accent-yellow/20 hover:bg-accent-yellow/40 px-2 py-1 rounded text-accent-yellow" title="Перезарядить">🔄</button>
                    )}
                    <button
                      onClick={() => handleRemove(slot.id, 1)}
                      className="text-xs bg-wasteland-700 hover:bg-accent-red/50 px-2 py-1 rounded text-wasteland-400 hover:text-wasteland-100"
                      title="Убрать 1"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
