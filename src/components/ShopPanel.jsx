// src/components/ShopPanel.jsx
import { useState, useEffect } from 'react';
import { api } from '../api';
import useAlert from '../hooks/useAlert';

export default function ShopPanel({ character, onRefresh }) {
  const [shopItems, setShopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [filter, setFilter] = useState('all');
  const [buyingId, setBuyingId] = useState(null);
  const [balance, setBalance] = useState(character?.currency || 0);
  const { alert, AlertModal } = useAlert();

  useEffect(() => {
    setBalance(character?.currency || 0);
  }, [character]);

  const loadShop = async () => {
    try {
      const data = await api.getShop();
      setShopItems(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadShop(); }, []);

  const handleBuy = async (item) => {
    if (!character) {
      await alert('Сначала создайте персонажа.');
      return;
    }
    setBuyingId(item.id);
    setError('');
    setSuccessMsg('');
    try {
      const result = await api.buyItem(character.id, item.id, 1);
      setSuccessMsg(`Куплено: ${item.name} за ${result.price} 💎`);
      setBalance(result.new_balance);
      onRefresh();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      await alert(e.message);
    } finally {
      setBuyingId(null);
    }
  };

  const slots = [...new Set(shopItems.map(i => i.slot))];
  const filtered = filter === 'all' ? shopItems : shopItems.filter(i => i.slot === filter);

  if (loading) return <p className="text-wasteland-400 text-center py-4">Загрузка магазина...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-stylized text-accent-orange">Магазин</h2>

      {error && (
        <div className="bg-accent-red/10 border border-accent-red/30 p-3 rounded text-accent-red text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-wasteland-300">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="bg-accent-green/10 border border-accent-green/30 p-3 rounded text-accent-green text-sm">
          {successMsg}
        </div>
      )}

      {!character && (
        <p className="text-wasteland-500 text-sm text-center py-4">Создайте персонажа, чтобы покупать предметы</p>
      )}

      {character && (
        <div className="bg-wasteland-800 p-3 rounded-lg border border-wasteland-600 flex items-center gap-2">
          <span className="text-wasteland-300 text-sm">💰 Баланс:</span>
          <span className="text-accent-orange font-bold text-lg">{balance}</span>
        </div>
      )}

      {/* Фильтры */}
      <div className="flex gap-1 overflow-x-auto">
        <button onClick={() => setFilter('all')} className={`text-xs px-3 py-1 rounded ${filter === 'all' ? 'bg-accent-orange text-wasteland-900' : 'bg-wasteland-700 text-wasteland-300'}`}>
          Всё
        </button>
        {slots.map(slot => (
          <button key={slot} onClick={() => setFilter(slot)} className={`text-xs px-3 py-1 rounded ${filter === slot ? 'bg-accent-orange text-wasteland-900' : 'bg-wasteland-700 text-wasteland-300'}`}>
            {slot === 'weapon' ? 'Оружие' : slot === 'armor' ? 'Броня' : slot === 'exo' ? 'Экзо' : slot === 'ammo' ? 'Патроны' : slot === 'consumable' ? 'Расходники' : slot === 'mod' ? 'Моды' : slot === 'item' ? 'Предметы' : slot}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-wasteland-500 text-sm text-center py-4">Нет товаров в этой категории</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {filtered.map(item => (
          <div key={item.id} className="bg-wasteland-800 p-3 rounded-lg border border-wasteland-600 flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="text-wasteland-100 text-sm font-bold">
                {item.icon && <span className="mr-1">{item.icon}</span>}
                {item.name}
              </h3>
              <div className="flex flex-wrap gap-x-2 text-xs mt-0.5">
                <span className="text-wasteland-400">{item.slot}</span>
                {item.weapon_type && <span className="text-wasteland-500">{item.weapon_type}</span>}
                {item.weight > 0 && <span className="text-wasteland-500">{item.weight} кг</span>}
                {item.ammo_type && <span className="text-accent-yellow">{item.ammo_type.name}</span>}
              </div>
              {item.description && (
                <p className="text-wasteland-400 text-xs mt-1 line-clamp-2">{item.description}</p>
              )}
              {item.preset_name && (
                <span className="text-wasteland-500 text-xs mt-1 block">📦 {item.preset_name}</span>
              )}
            </div>

            <div className="flex flex-col items-end ml-3 flex-shrink-0">
              <span className="text-accent-orange font-bold text-sm">{item.shop_price || item.trade_price} 💎</span>
              {character && (
                <button
                  onClick={() => handleBuy(item)}
                  disabled={buyingId === item.id}
                  className="mt-1 text-xs bg-accent-orange text-wasteland-900 px-3 py-1 rounded font-bold hover:bg-orange-500 disabled:opacity-50"
                >
                  {buyingId === item.id ? '...' : 'Купить'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {AlertModal}
    </div>
  );
}
