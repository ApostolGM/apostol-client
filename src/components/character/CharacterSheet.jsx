// components/character/CharacterSheet.jsx
import { useState, useEffect } from 'react';
import { characters } from '../../api/characters.js';
import WeightBar from '../ui/WeightBar.jsx';
import DeathLoanSection from './DeathLoanSection.jsx';
import StatusSliders from './StatusSliders.jsx';
import SkillsSection from './SkillsSection.jsx';
import PerksSection from './PerksSection.jsx';

export default function CharacterSheet({ character, isMaster, onUpdate, onRollSkill, socketRef }) {
  const [char, setChar] = useState(character);
  const [params, setParams] = useState({
    food: character.food ?? 100,
    water: character.water ?? 100,
    stress: character.stress ?? 0,
  });
  const [editMode, setEditMode] = useState(false);
  const [weightInfo, setWeightInfo] = useState(null);

  // Слушаем character_updated
  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;
    const handleUpdate = (data) => {
      if (data.character_id === character?.id) {
        setChar(prev => ({ ...prev, ...data.updates }));
        if (data.updates.food !== undefined) setParams(p => ({ ...p, food: data.updates.food }));
        if (data.updates.water !== undefined) setParams(p => ({ ...p, water: data.updates.water }));
        if (data.updates.stress !== undefined) setParams(p => ({ ...p, stress: data.updates.stress }));
      }
    };
    socket.on('character_updated', handleUpdate);
    return () => socket.off('character_updated', handleUpdate);
  }, [socketRef, character?.id]);

  // Слушаем inventory_updated — перезагружаем персонажа целиком
  useEffect(() => {
    if (!socketRef?.current || !character?.id) return;
    const socket = socketRef.current;
    const handleInventory = async (data) => {
      if (data.character_id === character.id) {
        const updated = await characters.get(character.id);
        setChar(updated);
      }
    };
    socket.on('inventory_updated', handleInventory);
    return () => socket.off('inventory_updated', handleInventory);
  }, [socketRef, character?.id]);

  useEffect(() => {
    setChar(character);
    setParams({ food: character.food ?? 100, water: character.water ?? 100, stress: character.stress ?? 0 });
  }, [character]);

  useEffect(() => {
    if (char?.id) characters.getWeight(char.id).then(setWeightInfo).catch(() => {});
  }, [char?.id, char?.inventory]);

  const handleSlider = (field, value) => setParams(prev => ({ ...prev, [field]: parseInt(value) }));
  const saveParams = async () => { await onUpdate(params); setEditMode(false); };

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

      {weightInfo && <WeightBar weightInfo={weightInfo} />}

      {char.perks?.some(p => p.name === 'Рассрочка гибели') && (
        <DeathLoanSection char={char} socketRef={socketRef} />
      )}

      <StatusSliders
        params={params}
        editMode={editMode}
        isMaster={isMaster}
        onSliderChange={handleSlider}
        onSave={saveParams}
        onEditToggle={() => setEditMode(!editMode)}
      />

      {char.skills?.length > 0 && (
        <SkillsSection skills={char.skills} onRoll={onRollSkill} />
      )}

      {char.perks?.length > 0 && (
        <PerksSection perks={char.perks} />
      )}
    </div>
  );
}
