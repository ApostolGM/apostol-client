// components/panels/MasterCharacterPanel.jsx
import { useState, useEffect } from 'react';
import { characters } from '../../api/characters.js';
import { professions } from '../../api/professions.js';
import { items } from '../../api/items.js';
import MasterCharacterCard from './master/MasterCharacterCard.jsx';
import useConfirm from '../../hooks/useConfirm.jsx';

export default function MasterCharacterPanel({ campaignId, socketRef }) {
  const [list, setList] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allSkills, setAllSkills] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const { confirm, ConfirmModal } = useConfirm();

  const load = async () => {
    try {
      setError('');
      const [chars, skills, itemsData] = await Promise.all([
        characters.getCampaignCharacters(campaignId),
        professions.getSkills(),
        items.getAll(),
      ]);
      setList(chars);
      setAllSkills(skills || []);
      setAllItems(itemsData || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [campaignId]);

  // Реалтайм-обновление инвентаря
  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;
    const handler = (data) => {
      if (data.character_id) load();
    };
    socket.on('inventory_updated', handler);
    return () => socket.off('inventory_updated', handler);
  }, [socketRef, campaignId]);

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const handleParamChange = async (charId, field, value) => {
    setList(prev => prev.map(c => c.id === charId ? { ...c, [field]: value } : c));
    await characters.updateParams(charId, { [field]: value });
  };

  const handleDeleteCharacter = async (char) => {
    if (!await confirm(`Удалить персонажа "${char.name}"?`)) return;
    await characters.delete(char.id);
    load();
  };

  if (loading) return <p className="text-wasteland-400 text-center py-4">Загрузка...</p>;
  if (error) return <p className="text-accent-red text-center py-4">Ошибка: {error}</p>;

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-stylized text-accent-orange mb-4">Персонажи игроков</h2>
      {list.length === 0 && <p className="text-wasteland-500 text-center py-4">Нет персонажей</p>}
      {list.map(char => (
        <MasterCharacterCard
          key={char.id}
          char={char}
          expanded={!!expanded[char.id]}
          onToggle={() => toggleExpand(char.id)}
          onDelete={() => handleDeleteCharacter(char)}
          onParamChange={handleParamChange}
          allSkills={allSkills}
          allItems={allItems}
          campaignId={campaignId}
          socketRef={socketRef}
          onRefresh={load}
        />
      ))}
      {ConfirmModal}
    </div>
  );
}
