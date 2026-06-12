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
  const [formType, setFormType] = useState(''); // 'item', 'perk', 'profession', 'skill', 'ammo', 'currency', 'preset'
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchPrice, setBatchPrice] = useState(0);

  // Form states
  const [newItem, setNewItem] = useState({ name: '', slot: 'item', weight: 0, condition_percent: 100, description: '', trade_price: 0, is_global: true });
  const [newPerk, setNewPerk] = useState({ name: '', type: 'positive', cost: 0, description: '', effect_text: '', effect_modifiers: '[]', tags: '', is_global: true });
  const [newProfession, setNewProfession] = useState({ name: '', description: '', starter_skills: '[]', is_global: true });
  const [newSkill, setNewSkill] = useState({ name: '', characteristic: '', tags: '', is_global: true });
  const [newAmmoType, setNewAmmoType] = useState({ name: '' });
  const [newCurrency, setNewCurrency] = useState({ name: '', icon: '💎', item_id: '' });
  const [newPreset, setNewPreset] = useState({ name: '', is_active: false, price_multiplier: 1.0, items: '[]' });
  const [editingPreset, setEditingPreset] = useState(null);

  const load = async () => {
    setLoading(true);
    const [i, p, prof, s, at, cur, usr, sp, bg, sd] = await Promise.all([
      api.getAdminItems(),
      api.getAdminPerks(),
      api.getAdminProfessions(),
      api.getAdminSkills(),
      api.getAmmoTypes(),
      api.getCurrencies(),
      api.getAdminUsers(),
      api.getShopPresets(),
      api.getAdminBackgrounds(),
      api.getAdminSounds(),
    ]);
    setItems(i); setPerks(p); setProfessions(prof); setSkills(s);
    setAmmoTypes(at); setCurrencies(cur); setUsers(usr); setShopPresets(sp);
    setGlobalBackgrounds(bg); setGlobalSounds(sd);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Generic handlers
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
    if (type === 'items') await api.deleteAdminItem(id);
    else if (type === 'perks') await api.fetch('/admin/perks/' + id, { method: 'DELETE' });
    else if (type === 'professions') await api.fetch('/admin/professions/' + id, { method: 'DELETE' });
    else if (type === 'skills') await api.fetch('/admin/skills/' + id, { method: 'DELETE' });
    load();
  };

  // Create handlers
  const handleCreateItem = async () => {
    await api.createAdminItem({ ...newItem, is_global: true });
    setNewItem({ name: '', slot: 'item', weight: 0, condition_percent: 100, description: '', trade_price: 0, is_global: true });
    setShowForm(false);
    load();
  };

  const handleCreatePerk = async () => {
    const tagsArray = newPerk.tags.split(',').map(t => t.trim()).filter(Boolean);
    let effectModifiers = [];
    try { effectModifiers = JSON.parse(newPerk.effect_modifiers); } catch {}
    await api.post('/admin/perks', { ...newPerk, tags: tagsArray, effect_modifiers: effectModifiers, is_global: true });
    setNewPerk({ name: '', type: 'positive', cost: 0, description: '', effect_text: '', effect_modifiers: '[]', tags: '', is_global: true });
    setShowForm(false);
    load();
  };

  const handleCreateProfession = async () => {
    let starterSkills = [];
    try { starterSkills = JSON.parse(newProfession.starter_skills); } catch {}
    await api.post('/admin/professions', { ...newProfession, starter_skills: starterSkills, is_global: true });
    setNewProfession({ name: '', description: '', starter_skills: '[]', is_global: true });
    setShowForm(false);
    load();
  };

  const handleCreateSkill = async () => {
    const tagsArray = newSkill.tags.split(',').map(t => t.trim()).filter(Boolean);
    await api.post('/admin/skills', { ...newSkill, tags: tagsArray, is_global: true });
    setNewSkill({ name: '', characteristic: '', tags: '', is_global: true });
    setShowForm(false);
    load();
  };

  const handleCreateAmmoType = async () => {
    await api.createAmmoType(newAmmoType.name);
    setNewAmmoType({ name: '' });
    setShowForm(false);
    load();
  };

  const handleCreateCurrency = async () => {
    await api.createCurrency(newCurrency);
    setNewCurrency({ name: '', icon: '💎', item_id: '' });
    setShowForm(false);
    load();
  };

  const handleCreatePreset = async () => {
    let items = [];
    try { items = JSON.parse(newPreset.items); } catch {}
    await api.createShopPreset({ ...newPreset, items });
    setNewPreset({ name: '', is_active: false, price_multiplier: 1.0, items: '[]' });
    setShowForm(false);
    load();
  };

  const handleUpdatePreset = async (id) => {
    let items = [];
    try { items = JSON.parse(editingPreset.items); } catch {}
    await api.updateShopPreset(id, { ...editingPreset, items });
    setEditingPreset(null);
    load();
  };

  // Batch handlers
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

  const openForm = (type) => { setFormType(type); setShowForm(true); };

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
          <button key={t.key} onClick={() => { setTab(t.key); setShowForm(false); setEditing(null); }}
            className={`text-xs px-3 py-1.5 rounded ${tab === t.key ? 'bg-accent-orange text-wasteland-900' : 'bg-wasteland-700 text-wasteland-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== ITEMS ===== */}
      {tab === 'items' && (
        <div>
          <div className="flex gap-2 mb-3 flex-wrap">
            <button onClick={() => openForm('item')} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded">{showForm && formType==='item' ? 'Отмена' : '+ Предмет'}</button>
            <button onClick={handleBatchDelete} disabled={!selectedIds.length} className="text-xs bg-accent-red text-wasteland-900 px-3 py-1.5 rounded disabled:opacity-50">Удалить выбранные ({selectedIds.length})</button>
            <input type="number" value={batchPrice} onChange={e => setBatchPrice(parseInt(e.target.value)||0)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs w-20" placeholder="Цена" />
            <button onClick={handleBatchPrice} disabled={!selectedIds.length} className="text-xs bg-accent-green text-wasteland-900 px-3 py-1.5 rounded disabled:opacity-50">Установить цену</button>
          </div>

          {showForm && formType === 'item' && (
            <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
              <h3 className="text-wasteland-300 text-sm font-bold">Новый предмет</h3>
              <input placeholder="Название" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <select value={newItem.slot} onChange={e => setNewItem({...newItem, slot: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                <option value="weapon">Оружие</option><option value="armor">Броня</option><option value="exo">Экзоскелет</option><option value="mod">Модификация</option><option value="ammo">Патроны</option><option value="consumable">Расходник</option><option value="item">Предмет</option><option value="currency">Валюта</option>
              </select>
              {newItem.slot === 'weapon' && (<>
                <select value={newItem.weapon_type || ''} onChange={e => setNewItem({...newItem, weapon_type: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                  <option value="">Тип оружия</option><option value="melee">Ближний бой</option><option value="ranged">Дальний бой</option><option value="thrown">Метательное</option>
                </select>
                {newItem.weapon_type === 'ranged' && (<>
                  <select value={newItem.ammo_type_id || ''} onChange={e => setNewItem({...newItem, ammo_type_id: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                    <option value="">Тип патронов</option>
                    {ammoTypes.map(at => <option key={at.id} value={at.id}>{at.name}</option>)}
                  </select>
                  <input type="number" placeholder="Макс. патронов" value={newItem.max_ammo || ''} onChange={e => setNewItem({...newItem, max_ammo: parseInt(e.target.value)||0})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
                </>)}
                <label className="flex items-center gap-2 text-xs text-wasteland-300"><input type="checkbox" checked={newItem.is_heavy || false} onChange={e => setNewItem({...newItem, is_heavy: e.target.checked})} />Тяжёлое оружие</label>
              </>)}
              {newItem.slot === 'mod' && (<>
                <select value={newItem.mod_target || ''} onChange={e => setNewItem({...newItem, mod_target: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                  <option value="">На что устанавливается</option><option value="weapon">Оружие</option><option value="armor">Броня</option><option value="exo">Экзоскелет</option><option value="any">Любой предмет</option>
                </select>
                {newItem.mod_target === 'weapon' && (
                  <select value={newItem.weapon_mod_subtype || ''} onChange={e => setNewItem({...newItem, weapon_mod_subtype: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                    <option value="">Подтип оружия</option><option value="melee">Ближний бой</option><option value="ranged">Дальний бой</option><option value="thrown">Метательное</option><option value="any">Любое</option>
                  </select>
                )}
              </>)}
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
                    <input value={editValues.trade_price || 0} onChange={e => setEditValues({...editValues, trade_price: parseInt(e.target.value)||0})} type="number" className="w-20 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100" />
                    <div className="flex gap-2">
                      <button onClick={() => handleSave('items')} className="bg-accent-green text-wasteland-900 px-2 py-1 rounded text-xs font-bold">OK</button>
                      <button onClick={() => setEditing(null)} className="bg-wasteland-600 text-wasteland-300 px-2 py-1 rounded text-xs">Отмена</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-wasteland-200">{item.name} <span className="text-wasteland-500">({item.slot})</span> <span className="text-accent-yellow text-xs">{item.trade_price}💎</span></span>
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

      {/* ===== PERKS ===== */}
      {tab === 'perks' && (
        <div>
          <button onClick={() => openForm('perk')} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded mb-3">{showForm && formType==='perk' ? 'Отмена' : '+ Перк'}</button>
          {showForm && formType === 'perk' && (
            <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
              <h3 className="text-wasteland-300 text-sm font-bold">Новый перк</h3>
              <input placeholder="Название" value={newPerk.name} onChange={e => setNewPerk({...newPerk, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <select value={newPerk.type} onChange={e => setNewPerk({...newPerk, type: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                <option value="positive">Позитивный</option><option value="negative">Негативный</option><option value="neutral">Нейтральный</option>
              </select>
              <input type="number" placeholder="Стоимость" value={newPerk.cost} onChange={e => setNewPerk({...newPerk, cost: parseInt(e.target.value)||0})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <textarea placeholder="Описание" value={newPerk.description} onChange={e => setNewPerk({...newPerk, description: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" rows={2} />
              <input placeholder="Текст эффекта" value={newPerk.effect_text} onChange={e => setNewPerk({...newPerk, effect_text: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <textarea placeholder="Модификаторы (JSON)" value={newPerk.effect_modifiers} onChange={e => setNewPerk({...newPerk, effect_modifiers: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm font-mono" rows={3} />
              <input placeholder="Теги (через запятую)" value={newPerk.tags} onChange={e => setNewPerk({...newPerk, tags: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <button onClick={handleCreatePerk} disabled={!newPerk.name} className="w-full bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">Создать</button>
            </div>
          )}
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
                    <span className="text-wasteland-200 font-bold">{item.name} <span className="text-wasteland-500">({item.type} {item.cost})</span></span>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(item)} className="text-wasteland-400 hover:text-wasteland-200">✏️</button>
                      <button onClick={() => handleDelete('perks', item.id)} className="text-accent-red hover:text-red-400">🗑️</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== PROFESSIONS ===== */}
      {tab === 'professions' && (
        <div>
          <button onClick={() => openForm('profession')} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded mb-3">{showForm && formType==='profession' ? 'Отмена' : '+ Профессия'}</button>
          {showForm && formType === 'profession' && (
            <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
              <h3 className="text-wasteland-300 text-sm font-bold">Новая профессия</h3>
              <input placeholder="Название" value={newProfession.name} onChange={e => setNewProfession({...newProfession, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <textarea placeholder="Описание" value={newProfession.description} onChange={e => setNewProfession({...newProfession, description: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" rows={2} />
              <textarea placeholder="Стартовые навыки (JSON)" value={newProfession.starter_skills} onChange={e => setNewProfession({...newProfession, starter_skills: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm font-mono" rows={3} />
              <button onClick={handleCreateProfession} disabled={!newProfession.name} className="w-full bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">Создать</button>
            </div>
          )}
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
        </div>
      )}

      {/* ===== SKILLS ===== */}
      {tab === 'skills' && (
        <div>
          <button onClick={() => openForm('skill')} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded mb-3">{showForm && formType==='skill' ? 'Отмена' : '+ Навык'}</button>
          {showForm && formType === 'skill' && (
            <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
              <h3 className="text-wasteland-300 text-sm font-bold">Новый навык</h3>
              <input placeholder="Название" value={newSkill.name} onChange={e => setNewSkill({...newSkill, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <input placeholder="Характеристика" value={newSkill.characteristic} onChange={e => setNewSkill({...newSkill, characteristic: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <input placeholder="Теги (через запятую)" value={newSkill.tags} onChange={e => setNewSkill({...newSkill, tags: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <button onClick={handleCreateSkill} disabled={!newSkill.name} className="w-full bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">Создать</button>
            </div>
          )}
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
        </div>
      )}

      {/* ===== AMMO TYPES ===== */}
      {tab === 'ammo' && (
        <div>
          <button onClick={() => openForm('ammo')} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded mb-3">{showForm && formType==='ammo' ? 'Отмена' : '+ Тип патронов'}</button>
          {showForm && formType === 'ammo' && (
            <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
              <h3 className="text-wasteland-300 text-sm font-bold">Новый тип патронов</h3>
              <input placeholder="Название" value={newAmmoType.name} onChange={e => setNewAmmoType({name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <button onClick={handleCreateAmmoType} disabled={!newAmmoType.name} className="w-full bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">Создать</button>
            </div>
          )}
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {ammoTypes.map(item => (
              <div key={item.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
                <span className="text-wasteland-200">{item.name}</span>
                <button onClick={() => api.deleteAmmoType(item.id).then(load)} className="text-accent-red hover:text-red-400">🗑️</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== CURRENCIES ===== */}
      {tab === 'currencies' && (
        <div>
          <button onClick={() => openForm('currency')} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded mb-3">{showForm && formType==='currency' ? 'Отмена' : '+ Валюта'}</button>
          {showForm && formType === 'currency' && (
            <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
              <h3 className="text-wasteland-300 text-sm font-bold">Новая валюта</h3>
              <input placeholder="Название" value={newCurrency.name} onChange={e => setNewCurrency({...newCurrency, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <input placeholder="Иконка" value={newCurrency.icon} onChange={e => setNewCurrency({...newCurrency, icon: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <select value={newCurrency.item_id} onChange={e => setNewCurrency({...newCurrency, item_id: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                <option value="">Предмет валюты</option>
                {items.filter(i => i.slot === 'currency').map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              <button onClick={handleCreateCurrency} disabled={!newCurrency.name} className="w-full bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">Создать</button>
            </div>
          )}
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {currencies.map(item => (
              <div key={item.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
                <span className="text-wasteland-200">{item.icon} {item.name}</span>
                <button onClick={() => api.deleteCurrency(item.id).then(load)} className="text-accent-red hover:text-red-400">🗑️</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== SHOP PRESETS ===== */}
      {tab === 'shop' && (
        <div>
          <button onClick={() => openForm('preset')} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded mb-3">{showForm && formType==='preset' ? 'Отмена' : '+ Пресет'}</button>
          {showForm && formType === 'preset' && (
            <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
              <h3 className="text-wasteland-300 text-sm font-bold">Новый пресет магазина</h3>
              <input placeholder="Название" value={newPreset.name} onChange={e => setNewPreset({...newPreset, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <label className="flex items-center gap-2 text-xs text-wasteland-300"><input type="checkbox" checked={newPreset.is_active} onChange={e => setNewPreset({...newPreset, is_active: e.target.checked})} />Активен</label>
              <input type="number" step="0.1" placeholder="Множитель цены" value={newPreset.price_multiplier} onChange={e => setNewPreset({...newPreset, price_multiplier: parseFloat(e.target.value)||1.0})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <textarea placeholder="Предметы (JSON: [{'item_id':'...','price_override':10}])" value={newPreset.items} onChange={e => setNewPreset({...newPreset, items: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm font-mono" rows={4} />
              <button onClick={handleCreatePreset} disabled={!newPreset.name} className="w-full bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">Создать</button>
            </div>
          )}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {shopPresets.map(p => (
              <div key={p.id} className="bg-wasteland-800 p-3 rounded border border-wasteland-600 text-xs">
                {editingPreset?.id === p.id ? (
                  <div className="space-y-2">
                    <input value={editingPreset.name || ''} onChange={e => setEditingPreset({...editingPreset, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100" />
                    <label className="flex items-center gap-2 text-wasteland-300"><input type="checkbox" checked={editingPreset.is_active || false} onChange={e => setEditingPreset({...editingPreset, is_active: e.target.checked})} />Активен</label>
                    <input type="number" step="0.1" value={editingPreset.price_multiplier || 1.0} onChange={e => setEditingPreset({...editingPreset, price_multiplier: parseFloat(e.target.value)||1.0})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100" />
                    <textarea value={editingPreset.items || '[]'} onChange={e => setEditingPreset({...editingPreset, items: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 font-mono" rows={3} />
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdatePreset(p.id)} className="bg-accent-green text-wasteland-900 px-2 py-1 rounded text-xs font-bold">OK</button>
                      <button onClick={() => setEditingPreset(null)} className="bg-wasteland-600 text-wasteland-300 px-2 py-1 rounded text-xs">Отмена</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-wasteland-200 font-bold">{p.name}</span>
                      <span className={`ml-2 text-xs ${p.is_active ? 'text-accent-green' : 'text-wasteland-500'}`}>{p.is_active ? 'Активен' : 'Скрыт'}</span>
                      <span className="text-wasteland-500 ml-2">×{p.price_multiplier}</span>
                      <span className="text-wasteland-500 ml-2">{(p.items||[]).length} предметов</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditingPreset({...p, items: JSON.stringify(p.items||[], null, 2)})} className="text-wasteland-400 hover:text-wasteland-200">✏️</button>
                      <button onClick={() => { if (confirm('Удалить пресет?')) api.deleteShopPreset(p.id).then(load); }} className="text-accent-red hover:text-red-400">🗑️</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== USERS ===== */}
      {tab === 'users' && (
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {users.map(u => (
            <div key={u.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
              <div>
                <span className="text-wasteland-200">{u.username}</span>
                <span className={`ml-2 ${u.role === 'admin' ? 'text-accent-orange' : 'text-wasteland-500'}`}>{u.role}</span>
                <span className="text-wasteland-500 ml-2">{new Date(u.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => api.updateAdminUser(u.id, u.role === 'admin' ? 'player' : 'admin').then(load)} className="text-wasteland-400 hover:text-wasteland-200 text-xs">
                  {u.role === 'admin' ? '→ player' : '→ admin'}
                </button>
                <button onClick={() => { if (confirm('Удалить пользователя?')) api.deleteAdminUser(u.id).then(load); }} className="text-accent-red hover:text-red-400 text-xs">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== BACKGROUNDS ===== */}
      {tab === 'backgrounds' && (
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {globalBackgrounds.map(bg => (
            <div key={bg.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
              <div className="flex items-center gap-2">
                <img src={bg.url} alt={bg.name} className="h-8 w-12 object-cover rounded" />
                <span className="text-wasteland-200">{bg.name}</span>
              </div>
              <button onClick={() => api.deleteAdminBackground(bg.id).then(load)} className="text-accent-red hover:text-red-400">🗑️</button>
            </div>
          ))}
        </div>
      )}

      {/* ===== SOUNDS ===== */}
      {tab === 'sounds' && (
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {globalSounds.map(s => (
            <div key={s.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
              <span className="text-wasteland-200">{s.name}</span>
              <button onClick={() => api.deleteAdminSound(s.id).then(load)} className="text-accent-red hover:text-red-400">🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
