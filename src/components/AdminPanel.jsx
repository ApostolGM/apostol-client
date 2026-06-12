// src/components/AdminPanel.jsx
import { useState, useEffect } from 'react';
import { api } from '../api';

export default function AdminPanel() {
  const [tab, setTab] = useState('items');
  const [items, setItems] = useState([]);
  const [perks, setPerks] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [users, setUsers] = useState([]);
  const [ammoTypes, setAmmoTypes] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [shopPresets, setShopPresets] = useState([]);
  const [backgrounds, setBackgrounds] = useState([]);
  const [sounds, setSounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState(''); // 'items','perks','professions','skills','users','ammo','currency','preset'
  const [selected, setSelected] = useState([]);
  const [batchPrice, setBatchPrice] = useState('');

  const loadAll = async () => {
    setLoading(true);
    const [i, p, prof, s, u, a, c, ps, bg, sd] = await Promise.all([
      api.getAdminItems(), api.getAdminPerks(), api.getAdminProfessions(),
      api.getAdminSkills(), api.getAdminUsers(), api.getAmmoTypes(),
      api.getCurrencies(), api.getShopPresets(),
      api.getAdminBackgrounds(), api.getAdminSounds(),
    ]);
    setItems(i); setPerks(p); setProfessions(prof); setSkills(s);
    setUsers(u); setAmmoTypes(a); setCurrencies(c); setShopPresets(ps);
    setBackgrounds(bg); setSounds(sd);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const handleEdit = (item) => { setEditing(item.id); setEditValues({ ...item }); };
  const handleSave = async (type) => {
    const apiMap = {
      items: api.updateAdminItem, perks: api.updateAdminPerk,
      professions: api.updateAdminProfession, skills: api.updateAdminSkill,
      users: api.updateAdminUser, ammo: api.updateAmmoType,
    };
    if (apiMap[type]) await apiMap[type](editing, editValues);
    setEditing(null); loadAll();
  };
  const handleDelete = async (type, id) => {
    if (!confirm('Удалить?')) return;
    const delMap = {
      items: api.deleteAdminItem, perks: api.deleteAdminPerk,
      professions: api.deleteAdminProfession, skills: api.deleteAdminSkill,
      users: api.deleteAdminUser, ammo: api.deleteAmmoType,
      currency: api.deleteCurrency, preset: api.deleteShopPreset,
      background: api.deleteAdminBackground, sound: api.deleteAdminSound,
    };
    if (delMap[type]) await delMap[type](id);
    loadAll();
  };
  const handleCreate = async () => {
    const createMap = {
      items: api.createAdminItem, perks: api.createAdminPerk,
      professions: api.createAdminProfession, skills: api.createAdminSkill,
      ammo: api.createAmmoType, currency: api.createCurrency,
      preset: api.createShopPreset,
    };
    if (createMap[formType]) await createMap[formType](editValues);
    setShowForm(false); setEditValues({}); loadAll();
  };
  const openCreateForm = (type, defaults = {}) => {
    setFormType(type); setEditValues(defaults); setShowForm(true);
  };
  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const selectAll = (list) => setSelected(list.map(x => x.id));
  const batchDelete = async () => {
    if (!selected.length || !confirm(`Удалить ${selected.length} предметов?`)) return;
    await api.batchDeleteItems(selected);
    setSelected([]); loadAll();
  };
  const batchUpdatePrice = async () => {
    if (!selected.length || !batchPrice) return;
    await api.batchUpdatePrice(selected, parseInt(batchPrice));
    setSelected([]); setBatchPrice(''); loadAll();
  };

  if (loading) return <p className="text-wasteland-400 text-center py-4">Загрузка...</p>;

  const tabs = [
    { key: 'items', label: 'Предметы' },
    { key: 'perks', label: 'Перки' },
    { key: 'professions', label: 'Профессии' },
    { key: 'skills', label: 'Навыки' },
    { key: 'users', label: 'Пользователи' },
    { key: 'ammo', label: 'Патроны' },
    { key: 'currencies', label: 'Валюты' },
    { key: 'shop', label: 'Магазин' },
    { key: 'backgrounds', label: 'Фоны' },
    { key: 'sounds', label: 'Звуки' },
  ];

  const slotGroups = ['weapon', 'armor', 'exo', 'mod', 'ammo', 'consumable', 'item', 'currency'];
  const slotLabels = { weapon: 'Оружие', armor: 'Броня', exo: 'Экзо', mod: 'Моды', ammo: 'Патроны', consumable: 'Расходники', item: 'Предметы', currency: 'Валюта' };

  const data = tab === 'items' ? items : tab === 'perks' ? perks : tab === 'professions' ? professions : tab === 'skills' ? skills : tab === 'users' ? users : tab === 'ammo' ? ammoTypes : tab === 'currencies' ? currencies : tab === 'shop' ? shopPresets : tab === 'backgrounds' ? backgrounds : sounds;

  const isItemsTab = tab === 'items';

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-stylized text-accent-orange mb-4">Админ-панель (БД)</h2>

      {/* Табы */}
      <div className="flex gap-1 overflow-x-auto flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSelected([]); }}
            className={`text-xs px-3 py-1.5 rounded whitespace-nowrap ${tab === t.key ? 'bg-accent-orange text-wasteland-900' : 'bg-wasteland-700 text-wasteland-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Кнопки действий */}
      <div className="flex gap-2 flex-wrap">
        {['items','perks','professions','skills','ammo'].includes(tab) && (
          <button onClick={() => openCreateForm(tab, tab==='items'?{name:'',slot:'item',weight:0,condition_percent:100,description:'',trade_price:0,is_global:true}:tab==='perks'?{name:'',type:'neutral',cost:0,description:'',effect_text:'',effect_modifiers:[],tags:[],is_global:true}:tab==='professions'?{name:'',description:'',starter_skills:[],is_global:true}:tab==='skills'?{name:'',characteristic:'',tags:[],is_global:true}:{name:''})}
            className="bg-accent-orange text-wasteland-900 text-xs font-bold px-3 py-1.5 rounded">
            + Создать
          </button>
        )}
        {tab === 'currencies' && (
          <button onClick={() => openCreateForm('currency', { name: '', item_id: '', icon: '💎' })}
            className="bg-accent-orange text-wasteland-900 text-xs font-bold px-3 py-1.5 rounded">+ Валюта</button>
        )}
        {tab === 'shop' && (
          <button onClick={() => openCreateForm('preset', { name: '', is_active: false, price_multiplier: 1.0, items: [] })}
            className="bg-accent-orange text-wasteland-900 text-xs font-bold px-3 py-1.5 rounded">+ Пресет</button>
        )}
        {isItemsTab && selected.length > 0 && (
          <>
            <button onClick={batchDelete} className="bg-accent-red text-wasteland-900 text-xs font-bold px-3 py-1.5 rounded">Удалить ({selected.length})</button>
            <input type="number" placeholder="Цена" value={batchPrice} onChange={e => setBatchPrice(e.target.value)}
              className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs w-20" />
            <button onClick={batchUpdatePrice} className="bg-accent-green text-wasteland-900 text-xs font-bold px-3 py-1.5 rounded">Цена →</button>
            <button onClick={() => selectAll(items)} className="text-wasteland-400 text-xs hover:text-wasteland-200">Все</button>
          </>
        )}
      </div>

      {/* Форма создания/редактирования */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-wasteland-800 border border-wasteland-600 rounded-lg p-4 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-accent-yellow font-bold mb-3">
              {formType === 'items' ? 'Предмет' : formType === 'perks' ? 'Перк' : formType === 'professions' ? 'Профессия' : formType === 'skills' ? 'Навык' : formType === 'ammo' ? 'Тип патронов' : formType === 'currency' ? 'Валюта' : 'Пресет магазина'}
            </h3>
            <div className="space-y-2">
              {Object.keys(editValues).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at').map(key => (
                <div key={key} className="flex gap-2 items-center">
                  <span className="text-wasteland-400 w-32 text-right flex-shrink-0 text-xs">{key}:</span>
                  {key === 'slot' ? (
                    <select value={editValues[key]||'item'} onChange={e => setEditValues({...editValues, [key]: e.target.value})}
                      className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs">
                      {slotGroups.map(s => <option key={s} value={s}>{slotLabels[s]}</option>)}
                    </select>
                  ) : key === 'mod_target' ? (
                    <select value={editValues[key]||''} onChange={e => setEditValues({...editValues, [key]: e.target.value})}
                      className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs">
                      <option value="">—</option>
                      <option value="weapon">Оружие</option><option value="armor">Броня</option>
                      <option value="exo">Экзоскелет</option><option value="any">Любой</option>
                    </select>
                  ) : key === 'weapon_mod_subtype' ? (
                    <select value={editValues[key]||''} onChange={e => setEditValues({...editValues, [key]: e.target.value})}
                      className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs">
                      <option value="">—</option>
                      <option value="melee">Ближнее</option><option value="ranged">Дальнобойное</option>
                      <option value="thrown">Метательное</option><option value="any">Любое</option>
                    </select>
                  ) : key === 'weapon_type' ? (
                    <select value={editValues[key]||''} onChange={e => setEditValues({...editValues, [key]: e.target.value})}
                      className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs">
                      <option value="">—</option>
                      <option value="melee">Ближнее</option><option value="ranged">Дальнобойное</option>
                      <option value="thrown">Метательное</option>
                    </select>
                  ) : key === 'ammo_type_id' ? (
                    <select value={editValues[key]||''} onChange={e => setEditValues({...editValues, [key]: e.target.value})}
                      className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs">
                      <option value="">—</option>
                      {ammoTypes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  ) : key === 'type' ? (
                    <select value={editValues[key]||'neutral'} onChange={e => setEditValues({...editValues, [key]: e.target.value})}
                      className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs">
                      <option value="positive">Позитивный</option><option value="negative">Негативный</option><option value="neutral">Нейтральный</option>
                    </select>
                  ) : key === 'role' ? (
                    <select value={editValues[key]||'player'} onChange={e => setEditValues({...editValues, [key]: e.target.value})}
                      className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs">
                      <option value="player">Игрок</option><option value="admin">Админ</option>
                    </select>
                  ) : typeof editValues[key] === 'boolean' ? (
                    <input type="checkbox" checked={!!editValues[key]} onChange={e => setEditValues({...editValues, [key]: e.target.checked})} />
                  ) : typeof editValues[key] === 'object' ? (
                    <input value={JSON.stringify(editValues[key])} onChange={e => { try { setEditValues({...editValues, [key]: JSON.parse(e.target.value)}); } catch {} }}
                      className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs font-mono" />
                  ) : (
                    <input value={editValues[key]||''} onChange={e => setEditValues({...editValues, [key]: e.target.value})}
                      className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs" />
                  )}
                </div>
              ))}
              {formType === 'shop' && (
                <div className="mt-2">
                  <p className="text-wasteland-400 text-xs mb-1">Предметы (JSON: [{"item_id":"...","price_override":50}])</p>
                  <textarea value={JSON.stringify(editValues.items||[],null,2)} onChange={e => { try { setEditValues({...editValues, items: JSON.parse(e.target.value)}); } catch {} }}
                    className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs font-mono" rows={5} />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={handleCreate} className="bg-accent-orange text-wasteland-900 font-bold px-4 py-2 rounded text-sm">Сохранить</button>
              <button onClick={() => { setShowForm(false); setEditValues({}); }} className="bg-wasteland-600 text-wasteland-300 px-4 py-2 rounded text-sm">Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Список */}
      <div className="space-y-1 max-h-[55vh] overflow-y-auto">
        {isItemsTab && slotGroups.map(slot => {
          const group = items.filter(i => i.slot === slot);
          if (!group.length) return null;
          return (
            <div key={slot}>
              <h3 className="text-wasteland-500 text-xs uppercase sticky top-0 bg-wasteland-900 py-1">{slotLabels[slot]} ({group.length})</h3>
              {group.map(item => (
                <div key={item.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                    <span className="text-wasteland-200 font-bold">{item.name}</span>
                    <span className="text-wasteland-500">{item.weight}кг</span>
                    <span className="text-wasteland-500">💰{item.trade_price}</span>
                    {item.weapon_type && <span className="text-wasteland-400">{item.weapon_type}</span>}
                    {item.ammo_type?.name && <span className="text-accent-yellow text-xs">{item.ammo_type.name}</span>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { handleEdit(item); setFormType('items'); }} className="text-wasteland-400 hover:text-wasteland-200">✏️</button>
                    <button onClick={() => handleDelete('items', item.id)} className="text-accent-red hover:text-red-400">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
        {!isItemsTab && data.map(item => (
          <div key={item.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
            <span className="text-wasteland-200 font-bold">{item.name || item.username || item.title}</span>
            <div className="flex gap-1 items-center">
              {tab === 'users' && <span className={`text-xs ${item.role==='admin'?'text-accent-orange':'text-wasteland-400'}`}>{item.role}</span>}
              <button onClick={() => handleEdit(item)} className="text-wasteland-400 hover:text-wasteland-200">✏️</button>
              <button onClick={() => handleDelete(tab, item.id)} className="text-accent-red hover:text-red-400">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
