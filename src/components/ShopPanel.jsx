// src/components/ShopPanel.jsx
import { useState, useEffect } from 'react';
import { api } from '../api';

export default function ShopPanel({ character, onRefresh }) {
  const [shopItems, setShopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    api.getShop().then(setShopItems).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleBuy = async (item) => {
    setError(''); setSuccess('');
    try {
      const result = await api.buyItem(character.id, item.id, quantity);
      setSuccess(`Куплено: ${result.item.item.name} ×${quantity} за ${result.price} 💎`);
      onRefresh();
      setQuantity(1);
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return <p className="text-wasteland-400 text-center py-4">Загрузка...</p>;
  if (!shopItems.length) return <p className="text-wasteland-500 text-center py-4">Магазин пуст</p>;

  const grouped = {};
  for (const item of shopItems) {
    const p = item.preset_name || 'Общее';
    if (!grouped[p]) grouped[p] = [];
    grouped[p].push(item);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-stylized text-accent-orange">Магазин</h2>
      {error && <p className="text-accent-red text-sm bg-wasteland-800 p-3 rounded">{error}</p>}
      {success && <p className="text-accent-green text-sm bg-wasteland-800 p-3 rounded">{success}</p>}

      {Object.entries(grouped).map(([preset, items]) => (
        <div key={preset}>
          <h3 className="text-wasteland-400 text-xs uppercase mb-1">{preset}</h3>
          <div className="space-y-1">
            {items.map(item => (
              <div key={item.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-sm flex justify-between items-center">
                <div>
                  <span className="text-wasteland-100 font-bold">{item.name}</span>
                  <span className="text-wasteland-500 ml-2">{item.weight}кг</span>
                  {item.ammo_type?.name && <span className="text-accent-yellow text-xs ml-1">({item.ammo_type.name})</span>}
                  {item.description && <p className="text-wasteland-400 text-xs">{item.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent-green font-bold">{item.shop_price} 💎</span>
                  {buying === item.id ? (
                    <div className="flex items-center gap-1">
                      <input type="number" min="1" max="99" value={quantity} onChange={e => setQuantity(parseInt(e.target.value)||1)}
                        className="bg-wasteland-900 border border-wasteland-600 rounded p-0.5 text-wasteland-100 text-xs w-12 text-center" />
                      <button onClick={() => handleBuy(item)} className="bg-accent-green text-wasteland-900 text-xs px-2 py-1 rounded font-bold">OK</button>
                      <button onClick={() => setBuying(null)} className="text-wasteland-400 text-xs">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => { setBuying(item.id); setError(''); setSuccess(''); }}
                      className="bg-accent-orange text-wasteland-900 text-xs px-2 py-1 rounded font-bold">Купить</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
