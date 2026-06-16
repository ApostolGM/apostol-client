// components/panels/master/MasterCharacterCard.jsx
import { useState, useEffect } from 'react';
import { charsApi } from '../../../api/characters.js';
import { inventory } from '../../../api/inventory.js';
import { master } from '../../../api/master.js';
import MasterInventorySection from './MasterInventorySection.jsx';
import useConfirm from '../../../hooks/useConfirm.jsx';

export default function MasterCharacterCard({ char, expanded, onToggle, onDelete, onParamChange, allSkills, allItems, campaignId, socketRef, onRefresh }) {
  const { confirm } = useConfirm();

  const handleAddSkill = async (skillId, modifier) => {
    await charsApi.addSkill(char.id, skillId, modifier || 0);
    onRefresh();
  };

  const handleUpdateSkill = async (skillId, modifier) => {
    await charsApi.updateSkill(char.id, skillId, modifier);
    onRefresh();
  };

  const handleDeleteSkill = async (skillId) => {
    if (!await confirm('Удалить навык?')) return;
    await charsApi.deleteSkill(char.id, skillId);
    onRefresh();
  };

  const handleForceFail = () => {
    if (socketRef?.current) {
      socketRef.current.emit('death_loan_force_fail', {
        campaignId,
        characterId: char.id,
        count: char.death_loan_count,
      });
      onRefresh();
    }
  };

  return (
    <div className="bg-wasteland-800 rounded-lg border border-wasteland-600 overflow-hidden">
      <div onClick={onToggle} className="flex justify-between items-center p-3 cursor-pointer hover:bg-wasteland-700 transition">
        <div className="flex items-center gap-2">
          <span className="text-wasteland-100 font-bold">{char.name}</span>
          <span className="text-accent-orange text-sm">{char.profession?.name}</span>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-accent-red hover:text-red-400 text-xs ml-2" title="Удалить">🗑️</button>
        </div>
        <span className="text-wasteland-400 text-sm">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="p-3 border-t border-wasteland-600 space-y-4">
          {/* Состояние */}
          <StatusSliders char={char} onParamChange={onParamChange} />

          {/* Экономика */}
          <div>
            <h4 className="text-wasteland-400 text-xs uppercase mb-2">Экономика</h4>
            <div className="flex items-center gap-3">
              <span className="text-wasteland-400 text-xs">💎 Валюта:</span>
              <input type="number" min="0" value={char.currency || 0} onChange={(e) => onParamChange(char.id, 'currency', parseInt(e.target.value) || 0)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm w-28" />
            </div>
          </div>

          {/* Рассрочка гибели */}
          {char.perks?.some(p => p.name === 'Рассрочка гибели') && (
            <div>
              <h4 className="text-wasteland-400 text-xs uppercase mb-2">💀 Рассрочка гибели</h4>
              <div className="flex items-center gap-3">
                <span className="text-wasteland-400 text-xs">Счётчик: {char.death_loan_count || 0}</span>
                {(char.death_loan_count || 0) > 0 && (
                  <button onClick={handleForceFail} className="text-xs bg-accent-red/20 hover:bg-accent-red/40 text-accent-red px-3 py-1.5 rounded">
                    Активировать провал
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Навыки */}
          <SkillsEditor char={char} allSkills={allSkills} onAdd={handleAddSkill} onUpdate={handleUpdateSkill} onDelete={handleDeleteSkill} />

          {/* Перки */}
          {char.perks?.length > 0 && (
            <div>
              <h4 className="text-wasteland-400 text-xs uppercase mb-1">Перки</h4>
              <div className="flex flex-wrap gap-1">
                {char.perks.map(p => (
                  <span key={p.id} className={`text-xs px-1.5 py-0.5 rounded ${
                    p.type === 'positive' ? 'bg-accent-green/20 text-accent-green' :
                    p.type === 'negative' ? 'bg-accent-red/20 text-accent-red' :
                    'bg-wasteland-700 text-wasteland-300'
                  }`}>{p.name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Инвентарь */}
          <div>
            <h4 className="text-wasteland-400 text-xs uppercase mb-2">Инвентарь</h4>
            <MasterInventorySection charId={char.id} inventory={char.inventory || []} allItems={allItems} onRefresh={onRefresh} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatusSliders({ char, onParamChange }) {
  const configs = [
    { label: 'Еда', field: 'food', value: char.food ?? 100, color: '#33cc33' },
    { label: 'Вода', field: 'water', value: char.water ?? 100, color: '#3399ff' },
    { label: 'Стресс', field: 'stress', value: char.stress ?? 0, color: '#cc3333' },
  ];

  const [locals, setLocals] = useState({});
  useEffect(() => {
    setLocals({ food: char.food ?? 100, water: char.water ?? 100, stress: char.stress ?? 0 });
  }, [char]);

  return (
    <div>
      <h4 className="text-wasteland-400 text-xs uppercase mb-2">Состояние</h4>
      {configs.map(({ label, field, color }) => (
        <div key={field} className="flex items-center gap-2 mb-1">
          <span className="text-wasteland-400 text-xs w-12">{label}</span>
          <input type="range" min="0" max="100" value={locals[field] ?? 0} onChange={(e) => setLocals(prev => ({ ...prev, [field]: parseInt(e.target.value) }))} onMouseUp={() => onParamChange(char.id, field, locals[field])} onTouchEnd={() => onParamChange(char.id, field, locals[field])} className="flex-1 h-1.5 rounded cursor-pointer" style={{ accentColor: color }} />
          <span className="text-wasteland-300 text-xs w-8">{locals[field]}%</span>
        </div>
      ))}
    </div>
  );
}

function SkillsEditor({ char, allSkills, onAdd, onUpdate, onDelete }) {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [modifier, setModifier] = useState(0);

  const existingIds = (char.skills || []).map(s => s.id);
  const availableSkills = allSkills.filter(s => !existingIds.includes(s.id));

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-wasteland-400 text-xs uppercase">Навыки</h4>
        <button onClick={() => setShowAdd(!showAdd)} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">+ Навык</button>
      </div>

      {showAdd && (
        <div className="bg-wasteland-700 p-2 rounded mb-2 space-y-1" onClick={e => e.stopPropagation()}>
          <select value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs">
            <option value="">Выбрать...</option>
            {availableSkills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="flex items-center gap-1">
            <span className="text-wasteland-400 text-xs">%:</span>
            <input type="number" value={modifier} onChange={e => setModifier(parseFloat(e.target.value) || 0)} className="w-12 bg-wasteland-900 border border-wasteland-600 rounded p-0.5 text-wasteland-100 text-xs text-center" />
            <button onClick={() => { onAdd(selectedSkill, modifier); setSelectedSkill(''); setModifier(0); setShowAdd(false); }} disabled={!selectedSkill} className="bg-accent-orange text-wasteland-900 text-xs py-1 px-2 rounded font-bold disabled:opacity-50">OK</button>
          </div>
        </div>
      )}

      {char.skills?.length > 0 ? (
        <div className="space-y-1">
          {char.skills.map(skill => (
            <div key={skill.id} className="flex items-center justify-between bg-wasteland-700 p-1.5 rounded text-xs">
              <span className="text-wasteland-200">{skill.name}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => { const m = prompt('Новый процент:', skill.modifier); if (m !== null) onUpdate(skill.id, parseFloat(m) || 0); }} className="text-wasteland-400 hover:text-wasteland-200">{skill.modifier}%</button>
                <button onClick={() => onDelete(skill.id)} className="text-accent-red hover:text-red-400 ml-1">✕</button>
              </div>
            </div>
          ))}
        </div>
      ) : <p className="text-wasteland-500 text-xs">Нет навыков</p>}
    </div>
  );
}
