import { useState, useEffect, useRef } from 'react';
import { api } from '../api';

export default function MasterCharacterPanel({ campaignId }) {
  const [characters, setCharacters] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const chars = await api.getCampaignCharacters(campaignId);
      setCharacters(chars);
    } catch (e) {
      setError(e.message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [campaignId]);

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleParamChange = async (charId, field, value) => {
    setCharacters(prev => prev.map(c => c.id === charId ? { ...c, [field]: value } : c));
    await api.updateCharacterParams(charId, { [field]: value });
  };

  if (loading) return <p className="text-wasteland-400 text-center py-4">Загрузка...</p>;
  if (error) return <p className="text-accent-red text-center py-4">Ошибка: {error}</p>;

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-stylized text-accent-orange mb-4">Персонажи игроков</h2>
      {characters.length === 0 && <p className="text-wasteland-500 text-center py-4">Нет персонажей</p>}

      {characters.map(char => (
        <div key={char.id} className="bg-wasteland-800 rounded-lg border border-wasteland-600 overflow-hidden">
          <div
            onClick={() => toggleExpand(char.id)}
            className="flex justify-between items-center p-3 cursor-pointer hover:bg-wasteland-700 transition"
          >
            <div>
              <span className="text-wasteland-100 font-bold">{char.name}</span>
              <span className="text-wasteland-100 font-bold">{char.name}</span>
<button
  onClick={(e) => {
    e.stopPropagation();
    if (confirm(`Удалить персонажа "${char.name}"? Игрок сможет создать нового.`)) {
      api.deleteCharacter(char.id).then(() => load());
    }
  }}
  className="text-accent-red hover:text-red-400 text-xs ml-2"
  title="Удалить персонажа"
>
  🗑️
</button>
              <span className="text-accent-orange ml-2 text-sm">{char.profession?.name}</span>
            </div>
            <span className="text-wasteland-400 text-sm">{expanded[char.id] ? '▲' : '▼'}</span>
          </div>

          {expanded[char.id] && (
            <div className="p-3 border-t border-wasteland-600 space-y-4">
              <div>
                <h4 className="text-wasteland-400 text-xs uppercase mb-2">Состояние</h4>
                {[
                  { label: 'Еда', field: 'food', value: char.food ?? 100, color: '#33cc33' },
                  { label: 'Вода', field: 'water', value: char.water ?? 100, color: '#3399ff' },
                  { label: 'Стресс', field: 'stress', value: char.stress ?? 0, color: '#cc3333' },
                ].map(({ label, field, value, color }) => (
                  <SliderRow
                    key={field}
                    label={label}
                    value={value}
                    color={color}
                    onChange={(v) => handleParamChange(char.id, field, v)}
                  />
                ))}
              </div>

              {char.skills?.length > 0 && (
                <div>
                  <h4 className="text-wasteland-400 text-xs uppercase mb-1">Навыки</h4>
                  <div className="grid grid-cols-2 gap-1">
                    {char.skills.map(s => (
                      <div key={s.id} className="text-xs text-wasteland-300 flex justify-between">
                        <span>{s.name}</span>
                        <span className="text-accent-green">+{s.modifier}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {char.perks?.length > 0 && (
                <div>
                  <h4 className="text-wasteland-400 text-xs uppercase mb-1">Перки</h4>
                  <div className="flex flex-wrap gap-1">
                    {char.perks.map(p => (
                      <span key={p.id} className={`text-xs px-1.5 py-0.5 rounded ${p.type === 'positive' ? 'bg-accent-green/20 text-accent-green' : p.type === 'negative' ? 'bg-accent-red/20 text-accent-red' : 'bg-wasteland-700 text-wasteland-300'}`}>
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-wasteland-400 text-xs uppercase mb-2">Инвентарь</h4>
                <MasterInventory charId={char.id} inventory={char.inventory || []} onRefresh={load} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SliderRow({ label, value, color, onChange }) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleMouseUp = () => {
    onChange(localValue);
  };

  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-wasteland-400 text-xs w-12">{label}</span>
      <input
        type="range"
        min="0"
        max="100"
        value={localValue}
        onChange={(e) => setLocalValue(parseInt(e.target.value))}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
        className="flex-1 h-1.5 rounded cursor-pointer"
        style={{ accentColor: color }}
      />
      <span className="text-wasteland-300 text-xs w-8">{localValue}%</span>
    </div>
  );
}

function MasterInventory({ charId, inventory, onRefresh }) {
  const [allItems, setAllItems] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => { api.getItems().then(setAllItems).catch(console.error); }, []);

  const handleAdd = async () => {
    if (!selectedItem) return;
    await api.masterAddItem(charId, selectedItem, quantity, 'рюкзак');
    setSelectedItem(''); setQuantity(1); setShowAdd(false);
    onRefresh();
  };

  const handleConditionChange = async (slotId, value) => {
    await api.updateInventorySlot(slotId, { condition_percent: value });
    onRefresh();
  };

  const handleAddMod = async (slotId) => {
    const modItems = allItems.filter(i => i.type === 'модификация');
    if (modItems.length === 0) { alert('Нет модификаций в базе'); return; }
    const modList = modItems.map(i => `${i.name} (${i.id})`).join('\n');
    const modId = prompt(`ID модификации:\n${modList}`);
    if (modId) {
      await api.addMod(slotId, modId.trim());
      onRefresh();
    }
  };

  const handleRemoveMod = async (slotId, modId) => {
    await api.removeMod(slotId, modId);
    onRefresh();
  };

  const equipped = inventory.filter(s => s.equipped);
  const backpack = inventory.filter(s => !s.equipped);

  return (
    <div className="space-y-2">
      {showAdd && (
        <div className="flex gap-1 items-center mb-2">
          <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs flex-1">
            <option value="">Выбрать...</option>
            {allItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          <input type="number" min="1" max="99" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs w-12" />
          <button onClick={handleAdd} className="bg-accent-orange text-wasteland-900 text-xs px-2 py-1 rounded">OK</button>
        </div>
      )}
      <button onClick={() => setShowAdd(!showAdd)} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">
        {showAdd ? 'Отмена' : '+ Предмет'}
      </button>

      {equipped.length > 0 && <p className="text-wasteland-500 text-xs mt-2">Экипировано:</p>}
      {equipped.map(s => (
        <MasterSlotRow key={s.id} slot={s} onConditionChange={handleConditionChange} onAddMod={handleAddMod} onRemoveMod={handleRemoveMod} />
      ))}
      {backpack.length > 0 && <p className="text-wasteland-500 text-xs mt-2">Рюкзак:</p>}
      {backpack.map(s => (
        <MasterSlotRow key={s.id} slot={s} onConditionChange={handleConditionChange} onAddMod={handleAddMod} onRemoveMod={handleRemoveMod} />
      ))}
    </div>
  );
}

function MasterSlotRow({ slot, onConditionChange, onAddMod, onRemoveMod }) {
  const item = slot.item;
  const condition = slot.condition_percent ?? item?.condition_percent ?? 100;
  const [showMods, setShowMods] = useState(false);
  const [localCond, setLocalCond] = useState(condition);

  useEffect(() => {
    setLocalCond(condition);
  }, [condition]);

  return (
    <div className="bg-wasteland-700 p-2 rounded text-xs">
      <div className="flex justify-between items-center">
        <span className="text-wasteland-200 font-bold">{item?.name}</span>
        <span className="text-wasteland-400">{slot.equipped ? '⚡' : ''} ×{slot.quantity}</span>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-wasteland-500">Состояние:</span>
        <input
          type="range"
          min="0"
          max="100"
          value={localCond}
          onChange={(e) => setLocalCond(parseInt(e.target.value))}
          onMouseUp={() => onConditionChange(slot.id, localCond)}
          onTouchEnd={() => onConditionChange(slot.id, localCond)}
          className="flex-1 h-1 rounded"
          style={{ accentColor: localCond > 50 ? '#33cc33' : localCond > 20 ? '#cc6600' : '#cc3333' }}
        />
        <span className="text-wasteland-300 w-8">{localCond}%</span>
      </div>

      <div className="mt-1">
        <button onClick={() => setShowMods(!showMods)} className="text-wasteland-400 hover:text-wasteland-200 text-xs">
          {showMods ? '▲' : '▼'} Модификации ({(slot.mods || []).length})
        </button>
        {showMods && (
          <div className="mt-1 space-y-1">
            {(slot.mods || []).map(mod => (
              <div key={mod.id} className="flex justify-between items-center bg-wasteland-800 p-1 rounded">
                <span className="text-wasteland-300">{mod.name}</span>
                <button onClick={() => onRemoveMod(slot.id, mod.id)} className="text-accent-red text-xs">✕</button>
              </div>
            ))}
            <button onClick={() => onAddMod(slot.id)} className="text-accent-green text-xs hover:underline">+ Добавить</button>
          </div>
        )}
      </div>
    </div>
  );
}
