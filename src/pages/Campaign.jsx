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
import MembersSidebar from '../components/MembersSidebar';
import useConfirm from '../hooks/useConfirm';

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');

  const socketRef = useRef(null);
  const chatRef = useRef(null);
  const characterRef = useRef(character);
  const { confirm, ConfirmModal } = useConfirm();

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

    socket.on('character_updated', (data) => {
      if (characterRef.current && data.character_id === characterRef.current.id) {
        setCharacter(prev => prev ? { ...prev, ...data.updates } : prev);
      }
    });
    socket.on('dice_result', (data) => {
      addMessage({ user: data.username, text: `${data.skillName ? `[${data.skillName}] ` : ''}${data.formula} = ${data.sum}`, time: new Date(data.time).toLocaleTimeString(), isRoll: true, hidden: data.hidden });
    });
    socket.on('chat_message', (data) => {
      addMessage({ user: data.username, text: data.text, time: new Date(data.created_at).toLocaleTimeString(), isRoll: data.is_roll });
    });
    socket.on('inventory_updated', (data) => { if (characterRef.current && data.character_id === characterRef.current.id) refreshCharacter(); });

    return () => {
      socket.off('character_updated'); socket.off('dice_result'); socket.off('chat_message'); socket.off('inventory_updated');
      socket.emit('leave_campaign', { userId: user.id }); socket.disconnect();
    };
  }, [campaign]);

  const loadCampaign = async () => {
    try {
      setError('');
      const c = await api.getCampaign(id);
      setCampaign(c);
      const member = c.members?.find(m => m.user_id === user.id);
      if (member?.character_id && !isMaster) {
        const char = await api.getCharacter(member.character_id); setCharacter(char);
      }
      const [npcData, profsData, allPerks, meData, history] = await Promise.all([
        api.getNPCs(id).catch(() => []), api.getProfessions(), api.getPerks(), api.me().catch(() => ({})), api.getChatMessages(id).catch(() => [])
      ]);
      setNpcs(npcData); setProfessions(profsData); setPerks(allPerks); setIsAdmin(meData?.role === 'admin');
      setMessages(history.map(m => ({ user: m.username, text: m.text, time: new Date(m.created_at).toLocaleTimeString(), isRoll: m.is_roll })));
      const chars = []; for (const m of (c.members || [])) { if (m.character_id) { const ch = await api.getCharacter(m.character_id); chars.push(ch); } }
      setAllCharacters(chars);
    } catch (e) { if (e instanceof ApiError && e.status === 404) navigate('/dashboard'); else setError(e.message); }
    finally { setLoading(false); }
  };

  const refreshCharacter = async () => { if (character?.id) { const updated = await api.getCharacter(character.id); setCharacter(updated); } };

  const sendMessage = async (e) => { e.preventDefault(); const text = input.trim(); if (!text) return; setInput(''); try { await api.sendChatMessage(id, text, false); } catch { addMessage({ user: user.username, text, time: new Date().toLocaleTimeString() }); } };

  const rollDice = async () => { /* без изменений */ };
  const rollSkill = async (skillName) => { /* без изменений */ };
  const handleKeyDown = (e) => { if (e.key === 'Enter' && input.startsWith('/r ')) { e.preventDefault(); rollDice(); } };

  const handleTimeChange = async (dateStr, hours, minutes) => { /* без изменений */ };

  const handleKickMember = async (userId) => {
    await api.deleteMember(id, userId);
    loadCampaign();
  };

  if (loading) return <div className="min-h-screen bg-wasteland-900 flex items-center justify-center"><p className="text-wasteland-300 font-stylized">Загрузка...</p></div>;
  if (!campaign) return null;

  const tabs = [
    { key: 'chat', label: 'Чат' }, { key: 'character', label: 'Перс' },
    ...(!isMaster ? [{ key: 'inventory', label: 'Инв' }] : []), { key: 'scene', label: 'Сцена' }, { key: 'shop', label: 'Магазин' },
    ...(isMaster ? [{ key: 'npcs', label: 'NPC' }, { key: 'notes', label: 'Заметки' }, { key: 'handouts', label: 'Хендауты' }, { key: 'sounds', label: 'Звук' }] : [{ key: 'handouts', label: 'Раздача' }]),
    ...(isAdmin ? [{ key: 'admin', label: 'БД' }] : []),
  ];

  return (
    <div className="h-screen bg-wasteland-900 flex flex-col overflow-hidden">
      {/* Хедер такой же, как был */}
      <header className="bg-wasteland-800 border-b border-wasteland-600 p-2 md:p-3 flex items-center justify-between flex-shrink-0">
        {/* ... тот же код хедера ... */}
      </header>
      {error && <div className="bg-accent-red/10 border border-accent-red/30 p-2 text-accent-red text-sm text-center">{error} <button onClick={loadCampaign} className="ml-2 underline">Повторить</button></div>}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="bg-wasteland-800 border-b border-wasteland-600 flex overflow-x-auto flex-shrink-0">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex-shrink-0 px-3 py-2 text-xs md:text-sm md:px-4 ${activeTab === tab.key ? 'bg-wasteland-700 text-accent-orange border-b-2 border-accent-orange' : 'text-wasteland-400'}`}>{tab.label}</button>
            ))}
          </div>

          {/* Вкладки (чат, персонаж, инвентарь, сцена, магазин, нпс, заметки, хендауты, звуки, админка) — оставлены как есть, только в местах где был confirm заменён на useConfirm */}
          {/* ... */}
        </div>
        <MembersSidebar members={campaign.members} isMaster={isMaster} currentUserId={user.id} onKick={handleKickMember} />
      </div>
      {ConfirmModal}
    </div>
  );
}
