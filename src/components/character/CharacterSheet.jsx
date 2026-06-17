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
  const [editMode, setEditMode] = useState(false);
  const [weightInfo, setWeightInfo] = useState(null);

  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;
    const handleUpdate = (data) => {
      if (data.character_id === character?.id) {
        setChar(prev => ({ ...prev, ...data.updates }));
      }
    };
    socket.on('character_updated', handleUpdate);
    return () => socket.off('character_updated', handleUpdate);
  }, [socketRef, character?.id]);

  useEffect(() => {
    if (!socketRef?.current || !character?.id) return;
    const socket = socketRef.current;
    const handler = async (data) => {
      if (data.character_id === character.id) {
        const updated = await characters.get(character.id);
        setChar(updated);
      }
    };
    socket.on('inventory_updated', handler);
    return () => socket.off('inventory_updated', handler);
  }, [socketRef, character?.id]);

  useEffect(() => { setChar(character); }, [character]);

  useEffect(() => {
    if (char?.id) characters.getWeight(char.id).then(setWeightInfo).catch(() => {});
  }, [char?.id, char?.inventory]);

  const handleSave = async (statuses) => {
    await onUpdate({ statuses });
    setEditMode(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600">
        <h2 className="text-xl font-stylized text-wasteland-100">{char.name}</h2>
        <p className="text-accent-orange">{char.profession?.name}</p>
      </div>

      {weightInfo && <WeightBar weightInfo={weightInfo} />}

      {char.perks?.some(p => p.name === 'Рассрочка гибели') && (
        <DeathLoanSection char={char} socketRef={socketRef} />
      )}

      <StatusSliders
        statuses={char.statuses || []}
        editMode={editMode}
        isMaster={isMaster}
        onSave={handleSave}
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
