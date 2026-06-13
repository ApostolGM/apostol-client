import { useState, useEffect } from 'react';
import { api } from '../api';
import useConfirm from '../hooks/useConfirm';

export default function MasterCharacterPanel({ campaignId }) {
  const [characters, setCharacters] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allSkills, setAllSkills] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const { confirm, ConfirmModal } = useConfirm();

  const load = async () => {
    try {
      setError('');
      const [chars, skills, items] = await Promise.all([
        api.getCampaignCharacters(campaignId),
        api.getSkills(),
        api.getItems(),
      ]);
      setCharacters(chars);
      setAllSkills(skills || []);
      setAllItems(items || []);
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

  const handleAddSkill = async (charId, skillId, modifier) => {
    await api.addCharacterSkill(charId, skillId, modifier || 0);
    load();
  };

  const handleUpdateSkill = async (charId, skillId, modifier) => {
    await api.updateCharacterSkill(charId, skillId, modifier);
    load();
  };

  const handleDeleteSkill = async (charId, skillId) => {
    if (!await confirm('Удалить навык?')) return;
    await api.deleteCharacterSkill(charId, skillId);
    load();
  };

  const handleDeleteCharacter = async (char) => {
    if (!await confirm(`Удалить персонажа "${char.name}"? Игрок сможет создать нового.`)) return;
    await api.deleteCharacter(char.id);
    load();
  };

  if (loading) return <p className="text-wasteland-400 text-center py-4">Загрузка...</p>;
  if (error) return <p className="text-accent-red text-center py-4">Ошибка: {error}</p>;

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-stylized text-accent-orange mb-4">Персонажи игроков</h2>
      {characters.length === 0 && <p className="text-wasteland-500 text-center py-4">Нет персонажей</p>}

      {characters.map(char => (
        <div key={char.id} className="bg-wasteland-800 rounded-lg border border-wasteland-600 overflow-hidden">
          <div onClick={() => toggleExpand(char.id)} className="flex justify-between items-center p-3 cursor-pointer hover:bg-wasteland-700 transition">
            <div className="flex items-center gap-2">
              <span className="text-wasteland-100 font-bold">{char.name}</span>
              <span className="text-accent-orange text-sm">{char.profession?.name}</span>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteCharacter(char); }} className="text-accent-red hover:text-red-400 text-xs ml-2" title="Удалить персонажа">🗑️</button>
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
                  <SliderRow key={field} label={label} value={value} color={color} onChange={(v) => handleParamChange(char.id, field, v)} />
                ))}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-wasteland-400 text-xs uppercase">Навыки</h4>
                  <AddSkillButton allSkills={allSkills} existingSkills={char.skills || []} onAdd={(skillId, modifier) => handleAddSkill(char.id, skillId, modifier)} />
                </div>
                {char.skills?.length > 0 ? (
                  <div className="space-y-1">
                    {char.skills.map(skill => (
                      <div key={skill.id} className="flex items-center justify-between bg-wasteland-700 p-1.5 rounded text-xs">
                        <span className="text-wasteland-200">{skill.name}</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { const newMod = window.prompt('Новый процент:', skill.modifier); if (newMod !== null) handleUpdateSkill(char.id, skill.id, parseFloat(newMod) || 0); }} className="text-wasteland-400 hover:text-wasteland-200" title="Изменить %">{skill.modifier}%</button>
                          <button onClick={() => handleDeleteSkill(char.id, skill.id)} className="text-accent-red hover:text-red-400 ml-1" title="Удалить навык">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-wasteland-500 text-xs">Нет навыков</p>
                )}
              </div>

              {char.perks?.length > 0 && (
                <div>
                  <h4 className="text-wasteland-400 text-xs uppercase mb-1">Перки</h4>
                  <div className="flex flex-wrap gap-1">
                    {char.perks.map(p => (
                      <span key={p.id} className={`text-xs px-1.5 py-0.5 rounded ${p.type === 'positive' ? 'bg-accent-green/20 text-accent-green' : p.type === 'negative' ? 'bg-accent-red/20 text-accent-red' : 'bg-wasteland-700 text-wasteland-300'}`}>{p.name}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-wasteland-400 text-xs uppercase mb-2">Инвентарь</h4>
                <MasterInventory charId={char.id} inventory={char.inventory || []} allItems={allItems} onRefresh={load} />
              </div>
            </div>
          )}
        </div>
      ))}
      {ConfirmModal}
    </div>
  );
}

