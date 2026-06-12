// src/components/CharacterCreator.jsx
import { useState } from 'react';
import { api } from '../api';

export default function CharacterCreator({ professions, perks, campaignId, onCreated, onCancel }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [rolledProfs, setRolledProfs] = useState([]);
  const [selectedProf, setSelectedProf] = useState(null);
  const [selectedPerks, setSelectedPerks] = useState([]);
  const [balance, setBalance] = useState(10);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const rollProfessions = () => {
    const count = professions.length;
    const idx1 = Math.floor(Math.random() * count);
    let idx2, idx3;
    do { idx2 = Math.floor(Math.random() * count); } while (idx2 === idx1);
    do { idx3 = Math.floor(Math.random() * count); } while (idx3 === idx1 || idx3 === idx2);
    setRolledProfs([professions[idx1], professions[idx2], professions[idx3]]);
    setStep(2);
  };

  const selectProfession = (prof) => {
    setSelectedProf(prof);
    setStep(3);
  };

  const togglePerk = (perk) => {
    const isSelected = selectedPerks.find(p => p.id === perk.id);
    if (isSelected) {
      setSelectedPerks(prev => prev.filter(p => p.id !== perk.id));
      setBalance(b => b - perk.cost);
    } else {
      setSelectedPerks(prev => [...prev, perk]);
      setBalance(b => b + perk.cost);
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || balance < 0) return;
    setLoading(true);
    setError('');
    try {
      const char = await api.createCharacter({
        campaign_id: campaignId,
        name,
        profession_id: selectedProf.id,
        perk_ids: selectedPerks.map(p => p.id),
      });
      onCreated(char);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPerkTypeColor = (type) => {
    if (type === 'positive') return 'text-accent-green';
    if (type === 'negative') return 'text-accent-red';
    return 'text-wasteland-300';
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-stylized text-accent-orange mb-4">Создание персонажа</h2>

      {error && (
        <p className="text-accent-red text-sm mb-4 bg-wasteland-800 p-3 rounded">{error}</p>
      )}

      {/* Шаг 1: Имя */}
      {step === 1 && (
        <div className="bg-wasteland-800 p-6 rounded-lg border border-wasteland-600 space-y-4">
          <label className="block text-wasteland-300 text-sm">Имя персонажа</label>
          <input
            className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-3 text-wasteland-100"
            placeholder="Введите имя..."
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
          <button
            onClick={rollProfessions}
            disabled={!name.trim()}
            className="w-full bg-accent-orange text-wasteland-900 font-bold py-3 rounded hover:bg-orange-500 transition disabled:opacity-50"
          >
            Бросить на профессию (3d{professions.length})
          </button>
          <button
            onClick={onCancel}
            className="w-full text-wasteland-400 text-sm hover:text-wasteland-200 py-2"
          >
            Отмена
          </button>
        </div>
      )}

      {/* Шаг 2: Выбор профессии */}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-wasteland-300 text-sm">Выберите одну из трёх (нельзя вернуться назад):</p>
          {rolledProfs.map(prof => (
            <div
              key={prof.id}
              onClick={() => selectProfession(prof)}
              className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 cursor-pointer hover:border-accent-orange hover:bg-wasteland-700 transition"
            >
              <h3 className="text-accent-orange font-bold">{prof.name}</h3>
              <p className="text-wasteland-400 text-sm mt-1">{prof.description}</p>
              <div className="mt-2 text-xs text-wasteland-400">
                Навыки: {prof.starter_skills?.map(s => `${s.skill} +${s.modifier}%`).join(', ')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Шаг 3: Выбор перков */}
      {step === 3 && selectedProf && (
        <div className="space-y-4">
          <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600">
            <p className="text-wasteland-300 text-sm">
              Персонаж: <span className="text-wasteland-100">{name}</span>
            </p>
            <p className="text-wasteland-300 text-sm">
              Профессия: <span className="text-accent-orange">{selectedProf.name}</span>
            </p>
            <p className={`text-lg font-bold mt-2 ${
              balance < 0 ? 'text-accent-red' : balance > 0 ? 'text-accent-green' : 'text-wasteland-300'
            }`}>
              Очки: {balance}
            </p>
          </div>

          <p className="text-wasteland-300 text-sm">Выберите перки:</p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {perks.map(perk => {
              const isSelected = selectedPerks.find(p => p.id === perk.id);
              return (
                <div
                  key={perk.id}
                  onClick={() => togglePerk(perk)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    isSelected
                      ? 'border-accent-orange bg-wasteland-700'
                      : 'border-wasteland-600 bg-wasteland-800 hover:border-wasteland-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-wasteland-100">{perk.name}</span>
                      <span className={`ml-2 text-xs ${getPerkTypeColor(perk.type)}`}>{perk.type}</span>
                    </div>
                    <span className={`text-sm font-bold ${
                      perk.type === 'negative' ? 'text-accent-green' :
                      perk.type === 'positive' ? 'text-accent-red' :
                      'text-wasteland-400'
                    }`}>
                      {perk.cost > 0 ? '+' : ''}{perk.cost}
                    </span>
                  </div>
                  <p className="text-wasteland-400 text-xs mt-1">{perk.description}</p>
                  {perk.effect_text && (
                    <p className="text-wasteland-300 text-xs mt-1">{perk.effect_text}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="text-wasteland-400 text-sm hover:text-wasteland-200 px-4 py-2"
            >
              ← Назад
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim() || balance < 0 || loading}
              className="flex-1 bg-accent-orange text-wasteland-900 font-bold py-3 rounded hover:bg-orange-500 transition disabled:opacity-50"
            >
              {loading ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
