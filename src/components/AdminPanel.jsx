// src/components/AdminPanel.jsx
import { useState, useEffect } from 'react';
import { api } from '../api';

export default function AdminPanel() {
  const [tab, setTab] = useState('items');
  const [items, setItems] = useState([]);
  const [perks, setPerks] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [ammoTypes, setAmmoTypes] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [users, setUsers] = useState([]);
  const [shopPresets, setShopPresets] = useState([]);
  const [globalBackgrounds, setGlobalBackgrounds] = useState([]);
  const [globalSounds, setGlobalSounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', slot: 'item', weight: 0, condition_percent: 100, description: '', trade_price: 0 });
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchPrice, setBatchPrice] = useState(0);

  const load = async () => {
    setLoading(true);
    const [i, p, prof, s, at, cur, usr, sp, bg, sd] = await Promise.all([
     api.getAmmoTypes()
api.getCurrencies()
api.getAdminUsers()
api.getShopPresets()
api.getAdminBackgrounds()
api.getAdminSounds()
api.createAdminItem(newItem)
api.post('/admin/items/batch-delete', { ids: selectedIds })
api.put('/admin/items/batch-price', { ids: selectedIds, trade_price: batchPrice })
api.updateAdminUser(u.id, u.role === 'admin' ? 'player' : 'admin')
api.fetch('/admin/perks/' + id, { method: 'DELETE' })
api.fetch('/admin/professions/' + id, { method: 'DELETE' })
api.fetch('/admin/skills/' + id, { method: 'DELETE' })
api.deleteAmmoType(item.id)
api.deleteCurrency(item.id)
api.deleteAdminUser(u.id)
api.deleteAdminBackground(bg.id)
api.deleteAdminSound(s.id)
    setItems(i); setPerks(p); setProfessions(prof); setSkills(s);
    setAmmoTypes(at); setCurrencies(cur); setUsers(usr); setShopPresets(sp);
    setGlobalBackgrounds(bg); setGlobalSounds(sd);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleEdit = (item) => { setEditing(item.id); setEditValues({ ...item }); };

  const handleSave = async (type) => {
    const endpoints = {
      items: api.updateAdminItem,
      perks: api.updateAdminPerk,
      professions: api.updateAdminProfession,
      skills: api.updateAdminSkill,
    };
    if (endpoints[type]) await endpoints[type](editing, editValues);
    setEditing(null);
    load();
  };

  const handleDelete = async (type, id) => {
    if (!confirm('Удалить?')) return;
    const endpoints = {
      items: api.deleteAdminItem,
      perks: () => api.fetch('/admin/perks/' + id, { method: 'DELETE' }),
      professions: () => api.fetch('/admin/professions/' + id, { method: 'DELETE' }),
      skills: () => api.fetch('/admin/skills/' + id, { method: 'DELETE' }),
    };
    if (endpoints[type]) await endpoints[type](id);
    load();
  };

  const handleCreateItem = async () => {
    await api.post('/admin/items', newItem);
    setNewItem({ name: '', slot: 'item', weight: 0, condition_percent: 100, description: '', trade_price: 0 });
    setShowForm(false);
    load();
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBatchDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Удалить ${selectedIds.length} предметов?`)) return;
    await api.post('/admin/items/batch-delete', { ids: selectedIds });
    setSelectedIds([]);
    load();
  };

  const handleBatchPrice = async () => {
    if (!selectedIds.length) return;
    await api.put('/admin/items/batch-price', { ids: selectedIds, trade_price: batchPrice });
    setSelectedIds([]);
    load();
  };

  if (loading) return <p className="text-wasteland-400 text-center py-4">Загрузка...</p>;

  const tabs = [
    { key: 'items', label: 'Предметы' },
    { key: 'perks', label: 'Перки' },
    { key: 'professions', label: 'Профессии' },
    { key: 'skills', label: 'Навыки' },
    { key: 'ammo', label: 'Патроны' },
    { key: 'currencies', label: 'Валюты' },
    { key: 'shop', label: 'Магазин' },
    { key: 'users', label: 'Пользователи' },
    { key: 'backgrounds', label: 'Фоны' },
    { key: 'sounds', label: 'Звуки' },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-stylized text-accent-orange mb-4">Админ-панель</h2>

      <div className="flex gap-1 overflow-x-auto flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`text-xs px-3 py-1.5 rounded ${tab === t.key ? 'bg-accent-orange text-wasteland-900' : 'bg-wasteland-700 text-wasteland-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Предметы */}
      {tab === 'items' && (
        <div>
          <div className="flex gap-2 mb-3 flex-wrap">
            <button onClick={() => setShowForm(!showForm)} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded">
              {showForm ? 'Отмена' : '+ Предмет'}
            </button>
            <button onClick={handleBatchDelete} disabled={!selectedIds.length} className="text-xs bg-accent-red text-wasteland-900 px-3 py-1.5 rounded disabled:opacity-50">
              Удалить выбранные ({selectedIds.length})
            </button>
            <input type="number" value={batchPrice} onChange={e => setBatchPrice(parseInt(e.target.value)||0)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs w-20" placeholder="Цена" />
            <button onClick={handleBatchPrice} disabled={!selectedIds.length} className="text-xs bg-accent-green text-wasteland-900 px-3 py-1.5 rounded disabled:opacity-50">
              Установить цену
            </button>
          </div>

          {showForm && (
            <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
              <input placeholder="Название" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <select value={newItem.slot} onChange={e => setNewItem({...newItem, slot: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                <option value="weapon">Оружие</option>
                <option value="armor">Броня</option>
                <option value="exo">Экзоскелет</option>
                <option value="mod">Модификация</option>
                <option value="ammo">Патроны</option>
                <option value="consumable">Расходник</option>
                <option value="item">Предмет</option>
                <option value="currency">Валюта</option>
              </select>
              {newItem.slot === 'weapon' && (
                <>
                  <select value={newItem.weapon_type || ''} onChange={e => setNewItem({...newItem, weapon_type: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                    <option value="">Тип оружия</option>
                    <option value="melee">Ближний бой</option>
                    <option value="ranged">Дальний бой</option>
                    <option value="thrown">Метательное</option>
                  </select>
                  {newItem.weapon_type === 'ranged' && (
                    <>
                      <select value={newItem.ammo_type_id || ''} onChange={e => setNewItem({...newItem, ammo_type_id: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                        <option value="">Тип патронов по умолчанию</option>
                        {ammoTypes.map(at => <option key={at.id} value={at.id}>{at.name}</option>)}
                      </select>
                      <input type="number" placeholder="Макс. патронов" value={newItem.max_ammo || ''} onChange={e => setNewItem({...newItem, max_ammo: parseInt(e.target.value)||0})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
                    </>
                  )}
                </>
              )}
              {newItem.slot === 'mod' && (
                <>
                  <select value={newItem.mod_target || ''} onChange={e => setNewItem({...newItem, mod_target: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                    <option value="">На что устанавливается</option>
                    <option value="weapon">Оружие</option>
                    <option value="armor">Броня</option>
                    <option value="exo">Экзоскелет</option>
                    <option value="any">Любой предмет</option>
                  </select>
                  {newItem.mod_target === 'weapon' && (
                    <select value={newItem.weapon_mod_subtype || ''} onChange={e => setNewItem({...newItem, weapon_mod_subtype: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                      <option value="">Подтип оружия</option>
                      <option value="melee">Ближний бой</option>
                      <option value="ranged">Дальний бой</option>
                      <option value="thrown">Метательное</option>
                      <option value="any">Любое</option>
                    </select>
                  )}
                </>
              )}
              {newItem.slot === 'ammo' && (
                <select value={newItem.ammo_type_id || ''} onChange={e => setNewItem({...newItem, ammo_type_id: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                  <option value="">Тип патронов</option>
                  {ammoTypes.map(at => <option key={at.id} value={at.id}>{at.name}</option>)}
                </select>
              )}
              <div className="flex gap-2">
                <input type="number" placeholder="Вес" value={newItem.weight} onChange={e => setNewItem({...newItem, weight: parseFloat(e.target.value)||0})} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
                <input type="number" placeholder="Цена" value={newItem.trade_price} onChange={e => setNewItem({...newItem, trade_price: parseInt(e.target.value)||0})} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              </div>
              <textarea placeholder="Описание" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" rows={2} />
              <button onClick={handleCreateItem} disabled={!newItem.name} className="w-full bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">Создать</button>
            </div>
          )}

          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {items.map(item => (
              <div key={item.id} className={`bg-wasteland-800 p-2 rounded border text-xs flex gap-2 ${selectedIds.includes(item.id) ? 'border-accent-orange' : 'border-wasteland-600'}`}>
                <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                {editing === item.id ? (
                  <div className="flex-1 space-y-1">
                    <input value={editValues.name || ''} onChange={e => setEditValues({...editValues, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100" />
                    <div className="flex gap-2">
                      <button onClick={() => handleSave('items')} className="bg-accent-green text-wasteland-900 px-2 py-1 rounded text-xs font-bold">OK</button>
                      <button onClick={() => setEditing(null)} className="bg-wasteland-600 text-wasteland-300 px-2 py-1 rounded text-xs">Отмена</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-wasteland-200">{item.name} <span className="text-wasteland-500">({item.slot})</span></span>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(item)} className="text-wasteland-400 hover:text-wasteland-200">✏️</button>
                      <button onClick={() => handleDelete('items', item.id)} className="text-accent-red hover:text-red-400">🗑️</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Перки */}
      {tab === 'perks' && (
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {perks.map(item => (
            <div key={item.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs">
              {editing === item.id ? (
                <div className="space-y-1">
                  <input value={editValues.name || ''} onChange={e => setEditValues({...editValues, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100" />
                  <div className="flex gap-2">
                    <button onClick={() => handleSave('perks')} className="bg-accent-green text-wasteland-900 px-2 py-1 rounded text-xs font-bold">OK</button>
                    <button onClick={() => setEditing(null)} className="bg-wasteland-600 text-wasteland-300 px-2 py-1 rounded text-xs">Отмена</button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-wasteland-200 font-bold">{item.name}</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(item)} className="text-wasteland-400 hover:text-wasteland-200">✏️</button>
                    <button onClick={() => handleDelete('perks', item.id)} className="text-accent-red hover:text-red-400">🗑️</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Профессии */}
      {tab === 'professions' && (
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {professions.map(item => (
            <div key={item.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs">
              {editing === item.id ? (
                <div className="space-y-1">
                  <input value={editValues.name || ''} onChange={e => setEditValues({...editValues, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100" />
                  <div className="flex gap-2">
                    <button onClick={() => handleSave('professions')} className="bg-accent-green text-wasteland-900 px-2 py-1 rounded text-xs font-bold">OK</button>
                    <button onClick={() => setEditing(null)} className="bg-wasteland-600 text-wasteland-300 px-2 py-1 rounded text-xs">Отмена</button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-wasteland-200 font-bold">{item.name}</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(item)} className="text-wasteland-400 hover:text-wasteland-200">✏️</button>
                    <button onClick={() => handleDelete('professions', item.id)} className="text-accent-red hover:text-red-400">🗑️</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Навыки */}
      {tab === 'skills' && (
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {skills.map(item => (
            <div key={item.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs">
              {editing === item.id ? (
                <div className="space-y-1">
                  <input value={editValues.name || ''} onChange={e => setEditValues({...editValues, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100" />
                  <div className="flex gap-2">
                    <button onClick={() => handleSave('skills')} className="bg-accent-green text-wasteland-900 px-2 py-1 rounded text-xs font-bold">OK</button>
                    <button onClick={() => setEditing(null)} className="bg-wasteland-600 text-wasteland-300 px-2 py-1 rounded text-xs">Отмена</button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-wasteland-200 font-bold">{item.name}</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(item)} className="text-wasteland-400 hover:text-wasteland-200">✏️</button>
                    <button onClick={() => handleDelete('skills', item.id)} className="text-accent-red hover:text-red-400">🗑️</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Типы патронов */}
      {tab === 'ammo' && (
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {ammoTypes.map(item => (
            <div key={item.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
              <span className="text-wasteland-200">{item.name}</span>
              <button onClick={() => { api.fetch('/ammo-types/' + item.id, { method: 'DELETE' }).then(load); }} className="text-accent-red hover:text-red-400">🗑️</button>
            </div>
          ))}
        </div>
      )}

      {/* Валюты */}
      {tab === 'currencies' && (
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {currencies.map(item => (
            <div key={item.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
              <span className="text-wasteland-200">{item.icon} {item.name}</span>
              <button onClick={() => { api.fetch('/currencies/' + item.id, { method: 'DELETE' }).then(load); }} className="text-accent-red hover:text-red-400">🗑️</button>
            </div>
          ))}
        </div>
      )}

      {/* Магазин */}
      {tab === 'shop' && (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {shopPresets.map(p => (
            <div key={p.id} className="bg-wasteland-800 p-3 rounded border border-wasteland-600 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-wasteland-200 font-bold">{p.name}</span>
                <span className={`text-xs ${p.is_active ? 'text-accent-green' : 'text-wasteland-500'}`}>{p.is_active ? 'Активен' : 'Скрыт'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Пользователи */}
      {tab === 'users' && (
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {users.map(u => (
            <div key={u.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
              <div>
                <span className="text-wasteland-200">{u.username}</span>
                <span className={`ml-2 ${u.role === 'admin' ? 'text-accent-orange' : 'text-wasteland-500'}`}>{u.role}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { api.put('/admin/users/' + u.id, { role: u.role === 'admin' ? 'player' : 'admin' }).then(load); }} className="text-wasteland-400 hover:text-wasteland-200 text-xs">
                  {u.role === 'admin' ? '→ player' : '→ admin'}
                </button>
                <button onClick={() => { if (confirm('Удалить пользователя?')) api.fetch('/admin/users/' + u.id, { method: 'DELETE' }).then(load); }} className="text-accent-red hover:text-red-400 text-xs">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Фоны */}
      {tab === 'backgrounds' && (
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {globalBackgrounds.map(bg => (
            <div key={bg.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
              <span className="text-wasteland-200">{bg.name}</span>
              <button onClick={() => { api.fetch('/admin/backgrounds/' + bg.id, { method: 'DELETE' }).then(load); }} className="text-accent-red hover:text-red-400">🗑️</button>
            </div>
          ))}
        </div>
      )}

      {/* Звуки */}
      {tab === 'sounds' && (
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {globalSounds.map(s => (
            <div key={s.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
              <span className="text-wasteland-200">{s.name}</span>
              <button onClick={() => { api.fetch('/admin/sounds/' + s.id, { method: 'DELETE' }).then(load); }} className="text-accent-red hover:text-red-400">🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