function AddSkillButton({ allSkills, existingSkills, onAdd }) {
  const [show, setShow] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [modifier, setModifier] = useState(0);

  const availableSkills = allSkills.filter(s => !existingSkills?.some(es => es.id === s.id));

  const handleAdd = () => {
    if (!selectedSkill) return;
    onAdd(selectedSkill, modifier);
    setSelectedSkill('');
    setModifier(0);
    setShow(false);
  };

  return (
    <div className="relative">
      <button onClick={(e) => { e.stopPropagation(); setShow(!show); }} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">+ Навык</button>
      {show && (
        <div className="absolute right-0 top-full mt-1 bg-wasteland-800 border border-wasteland-600 rounded p-2 z-40 w-48 shadow-lg" onClick={e => e.stopPropagation()}>
          <select value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs mb-1">
            <option value="">Выбрать...</option>
            {availableSkills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-wasteland-400 text-xs">%:</span>
            <input type="number" value={modifier} onChange={e => setModifier(parseFloat(e.target.value) || 0)} className="w-12 bg-wasteland-900 border border-wasteland-600 rounded p-0.5 text-wasteland-100 text-xs text-center" />
          </div>
          <button onClick={handleAdd} disabled={!selectedSkill} className="w-full bg-accent-orange text-wasteland-900 text-xs py-1 rounded font-bold disabled:opacity-50">Добавить</button>
        </div>
      )}
    </div>
  );
}

function SliderRow({ label, value, color, onChange }) {
  const [localValue, setLocalValue] = useState(value);
  useEffect(() => { setLocalValue(value); }, [value]);
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-wasteland-400 text-xs w-12">{label}</span>
      <input type="range" min="0" max="100" value={localValue} onChange={(e) => setLocalValue(parseInt(e.target.value))} onMouseUp={() => onChange(localValue)} onTouchEnd={() => onChange(localValue)} className="flex-1 h-1.5 rounded cursor-pointer" style={{ accentColor: color }} />
      <span className="text-wasteland-300 text-xs w-8">{localValue}%</span>
    </div>
  );
}

