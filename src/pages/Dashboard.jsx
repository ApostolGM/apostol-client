// pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api/auth.js';
import { campaigns } from '../api/campaigns.js';

export default function Dashboard({ user }) {
  const [campaignList, setCampaignList] = useState([]);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    try {
      const data = await campaigns.getAll();
      setCampaignList(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const c = await campaigns.create(title);
      navigate(`/campaign/${c.id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const join = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const c = await campaigns.join(code);
      navigate(`/campaign/${c.id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-wasteland-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-stylized text-accent-orange">APOSTOL 2.0</h1>
          <div className="flex items-center gap-4">
            <span className="text-wasteland-300">{user.username}</span>
            <button onClick={logout} className="text-wasteland-400 hover:text-accent-red text-sm">Выйти</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-wasteland-800 p-6 rounded-lg border border-wasteland-600">
            <h2 className="text-xl font-stylized mb-4">Создать кампанию</h2>
            <form onSubmit={create} className="space-y-3">
              <input className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 placeholder-wasteland-500" placeholder="Название кампании" value={title} onChange={e => setTitle(e.target.value)} required />
              <button className="w-full bg-wasteland-600 text-wasteland-100 py-2 rounded hover:bg-wasteland-500 transition">Создать</button>
            </form>
          </div>
          <div className="bg-wasteland-800 p-6 rounded-lg border border-wasteland-600">
            <h2 className="text-xl font-stylized mb-4">Присоединиться</h2>
            <form onSubmit={join} className="space-y-3">
              <input className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 placeholder-wasteland-500" placeholder="Код приглашения" value={code} onChange={e => setCode(e.target.value)} required />
              <button className="w-full bg-wasteland-600 text-wasteland-100 py-2 rounded hover:bg-wasteland-500 transition">Войти</button>
            </form>
          </div>
        </div>

        {error && <p className="text-accent-red mb-4">{error}</p>}

        <div className="bg-wasteland-800 p-6 rounded-lg border border-wasteland-600">
          <h2 className="text-xl font-stylized mb-4">Мои кампании</h2>
          {campaignList.length === 0 ? (
            <p className="text-wasteland-400">Пока нет кампаний</p>
          ) : (
            <div className="space-y-2">
              {campaignList.map(c => (
                <div key={c.id} onClick={() => navigate(`/campaign/${c.id}`)} className="bg-wasteland-700 p-3 rounded cursor-pointer hover:bg-wasteland-600 transition flex justify-between items-center">
                  <span>{c.title}</span>
                  <span className="text-wasteland-400 text-sm">Код: {c.invite_code}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
