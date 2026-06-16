// src/components/CharacterSheet.jsx
import { useState, useEffect } from 'react';
import { api } from '../api';

export default function CharacterSheet({ character, isMaster, onUpdate, onRollSkill, socketRef }) {
  const [editMode, setEditMode] = useState(false);
  const [char, setChar] = useState(character);
  const [params, setParams] = useState({
    food: character.food ?? 100,
    water: character.water ?? 100,
    stress: character.stress ?? 0,
  });
  const [loanCount, setLoanCount] = useState(character?.death_loan_count || 0);
  const [weightInfo, setWeightInfo] = useState(null);

  // Realtime: обновление персонажа
  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;
    
    const handleUpdate = (data) => {
      if (data.character_id === character?.id) {
        setChar(prev => ({ ...prev, ...data.updates }));
        if (data.updates.food !== undefined) setParams(p => ({ ...p, food: data.updates.food }));
        if (data.updates.water !== undefined) setParams(p => ({ ...p, water: data.updates.water }));
        if (data.updates.stress !== undefined) setParams(p => ({ ...p, stress: data.updates.stress }));
        if (data.updates.death_loan_count !== undefined) setLoanCount(data.updates.death_loan_count);
      }
    };

    socket.on('character_updated', handleUpdate);
    return () => socket.off('character_updated', handleUpdate);
  }, [socketRef, character?.id]);

  // Синхронизация с пропсами
  useEffect(() => {
    setChar(character);
    setParams({
      food: character.food ?? 100,
      water: character.water ?? 100,
      stress: character.stress ?? 0,
    });
    setLoanCount(character?.death_loan_count || 0);
  }, [character]);

  // Вес
  useEffect(() => {
    if (char?.id) {
      api.getCharacterWeight(char.id).then(setWeightInfo).catch(() => {});
    }
  }, [char?.id]);

  const handleSlider = (field, value) => {
    setParams(prev => ({ ...prev, [field]: parseInt(value) }));
  };

  const saveParams = async () => {
    await onUpdate(params);
    setEditMode(false);
  };

  const requestDeathLoan = () => {
    console.log('Requesting death loan...', { characterId: char.id, characterName: char.name });
    if (!socketRef?.current) return;
    socketRef.current.emit('death_loan_request', {
      campaignId: char.campaign_id,
      characterId: char.id,
      characterName: char.name,
    });
  };

  const sliderConfigs = [
    { label: 'Еда', field: 'food', color: '#33cc33' },
    { label: 'Вода', field: 'water', color: '#3399ff' },
    { label: 'Стресс', field: 'stress', color: '#cc3333' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-stylized text-wasteland-100">{char.name}</h2>
            <p className="text-accent-orange">{char.profession?.name}</p>
          </div>
        </div>
      </div>

      {weightInfo && (
        <div className="bg-wasteland-800 p-3 rounded-lg border border-wasteland-600">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-wasteland-400">Вес</span>
            <span className={`font-bold ${
              weightInfo.percent > 110 ? 'text-accent-red' :
              weightInfo.percent > 85 ? 'text-accent-yellow' :
              'text-wasteland-300'
            }`}>
              {weightInfo.totalWeight.toFixed(1)} / {weightInfo.maxWeight} кг ({weightInfo.percent}%)
            </span>
          </div>
          <div className="w-full h-2 bg-wasteland-900 rounded overflow-hidden">
            <div className={`h-full rounded transition-all ${
              weightInfo.percent > 110 ? 'bg-accent-red' :
              weightInfo.percent > 85 ? 'bg-accent-yellow' :
              'bg-accent-green'
            }`} style={{ width: `${Math.min(100, weightInfo.percent)}%` }} />
          </div>
          {weightInfo.penalty.label !== 'Норма' && (
            <p className={`text-xs mt-1 ${weightInfo.penalty.label.includes('Помеха') ? 'text-accent-red' : 'text-accent-yellow'}`}>
              ⚠️ {weightInfo.penalty.label}
              {typeof weightInfo.penalty.penalty === 'number' && ` (${weightInfo.penalty.penalty}% к броскам)`}
            </p>
          )}
        </div>
      )}

      {char.perks?.some(p => p.name === 'Рассрочка гибели') && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-accent-purple/30">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-wasteland-300 font-stylized">💀 Рассрочка гибели</h3>
              <p className="text-wasteland-500 text-xs">Использовано: {loanCount}</p>
            </div>
            <button onClick={requestDeathLoan} className="text-xs bg-accent-purple/20 hover:bg-accent-purple/40 text-purple-400 px-3 py-1.5 rounded border border-accent-purple/30">
              Запросить удачу
            </button>
          </div>
        </div>
      )}

      <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-wasteland-300 font-stylized">Состояние</h3>
          {isMaster && (
            <button onClick={() => editMode ? saveParams() : setEditMode(true)} className={`text-xs px-3 py-1 rounded ${editMode ? 'bg-accent-green text-wasteland-900' : 'bg-wasteland-600 text-wasteland-300'}`}>
              {editMode ? 'Сохранить' : 'Изменить'}
            </button>
          )}
        </div>
        {sliderConfigs.map(({ label, field, color }) => (
          <div key={field} className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-wasteland-400">{label}</span>
              <span className="text-wasteland-300">{params[field]}%</span>
            </div>
            <input type="range" min="0" max="100" value={params[field]} onChange={e => handleSlider(field, e.target.value)} disabled={!isMaster && !editMode}
              className="w-full h-2 rounded cursor-pointer" style={{ accentColor: color, opacity: isMaster || editMode ? 1 : 0.7 }} />
          </div>
        ))}
      </div>

      {char.skills?.length > 0 && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600">
          <h3 className="text-wasteland-300 font-stylized mb-3">Навыки</h3>
          <div className="grid grid-cols-2 gap-2">
            {char.skills.map(skill => (
              <button key={skill.id} onClick={() => onRollSkill(skill.name)} className="bg-wasteland-700 p-3 rounded text-left hover:bg-wasteland-600 hover:border-wasteland-500 border border-transparent transition active:scale-95">
                <div className="flex justify-between items-center">
                  <span className="text-wasteland-200 text-sm">{skill.name}</span>
                  <span className="text-sm font-bold text-accent-green">+{skill.totalModifier || 0}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {char.perks?.length > 0 && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600">
          <h3 className="text-wasteland-300 font-stylized mb-2">Перки</h3>
          {char.perks.map(perk => (
            <div key={perk.id} className="text-sm mb-1">
              <span className={`font-bold ${perk.type === 'positive' ? 'text-accent-green' : perk.type === 'negative' ? 'text-accent-red' : 'text-wasteland-300'}`}>{perk.name}</span>
              <span className="text-wasteland-500 ml-1">({perk.cost > 0 ? '+' : ''}{perk.cost})</span>
              <p className="text-wasteland-400 text-xs">{perk.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
