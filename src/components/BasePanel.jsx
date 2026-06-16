import { useState, useEffect } from 'react';
import { api } from '../api';

export default function BasePanel({ campaignId, character, isMaster, socketRef, onRefresh }) {
  const [baseItems, setBaseItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [baseAccess, setBaseAccess] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [base, camp] = await Promise.all([
      api.getBaseInventory(campaignId),
      api.getCampaign(campaignId)
    ]);
    setBaseItems(base);
    setBaseAccess(camp?.base_access ?? true);
    if (character) {
      const ch = await api.getCharacter(character.id);
      setInventory(ch?.inventory || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [campaignId, character]);

  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;
    socket.on('base_updated', () => load());
    return () => socket.off('base_updated');
  }, [socketRef]);

  const handleDeposit = async (slotId, qty) => {
    await api.depositToBase(campaignId, slotId, qty);
    load(); onRefresh?.();
  };

  const handleWithdraw = async (baseItemId, qty) => {
    await api.withdrawFromBase(campaignId, baseItemId, qty);
    load(); onRefresh?.();
  };

  const handleToggleAccess = async () => {
    await api.setBaseAccess(campaignId, !baseAccess);
    setBaseAccess(!baseAccess);
  };

  if (loading) return <p className="text-wasteland-400 text-center py-4">Загрузка...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-stylized text-accent-orange">База</h2>
        {isMaster && (
          <button onClick={handleToggleAccess} className={`text-xs px-3 py-1.5 rounded ${baseAccess ? 'bg-accent-green text-wasteland-900' : 'bg-accent-red text-wasteland-900'}`}>
            {baseAccess ? 'Доступна' : 'Закрыта'}
          </button>
        )}
      </div>

      {!baseAccess && (
        <div className="bg-accent-red/10 border border-accent-red/30 p-3 rounded text-accent-red text-sm text-center">
          База недоступна. Вы в рейде.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Инвентарь персонажа */}
        <div>
          <h3 className="text-wasteland-400 text-xs uppercase mb-2">🎒 Инвентарь</h3>
          {character && baseAccess ? (
            inventory.filter(s => s.slot_type !== 'container' && !s.parent_slot_id).map(slot => (
              <div key={slot.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 mb-1 text-xs flex justify-between items-center">
                <span className="text-wasteland-200">{slot.item?.name} ×{slot.quantity}</span>
                <button onClick={() => handleDeposit(slot.id, 1)} className="text-accent-green text-xs">→ Сдать</button>
              </div>
            ))
          ) : (
            <p className="text-wasteland-500 text-xs">Нет персонажа или база закрыта</p>
          )}
        </div>

        {/* Хранилище базы */}
        <div>
          <h3 className="text-wasteland-400 text-xs uppercase mb-2">🏚️ Хранилище</h3>
          {baseItems.length === 0 ? (
            <p className="text-wasteland-500 text-xs">Пусто</p>
          ) : (
            baseItems.map(item => (
              <div key={item.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 mb-1 text-xs flex justify-between items-center">
                <span className="text-wasteland-200">{item.item?.name} ×{item.quantity}</span>
                {character && baseAccess && (
                  <button onClick={() => handleWithdraw(item.id, 1)} className="text-accent-orange text-xs">← Взять</button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
