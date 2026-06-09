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

  useEffect(() => {
    api.getCampaign(id)
      .then(setCampaign)
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [id]);

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

  if (loading) return <div className="min-h-screen bg-wasteland-900 flex items-center justify-center"><p className="text-wasteland-300">Загрузка...</p></div>;
  if (!campaign) return null;

  return (
    <div className="min-h-screen bg-wasteland-900 flex flex-col">
      <header className="bg-wasteland-800 border-b border-wasteland-600 p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-wasteland-400 hover:text-wasteland-200">← Назад</button>
          <h1 className="text-xl font-stylized text-accent-orange">{campaign.title}</h1>
        </div>
        <span className="text-wasteland-400 text-sm">Код: {campaign.invite_code}</span>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Чат */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.length === 0 && (
              <p className="text-wasteland-500 text-center mt-8">Чат пуст. Напишите что-нибудь или бросьте кубики (/r 2d10 + 3)</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className="text-sm">
                <span className="text-wasteland-400 text-xs">{m.time}</span>{' '}
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
              Отправить
            </button>
          </form>
        </div>

        {/* Правая панель */}
        <div className="w-full md:w-64 bg-wasteland-800 border-l border-wasteland-600 p-3 overflow-y-auto">
          <h2 className="text-lg font-stylized mb-3 text-wasteland-300">Группа</h2>
          {campaign.members?.map(m => (
            <div key={m.user_id} className="text-sm py-1 text-wasteland-300">
              {m.role === 'master' && '👑 '}
              {m.role === 'co-master' && '🛡️ '}
              ID: {m.user_id?.substring(0, 8)}...
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
