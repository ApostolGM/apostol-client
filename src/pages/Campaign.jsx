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
    setRolledProfs([professions[r1 - 1], professions[r2 - 1], professions[r3 -
