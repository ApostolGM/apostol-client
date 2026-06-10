import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api } from '../api';
import NPCPanel from '../components/NPCPanel';
import InventoryPanel from '../components/InventoryPanel';
import ScenePanel from '../components/ScenePanel';
import MasterCharacterPanel from '../components/MasterCharacterPanel';

const SOCKET_URL = 'https://apostol-api.onrender.com';

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
  const [hiddenMode, setHiddenMode] = useState(false);
  const [npcs, setNpcs] = useState([]);
  const [allCharacters, setAllCharacters] = useState([]);
  const socketRef = useRef(null);
  const chatRef = useRef(null);

  const userRole = campaign?.members?.find(m => m.user_id === user.id)?.role;
  const isMaster = userRole === 'master' || userRole === 'co-master';

  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev, msg]);
    setTimeout(() => {
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  }, []);

  useEffect(() => {
    loadCampaign();
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_campaign', { userId: user.id });
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  useEffect(() => {
    if (!campaign) return;
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit('join_campaign', { userId: user.id, campaignId: id });
    socket.emit('set_role', userRole || 'player');

    socket.on('dice_result', (data) => {
      if (data.hidden) {
        addMessage({
          user: 'Скрытый',
          text: `${data.username}: ${data.skillName ? `[${data.skillName}] ` : ''}${data.formula} = ${data.sum}`,
          time: new Date(data.time).toLocaleTimeString(),
        });
      } else {
        addMessage({
          user: data.username,
          text: `${data.skillName ? `[${data.skillName}] ` : ''}${data.formula} = ${data.sum}`,
          time: new Date(data.time).toLocaleTimeString(),
          isRoll: true,
        });
      }
    });

    return () => {
      socket.emit('leave_campaign', { userId: user.id });
      socket.disconnect();
    };
  }, [campaign]);

  const loadCampaign = async () => {
    try {
      const c = await api.getCampaign(id);
      setCampaign(c);
      const member = c.members?.find(m => m.user_id === user.id);
      if (member?.character_id && !isMaster) {
        const char = await api.getCharacter(member.character_id);
        setCharacter(char);
      }
      try {
        const npcData = await api.getNPCs(id);
        setNpcs(npcData);
      } catch (e) { console.error('NPC load error:', e); }
      const chars = [];
      for (const m of (c.members || [])) {
        if (m.character_id) {
          try { const ch = await api.getCharacter(m.character_id); chars.push(ch); } catch (e) { /* */ }
        }
      }
      setAllCharacters(chars);
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

  const refreshCharacter = async () => {
    if (character?.id) {
      const updated = await api.getCharacter(character.id);
      setCharacter(updated);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    addMessage({ user: user.username, text: input, time: new Date().toLocaleTimeString() });
    setInput('');
  };

  const rollDice = () => {
    const match = input.match(/\/r\s+(\d+)d(\d+)(?:\s*\+\s*(\d+))?/i);
    if (!match) {
      addMessage({ user: 'Система', text: 'Формат: /r XdY + Z', time: new Date().toLocaleTimeString() });
      return;
    }
    const count = parseInt(match[1]);
    const sides = parseInt(match[2]);
    const mod = parseInt(match[3] || '0');
    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    const sum = rolls.reduce((a, b) => a + b, 0) + mod;
    if (socketRef.current && campaign) {
      socketRef.current.emit('dice_roll', {
        campaignId: id,
        userId: user.id,
        username: user.username,
        formula: `${count}d${sides}${mod ? ' + ' + mod : ''} = ${sum}`,
        sum,
        hidden: hiddenMode && isMaster,
      });
    }
    setInput('');
  };

  const rollSkill = async (skillName) => {
    if (!character) return;
    try {
      const result = await api.diceAuto(character.id, skillName);
      if (socketRef.current && campaign) {
        socketRef.current.emit('dice_roll', {
          campaignId: id,
          userId: user.id,
          username: user.username,
          skillName,
          formula: result.formula,
          sum: result.sum,
          hidden: hiddenMode && isMaster,
        });
      }
    } catch (err) {
      addMessage({ user: 'Система', text: `Ошибка: ${err.message}`, time: new Date().toLocaleTimeString() });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.startsWith('/r ')) {
      e.preventDefault();
      rollDice();
    }
  };

  if (loading) return <div className="min-h-screen bg-wasteland-900 flex items-center justify-center"><p className="text-wasteland-300 font-stylized">Загрузка...</p></div>;
  if (!campaign) return null;

  const tabs = [
    { key: 'chat', label: 'Чат' },
    { key: 'character', label: 'Перс' },
    ...(isMaster ? [] : [{ key: 'inventory', label: 'Инв' }]),
    { key: 'scene', label: 'Сцена' },
    ...(isMaster ? [{ key: 'npcs', label: 'NPC' }] : []),
  ];

  return (
    <div className="min-h-screen bg-wasteland-900 flex flex-col">
      <header className="bg-wasteland-800 border-b border-wasteland-600 p-2 md:p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/dashboard')} className="text-wasteland-400 hover:text-wasteland-200 text-sm">←</button>
          <h1 className="text-base md:text-xl font-stylized text-accent-orange truncate max-w-[120px] md:max-w-none">{campaign.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isMaster && (
            <button onClick={() => setHiddenMode(!hiddenMode)} className={`text-xs px-2 py-0.5 rounded ${hiddenMode ? 'bg-accent-red text-wasteland-900' : 'bg-wasteland-600 text-wasteland-300'}`}>
              {hiddenMode ? '🔒' : '👁'}
            </button>
          )}
          <span className="text-wasteland-500 text-xs hidden sm:inline">Код: {campaign.invite_code}</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="bg-wasteland-800 border-b border-wasteland-600 flex overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 px-3 py-2 text-xs md:text-sm md:px-4 ${activeTab === tab.key ? 'bg-wasteland-700 text-accent-orange border-b-2 border-accent-orange' : 'text-wasteland-400'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'chat' && (
            <>
              <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.length === 0 && <p className="text-wasteland-500 text-center mt-8 text-sm">Чат пуст. /r 2d10 + 3 для броска</p>}
                {messages.map((m, i) => (
                  <div key={i} className={`text-sm ${m.isRoll ? 'bg-wasteland-800/50 p-1.5 rounded border border-wasteland-700' : ''}`}>
                    <span className="text-wasteland-500 text-xs">{m.time}</span>{' '}
                    <span className={`font-bold ${m.user === 'Система' ? 'text-accent-yellow' : m.user?.includes('Скрытый') ? 'text-accent-red' : 'text-accent-orange'}`}>{m.user}:</span>{' '}
                    <span className="text-wasteland-200">{m.text}</span>
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage} onKeyDown={handleKeyDown} className="p-2 bg-wasteland-800 border-t border-wasteland-600 flex gap-2">
                <input className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 placeholder-wasteland-500 text-sm" placeholder="Сообщение или /r 2d10 + 3" value={input} onChange={e => setInput(e.target.value)} />
                <button type="submit" className="bg-wasteland-600 text-wasteland-100 px-3 py-2 rounded text-sm hover:bg-wasteland-500 transition">→</button>
              </form>
            </>
          )}

          {activeTab === 'character' && (
            <div className="flex-1 overflow-y-auto p-3">
              {isMaster ? (
                <MasterCharacterPanel campaignId={id} />
              ) : (
                <>
                  {!character && !showCreateChar && (
                    <div className="text-center mt-8">
                      <p className="text-wasteland-400 mb-4">У вас ещё нет персонажа</p>
                      <button onClick={() => setShowCreateChar(true)} className="bg-accent-orange text-wasteland-900 font-bold px-6 py-3 rounded hover:bg-orange-500 transition">Создать персонажа</button>
                    </div>
                  )}
                  {showCreateChar && !character && (
                    <CharacterCreator professions={professions} perks={perks} campaignId={id} onCreated={(char) => { setCharacter(char); setShowCreateChar(false); }} onCancel={() => setShowCreateChar(false)} />
                  )}
                  {character && (
                    <CharacterSheet character={character} isMaster={false} onUpdate={async (params) => { await api.updateCharacterParams(character.id, params); refreshCharacter(); }} onRollSkill={rollSkill} />
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'inventory' && !isMaster && character && (
            <div className="flex-1 overflow-y-auto p-3">
              <InventoryPanel character={character} onRefresh={refreshCharacter} />
            </div>
          )}
          {activeTab === 'inventory' && !isMaster && !character && (
            <div className="flex-1 overflow-y-auto p-3 text-center text-wasteland-400 mt-8">Сначала создайте персонажа</div>
          )}

          {activeTab === 'scene' && (
            <div className="flex-1 overflow-hidden">
              <ScenePanel campaignId={id} isMaster={isMaster} socketRef={socketRef} npcs={npcs} characters={allCharacters} />
            </div>
          )}

          {activeTab === 'npcs' && isMaster && (
            <div className="flex-1 overflow-y-auto p-3">
              <NPCPanel campaignId={id} socketRef={socketRef} />
            </div>
          )}
        </div>

        <div className="hidden md:block w-64 bg-wasteland-800 border-l border-wasteland-600 p-3 overflow-y-auto">
          <h2 className="text-lg font-stylized mb-3 text-wasteland-300">Группа</h2>
          {campaign.members?.map(m => (
            <div key={m.user_id} className="text-sm py-1.5 px-2 rounded mb-1 bg-wasteland-700/50">
              <div className="flex items-center gap-1">
                {m.role === 'master' && <span>👑</span>}
                {m.role === 'co-master' && <span>🛡️</span>}
                <span className="text-wasteland-300">{m.user_id === user.id ? 'Вы' : `Игрок ${m.user_id?.substring(0, 6)}`}</span>
              </div>
              {m.character_id && <span className="text-wasteland-500 text-xs">🎭 В игре</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
    const idx1 = Math.floor(Math.random() * count);
    let idx2, idx3;
    do { idx2 = Math.floor(Math.random() * count); } while (idx2 === idx1);
    do { idx3 = Math.floor(Math.random() * count); } while (idx3 === idx1 || idx3 === idx2);
    setRolledProfs([professions[idx1], professions[idx2], professions[idx3]]);
    setStep(2);
  };

  const selectProfession = (prof) => { setSelectedProf(prof); setStep(3); };

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
    setLoading(true); setError('');
    try {
      const char = await api.createCharacter({ campaign_id: campaignId, name, profession_id: selectedProf.id, perk_ids: selectedPerks.map(p => p.id) });
      onCreated(char);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
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
      {step === 1 && (
        <div className="bg-wasteland-800 p-6 rounded-lg border border-wasteland-600 space-y-4">
          <label className="block text-wasteland-300 text-sm">Имя персонажа</label>
          <input className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-3 text-wasteland-100" placeholder="Введите имя..." value={name} onChange={e => setName(e.target.value)} />
          <button onClick={rollProfessions} disabled={!name.trim()} className="w-full bg-accent-orange text-wasteland-900 font-bold py-3 rounded hover:bg-orange-500 transition disabled:opacity-50">Бросить на профессию (3d{professions.length})</button>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-wasteland-300 text-sm">Выберите одну из трёх:</p>
          {rolledProfs.map(prof => (
            <div key={prof.id} onClick={() => selectProfession(prof)} className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 cursor-pointer hover:border-accent-orange hover:bg-wasteland-700 transition">
              <h3 className="text-accent-orange font-bold">{prof.name}</h3>
              <p className="text-wasteland-400 text-sm mt-1">{prof.description}</p>
              <div className="mt-2 text-xs text-wasteland-400">Навыки: {prof.starter_skills?.map(s => `${s.skill} +${s.modifier}%`).join(', ')}</div>
            </div>
          ))}
          <button onClick={() => setStep(1)} className="text-wasteland-400 text-sm hover:text-wasteland-200">← Назад</button>
        </div>
      )}
      {step === 3 && selectedProf && (
        <div className="space-y-4">
          <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600">
            <p className="text-wasteland-300 text-sm">Персонаж: <span className="text-wasteland-100">{name}</span></p>
            <p className="text-wasteland-300 text-sm">Профессия: <span className="text-accent-orange">{selectedProf.name}</span></p>
            <p className={`text-lg font-bold mt-2 ${balance < 0 ? 'text-accent-red' : balance > 0 ? 'text-accent-green' : 'text-wasteland-300'}`}>Очки: {balance}</p>
          </div>
          <p className="text-wasteland-300 text-sm">Выберите перки:</p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {perks.map(perk => {
              const isSelected = selectedPerks.find(p => p.id === perk.id);
              return (
                <div key={perk.id} onClick={() => togglePerk(perk)} className={`p-3 rounded-lg border cursor-pointer transition ${isSelected ? 'border-accent-orange bg-wasteland-700' : 'border-wasteland-600 bg-wasteland-800 hover:border-wasteland-500'}`}>
                  <div className="flex justify-between items-start">
                    <div><span className="font-bold text-wasteland-100">{perk.name}</span><span className={`ml-2 text-xs ${getPerkTypeColor(perk.type)}`}>{perk.type}</span></div>
                    <span className={`text-sm font-bold ${perk.type === 'negative' ? 'text-accent-green' : perk.type === 'positive' ? 'text-accent-red' : 'text-wasteland-400'}`}>{perk.cost > 0 ? '+' : ''}{perk.cost}</span>
                  </div>
                  <p className="text-wasteland-400 text-xs mt-1">{perk.description}</p>
                  {perk.effect_text && <p className="text-wasteland-300 text-xs mt-1">{perk.effect_text}</p>}
                </div>
              );
            })}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="text-wasteland-400 text-sm hover:text-wasteland-200 px-4 py-2">← Назад</button>
            <button onClick={handleCreate} disabled={!name.trim() || balance < 0 || loading} className="flex-1 bg-accent-orange text-wasteland-900 font-bold py-3 rounded hover:bg-orange-500 transition disabled:opacity-50">{loading ? 'Создание...' : 'Создать'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CharacterSheet({ character, isMaster, onUpdate, onRollSkill }) {
  const [editMode, setEditMode] = useState(false);
  const [params, setParams] = useState({
    food: character.food ?? 100,
    water: character.water ?? 100,
    stress: character.stress ?? 0,
    game_time_date: character.game_time_date ?? '2026-01-01',
    game_time_hours: character.game_time_hours ?? 12,
    game_time_minutes: character.game_time_minutes ?? 0,
    carry_weight_max: character.carry_weight_max ?? 50,
  });

  const handleSlider = (field, value) => {
    setParams(prev => ({ ...prev, [field]: field === 'game_time_date' ? value : parseInt(value) }));
  };

  const saveParams = async () => { await onUpdate(params); setEditMode(false); };

  const formatGameTime = () => {
    const h = String(params.game_time_hours).padStart(2, '0');
    const m = String(params.game_time_minutes).padStart(2, '0');
    return `${params.game_time_date} ${h}:${m}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600">
        <div className="flex justify-between items-start">
          <div><h2 className="text-xl font-stylized text-wasteland-100">{character.name}</h2><p className="text-accent-orange">{character.profession?.name}</p></div>
          <div className="text-right text-xs text-wasteland-400"><p>Очков: {character.balance_points}</p><p className="text-wasteland-500 mt-1">{formatGameTime()}</p></div>
        </div>
      </div>
      <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-wasteland-300 font-stylized">Состояние</h3>
          {isMaster && (
            <button onClick={() => editMode ? saveParams() : setEditMode(true)} className={`text-xs px-3 py-1 rounded ${editMode ? 'bg-accent-green text-wasteland-900' : 'bg-wasteland-600 text-wasteland-300'}`}>{editMode ? 'Сохранить' : 'Изменить'}</button>
          )}
        </div>
        {[{ label: 'Еда', field: 'food', color: '#33cc33' },{ label: 'Вода', field: 'water', color: '#3399ff' },{ label: 'Стресс', field: 'stress', color: '#cc3333' }].map(({ label, field, color }) => (
          <div key={field} className="mb-3">
            <div className="flex justify-between text-sm mb-1"><span className="text-wasteland-400">{label}</span><span className="text-wasteland-300">{params[field]}%</span></div>
            <input type="range" min="0" max="100" value={params[field]} onChange={e => handleSlider(field, e.target.value)} disabled={!isMaster && !editMode} className="w-full h-2 rounded cursor-pointer" style={{ accentColor: color, opacity: isMaster || editMode ? 1 : 0.7 }} />
          </div>
        ))}
        {editMode && (
          <div className="mt-4 pt-3 border-t border-wasteland-600">
            <p className="text-wasteland-400 text-sm mb-2">Игровое время</p>
            <div className="flex gap-2 text-sm flex-wrap">
              <input type="date" value={params.game_time_date} onChange={e => handleSlider('game_time_date', e.target.value)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100" />
              <input type="number" min="0" max="23" value={params.game_time_hours} onChange={e => handleSlider('game_time_hours', e.target.value)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 w-16" placeholder="Ч" />
              <span className="text-wasteland-400 self-center">:</span>
              <input type="number" min="0" max="59" value={params.game_time_minutes} onChange={e => handleSlider('game_time_minutes', e.target.value)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 w-16" placeholder="М" />
            </div>
          </div>
        )}
      </div>
      {character.skills?.length > 0 && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600">
          <h3 className="text-wasteland-300 font-stylized mb-3">Навыки</h3>
          <div className="grid grid-cols-2 gap-2">
            {character.skills.map(skill => (
              <button key={skill.id} onClick={() => onRollSkill(skill.name)} className="bg-wasteland-700 p-3 rounded text-left hover:bg-wasteland-600 hover:border-wasteland-500 border border-transparent transition active:scale-95">
                <div className="flex justify-between items-center"><span className="text-wasteland-200 text-sm">{skill.name}</span><span className="text-sm font-bold text-accent-green">+{skill.totalModifier}%</span></div>
              </button>
            ))}
          </div>
        </div>
      )}
      {character.perks?.length > 0 && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600">
          <h3 className="text-wasteland-300 font-stylized mb-2">Перки</h3>
          {character.perks.map(perk => (
            <div key={perk.id} className="text-sm"><span className={`font-bold ${perk.type === 'positive' ? 'text-accent-green' : perk.type === 'negative' ? 'text-accent-red' : 'text-wasteland-300'}`}>{perk.name}</span><span className="text-wasteland-500 ml-1">({perk.cost > 0 ? '+' : ''}{perk.cost})</span><p className="text-wasteland-400 text-xs">{perk.effect_text}</p></div>
          ))}
        </div>
      )}
    </div>
  );
}