function MasterInventory({ charId, inventory, allItems, onRefresh }) {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [weightInfo, setWeightInfo] = useState(null);

  useEffect(() => { api.getCharacterWeight(charId).then(setWeightInfo).catch(() => {}); }, [charId, inventory]);

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

  const handleQuantityChange = async (slotId, newQty) => {
    if (newQty < 1) return;
    await api.updateInventorySlot(slotId, { quantity: newQty });
    onRefresh();
  };

  const handleRemoveSlot = async (slotId) => {
    if (!await confirm('Удалить предмет из инвентаря?')) return;
    await api.removeItem(slotId, 999);
    onRefresh();
  };

  const handleAddMod = async (slotId, slotItem) => {
    const targetSlot = slotItem?.slot;
    const weaponType = slotItem?.weapon_type;
    const availableMods = allItems.filter(i => {
      if (i.slot !== 'mod') return false;
      if (i.mod_target === 'any') return true;
      if (i.mod_target !== targetSlot) return false;
      if (i.mod_target === 'weapon' && i.weapon_mod_subtype && i.weapon_mod_subtype !== 'any' && i.weapon_mod_subtype !== weaponType) return false;
      return true;
    });

    if (availableMods.length === 0) {
      alert('Нет подходящих модификаций');
      return;
    }

    const modList = availableMods.map(m => `${m.name} (${m.id.substring(0, 8)})`).join('\n');
    const modId = await prompt('Доступные модификации:\n' + modList + '\n\nВведите ID модификации:');
    if (modId) {
      try {
        await api.addMod(slotId, modId.trim());
        onRefresh();
      } catch (e) {
        alert(e.message);
      }
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
      {weightInfo && (
        <div className="bg-wasteland-700 p-2 rounded text-xs">
          <span className="text-wasteland-400">Вес: </span>
          <span className={`font-bold ${weightInfo.percent > 110 ? 'text-accent-red' : weightInfo.percent > 85 ? 'text-accent-yellow' : 'text-wasteland-300'}`}>{weightInfo.totalWeight.toFixed(1)} / {weightInfo.maxWeight} кг ({weightInfo.percent}%)</span>
          {weightInfo.penalty.label !== 'Норма' && <span className="text-accent-red ml-2">⚠️ {weightInfo.penalty.label}</span>}
        </div>
      )}

      {showAdd && (
        <div className="flex gap-1 items-center mb-2">
          <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs flex-1">
            <option value="">Выбрать...</option>
            {allItems.map(i => <option key={i.id} value={i.id}>{i.name} ({i.slot})</option>)}
          </select>
          <input type="number" min="1" max="99" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs w-12" />
          <button onClick={handleAdd} className="bg-accent-orange text-wasteland-900 text-xs px-2 py-1 rounded">OK</button>
        </div>
      )}
      <button onClick={() => setShowAdd(!showAdd)} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">{showAdd ? 'Отмена' : '+ Предмет'}</button>

      {equipped.length > 0 && <p className="text-wasteland-500 text-xs mt-2">Экипировано:</p>}
      {equipped.map(s => <MasterSlotRow key={s.id} slot={s} onConditionChange={handleConditionChange} onQuantityChange={handleQuantityChange} onRemove={handleRemoveSlot} onAddMod={handleAddMod} onRemoveMod={handleRemoveMod} />)}
      {backpack.length > 0 && <p className="text-wasteland-500 text-xs mt-2">Рюкзак:</p>}
      {backpack.map(s => <MasterSlotRow key={s.id} slot={s} onConditionChange={handleConditionChange} onQuantityChange={handleQuantityChange} onRemove={handleRemoveSlot} onAddMod={handleAddMod} onRemoveMod={handleRemoveMod} />)}
    </div>
  );
}

function MasterSlotRow({ slot, onConditionChange, onQuantityChange, onRemove, onAddMod, onRemoveMod }) {
  const item = slot.item;
  const condition = slot.condition_percent ?? item?.condition_percent ?? 100;
  const [showMods, setShowMods] = useState(false);
  const [localCond, setLocalCond] = useState(condition);
  const [qty, setQty] = useState(slot.quantity || 1);

  useEffect(() => { setLocalCond(condition); setQty(slot.quantity || 1); }, [condition, slot.quantity]);

  const handleQtyBlur = () => { if (qty !== slot.quantity) onQuantityChange(slot.id, qty); };

  return (
    <div className="bg-wasteland-700 p-2 rounded text-xs">
      <div className="flex justify-between items-center">
        <span className="text-wasteland-200 font-bold">{item?.name}</span>
        <div className="flex items-center gap-1">
          <span className="text-wasteland-400">{slot.equipped ? '⚡' : ''}</span>
          <input type="number" value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)} onBlur={handleQtyBlur} className="bg-wasteland-900 border border-wasteland-600 rounded p-0.5 text-wasteland-100 text-xs w-10 text-center" min="1" />
          <button onClick={() => onRemove(slot.id)} className="text-accent-red hover:text-red-400 ml-1" title="Удалить">✕</button>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-wasteland-500">Состояние:</span>
        <input type="range" min="0" max="100" value={localCond} onChange={(e) => setLocalCond(parseInt(e.target.value))} onMouseUp={() => onConditionChange(slot.id, localCond)} onTouchEnd={() => onConditionChange(slot.id, localCond)} className="flex-1 h-1 rounded" style={{ accentColor: localCond > 50 ? '#33cc33' : localCond > 20 ? '#cc6600' : '#cc3333' }} />
        <span className="text-wasteland-300 w-8">{localCond}%</span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <button onClick={() => setShowMods(!showMods)} className="text-wasteland-400 hover:text-wasteland-200 text-xs">{showMods ? '▲' : '▼'} Моды ({(slot.mods || []).length})</button>
        <button onClick={() => onAddMod(slot.id, item)} className="text-accent-green text-xs hover:underline">+ Мод</button>
        {showMods && (
          <div className="mt-1 space-y-1 w-full">
            {(slot.mods || []).map(mod => (
              <div key={mod.id} className="flex justify-between items-center bg-wasteland-800 p-1 rounded">
                <span className="text-wasteland-300">{mod.name}</span>
                <button onClick={() => onRemoveMod(slot.id, mod.id)} className="text-accent-red text-xs">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
