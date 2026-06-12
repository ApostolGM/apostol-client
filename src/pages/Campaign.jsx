// src/pages/Campaign.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api, ApiError } from '../api';
import NPCPanel from '../components/NPCPanel';
import InventoryPanel from '../components/InventoryPanel';
import ScenePanel from '../components/ScenePanel';
import MasterCharacterPanel from '../components/MasterCharacterPanel';
import MasterNotes from '../components/MasterNotes';
import HandoutsPanel from '../components/HandoutsPanel';
import SoundPad from '../components/SoundPad';
import AdminPanel from '../components/AdminPanel';
import ShopPanel from '../components/ShopPanel';
import CharacterSheet from '../components/CharacterSheet';
import CharacterCreator from '../components/CharacterCreator';
import TimeCounter from '../components/TimeCounter';

const SOCKET_URL = 'https://apostol-api.onrender.com';

export default function Campaign({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [character, setCharacter] = useState(null);
  const [professions, setProfessions] = useState([]);
  const [perks, setPerks] = useState([]);
  const [showCreateChar, setShowCreateChar] = useState(false);
  const [hiddenMode, setHiddenMode] = useState(false);
  const [npcs, setNpcs] = useState([]);
  const [allCharacters, setAllCharacters] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [ammoTypes, setAmmoTypes] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');

  const socketRef = useRef(null);
  const chatRef = useRef(null);
  const characterRef = useRef(character);

  const userRole = campaign?.members?.find(m => m.user_id === user.id)?.role;
  const isMaster = userRole === 'master' || userRole === 'co-master';

  useEffect(() => { characterRef.current = character; }, [character]);

  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev, msg]);
    setTimeout(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }); }, 50);
  }, []);

  useEffect(() => {
    loadCampaign();
    return () => { if (socketRef.current) { socketRef.current.emit('leave_campaign', { userId: user.id }); socketRef.current.disconnect(); } };
  }, [id]);

  useEffect(() => {
    if (!campaign) return;
    const socket = io(SOCKET_URL, { reconnectionAttempts: 10, reconnectionDelay: 1000 });
    socketRef.current = socket;
    socket.emit('join_campaign', { userId: user.id, campaignId: id });
    socket.emit('set_role', userRole || 'player');

    const handlers = {
      character_updated: (data) => { const cc = characterRef.current; if (cc && data.character_id === cc.id) setCharacter(prev => prev ? { ...prev, ...data.updates } : prev); },
      dice_result: (data) => { addMessage({ user: data.username, text: `${data.skillName ? `[${data.skillName}] ` : ''}${data.formula} = ${data.sum}`, time: new Date(data.time).toLocaleTimeString(), isRoll: true, hidden: data.hidden }); },
      chat_message: (data) => { addMessage({ user: data.username, text: data.text, time: new Date(data.created_at).toLocaleTimeString(), isRoll: data.is_roll }); },
      inventory_updated: () => { if (characterRef.current) refreshCharacter(); },
    };

    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));

    return () => {
      Object.keys(handlers).forEach(event => socket.off(event));
      socket.emit('leave_campaign', { userId: user.id });
      socket.disconnect();
    };
  }, [campaign]);

  const loadCampaign = async () => {
    try {
      setError('');
      const [c, items, ammo, meData] = await Promise.all([
        api.getCampaign(id), api.getItems().catch(() => []),
        api.getAmmoTypes().catch(() => []), api.me().catch(() => ({}))
      ]);
      setCampaign(c); setAllItems(items); setAmmoTypes(ammo); setIsAdmin(meData?.role === 'admin');

      const member = c.members?.find(m => m.user_id === user.id);
      if (member?.character_id && !isMaster) {
        try { const char = await api.getCharacter(member.character_id); setCharacter(char); } catch {}
      }

      const [npcData, profsData, allPerks, history] = await Promise.all([
        api.getNPCs(id).catch(() => []), api.getProfessions(), api.getPerks(),
        api.getChatMessages(id).catch(() => []),
      ]);
      setNpcs(npcData); setProfessions(profsData); setPerks(allPerks);
      setMessages(history.map(m => ({ user: m.username, text: m.text, time: new Date(m.created_at).toLocaleTimeString(), isRoll: m.is_roll })));

      const chars = [];
      for (const m of (c.members || [])) {
        if (m.character_id) { try { const ch = await api.getCharacter(m.character_id); chars.push(ch); } catch {} }
      }
      setAllCharacters(chars);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) navigate('/dashboard');
      else setError(e.message);
    } finally { setLoading(false); }
  };

  const refreshCharacter = async () => {
    if (characterRef.current?.id) {
      try { const updated = await api.getCharacter(characterRef.current.id); setCharacter(updated); } catch {}
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    try { await api.sendChatMessage(id, text, false); }
    catch (err) { addMessage({ user: user.username, text, time: new Date().toLocaleTimeString() }); }
  };

  const rollDice = async () => {
    const match = input.match(/\/r\s+(\d+)d(\d+)(?:\s*\+\s*(\d+))?/i);
    if (!match) { addMessage({ user: 'Система', text: 'Формат: /r XdY + Z', time: new Date().toLocaleTimeString() }); return; }
    const count = parseInt(match[1]), sides = parseInt(match[2]), mod = parseInt(match[3] || '0');
    const sum = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1).reduce((a, b) => a + b, 0) + mod;
    const formula = `${count}d${sides}${mod ? ' + ' + mod : ''} = ${sum}`;
    setInput('');
    try { await api.sendChatMessage(id, `🎲 ${formula}`, true); } catch {}
    if (socketRef.current) socketRef.current.emit('dice_roll', { campaignId: id, userId: user.id, username: user.username, formula, sum, hidden: hiddenMode && isMaster });
  };

  const rollSkill = async (skillName) => {
    if (!character) return;
    try {
      const result = await api.diceAuto(character.id, skillName);
      try { await api.sendChatMessage(id, `🎲 [${skillName}] ${result.formula}`, true); } catch {}
      if (socketRef.current) socketRef.current.emit('dice_roll', { campaignId: id, userId: user.id, username: character.name, skillName, formula: result.formula, sum: result.sum, hidden: hiddenMode && isMaster });
    } catch (err) { addMessage({ user: 'Система', text: `Ошибка: ${err.message}`, time: new Date().toLocaleTimeString() }); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && input.startsWith('/r ')) { e.preventDefault(); rollDice(); } };

  if (loading) return <div className="min-h-screen bg-wasteland-900 flex items-center justify-center"><p className="text-wasteland-300 font-stylized">Загрузка...</p></div>;
  if (!campaign) return null;

  const tabs = [
    { key: 'chat', label: 'Чат' },
    { key: 'character', label: 'Перс' },
    ...(!isMaster ? [{ key: 'inventory', label: 'Инв' }, { key: 'shop', label: 'Магазин' }] : []),
    { key: 'scene', label: 'Сцена' },
    ...(isMaster ? [
      { key: 'npcs', label: 'NPC' }, { key: 'notes', label: 'Заметки' },
      { key: 'handouts', label: 'Хендауты' }, { key: 'sounds', label: 'Звук' },
    ] : [{ key: 'handouts', label: 'Раздача' }]),
    ...(isAdmin ? [{ key: 'admin', label: 'БД' }] : []),
  ];

  const formatTime = () => {
    const d = campaign.game_time_date || '2026-01-01';
    const h = String(campaign.game_time_hours || 12).padStart(2, '0');
    const m = String(campaign.game_time_minutes || 0).padStart(2, '0');
    return `${d} ${h}:${m}`;
  };

  const handleTimeChange = async (dateStr, hours, minutes) => {
    setSaveStatus('saving');
    try {
      await api.updateCampaignTime(id, { game_time_date: dateStr, game_time_hours: hours, game_time_minutes: minutes });
      setCampaign(prev => ({ ...prev, game_time_date: dateStr, game_time_hours: hours, game_time_minutes: minutes }));
      setSaveStatus('saved');
    } catch { setSaveStatus('error'); }
  };

  return (
    <div className="h-screen bg-wasteland-900 flex flex-col overflow-hidden">
      <header className="bg-wasteland-800 border-b border-wasteland-600 p-2 md:p-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/dashboard')} className="text-wasteland-400 hover:text-wasteland-200 text-sm">←</button>
          <h1 className="text-base md:text-xl font-stylized text-accent-orange truncate max-w-[120px] md:max-w-none">{campaign.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isMaster && (
            <button onClick={() => setHiddenMode(!hiddenMode)} className={`text-xs px-2 py-0.5 rounded ${hiddenMode ? 'bg-accent-red text-wasteland-900' : 'bg-wasteland-600 text-wasteland-300'}`}>{hiddenMode ? '🔒' : '👁'}</button>
          )}
          <span className="text-wasteland-500 text-xs hidden sm:inline">Код: {campaign.invite_code}</span>
          {isMaster ? (
            <div className="flex items-center gap-1">
              <TimeCounter date={campaign.game_time_date || '2026-01-01'} hours={campaign.game_time_hours || 12} minutes={campaign.game_time_minutes || 0} onChange={handleTimeChange} />
              {saveStatus === 'saving' && <span className="text-accent-yellow text-xs">⏳</span>}
              {saveStatus === 'error' && <span className="text-accent-red text-xs">⚠️</span>}
            </div>
          ) : (
            <span className="text-xs text-wasteland-500">🕐 {formatTime()}</span>
          )}
        </div>
      </header>

      {error && (
        <div className="bg-accent-red/10 border border-accent-red/30 p-2 text-accent-red text-sm text-center">
          {error} <button onClick={loadCampaign} className="ml-2 underline">Повторить</button>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="bg-wasteland-800 border-b border-wasteland-600 flex overflow-x-auto flex-shrink-0">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 px-3 py-2 text-xs md:text-sm md:px-4 ${activeTab === tab.key ? 'bg-wasteland-700 text-accent-orange border-b-2 border-accent-orange' : 'text-wasteland-400'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                {messages.length === 0 && <p className="text-wasteland-500 text-center mt-8 text-sm">Чат пуст. /r 2d10 + 3 для броска</p>}
                {messages.map((m, i) => (
                  <div key={i} className={`text-sm ${m.isRoll ? 'bg-wasteland-800/50 p-1.5 rounded border border-wasteland-700' : ''}`}>
                    <span className="text-wasteland-500 text-xs">{m.time}</span>{' '}
                    <span className={`font-bold ${m.user === 'Система' ? 'text-accent-yellow' : m.user?.includes('Скрытый') ? 'text-accent-red' : 'text-accent-orange'}`}>{m.user}:</span>{' '}
                    <span className="text-wasteland-200">{m.text}</span>
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage} onKeyDown={handleKeyDown} className="p-2 bg-wasteland-800 border-t border-wasteland-600 flex gap-2 flex-shrink-0">
                <input className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 placeholder-wasteland-500 text-sm" placeholder="Сообщение или /r 2d10 + 3" value={input} onChange={e => setInput(e.target.value)} />
                <button type="submit" className="bg-wasteland-600 text-wasteland-100 px-3 py-2 rounded text-sm hover:bg-wasteland-500 transition flex-shrink-0">→</button>
              </form>
            </div>
          )}

          {activeTab === 'character' && (
            <div className="flex-1 overflow-y-auto p-3 min-h-0">
              {isMaster ? <MasterCharacterPanel campaignId={id} /> : (
                <>
                  {!character && !showCreateChar && (
                    <div className="text-center mt-8">
                      <p className="text-wasteland-400 mb-4">У вас ещё нет персонажа</p>
                      <button onClick={() => setShowCreateChar(true)} className="bg-accent-orange text-wasteland-900 font-bold px-6 py-3 rounded hover:bg-orange-500 transition">Создать персонажа</button>
                    </div>
                  )}
                  {showCreateChar && !character && <CharacterCreator professions={professions} perks={perks} campaignId={id} onCreated={(char) => { setCharacter(char); setShowCreateChar(false); loadCampaign(); }} onCancel={() => setShowCreateChar(false)} />}
                  {character && <CharacterSheet character={character} isMaster={false} onUpdate={async (params) => { await api.updateCharacterParams(character.id, params); refreshCharacter(); }} onRollSkill={rollSkill} />}
                </>
              )}
            </div>
          )}

          {activeTab === 'inventory' && !isMaster && character && (
            <div className="flex-1 overflow-y-auto p-3 min-h-0">
              <InventoryPanel character={character} onRefresh={refreshCharacter} socketRef={socketRef} allItems={allItems} ammoTypes={ammoTypes} />
            </div>
          )}
          {activeTab === 'inventory' && !isMaster && !character && (
            <div className="flex-1 overflow-y-auto p-3 text-center text-wasteland-400 mt-8 min-h-0">Сначала создайте персонажа</div>
          )}

          {activeTab === 'shop' && !isMaster && character && (
            <div className="flex-1 overflow-y-auto p-3 min-h-0">
              <ShopPanel character={character} onRefresh={refreshCharacter} />
            </div>
          )}
          {activeTab === 'shop' && !isMaster && !character && (
            <div className="flex-1 overflow-y-auto p-3 text-center text-wasteland-400 mt-8 min-h-0">Сначала создайте персонажа</div>
          )}

          {activeTab === 'scene' && (
            <div className="flex-1 overflow-hidden min-h-0">
              <ScenePanel campaignId={id} isMaster={isMaster} socketRef={socketRef} npcs={npcs} characters={allCharacters} />
            </div>
          )}

          {activeTab === 'npcs' && isMaster && <div className="flex-1 overflow-y-auto p-3 min-h-0"><NPCPanel campaignId={id} socketRef={socketRef} /></div>}
          {activeTab === 'notes' && isMaster && <div className="flex-1 overflow-y-auto p-3 min-h-0"><MasterNotes campaignId={id} /></div>}
          {activeTab === 'handouts' && <div className="flex-1 overflow-y-auto p-3 min-h-0"><HandoutsPanel campaignId={id} isMaster={isMaster} /></div>}
          {activeTab === 'sounds' && isMaster && <div className="flex-1 overflow-y-auto p-3 min-h-0"><SoundPad campaignId={id} isMaster={isMaster} socketRef={socketRef} /></div>}
          {activeTab === 'admin' && isAdmin && <div className="flex-1 overflow-y-auto p-3 min-h-0"><AdminPanel /></div>}
        </div>

        <div className="hidden md:block w-64 bg-wasteland-800 border-l border-wasteland-600 p-3 overflow-y-auto flex-shrink-0">
          <h2 className="text-lg font-stylized mb-3 text-wasteland-300">Группа</h2>
          {campaign.members?.map(m => (
            <div key={m.user_id} className="text-sm py-1.5 px-2 rounded mb-1 bg-wasteland-700/50">
              <div className="flex items-center gap-1">
                {m.role === 'master' && <span>👑</span>}
                {m.role === 'co-master' && <span>🛡️</span>}
                <span className="text-wasteland-300">{m.user?.username || m.user_id?.substring(0, 8)}</span>
              </div>
              {m.character_id && <span className="text-wasteland-500 text-xs">🎭 В игре</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
