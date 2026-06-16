// pages/Campaign.jsx — контейнер

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ApiError } from '../api/index.js';
import { auth } from '../api/auth.js';
import { campaigns } from '../api/campaigns.js';
import { characters } from '../api/characters.js';
import { chat } from '../api/chat.js';
import { dice } from '../api/dice.js';
import { npc } from '../api/npc.js';
import { professions } from '../api/professions.js';
import CampaignHeader from '../components/campaign/CampaignHeader.jsx';
import CampaignTabs from '../components/campaign/CampaignTabs.jsx';
import ChatSection from '../components/campaign/ChatSection.jsx';
import MembersSidebar from '../components/layout/MembersSidebar.jsx';
import useConfirm from '../hooks/useConfirm.jsx';
import CharacterCreator from '../components/character/CharacterCreator.jsx';
import CharacterSheet from '../components/character/CharacterSheet.jsx';
import InventoryPanel from '../components/panels/InventoryPanel.jsx';
import ScenePanel from '../components/panels/ScenePanel.jsx';
import ShopPanel from '../components/panels/ShopPanel.jsx';
import SoundPad from '../components/panels/SoundPad.jsx';
import BasePanel from '../components/panels/BasePanel.jsx';
import LootPanel from '../components/panels/LootPanel.jsx';
import NPCPanel from '../components/panels/NPCPanel.jsx';
import MasterCharacterPanel from '../components/panels/MasterCharacterPanel.jsx';
import MasterNotes from '../components/panels/MasterNotes.jsx';
import HandoutsPanel from '../components/panels/HandoutsPanel.jsx';
import AdminPanel from '../components/panels/AdminPanel.jsx';

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
  const [professionsList, setProfessionsList] = useState([]);
  const [perks, setPerks] = useState([]);
  const [showCreateChar, setShowCreateChar] = useState(false);
  const [hiddenMode, setHiddenMode] = useState(false);
  const [npcs, setNpcs] = useState([]);
  const [allCharacters, setAllCharacters] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');

  const socketRef = useRef(null);
  const characterRef = useRef(character);
  const { confirm, ConfirmModal } = useConfirm();

  const userRole = campaign?.members?.find(m => m.user_id === user.id)?.role;
  const isMaster = userRole === 'master' || userRole === 'co-master';

  useEffect(() => { characterRef.current = character; }, [character]);

  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev, msg]);
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
      addMessage({
        user: data.username,
        text: `${data.skillName ? `[${data.skillName}] ` : ''}${data.formula} = ${data.sum}`,
        time: new Date(data.time).toLocaleTimeString(),
        isRoll: true,
        hidden: data.hidden,
      });
    });
    socket.on('chat_message', (data) => {
      addMessage({
        user: data.username,
        text: data.text,
        time: new Date(data.created_at).toLocaleTimeString(),
        isRoll: data.is_roll,
      });
    });
    socket.on('inventory_updated', (data) => {
      if (characterRef.current && data.character_id === characterRef.current.id) refreshCharacter();
    });
    socket.on('death_loan_requested', async (data) => {
      if (!isMaster) return;
      const ok = await confirm(`Игрок "${data.characterName}" запрашивает Рассрочку гибели. Заменить бросок на удачу?`);
      if (ok) {
        const char = allCharacters.find(c => c.id === data.characterId);
        socket.emit('death_loan_approve', {
          campaignId: data.campaignId,
          characterId: data.characterId,
          count: char?.death_loan_count || 0,
          rollResult: 20,
        });
      }
    });
    socket.on('death_loan_approved', () => {
      addMessage({ user: 'Система', text: '💀 Рассрочка гибели активирована! Бросок заменён на удачу.', time: new Date().toLocaleTimeString() });
      refreshCharacter();
    });
    socket.on('death_loan_forced', () => {
      addMessage({ user: 'Система', text: '💀 Мастер активировал провал по Рассрочке гибели!', time: new Date().toLocaleTimeString() });
      refreshCharacter();
    });

    return () => {
      socket.off('character_updated');
      socket.off('dice_result');
      socket.off('chat_message');
      socket.off('inventory_updated');
      socket.off('death_loan_requested');
      socket.off('death_loan_approved');
      socket.off('death_loan_forced');
      socket.emit('leave_campaign', { userId: user.id });
      socket.disconnect();
    };
  }, [campaign, isMaster, allCharacters]);

  const loadCampaign = async () => {
    try {
      setError('');
      const c = await campaigns.get(id);
      setCampaign(c);
      const member = c.members?.find(m => m.user_id === user.id);
      if (member?.character_id && !isMaster) {
        const char = await characters.get(member.character_id);
        setCharacter(char);
      }
      const [npcData, profsData, allPerks, meData, history] = await Promise.all([
        npc.getAll(id).catch(() => []),
        professions.getAll(),
        professions.getPerks(),
        auth.me().catch(() => ({})),
        chat.getMessages(id).catch(() => []),
      ]);
      setNpcs(npcData);
      setProfessionsList(profsData);
      setPerks(allPerks);
      setIsAdmin(meData?.role === 'admin');
      setMessages(history.map(m => ({
        user: m.username, text: m.text,
        time: new Date(m.created_at).toLocaleTimeString(), isRoll: m.is_roll,
      })));
      const chars = [];
      for (const m of (c.members || [])) {
        if (m.character_id) {
          const ch = await characters.get(m.character_id);
          chars.push(ch);
        }
      }
      setAllCharacters(chars);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) navigate('/dashboard');
      else setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshCharacter = async () => {
    if (character?.id) {
      const updated = await characters.get(character.id);
      setCharacter(updated);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    try { await chat.sendMessage(id, text, false); }
    catch { addMessage({ user: user.username, text, time: new Date().toLocaleTimeString() }); }
  };

  const rollDice = async () => {
    const match = input.match(/\/r\s+(\d+)d(\d+)(?:\s*\+\s*(\d+))?/i);
    if (!match) {
      addMessage({ user: 'Система', text: 'Формат: /r XdY + Z', time: new Date().toLocaleTimeString() });
      return;
    }
    const count = parseInt(match[1]), sides = parseInt(match[2]), mod = parseInt(match[3] || '0');
    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    const sum = rolls.reduce((a, b) => a + b, 0) + mod;
    const formula = `${count}d${sides}${mod ? ' + ' + mod : ''} = ${sum}`;
    setInput('');
    try { await chat.sendMessage(id, `🎲 ${formula}`, true); } catch {}
    if (socketRef.current) {
      socketRef.current.emit('dice_roll', {
        campaignId: id, userId: user.id, username: user.username,
        formula, sum, hidden: hiddenMode && isMaster,
      });
    }
  };

  const rollSkill = async (skillName) => {
    if (!character) return;
    try {
      const result = await dice.auto(character.id, skillName);
      try { await chat.sendMessage(id, `🎲 [${skillName}] ${result.formula}`, true); } catch {}
      if (socketRef.current) {
        socketRef.current.emit('dice_roll', {
          campaignId: id, userId: user.id, username: character.name,
          skillName, formula: result.formula, sum: result.sum,
          hidden: hiddenMode && isMaster,
        });
      }
    } catch (err) {
      addMessage({ user: 'Система', text: `Ошибка: ${err.message}`, time: new Date().toLocaleTimeString() });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.startsWith('/r ')) {
      e.preventDefault(); rollDice();
    }
  };

  const handleTimeChange = async (gameTime) => {
    setSaveStatus('saving');
    try {
      await campaigns.updateTime(id, { game_time: gameTime });
      setCampaign(prev => ({ ...prev, game_time: gameTime }));
      setSaveStatus('saved');
    } catch { setSaveStatus('error'); }
  };

  const handleKickMember = async (userId) => {
    await campaigns.deleteMember(id, userId);
    loadCampaign();
  };

  if (loading) return <div className="min-h-screen bg-wasteland-900 flex items-center justify-center"><p className="text-wasteland-300 font-stylized">Загрузка...</p></div>;
  if (!campaign) return null;

  const tabs = [
    { key: 'chat', label: 'Чат' },
    { key: 'character', label: 'Перс' },
    ...(!isMaster ? [{ key: 'inventory', label: 'Инв' }] : []),
    { key: 'scene', label: 'Сцена' },
    { key: 'shop', label: 'Магазин' },
    { key: 'sounds', label: 'Звук' },
    { key: 'base', label: 'База' },
    ...(isMaster ? [
      { key: 'loot', label: 'Лут' }, { key: 'npcs', label: 'NPC' },
      { key: 'notes', label: 'Заметки' }, { key: 'handouts', label: 'Хендауты' },
    ] : [{ key: 'handouts', label: 'Раздача' }]),
    ...(isAdmin ? [{ key: 'admin', label: 'БД' }] : []),
  ];

  return (
    <div className="h-screen bg-wasteland-900 flex flex-col overflow-hidden">
      <CampaignHeader
        campaign={campaign}
        navigate={navigate}
        isMaster={isMaster}
        hiddenMode={hiddenMode}
        setHiddenMode={setHiddenMode}
        saveStatus={saveStatus}
        onTimeChange={handleTimeChange}
      />
      {error && (
        <div className="bg-accent-red/10 border border-accent-red/30 p-2 text-accent-red text-sm text-center">
          {error} <button onClick={loadCampaign} className="ml-2 underline">Повторить</button>
        </div>
      )}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <CampaignTabs tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />
          <CampaignContent
            activeTab={activeTab}
            isMaster={isMaster}
            isAdmin={isAdmin}
            character={character}
            campaignId={id}
            messages={messages}
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            handleKeyDown={handleKeyDown}
            professionsList={professionsList}
            perks={perks}
            showCreateChar={showCreateChar}
            setShowCreateChar={setShowCreateChar}
            setCharacter={setCharacter}
            loadCampaign={loadCampaign}
            refreshCharacter={refreshCharacter}
            rollSkill={rollSkill}
            socketRef={socketRef}
          />
        </div>
        <MembersSidebar members={campaign.members} isMaster={isMaster} currentUserId={user.id} onKick={handleKickMember} />
      </div>
      {ConfirmModal}
    </div>
  );
}

function CampaignContent({ activeTab, isMaster, isAdmin, character, campaignId, messages, input, setInput, sendMessage, handleKeyDown, professionsList, perks, showCreateChar, setShowCreateChar, setCharacter, loadCampaign, refreshCharacter, rollSkill, socketRef }) {
  switch (activeTab) {
    case 'chat':
      return <ChatSection messages={messages} input={input} setInput={setInput} onSend={sendMessage} onKeyDown={handleKeyDown} />;
    case 'character':
      return (
        <div className="flex-1 overflow-y-auto p-3 min-h-0">
          {isMaster ? (
            <MasterCharacterPanel campaignId={campaignId} socketRef={socketRef} />
          ) : (
            <>
              {!character && !showCreateChar && (
                <div className="text-center mt-8">
                  <p className="text-wasteland-400 mb-4">У вас ещё нет персонажа</p>
                  <button onClick={() => setShowCreateChar(true)} className="bg-accent-orange text-wasteland-900 font-bold px-6 py-3 rounded hover:bg-orange-500 transition">Создать персонажа</button>
                </div>
              )}
              {showCreateChar && !character && (
                <CharacterCreator professions={professionsList} perks={perks} campaignId={campaignId} onCreated={(char) => { setCharacter(char); setShowCreateChar(false); loadCampaign(); }} onCancel={() => setShowCreateChar(false)} />
              )}
              {character && (
                <CharacterSheet character={character} isMaster={false} onUpdate={async (params) => { await characters.updateParams(character.id, params); refreshCharacter(); }} onRollSkill={rollSkill} socketRef={socketRef} />
              )}
            </>
          )}
        </div>
      );
    case 'inventory':
      return (
        <div className="flex-1 overflow-y-auto p-3 min-h-0">
          {!isMaster && character ? (
            <InventoryPanel character={character} onRefresh={refreshCharacter} socketRef={socketRef} />
          ) : (
            <div className="text-center text-wasteland-400 mt-8">Сначала создайте персонажа</div>
          )}
        </div>
      );
    case 'scene':
      return <div className="flex-1 overflow-hidden min-h-0"><ScenePanel campaignId={campaignId} isMaster={isMaster} /></div>;
    case 'shop':
      return <div className="flex-1 overflow-y-auto p-3 min-h-0"><ShopPanel character={character} onRefresh={refreshCharacter} /></div>;
    case 'sounds':
      return <div className="flex-1 overflow-y-auto p-3 min-h-0"><SoundPad campaignId={campaignId} isMaster={isMaster} socketRef={socketRef} /></div>;
    case 'base':
      return <div className="flex-1 overflow-y-auto p-3 min-h-0"><BasePanel campaignId={campaignId} character={character} isMaster={isMaster} socketRef={socketRef} onRefresh={refreshCharacter} /></div>;
    case 'loot':
      return <div className="flex-1 overflow-y-auto p-3 min-h-0"><LootPanel campaignId={campaignId} /></div>;
    case 'npcs':
      return <div className="flex-1 overflow-y-auto p-3 min-h-0"><NPCPanel campaignId={campaignId} socketRef={socketRef} /></div>;
    case 'notes':
      return <div className="flex-1 overflow-y-auto p-3 min-h-0"><MasterNotes campaignId={campaignId} /></div>;
    case 'handouts':
      return <div className="flex-1 overflow-y-auto p-3 min-h-0"><HandoutsPanel campaignId={campaignId} isMaster={isMaster} /></div>;
    case 'admin':
      return <div className="flex-1 overflow-y-auto p-3 min-h-0"><AdminPanel /></div>;
    default:
      return null;
  }
}
