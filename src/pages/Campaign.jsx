import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Campaign({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [character, setCharacter] = useState(null);
  const [professions, setProfessions] = useState([]);
  const [perks, setPerks] = useState([]);
  const [showCreateChar, setShowCreateChar] = useState(false);
  const [charName, setCharName] = useState('');

  useEffect(() => {
    loadCampaign();
  }, [id]);

  const loadCampaign = async () => {
    try {
      const c = await api.getCampaign(id);
      setCampaign(c);
      // Ищем персонажа текущего пользователя
      const member = c.members?.find(m => m.user_id === user.id);
      if (member?.character_id) {
        const char = await api.getCharacter(member.character_id);
        setCharacter(char);
      }
      // Загружаем профессии и перки для создания персонажа
      const profs = await api.getProfessions();
      setProfessions(profs);
      const allPerks = await api.getPerks();
      setPerks(allPerks);
    } catch (e) {
      console.error(e);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages(prev => [...prev, { user: user.username, text: input, time: new Date().toLocaleTimeString() }]);
    setInput('');
  };

  const rollDice = () => {
    const match = input.match(/\/r\s+(\d+)d(\d+)(?:\s*\+\s*(\d+))?/i);
    if (!match) {
      setMessages(prev => [...prev, { user: 'Система', text: 'Формат: /r XdY + Z', time: new Date().toLocaleTimeString() }]);
      return;
    }
    const count = parseInt(match[1]);
    const sides = parseInt(match[2]);
    const mod = parseInt(match[3] || '0');
    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    const sum = rolls.reduce((a, b) => a + b, 0) + mod;
    setMessages(prev => [...prev, {
      user: user.username,
      text: `🎲 /r ${count}d${sides}${mod ? ' + ' + mod : ''} → [${rolls.join(', ')}] + ${mod} = ${sum}`,
      time: new Date().toLocaleTimeString()
    }]);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.startsWith('/r ')) {
      e.preventDefault();
      rollDice();
    }
  };

  if (loading) return <div className="min-h-screen bg-wasteland-900 flex items-center justify-center"><p className="text-wasteland-300 font-stylized">Загрузка...</p></div>;
  if (!campaign) return null;

  const isMaster = campaign.members?.find(m => m.user_id === user.id)?.role === 'master';
  const userMember = campaign.members?.find(m => m.user_id === user.id);

  return (
    <div className="min-h-screen bg-wasteland-900 flex flex-col">
      {/* Шапка */}
      <header className="bg-wasteland-800 border-b border-wasteland-600 p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-wasteland-400 hover:text-wasteland-200">←</button>
          <h1 className="text-xl font-stylized text-accent-orange">{campaign.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-wasteland-400 text-xs">Код: {campaign.invite_code}</span>
          <span className="text-wasteland-500 text-sm">{user.username}</span>
        </div>
      </header>

      {/* Основной контент */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Чат / панели */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Вкладки */}
          <div className="bg-wasteland-800 border-b border-wasteland-600 flex">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 text-sm ${activeTab === 'chat' ? 'bg-wasteland-700 text-accent-orange border-b-2 border-accent-orange' : 'text-wasteland-400'}`}
            >
              Чат
            </button>
            <button
              onClick={() => setActiveTab('character')}
              className={`px-4 py-2 text-sm ${activeTab === 'character' ? 'bg-wasteland-700 text-accent-orange border-b-2 border-accent-orange' : 'text-wasteland-400'}`}
            >
              Персонаж
            </button>
          </div>

          {/* Контент вкладок */}
          {activeTab === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.length === 0 && (
                  <p className="text-wasteland-500 text-center mt-8 text-sm">Чат пуст. /r 2d10 + 3 для броска</p>
                )}
                {messages.map((m, i) => (
                  <div key={i} className="text-sm">
                    <span className="text-wasteland-500 text-xs">{m.time}</span>{' '}
                    <span className={`font-bold ${m.user === 'Система' ? 'text-accent-yellow' : 'text-accent-orange'}`}>{m.user}:</span>{' '}
                    <span className="text-wasteland-200">{m.text}</span>
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage} onKeyDown={handleKeyDown} className="p-3 bg-wasteland-800 border-t border-wasteland-600 flex gap-2">
                <input
                  className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 placeholder-wasteland-500 text-sm"
                  placeholder="Сообщение или /r 2d10 + 3"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                />
                <button type="submit" className="bg-wasteland-600 text-wasteland-100 px-4 py-2 rounded text-sm hover:bg-wasteland-500 transition">
                  →
                </button>
              </form>
            </>
          )}

          {activeTab === 'character' && (
            <div className="flex-1 overflow-y-auto p-4">
              {!character && !showCreateChar && (
                <div className="text-center mt-8">
                  <p className="text-wasteland-400 mb-4">У вас ещё нет персонажа в этой кампании</p>
                  <button
                    onClick={() => setShowCreateChar(true)}
                    className="bg-accent-orange text-wasteland-900 font-bold px-6 py-3 rounded hover:bg-orange-500 transition"
                  >
                    Создать персонажа
                  </button>
                </div>
              )}

              {showCreateChar && !character && <CharacterCreator
                professions={professions}
                perks={perks}
                campaignId={id}
                onCreated={(char) => { setCharacter(char); setShowCreateChar(false); }}
                onCancel={() => setShowCreateChar(false)}
              />}

              {character && <CharacterSheet
                character={character}
                isMaster={isMaster}
                onUpdate={async (params) => {
                  const updated = await api.updateCharacterParams(character.id, params);
                  setCharacter(prev => ({ ...prev, ...updated }));
                }}
              />}
            </div>
          )}
        </div>

        {/* Правая панель */}
        <div className="w-full md:w-72 bg-wasteland-800 border-l border-wasteland-600 p-3 overflow-y-auto">
          <h2 className="text-lg font-stylized mb-3 text-wasteland-300">Группа</h2>
          {campaign.members?.map(m => (
            <div key={m.user_id} className="text-sm py-1.5 px-2 rounded mb-1 bg-wasteland-700/50">
              <div className="flex items-center gap-1">
                {m.role === 'master' && <span className="text-xs">👑</span>}
                {m.role === 'co-master' && <span className="text-xs">🛡️</span>}
                <span className="text-wasteland-300">{m.user_id === user.id ? 'Вы' : `Игрок ${m.user_id?.substring(0, 6)}`}</span>
              </div>
              {m.character_id && (
                <span className="text-wasteland-500 text-xs">🎭 Персонаж создан</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== КОМПОНЕНТ СОЗДАНИЯ ПЕРСОНАЖА =====
function CharacterCreator({ professions, perks, campaignId, onCreated, onCancel }) {
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
    const r1 = Math.floor(Math.random() * count) + 1;
    const r2 = Math.floor(Math.random() * count) + 1;
    const r3 = Math.floor(Math.random() * count) + 1;
    setRolledProfs([professions[r1 - 1], professions[r2 - 1], professions[r3 - 1]]);
    setStep(2);
  };

  const selectProfession = (prof) => {
    setSelectedProf(prof);
    setStep(3);
  };

  const togglePerk = (perk) => {
    const isSelected = selectedPerks.find(p => p.id === perk.id);
    let newPerks;
    if (isSelected) {
      newPerks = selectedPerks.filter(p => p.id !== perk.id);
      setBalance(balance - perk.cost);
    } else {
      newPerks = [...selectedPerks, perk];
      setBalance(balance + perk.cost);
    }
    setSelectedPerks(newPerks);
  };

  const canCreate = name.trim() && balance >= 0;

  const handleCreate = async () => {
    if (!canCreate) return;
    setLoading(true);
    setError('');
    try {
      const char = await api.createCharacter({
        campaign_id: campaignId,
        name,
        profession_id: selectedProf.id,
        perk_ids: selectedPerks.map(p => p.id)
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

      {error && <p className="text-accent-red text-sm mb-4 bg-wasteland-800 p-3 rounded">{error}</p>}

      {/* Шаг 1: Имя */}
      {step === 1 && (
        <div className="bg-wasteland-800 p-6 rounded-lg border border-wasteland-600 space-y-4">
          <label className="block text-wasteland-300 text-sm">Имя персонажа</label>
          <input
            className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-3 text-wasteland-100"
            placeholder="Введите имя..."
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <button
            onClick={rollProfessions}
            disabled={!name.trim()}
            className="w-full bg-accent-orange text-wasteland-900 font-bold py-3 rounded hover:bg-orange-500 transition disabled:opacity-50"
          >
            Бросить на профессию (3d{professions.length})
          </button>
        </div>
      )}

      {/* Шаг 2: Выбор профессии */}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-wasteland-300 text-sm">Выберите одну из трёх профессий:</p>
          {rolledProfs.map(prof => (
            <div
              key={prof.id}
              onClick={() => selectProfession(prof)}
              className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 cursor-pointer hover:border-accent-orange hover:bg-wasteland-700 transition"
            >
              <h3 className="text-accent-orange font-bold">{prof.name}</h3>
              <p className="text-wasteland-400 text-sm mt-1">{prof.description}</p>
              <div className="mt-2 text-xs text-wasteland-400">
                Стартовые навыки: {prof.starter_skills?.map(s => `${s.skill} +${s.modifier}%`).join(', ')}
              </div>
            </div>
          ))}
          <button onClick={() => setStep(1)} className="text-wasteland-400 text-sm hover:text-wasteland-200">← Назад</button>
        </div>
      )}

      {/* Шаг 3: Выбор перков */}
      {step === 3 && selectedProf && (
        <div className="space-y-4">
          <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600">
            <p className="text-wasteland-300 text-sm">Персонаж: <span className="text-wasteland-100">{name}</span></p>
            <p className="text-wasteland-300 text-sm">Профессия: <span className="text-accent-orange">{selectedProf.name}</span></p>
            <p className={`text-lg font-bold mt-2 ${balance < 0 ? 'text-accent-red' : balance > 0 ? 'text-accent-green' : 'text-wasteland-300'}`}>
              Очки распределения: {balance}
            </p>
            {balance < 0 && <p className="text-accent-red text-xs mt-1">Нельзя уйти в минус! Уберите часть перков.</p>}
          </div>

          <p className="text-wasteland-300 text-sm">Выберите перки:</p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {perks.map(perk => {
              const isSelected = selectedPerks.find(p => p.id === perk.id);
              return (
                <div
                  key={perk.id}
                  onClick={() => togglePerk(perk)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${isSelected
                    ? 'border-accent-orange bg-wasteland-700'
                    : 'border-wasteland-600 bg-wasteland-800 hover:border-wasteland-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-wasteland-100">{perk.name}</span>
                      <span className={`ml-2 text-xs ${getPerkTypeColor(perk.type)}`}>
                        {perk.type === 'positive' ? '👍' : perk.type === 'negative' ? '👎' : '➖'} {perk.type}
                      </span>
                    </div>
                    <span className={`text-sm font-bold ${perk.type === 'negative' ? 'text-accent-green' : perk.type === 'positive' ? 'text-accent-red' : 'text-wasteland-400'}`}>
                      {perk.cost > 0 ? '+' : ''}{perk.cost}
                    </span>
                  </div>
                  <p className="text-wasteland-400 text-xs mt-1">{perk.description}</p>
                  {perk.effect_text && <p className="text-wasteland-300 text-xs mt-1">{perk.effect_text}</p>}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="text-wasteland-400 text-sm hover:text-wasteland-200 px-4 py-2">← Назад</button>
            <button
              onClick={handleCreate}
              disabled={!canCreate || loading}
              className="flex-1 bg-accent-orange text-wasteland-900 font-bold py-3 rounded hover:bg-orange-500 transition disabled:opacity-50"
            >
              {loading ? 'Создание...' : 'Создать персонажа'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== КОМПОНЕНТ ЛИСТА ПЕРСОНАЖА =====
function CharacterSheet({ character, isMaster, onUpdate }) {
  const [editMode, setEditMode] = useState(false);
  const [params, setParams] = useState({
    food: character.food,
    water: character.water,
    stress: character.stress,
    game_time_date: character.game_time_date,
    game_time_hours: character.game_time_hours,
    game_time_minutes: character.game_time_minutes,
    carry_weight_max: character.carry_weight_max,
  });

  const handleSlider = (field, value) => {
    setParams(prev => ({ ...prev, [field]: parseInt(value) }));
  };

  const saveParams = async () => {
    await onUpdate(params);
    setEditMode(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Заголовок */}
      <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-stylized text-wasteland-100">{character.name}</h2>
            <p className="text-accent-orange">{character.profession?.name}</p>
          </div>
          <div className="text-right text-xs text-wasteland-400">
            <p>Очков: {character.balance_points}</p>
          </div>
        </div>
      </div>

      {/* Параметры-ползунки */}
      <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-wasteland-300 font-stylized">Состояние</h3>
          {isMaster && (
            <button
              onClick={() => editMode ? saveParams() : setEditMode(true)}
              className={`text-xs px-3 py-1 rounded ${editMode ? 'bg-accent-green text-wasteland-900' : 'bg-wasteland-600 text-wasteland-300'}`}
            >
              {editMode ? 'Сохранить' : 'Изменить'}
            </button>
          )}
        </div>

        {[
          { label: 'Еда', field: 'food', color: 'bg-accent-green' },
          { label: 'Вода', field: 'water', color: 'bg-blue-500' },
          { label: 'Стресс', field: 'stress', color: 'bg-accent-red' },
        ].map(({ label, field, color }) => (
          <div key={field} className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-wasteland-400">{label}</span>
              <span className="text-wasteland-300">{params[field]}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={params[field]}
              onChange={e => handleSlider(field, e.target.value)}
              disabled={!editMode}
              className={`w-full h-2 rounded appearance-none cursor-pointer ${editMode ? 'opacity-100' : 'opacity-70'} ${color}`}
              style={{ accentColor: 'currentColor' }}
            />
          </div>
        ))}

        {/* Игровое время */}
        <div className="mt-4 pt-3 border-t border-wasteland-600">
          <p className="text-wasteland-400 text-sm mb-2">Игровое время</p>
          <div className="flex gap-2 text-sm">
            <input
              type="date"
              value={params.game_time_date}
              onChange={e => handleSlider('game_time_date', e.target.value)}
              disabled={!editMode}
              className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100"
            />
            <input
              type="number"
              min="0" max="23"
              value={params.game_time_hours}
              onChange={e => handleSlider('game_time_hours', e.target.value)}
              disabled={!editMode}
              className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 w-16"
              placeholder="Ч"
            />
            <span className="text-wasteland-400">:</span>
            <input
              type="number"
              min="0" max="59"
              value={params.game_time_minutes}
              onChange={e => handleSlider('game_time_minutes', e.target.value)}
              disabled={!editMode}
              className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 w-16"
              placeholder="М"
            />
          </div>
        </div>
      </div>

      {/* Перки */}
      {character.perks?.length > 0 && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600">
          <h3 className="text-wasteland-300 font-stylized mb-2">Перки</h3>
          <div className="space-y-2">
            {character.perks.map(perk => (
              <div key={perk.id} className="text-sm">
                <span className={`font-bold ${perk.type === 'positive' ? 'text-accent-green' : perk.type === 'negative' ? 'text-accent-red' : 'text-wasteland-300'}`}>
                  {perk.name}
                </span>
                <span className="text-wasteland-500 ml-1">({perk.cost > 0 ? '+' : ''}{perk.cost})</span>
                <p className="text-wasteland-400 text-xs">{perk.effect_text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Навыки */}
      {character.skills?.length > 0 && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600">
          <h3 className="text-wasteland-300 font-stylized mb-2">Навыки</h3>
          <div className="grid grid-cols-2 gap-2">
            {character.skills.map(skill => (
              <div key={skill.id} className="bg-wasteland-700 p-2 rounded text-sm flex justify-between">
                <span className="text-wasteland-300">{skill.name}</span>
                <span className="text-accent-green">+{skill.modifier}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
