// src/components/AdminPanel.jsx
import { useState, useEffect } from 'react';
import { api } from '../api';
import useConfirm from '../hooks/useConfirm';
import usePrompt from '../hooks/usePrompt';
import SkillListEditor from './SkillListEditor';
import ItemListEditor from './ItemListEditor';

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
  const [campaigns, setCampaigns] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchPrice, setBatchPrice] = useState(0);

  // Filter states
  const [filterSlot, setFilterSlot] = useState('all');
  const [filterSubcategory, setFilterSubcategory] = useState('all');

  // Form states
  const [newItem, setNewItem] = useState({ name: '', slot: 'item', subcategory: '', weight: 0, condition_percent: 100, description: '', trade_price: 0, is_global: true, is_container: false, container_slots: 0, container_items: [] });
  const [newPerk, setNewPerk] = useState({ name: '', type: 'positive', cost: 0, description: '', effect_text: '', effect_modifiers: [], tags: '', is_global: true });
  const [newProfession, setNewProfession] = useState({ name: '', description: '', starter_skills: [], is_global: true });
  const [newSkill, setNewSkill] = useState({ name: '', characteristic: '', tags: '', is_global: true });
  const [newAmmoType, setNewAmmoType] = useState({ name: '' });
  const [newCurrency, setNewCurrency] = useState({ name: '', icon: '💎', item_id: '' });
  const [newPreset, setNewPreset] = useState({ name: '', is_active: false, price_multiplier: 1.0, items: [] });
  const [editingPreset, setEditingPreset] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newSubcategory, setNewSubcategory] = useState({ slot: 'item', name: '' });

  const { confirm, ConfirmModal } = useConfirm();
  const { prompt, PromptModal } = usePrompt();

  const load = async () => {
    setLoading(true);
    const [i, p, prof, s, at, cur, usr, sp, bg, sd, camp, pl, sub] = await Promise.all([
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
      api.getAdminCampaigns().catch(() => []),
      api.getPlaylists().catch(() => []),
      api.getSubcategories().catch(() => []),
    ]);
    setItems(i); setPerks(p); setProfessions(prof); setSkills(s);
    setAmmoTypes(at); setCurrencies(cur); setUsers(usr); setShopPresets(sp);
    setGlobalBackgrounds(bg); setGlobalSounds(sd);
    setCampaigns(camp); setPlaylists(pl); setSubcategories(sub);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getAvailableSubcategories = (slot) => {
    if (slot === 'weapon') return ['melee', 'ranged', 'thrown']; // weapon_type, не subcategory
    return subcategories.filter(s => s.slot === slot);
  };

  // === ITEM CREATION ===
  const handleCreateItem = async () => {
    const payload = { ...newItem };
    if (payload.slot === 'weapon') payload.subcategory = payload.weapon_type || 'melee';
    await api.createAdminItem(payload);
    setNewItem({ name: '', slot: 'item', subcategory: '', weight: 0, condition_percent: 100, description: '', trade_price: 0, is_global: true, is_container: false, container_slots: 0, container_items: [] });
    setShowForm(false);
    load();
  };

  // === PERK CREATION ===
  const handleCreatePerk = async () => {
    const tagsArray = newPerk.tags.split(',').map(t => t.trim()).filter(Boolean);
    await api.post('/admin/perks', { ...newPerk, tags: tagsArray, is_global: true });
    setNewPerk({ name: '', type: 'positive', cost: 0, description: '', effect_text: '', effect_modifiers: [], tags: '', is_global: true });
    setShowForm(false);
    load();
  };

  // === PROFESSION CREATION ===
  const handleCreateProfession = async () => {
    await api.post('/admin/professions', { ...newProfession, is_global: true });
    setNewProfession({ name: '', description: '', starter_skills: [], is_global: true });
    setShowForm(false);
    load();
  };

  // === SKILL CREATION ===
  const handleCreateSkill = async () => {
    const tagsArray = newSkill.tags.split(',').map(t => t.trim()).filter(Boolean);
    await api.post('/admin/skills', { ...newSkill, tags: tagsArray, is_global: true });
    setNewSkill({ name: '', characteristic: '', tags: '', is_global: true });
    setShowForm(false);
    load();
  };

  // === AMMO TYPE ===
  const handleCreateAmmoType = async () => {
    await api.createAmmoType(newAmmoType.name);
    setNewAmmoType({ name: '' });
    setShowForm(false);
    load();
  };

  // === CURRENCY ===
  const handleCreateCurrency = async () => {
    await api.createCurrency(newCurrency);
    setNewCurrency({ name: '', icon: '💎', item_id: '' });
    setShowForm(false);
    load();
  };

  // === SHOP PRESET ===
  const handleCreatePreset = async () => {
    await api.createShopPreset({ ...newPreset });
    setNewPreset({ name: '', is_active: false, price_multiplier: 1.0, items: [] });
    setShowForm(false);
    load();
  };

  const handleUpdatePreset = async (id) => {
    await api.updateShopPreset(id, { ...editingPreset });
    setEditingPreset(null);
    load();
  };

  // === PLAYLIST ===
  const handleCreatePlaylist = async () => {
    await api.createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setShowForm(false);
    load();
  };

  // === SUBCATEGORY ===
  const handleCreateSubcategory = async () => {
    await api.createSubcategory(newSubcategory.slot, newSubcategory.name);
    setNewSubcategory({ slot: 'item', name: '' });
    load();
  };

  // === SAVE EDIT ===
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

  // === DELETE ===
  const handleDelete = async (type, id) => {
    const ok = await confirm('Удалить?');
    if (!ok) return;
    if (type === 'items') await api.deleteAdminItem(id);
    else if (type === 'perks') await api.fetch('/admin/perks/' + id, { method: 'DELETE' });
    else if (type === 'professions') await api.fetch('/admin/professions/' + id, { method: 'DELETE' });
    else if (type === 'skills') await api.fetch('/admin/skills/' + id, { method: 'DELETE' });
    load();
  };

  const handleEdit = (item) => {
    setEditing(item.id);
    setEditValues({ ...item });
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBatchDelete = async () => {
    const ok = await confirm(`Удалить ${selectedIds.length} предметов?`);
    if (!ok) return;
    await api.post('/admin/items/batch-delete', { ids: selectedIds });
    setSelectedIds([]);
    load();
  };

  const handleBatchPrice = async () => {
    await api.put('/admin/items/batch-price', { ids: selectedIds, trade_price: batchPrice });
    setSelectedIds([]);
    load();
  };

  const openForm = (type) => { setFormType(type); setShowForm(true); };

  const filteredItems = items.filter(item => {
    if (filterSlot !== 'all' && item.slot !== filterSlot) return false;
    if (filterSubcategory !== 'all' && item.subcategory !== filterSubcategory) return false;
    return true;
  });

  if (loading) return <p className="text-wasteland-400 text-center py-4">Загрузка...</p>;

  const tabs = [
    { key: 'items', label: 'Предметы' },
    { key: 'perks', label: 'Перки' },
    { key: 'professions', label: 'Профессии' },
    { key: 'skills', label: 'Навыки' },
    { key: 'ammo', label: 'Патроны' },
    { key: 'currencies', label: 'Валюты' },
    { key: 'shop', label: 'Магазин' },
    { key: 'playlists', label: 'Плейлисты' },
    { key: 'subcategories', label: 'Подкатегории' },
    { key: 'campaigns', label: 'Кампании' },
    { key: 'users', label: 'Пользователи' },
    { key: 'backgrounds', label: 'Фоны' },
    { key: 'sounds', label: 'Звуки' },
  ];

  // ... (рендер табов и контента)

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
          <div className="flex gap-2 mb-3 flex-wrap items-end">
            <button onClick={() => openForm('item')} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded">{showForm && formType==='item' ? 'Отмена' : '+ Предмет'}</button>
            <button onClick={handleBatchDelete} disabled={!selectedIds.length} className="text-xs bg-accent-red text-wasteland-900 px-3 py-1.5 rounded disabled:opacity-50">Удалить выбранные ({selectedIds.length})</button>
            <input type="number" value={batchPrice} onChange={e => setBatchPrice(parseInt(e.target.value)||0)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs w-20" placeholder="Цена" />
            <button onClick={handleBatchPrice} disabled={!selectedIds.length} className="text-xs bg-accent-green text-wasteland-900 px-3 py-1.5 rounded disabled:opacity-50">Установить цену</button>
          </div>

          {/* Фильтры */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <select value={filterSlot} onChange={e => { setFilterSlot(e.target.value); setFilterSubcategory('all'); }} className="bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-xs">
              <option value="all">Все категории</option>
              <option value="weapon">Оружие</option><option value="armor">Броня</option><option value="exo">Экзоскелет</option>
              <option value="mod">Модификация</option><option value="ammo">Патроны</option><option value="consumable">Расходник</option>
              <option value="item">Предмет</option><option value="currency">Валюта</option>
            </select>
            {filterSlot !== 'all' && filterSlot !== 'currency' && filterSlot !== 'exo' && (
              <select value={filterSubcategory} onChange={e => setFilterSubcategory(e.target.value)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-xs">
                <option value="all">Все подкатегории</option>
                {getAvailableSubcategories(filterSlot).map(sc => (
                  <option key={typeof sc === 'string' ? sc : sc.id} value={typeof sc === 'string' ? sc : sc.name}>
                    {typeof sc === 'string' ? sc : sc.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Форма предмета */}
          {showForm && formType === 'item' && (
            <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
              <h3 className="text-wasteland-300 text-sm font-bold">Новый предмет</h3>
              <input placeholder="Название" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              
              <div className="flex gap-2">
                <select value={newItem.slot} onChange={e => {
                  const slot = e.target.value;
                  setNewItem({...newItem, slot, subcategory: '', weapon_type: '', mod_target: '', weapon_mod_subtype: '', ammo_type_id: '' });
                }} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                  <option value="weapon">Оружие</option><option value="armor">Броня</option><option value="exo">Экзоскелет</option>
                  <option value="mod">Модификация</option><option value="ammo">Патроны</option><option value="consumable">Расходник</option>
                  <option value="item">Предмет</option><option value="currency">Валюта</option>
                </select>
                {/* Подкатегория (кроме оружия — там weapon_type) */}
                {newItem.slot !== 'weapon' && newItem.slot !== 'ammo' && newItem.slot !== 'currency' && newItem.slot !== 'exo' && getAvailableSubcategories(newItem.slot).length > 0 && (
                  <select value={newItem.subcategory} onChange={e => setNewItem({...newItem, subcategory: e.target.value})} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                    <option value="">Подкатегория</option>
                    {getAvailableSubcategories(newItem.slot).map(sc => (
                      <option key={sc.id} value={sc.name}>{sc.name}</option>
                    ))}
                  </select>
                )}
                {/* Для оружия — тип */}
                {newItem.slot === 'weapon' && (
                  <select value={newItem.weapon_type || ''} onChange={e => setNewItem({...newItem, weapon_type: e.target.value})} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                    <option value="">Тип оружия</option>
                    <option value="melee">Ближний бой</option>
                    <option value="ranged">Дальний бой</option>
                    <option value="thrown">Метательное</option>
                  </select>
                )}
              </div>

              {/* Динамические поля в зависимости от слота */}
              {newItem.slot === 'weapon' && newItem.weapon_type === 'ranged' && (
                <>
                  <select value={newItem.ammo_type_id || ''} onChange={e => setNewItem({...newItem, ammo_type_id: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                    <option value="">Тип патронов</option>
                    {ammoTypes.map(at => <option key={at.id} value={at.id}>{at.name}</option>)}
                  </select>
                  <label className="text-wasteland-400 text-xs">Макс. патронов в магазине</label>
                  <input type="number" placeholder="0" value={newItem.max_ammo || ''} onChange={e => setNewItem({...newItem, max_ammo: parseInt(e.target.value)||0})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
                </>
              )}
              {newItem.slot === 'weapon' && (
                <label className="flex items-center gap-2 text-xs text-wasteland-300"><input type="checkbox" checked={newItem.is_heavy || false} onChange={e => setNewItem({...newItem, is_heavy: e.target.checked})} />Тяжёлое оружие</label>
              )}
              {newItem.slot === 'mod' && (
                <>
                  <select value={newItem.mod_target || ''} onChange={e => setNewItem({...newItem, mod_target: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                    <option value="">На что устанавливается</option>
                    <option value="weapon">Оружие</option><option value="armor">Броня</option><option value="exo">Экзоскелет</option><option value="any">Любой предмет</option>
                  </select>
                  {newItem.mod_target === 'weapon' && (
                    <select value={newItem.weapon_mod_subtype || ''} onChange={e => setNewItem({...newItem, weapon_mod_subtype: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                      <option value="">Подтип оружия</option>
                      <option value="melee">Ближний бой</option><option value="ranged">Дальний бой</option><option value="thrown">Метательное</option><option value="any">Любое</option>
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
                <div className="flex-1"><label className="text-wasteland-400 text-xs">Вес (кг)</label>
                  <input type="number" value={newItem.weight} onChange={e => setNewItem({...newItem, weight: parseFloat(e.target.value)||0})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
                </div>
                <div className="flex-1"><label className="text-wasteland-400 text-xs">Базовая цена</label>
                  <input type="number" value={newItem.trade_price} onChange={e => setNewItem({...newItem, trade_price: parseInt(e.target.value)||0})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
                </div>
              </div>
              <textarea placeholder="Описание" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" rows={2} />

              {/* Контейнер */}
              <label className="flex items-center gap-2 text-xs text-wasteland-300">
                <input type="checkbox" checked={newItem.is_container} onChange={e => setNewItem({...newItem, is_container: e.target.checked})} />Это контейнер
              </label>
              {newItem.is_container && (
                <>
                  <div><label className="text-wasteland-400 text-xs">Слотов: {newItem.container_slots}</label>
                    <input type="range" min="1" max="10" value={newItem.container_slots} onChange={e => setNewItem({...newItem, container_slots: parseInt(e.target.value)})} className="w-full" />
                  </div>
                  <label className="text-wasteland-400 text-xs block">Содержимое:</label>
                  <ItemListEditor
                    items={newItem.container_items}
                    allItems={items}
                    onChange={(val) => setNewItem({...newItem, container_items: val})}
                  />
                </>
              )}

              <button onClick={handleCreateItem} disabled={!newItem.name} className="w-full bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">Создать</button>
            </div>
          )}

          {/* Список предметов */}
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {filteredItems.map(item => (
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
                    <span className="text-wasteland-200">{item.name} <span className="text-wasteland-500">({item.slot}{item.subcategory ? '/'+item.subcategory : ''})</span> <span className="text-accent-yellow text-xs">{item.trade_price}💎</span>{item.is_container && <span className="text-accent-green text-xs ml-1">📦</span>}</span>
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
              <label className="text-wasteland-400 text-xs block">Модификаторы навыков:</label>
              <SkillListEditor
                skills={newPerk.effect_modifiers}
                allSkills={skills}
                onChange={(val) => setNewPerk({...newPerk, effect_modifiers: val})}
                showSkillSelect={true}
              />
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
              <label className="text-wasteland-400 text-xs block">Стартовые навыки:</label>
              <SkillListEditor
                skills={newProfession.starter_skills}
                allSkills={skills}
                onChange={(val) => setNewProfession({...newProfession, starter_skills: val})}
                showSkillSelect={true}
                showModifier={true}
              />
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
              <label className="text-wasteland-400 text-xs block">Предметы:</label>
              <ItemListEditor
                items={newPreset.items}
                allItems={items}
                onChange={(val) => setNewPreset({...newPreset, items: val})}
                showPrice={true}
              />
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
                    <ItemListEditor
                      items={editingPreset.items || []}
                      allItems={items}
                      onChange={(val) => setEditingPreset({...editingPreset, items: val})}
                      showPrice={true}
                    />
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
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditingPreset({...p, items: p.items || []})} className="text-wasteland-400 hover:text-wasteland-200">✏️</button>
                      <button onClick={() => { api.deleteShopPreset(p.id).then(load); }} className="text-accent-red hover:text-red-400">🗑️</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== PLAYLISTS ===== */}
      {tab === 'playlists' && (
        <div>
          <button onClick={() => openForm('playlist')} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded mb-3">{showForm && formType==='playlist' ? 'Отмена' : '+ Плейлист'}</button>
          {showForm && formType === 'playlist' && (
            <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
              <input placeholder="Название" value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <button onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim()} className="w-full bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">Создать</button>
            </div>
          )}
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {playlists.map(pl => (
              <div key={pl.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
                <span className="text-wasteland-200">{pl.name}</span>
                <button onClick={() => api.deletePlaylist(pl.id).then(load)} className="text-accent-red hover:text-red-400">🗑️</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== SUBCATEGORIES ===== */}
      {tab === 'subcategories' && (
        <div>
          <div className="flex gap-2 mb-3 items-end">
            <select value={newSubcategory.slot} onChange={e => setNewSubcategory({...newSubcategory, slot: e.target.value})} className="bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
              <option value="armor">Броня</option><option value="consumable">Расходник</option><option value="item">Предмет</option><option value="mod">Модификация</option>
            </select>
            <input placeholder="Название" value={newSubcategory.name} onChange={e => setNewSubcategory({...newSubcategory, name: e.target.value})} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
            <button onClick={handleCreateSubcategory} disabled={!newSubcategory.name} className="bg-accent-orange text-wasteland-900 text-xs px-3 py-1.5 rounded">Добавить</button>
          </div>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {subcategories.map(sc => (
              <div key={sc.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
                <span className="text-wasteland-200">{sc.slot} / {sc.name}</span>
                <button onClick={() => api.deleteSubcategory(sc.id).then(load)} className="text-accent-red hover:text-red-400">🗑️</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== CAMPAIGNS ===== */}
      {tab === 'campaigns' && (
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {campaigns.map(c => (
            <div key={c.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
              <div>
                <span className="text-wasteland-200 font-bold">{c.title}</span>
                <span className="text-wasteland-500 ml-2">👑 {c.master?.username || '?'}</span>
                <span className="text-wasteland-500 ml-2">{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
              <button onClick={async () => { const ok = await confirm(`Удалить кампанию "${c.title}"?`); if (ok) api.deleteAdminCampaign(c.id).then(load); }} className="text-accent-red hover:text-red-400 text-xs">🗑️</button>
            </div>
          ))}
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
                <button onClick={async () => { const ok = await confirm('Удалить пользователя?'); if (ok) api.deleteAdminUser(u.id).then(load); }} className="text-accent-red hover:text-red-400 text-xs">🗑️</button>
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

      {/* Модалки */}
      {ConfirmModal}
      {PromptModal}
    </div>
  );
}
