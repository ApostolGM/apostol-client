import { useState, useEffect } from 'react';
import { api } from '../api';
import ItemListEditor from './ItemListEditor';

export default function LootPanel({ campaignId }) {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [poolName, setPoolName] = useState('');
  const [poolItems, setPoolItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [giving, setGiving] = useState(null);

  const load = async () => {
    const [p, i, c] = await Promise.all([
      api.getLootPools(campaignId),
      api.getItems(),
      api.getCampaignCharacters(campaignId).catch(() => [])
    ]);
    setPools(p); setAllItems(i); setCharacters(c);
    setLoading(false);
  };

  useEffect(() => { load(); }, [campaignId]);

  const handleCreate = async () => {
    await api.createLootPool(campaignId, poolName, poolItems);
    setPoolName(''); setPoolItems([]); setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    await api.deleteLootPool(id);
    setPools(prev => prev.filter(p => p.id !== id));
  };

  const handleGive = async (poolId, characterId) => {
    setGiving(poolId);
    await api.giveLoot(poolId, characterId);
    setGiving(null);
    load();
  };

  if (loading) return <p className="text-wasteland-400 text-center py-4">Загрузка...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-stylized text-accent-orange">Лут</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-accent-orange text-wasteland-900 text-sm font-bold px-4 py-2 rounded">
          {showForm ? 'Отмена' : '+ Лут-пул'}
        </button>
      </div>

      {showForm && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 space-y-3">
          <input placeholder="Название (Ящик, Труп, Тайник...)" value={poolName} onChange={e => setPoolName(e.target.value)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm" />
          <ItemListEditor items={poolItems} allItems={allItems} onChange={setPoolItems} />
          <button onClick={handleCreate} disabled={!poolName} className="w-full bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">Создать</button>
        </div>
      )}

      {pools.map(pool => (
        <div key={pool.id} className="bg-wasteland-800 p-3 rounded-lg border border-wasteland-600">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-wasteland-100 font-bold">{pool.name}</h3>
            <button onClick={() => handleDelete(pool.id)} className="text-accent-red text-xs">🗑️</button>
          </div>
          <p className="text-wasteland-400 text-xs">{(pool.items || []).length} предметов</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {characters.map(ch => (
              <button key={ch.id} onClick={() => handleGive(pool.id, ch.id)} disabled={giving === pool.id}
                className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300 disabled:opacity-50">
                {giving === pool.id ? '...' : `→ ${ch.name}`}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
