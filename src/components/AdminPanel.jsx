// src/components/AdminPanel.jsx
import { useState, useEffect } from 'react';
import { api } from '../api';
import useConfirm from '../hooks/useConfirm';
import usePrompt from '../hooks/usePrompt';
import SkillListEditor from './SkillListEditor';
import ItemListEditor from './ItemListEditor';

const STANDARD_TAGS = ['бой', 'выживание', 'социальное', 'наука/инженерия', 'торговля'];

const ITEM_ICONS = ['🗡️','🔫','🪓','🏹','🛡️','🦺','🤖','💠','🥫','💧','💉','🔦','🪢','🔧','💎','⚙️','📦','🧪','📜','🔑'];

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
  const [characteristics, setCharacteristics] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('');
  const [editId, setEditId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchPrice, setBatchPrice] = useState(0);

  // Filters
  const [filterSlot, setFilterSlot] = useState('all');
  const [filterSubcategory, setFilterSubcategory] = useState('all');

  // Form states
  const [newItem, setNewItem] = useState({
    name: '', slot: 'item', subcategory: '', icon: '', weight: 0, condition_percent: 100,
    description: '', trade_price: 0, is_global: true, is_container: false,
    container_slots: 0, container_items: []
  });
  const [newPerk, setNewPerk] = useState({ name: '', type: 'positive', cost: 0, description: '', effect_modifiers: [], tags: [], is_global: true });
  const [newProfession, setNewProfession] = useState({ name: '', description: '', starter_skills: [], is_global: true });
  const [newSkill, setNewSkill] = useState({ name: '', characteristic_id: '', tags: [], is_global: true });
  const [newAmmoType, setNewAmmoType] = useState({ name: '' });
  const [newCurrency, setNewCurrency] = useState({ name: '', icon: '💎' });
  const [newPreset, setNewPreset] = useState({ name: '', is_active: false, price_multiplier: 1.0, items: [] });
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newSubcategory, setNewSubcategory] = useState({ slot: 'item', name: '' });
  const [newChar, setNewChar] = useState({ name: '', short_name: '', description: '' });
  const [newGlobalSound, setNewGlobalSound] = useState({ name: '', file_url: '', category: 'ambient', playlist_id: '' });
  const [uploadingSound, setUploadingSound] = useState(false);

  const { confirm, ConfirmModal } = useConfirm();
  const { prompt, PromptModal } = usePrompt();

  const load = async () => {
    setLoading(true);
    const [i, p, prof, s, at, cur, usr, sp, bg, sd, camp, pl, sub, chars] = await Promise.all([
      api.getAdminItems(), api.getAdminPerks(), api.getAdminProfessions(), api.getAdminSkills(),
      api.getAmmoTypes(), api.getCurrencies(), api.getAdminUsers(), api.getShopPresets(),
      api.getAdminBackgrounds(), api.getAdminSounds(), api.getAdminCampaigns().catch(() => []),
      api.getPlaylists().catch(() => []), api.getSubcategories().catch(() => []),
      api.getCharacteristics().catch(() => [])
    ]);
    setItems(i); setPerks(p); setProfessions(prof); setSkills(s);
    setAmmoTypes(at); setCurrencies(cur); setUsers(usr); setShopPresets(sp);
    setGlobalBackgrounds(bg); setGlobalSounds(sd);
    setCampaigns(camp); setPlaylists(pl); setSubcategories(sub);
    setCharacteristics(chars);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getAvailableSubcategories = (slot) => {
    if (slot === 'weapon') return ['melee', 'ranged', 'thrown'];
    return subcategories.filter(s => s.slot === slot);
  };

  // Open form
  const openForm = (type, editObj = null) => {
    setFormType(type);
    setEditId(editObj?.id || null);
    setShowForm(true);

    switch (type) {
      case 'item':
        if (editObj) {
          setNewItem({
            name: editObj.name || '', slot: editObj.slot || 'item', subcategory: editObj.subcategory || '',
            icon: editObj.icon || '', weight: editObj.weight || 0, condition_percent: editObj.condition_percent ?? 100,
            description: editObj.description || '', trade_price: editObj.trade_price || 0,
            is_global: editObj.is_global ?? true, is_container: editObj.is_container || false,
            container_slots: editObj.container_slots || 0, container_items: editObj.container_items || []
          });
        } else {
          setNewItem({ name: '', slot: 'item', subcategory: '', icon: '', weight: 0, condition_percent: 100, description: '', trade_price: 0, is_global: true, is_container: false, container_slots: 0, container_items: [] });
        }
        break;
      case 'perk':
        setNewPerk(editObj ? { ...editObj, effect_modifiers: editObj.effect_modifiers || [], tags: editObj.tags || [] } : { name: '', type: 'positive', cost: 0, description: '', effect_modifiers: [], tags: [], is_global: true });
        break;
      case 'profession':
        setNewProfession(editObj ? { ...editObj, starter_skills: editObj.starter_skills || [] } : { name: '', description: '', starter_skills: [], is_global: true });
        break;
      case 'skill':
        setNewSkill(editObj ? { ...editObj, tags: editObj.tags || [], characteristic_id: editObj.characteristic_id || '' } : { name: '', characteristic_id: '', tags: [], is_global: true });
        break;
      case 'ammo': setNewAmmoType({ name: '' }); break;
      case 'currency': setNewCurrency({ name: '', icon: '💎' }); break;
      case 'preset': setNewPreset({ name: '', is_active: false, price_multiplier: 1.0, items: [] }); break;
      case 'playlist': setNewPlaylistName(''); break;
      case 'subcategory': setNewSubcategory({ slot: 'item', name: '' }); break;
      case 'characteristic': setNewChar({ name: '', short_name: '', description: '' }); break;
      case 'globalSound': setNewGlobalSound({ name: '', file_url: '', category: 'ambient', playlist_id: '' }); break;
      default: break;
    }
  };

  // ===== SAVE / DELETE =====

  // Items
  const handleSaveItem = async () => {
    const payload = { ...newItem };
    if (payload.slot === 'weapon') payload.subcategory = payload.weapon_type || 'melee';
    try {
      if (editId) {
        const updated = await api.updateAdminItem(editId, payload);
        setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
      } else {
        const created = await api.createAdminItem(payload);
        setItems(prev => [created, ...prev]);
      }
      setShowForm(false);
    } catch (e) { alert('Ошибка: ' + e.message); }
  };

  const handleDeleteItem = async (id) => {
    if (!await confirm('Удалить предмет?')) return;
    await api.deleteAdminItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Perks
  const handleSavePerk = async () => {
    try {
      if (editId) {
        const updated = await api.updateAdminPerk(editId, newPerk);
        setPerks(prev => prev.map(p => p.id === updated.id ? updated : p));
      } else {
        const created = await api.post('/admin/perks', { ...newPerk, is_global: true });
        setPerks(prev => [created, ...prev]);
      }
      setShowForm(false);
    } catch (e) { alert('Ошибка: ' + e.message); }
  };

  const handleDeletePerk = async (id) => {
    if (!await confirm('Удалить перк?')) return;
    await api.fetch('/admin/perks/' + id, { method: 'DELETE' });
    setPerks(prev => prev.filter(p => p.id !== id));
  };

  // Professions
  const handleSaveProfession = async () => {
    try {
      if (editId) {
        const updated = await api.updateAdminProfession(editId, newProfession);
        setProfessions(prev => prev.map(p => p.id === updated.id ? updated : p));
      } else {
        const created = await api.post('/admin/professions', { ...newProfession, is_global: true });
        setProfessions(prev => [created, ...prev]);
      }
      setShowForm(false);
    } catch (e) { alert('Ошибка: ' + e.message); }
  };

  const handleDeleteProfession = async (id) => {
    if (!await confirm('Удалить профессию?')) return;
    await api.fetch('/admin/professions/' + id, { method: 'DELETE' });
    setProfessions(prev => prev.filter(p => p.id !== id));
  };

  // Skills
  const handleSaveSkill = async () => {
    try {
      const payload = { ...newSkill, tags: newSkill.tags.join(',') };
      if (editId) {
        const updated = await api.updateAdminSkill(editId, payload);
        setSkills(prev => prev.map(s => s.id === updated.id ? updated : s));
      } else {
        const created = await api.post('/admin/skills', { ...payload, is_global: true });
        setSkills(prev => [created, ...prev]);
      }
      setShowForm(false);
    } catch (e) { alert('Ошибка: ' + e.message); }
  };

  const handleDeleteSkill = async (id) => {
    if (!await confirm('Удалить навык?')) return;
    await api.fetch('/admin/skills/' + id, { method: 'DELETE' });
    setSkills(prev => prev.filter(s => s.id !== id));
  };

  // Ammo types
  const handleCreateAmmoType = async () => {
    if (!newAmmoType.name.trim()) return;
    const created = await api.createAmmoType(newAmmoType.name);
    setAmmoTypes(prev => [...prev, created]);
    setShowForm(false);
  };
  const handleDeleteAmmoType = async (id) => {
    if (!await confirm('Удалить тип патронов?')) return;
    await api.deleteAmmoType(id);
    setAmmoTypes(prev => prev.filter(a => a.id !== id));
  };

  // Currencies
  const handleCreateCurrency = async () => {
    if (!newCurrency.name.trim()) return;
    try {
      const created = await api.createCurrency(newCurrency);
      setCurrencies(prev => [...prev, created]);
      setShowForm(false);
    } catch (e) { alert('Ошибка: ' + e.message); }
  };
  const handleDeleteCurrency = async (id) => {
    if (!await confirm('Удалить валюту?')) return;
    await api.deleteCurrency(id);
    setCurrencies(prev => prev.filter(c => c.id !== id));
  };

  // Shop presets
  const handleSavePreset = async () => {
    try {
      if (editId) {
        const updated = await api.updateShopPreset(editId, newPreset);
        setShopPresets(prev => prev.map(p => p.id === updated.id ? updated : p));
      } else {
        const created = await api.createShopPreset(newPreset);
        setShopPresets(prev => [...prev, created]);
      }
      setShowForm(false);
    } catch (e) { alert('Ошибка: ' + e.message); }
  };
  const handleDeletePreset = async (id) => {
    if (!await confirm('Удалить пресет?')) return;
    await api.deleteShopPreset(id);
    setShopPresets(prev => prev.filter(p => p.id !== id));
  };

  // Playlists
  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    const created = await api.createPlaylist(newPlaylistName.trim());
    setPlaylists(prev => [...prev, created]);
    setShowForm(false);
  };
  const handleDeletePlaylist = async (id) => {
    if (!await confirm('Удалить плейлист?')) return;
    await api.deletePlaylist(id);
    setPlaylists(prev => prev.filter(p => p.id !== id));
  };

  // Subcategories
  const handleCreateSubcategory = async () => {
    if (!newSubcategory.name.trim()) return;
    const created = await api.createSubcategory(newSubcategory.slot, newSubcategory.name);
    setSubcategories(prev => [...prev, created]);
    setNewSubcategory({ slot: 'item', name: '' });
  };
  const handleDeleteSubcategory = async (id) => {
    if (!await confirm('Удалить подкатегорию?')) return;
    await api.deleteSubcategory(id);
    setSubcategories(prev => prev.filter(s => s.id !== id));
  };

  // Characteristics
  const handleCreateChar = async () => {
    if (!newChar.name.trim()) return;
    const created = await api.createCharacteristic(newChar);
    setCharacteristics(prev => [...prev, created]);
    setNewChar({ name: '', short_name: '', description: '' });
    setShowForm(false);
  };
  const handleDeleteChar = async (id) => {
    if (!await confirm('Удалить характеристику?')) return;
    await api.deleteCharacteristic(id);
    setCharacteristics(prev => prev.filter(c => c.id !== id));
  };

  // Global sounds
  const handleUploadGlobalSound = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) { alert('Файл слишком большой.'); return; }
    setUploadingSound(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = await api.uploadSound(reader.result, newGlobalSound.name || file.name, null, true);
        setNewGlobalSound({ name: '', file_url: '', category: 'ambient', playlist_id: '' });
        load();
      } catch (err) { alert('Ошибка загрузки: ' + err.message); }
      finally { setUploadingSound(false); }
    };
    reader.readAsDataURL(file);
  };
  const handleDeleteGlobalSound = async (id) => {
    if (!await confirm('Удалить звук?')) return;
    await api.deleteAdminSound(id);
    setGlobalSounds(prev => prev.filter(s => s.id !== id));
  };

  // Users
  const handleToggleUserRole = async (user) => {
    const newRole = user.role === 'admin' ? 'player' : 'admin';
    const updated = await api.updateAdminUser(user.id, newRole);
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  };
  const handleDeleteUser = async (id) => {
    if (!await confirm('Удалить пользователя?')) return;
    await api.deleteAdminUser(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // Campaigns
  const handleDeleteCampaign = async (campaign) => {
    if (!await confirm(`Удалить кампанию "${campaign.title}"?`)) return;
    await api.deleteAdminCampaign(campaign.id);
    setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
  };

  // Backgrounds
  const handleDeleteBackground = async (id) => {
    if (!await confirm('Удалить фон?')) return;
    await api.deleteAdminBackground(id);
    setGlobalBackgrounds(prev => prev.filter(b => b.id !== id));
  };

  // Batch operations
  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const handleBatchDelete = async () => {
    if (!selectedIds.length) return;
    if (!await confirm(`Удалить ${selectedIds.length} предметов?`)) return;
    await api.post('/admin/items/batch-delete', { ids: selectedIds });
    setItems(prev => prev.filter(i => !selectedIds.includes(i.id)));
    setSelectedIds([]);
  };
  const handleBatchPrice = async () => {
    if (!selectedIds.length) return;
    await api.put('/admin/items/batch-price', { ids: selectedIds, trade_price: batchPrice });
    setItems(prev => prev.map(i => selectedIds.includes(i.id) ? { ...i, trade_price: batchPrice } : i));
    setSelectedIds([]);
  };

  // Filtering
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
    { key: 'characteristics', label: 'Хар-ки' },
    { key: 'ammo', label: 'Патроны' },
    { key: 'currencies', label: 'Валюты' },
    { key: 'shop', label: 'Магазин' },
    { key: 'playlists', label: 'Плейлисты' },
    { key: 'subcategories', label: 'Подкатегории' },
    { key: 'sounds', label: 'Звуки' },
    { key: 'campaigns', label: 'Кампании' },
    { key: 'users', label: 'Пользователи' },
    { key: 'backgrounds', label: 'Фоны' },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-stylized text-accent-orange mb-4">Админ-панель</h2>
      <div className="flex gap-1 overflow-x-auto flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setShowForm(false); }}
            className={`text-xs px-3 py-1.5 rounded ${tab === t.key ? 'bg-accent-orange text-wasteland-900' : 'bg-wasteland-700 text-wasteland-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== ITEMS ===== */}
      {tab === 'items' && (
        <div>
          <div className="flex gap-2 mb-3 flex-wrap items-end">
            <button onClick={() => openForm('item')} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded">
              {showForm && formType === 'item' ? 'Отмена' : '+ Предмет'}
            </button>
            <button onClick={handleBatchDelete} disabled={!selectedIds.length} className="text-xs bg-accent-red text-wasteland-900 px-3 py-1.5 rounded disabled:opacity-50">Удалить выбранные ({selectedIds.length})</button>
            <input type="number" value={batchPrice} onChange={e => setBatchPrice(parseInt(e.target.value)||0)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs w-20" placeholder="Цена" />
            <button onClick={handleBatchPrice} disabled={!selectedIds.length} className="text-xs bg-accent-green text-wasteland-900 px-3 py-1.5 rounded disabled:opacity-50">Установить цену</button>
          </div>

          {/* Filters */}
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
                  <option key={typeof sc === 'string' ? sc : sc.id} value={typeof sc === 'string' ? sc : sc.name}>{typeof sc === 'string' ? sc : sc.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Item form */}
          {showForm && formType === 'item' && (
            <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
              <h3 className="text-wasteland-300 text-sm font-bold">{editId ? 'Редактировать предмет' : 'Новый предмет'}</h3>
              
              <div className="flex gap-2">
                <input placeholder="Название" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
                <select value={newItem.icon} onChange={e => setNewItem({...newItem, icon: e.target.value})} className="w-16 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm text-center">
                  <option value="">—</option>
                  {ITEM_ICONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                </select>
              </div>

              <div className="flex gap-2">
                <select value={newItem.slot} onChange={e => setNewItem({...newItem, slot: e.target.value, subcategory: '', weapon_type: '', mod_target: '', weapon_mod_subtype: '', ammo_type_id: '' })} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                  <option value="weapon">Оружие</option><option value="armor">Броня</option><option value="exo">Экзоскелет</option>
                  <option value="mod">Модификация</option><option value="ammo">Патроны</option><option value="consumable">Расходник</option>
                  <option value="item">Предмет</option><option value="currency">Валюта</option>
                </select>
                {newItem.slot !== 'weapon' && newItem.slot !== 'ammo' && newItem.slot !== 'currency' && newItem.slot !== 'exo' && getAvailableSubcategories(newItem.slot).length > 0 && (
                  <select value={newItem.subcategory} onChange={e => setNewItem({...newItem, subcategory: e.target.value})} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                    <option value="">Подкатегория</option>
                    {getAvailableSubcategories(newItem.slot).map(sc => <option key={sc.id} value={sc.name}>{sc.name}</option>)}
                  </select>
                )}
                {newItem.slot === 'weapon' && (
                  <select value={newItem.weapon_type || ''} onChange={e => setNewItem({...newItem, weapon_type: e.target.value})} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                    <option value="">Тип оружия</option>
                    <option value="melee">Ближний бой</option><option value="ranged">Дальний бой</option><option value="thrown">Метательное</option>
                  </select>
                )}
              </div>

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
                    <option value="">На что устанавливается</option><option value="weapon">Оружие</option><option value="armor">Броня</option><option value="exo">Экзоскелет</option><option value="any">Любой предмет</option>
                  </select>
                  {newItem.mod_target === 'weapon' && (
                    <select value={newItem.weapon_mod_subtype || ''} onChange={e => setNewItem({...newItem, weapon_mod_subtype: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                      <option value="">Подтип оружия</option><option value="melee">Ближний бой</option><option value="ranged">Дальний бой</option><option value="thrown">Метательное</option><option value="any">Любое</option>
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
                <div className="flex-1"><label className="text-wasteland-400 text-xs">Вес (кг)</label><input type="number" value={newItem.weight} onChange={e => setNewItem({...newItem, weight: parseFloat(e.target.value)||0})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" /></div>
                <div className="flex-1"><label className="text-wasteland-400 text-xs">Базовая цена</label><input type="number" value={newItem.trade_price} onChange={e => setNewItem({...newItem, trade_price: parseInt(e.target.value)||0})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" /></div>
              </div>
              <textarea placeholder="Описание" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" rows={2} />

              <label className="flex items-center gap-2 text-xs text-wasteland-300"><input type="checkbox" checked={newItem.is_container} onChange={e => setNewItem({...newItem, is_container: e.target.checked})} />Это контейнер</label>
              {newItem.is_container && (
                <>
                  <div><label className="text-wasteland-400 text-xs">Слотов: {newItem.container_slots}</label><input type="range" min="1" max="10" value={newItem.container_slots} onChange={e => setNewItem({...newItem, container_slots: parseInt(e.target.value)})} className="w-full" /></div>
                  <label className="text-wasteland-400 text-xs block">Содержимое:</label>
                  <ItemListEditor items={newItem.container_items} allItems={items} onChange={(val) => setNewItem({...newItem, container_items: val})} />
                </>
              )}

              <button onClick={handleSaveItem} disabled={!newItem.name} className="w-full bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">
                {editId ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          )}

          {/* Item list */}
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {filteredItems.map(item => (
              <div key={item.id} className={`bg-wasteland-800 p-2 rounded border text-xs flex gap-2 ${selectedIds.includes(item.id) ? 'border-accent-orange' : 'border-wasteland-600'}`}>
                <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                <div className="flex-1 flex justify-between items-center">
                  <span className="text-wasteland-200">
                    {item.icon && <span className="mr-1">{item.icon}</span>}
                    {item.name}
                    <span className="text-wasteland-500"> ({item.slot}{item.subcategory ? '/'+item.subcategory : ''})</span>
                    <span className="text-accent-yellow text-xs ml-1">{item.trade_price}💎</span>
                    {item.is_container && <span className="text-accent-green text-xs ml-1">📦</span>}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => openForm('item', item)} className="text-wasteland-400 hover:text-wasteland-200">✏️</button>
                    <button onClick={() => handleDeleteItem(item.id)} className="text-accent-red hover:text-red-400">🗑️</button>
                  </div>
                </div>
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
              <h3 className="text-wasteland-300 text-sm font-bold">{editId ? 'Редактировать перк' : 'Новый перк'}</h3>
              <input placeholder="Название" value={newPerk.name} onChange={e => setNewPerk({...newPerk, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <select value={newPerk.type} onChange={e => setNewPerk({...newPerk, type: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                <option value="positive">Позитивный</option><option value="negative">Негативный</option><option value="neutral">Нейтральный</option>
              </select>
              <input type="number" placeholder="Стоимость" value={newPerk.cost} onChange={e => setNewPerk({...newPerk, cost: parseInt(e.target.value)||0})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <textarea placeholder="Описание (включая эффект)" value={newPerk.description} onChange={e => setNewPerk({...newPerk, description: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" rows={3} />
              <SkillListEditor skills={newPerk.effect_modifiers} allSkills={skills} onChange={(val) => setNewPerk({...newPerk, effect_modifiers: val})} showSkillSelect={true} showModifier={true} />
              <button onClick={handleSavePerk} disabled={!newPerk.name} className="w-full bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">{editId ? 'Сохранить' : 'Создать'}</button>
            </div>
          )}
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {perks.map(perk => (
              <div key={perk.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
                <span className="text-wasteland-200 font-bold">{perk.name} <span className="text-wasteland-500">({perk.type} {perk.cost})</span></span>
                <div className="flex gap-1">
                  <button onClick={() => openForm('perk', perk)} className="text-wasteland-400 hover:text-wasteland-200">✏️</button>
                  <button onClick={() => handleDeletePerk(perk.id)} className="text-accent-red hover:text-red-400">🗑️</button>
                </div>
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
              <h3 className="text-wasteland-300 text-sm font-bold">{editId ? 'Редактировать профессию' : 'Новая профессия'}</h3>
              <input placeholder="Название" value={newProfession.name} onChange={e => setNewProfession({...newProfession, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <textarea placeholder="Описание" value={newProfession.description} onChange={e => setNewProfession({...newProfession, description: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" rows={2} />
              <SkillListEditor skills={newProfession.starter_skills} allSkills={skills} onChange={(val) => setNewProfession({...newProfession, starter_skills: val})} showSkillSelect={true} showModifier={true} />
              <button onClick={handleSaveProfession} disabled={!newProfession.name} className="w-full bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">{editId ? 'Сохранить' : 'Создать'}</button>
            </div>
          )}
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {professions.map(prof => (
              <div key={prof.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
                <span className="text-wasteland-200 font-bold">{prof.name}</span>
                <div className="flex gap-1">
                  <button onClick={() => openForm('profession', prof)} className="text-wasteland-400 hover:text-wasteland-200">✏️</button>
                  <button onClick={() => handleDeleteProfession(prof.id)} className="text-accent-red hover:text-red-400">🗑️</button>
                </div>
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
              <h3 className="text-wasteland-300 text-sm font-bold">{editId ? 'Редактировать навык' : 'Новый навык'}</h3>
              <input placeholder="Название" value={newSkill.name} onChange={e => setNewSkill({...newSkill, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <select value={newSkill.characteristic_id} onChange={e => setNewSkill({...newSkill, characteristic_id: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                <option value="">Характеристика</option>
                {characteristics.map(ch => <option key={ch.id} value={ch.id}>{ch.short_name} — {ch.name}</option>)}
              </select>
              <div>
                <label className="text-wasteland-400 text-xs mb-1 block">Теги</label>
                <div className="flex flex-wrap gap-2">
                  {STANDARD_TAGS.map(tag => (
                    <label key={tag} className="flex items-center gap-1 text-xs text-wasteland-300">
                      <input type="checkbox" checked={newSkill.tags.includes(tag)} onChange={(e) => {
                        if (e.target.checked) setNewSkill({...newSkill, tags: [...newSkill.tags, tag]});
                        else setNewSkill({...newSkill, tags: newSkill.tags.filter(t => t !== tag)});
                      }} />
                      {tag}
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={handleSaveSkill} disabled={!newSkill.name} className="w-full bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">{editId ? 'Сохранить' : 'Создать'}</button>
            </div>
          )}
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {skills.map(skill => (
              <div key={skill.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
                <span className="text-wasteland-200 font-bold">{skill.name}</span>
                <div className="flex gap-1">
                  <button onClick={() => openForm('skill', skill)} className="text-wasteland-400 hover:text-wasteland-200">✏️</button>
                  <button onClick={() => handleDeleteSkill(skill.id)} className="text-accent-red hover:text-red-400">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== CHARACTERISTICS ===== */}
      {tab === 'characteristics' && (
        <div>
          <button onClick={() => openForm('characteristic')} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded mb-3">
            {showForm && formType==='characteristic' ? 'Отмена' : '+ Характеристика'}
          </button>
          {showForm && formType === 'characteristic' && (
            <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
              <h3 className="text-wasteland-300 text-sm font-bold">Новая характеристика</h3>
              <input placeholder="Название" value={newChar.name} onChange={e => setNewChar({...newChar, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <input placeholder="Кратко (СИЛ, ЛВК...)" value={newChar.short_name} onChange={e => setNewChar({...newChar, short_name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <input placeholder="Описание" value={newChar.description} onChange={e => setNewChar({...newChar, description: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <button onClick={handleCreateChar} disabled={!newChar.name} className="w-full bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">Создать</button>
            </div>
          )}
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {characteristics.map(ch => (
              <div key={ch.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
                <span className="text-wasteland-200">{ch.short_name} — {ch.name}</span>
                <button onClick={() => handleDeleteChar(ch.id)} className="text-accent-red hover:text-red-400">🗑️</button>
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
            {ammoTypes.map(at => (
              <div key={at.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
                <span className="text-wasteland-200">{at.name}</span>
                <button onClick={() => handleDeleteAmmoType(at.id)} className="text-accent-red hover:text-red-400">🗑️</button>
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
              <label className="text-wasteland-400 text-xs">Название</label>
              <input placeholder="Например: РК Кристаллы" value={newCurrency.name} onChange={e => setNewCurrency({...newCurrency, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <label className="text-wasteland-400 text-xs">Иконка (эмодзи)</label>
              <input placeholder="💎" value={newCurrency.icon} onChange={e => setNewCurrency({...newCurrency, icon: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <button onClick={handleCreateCurrency} disabled={!newCurrency.name} className="w-full bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">Создать</button>
            </div>
          )}
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {currencies.map(cur => (
              <div key={cur.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
                <span className="text-wasteland-200">{cur.icon} {cur.name}</span>
                <button onClick={() => handleDeleteCurrency(cur.id)} className="text-accent-red hover:text-red-400">🗑️</button>
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
              <h3 className="text-wasteland-300 text-sm font-bold">{editId ? 'Редактировать пресет' : 'Новый пресет'}</h3>
              <input placeholder="Название" value={newPreset.name} onChange={e => setNewPreset({...newPreset, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <label className="flex items-center gap-2 text-xs text-wasteland-300"><input type="checkbox" checked={newPreset.is_active} onChange={e => setNewPreset({...newPreset, is_active: e.target.checked})} />Активен</label>
              <label className="text-wasteland-400 text-xs">Множитель цены <span className="text-wasteland-500">(1.0 = обычная, 0.5 = скидка 50%, 2.0 = наценка 100%)</span></label>
              <input type="number" step="0.1" value={newPreset.price_multiplier} onChange={e => setNewPreset({...newPreset, price_multiplier: parseFloat(e.target.value)||1.0})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <ItemListEditor items={newPreset.items} allItems={items} onChange={(val) => setNewPreset({...newPreset, items: val})} showPrice={true} />
              <button onClick={handleSavePreset} disabled={!newPreset.name} className="w-full bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">{editId ? 'Сохранить' : 'Создать'}</button>
            </div>
          )}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {shopPresets.map(p => (
              <div key={p.id} className="bg-wasteland-800 p-3 rounded border border-wasteland-600 text-xs flex justify-between items-center">
                <div>
                  <span className="text-wasteland-200 font-bold">{p.name}</span>
                  <span className={`ml-2 text-xs ${p.is_active ? 'text-accent-green' : 'text-wasteland-500'}`}>{p.is_active ? 'Активен' : 'Скрыт'}</span>
                  <span className="text-wasteland-500 ml-2">×{p.price_multiplier}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openForm('preset', p)} className="text-wasteland-400 hover:text-wasteland-200">✏️</button>
                  <button onClick={() => handleDeletePreset(p.id)} className="text-accent-red hover:text-red-400">🗑️</button>
                </div>
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
                <button onClick={() => handleDeletePlaylist(pl.id)} className="text-accent-red hover:text-red-400">🗑️</button>
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
                <button onClick={() => handleDeleteSubcategory(sc.id)} className="text-accent-red hover:text-red-400">🗑️</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== SOUNDS (GLOBAL) ===== */}
      {tab === 'sounds' && (
        <div>
          <button onClick={() => openForm('globalSound')} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded mb-3">
            {showForm && formType==='globalSound' ? 'Отмена' : '+ Загрузить звук'}
          </button>
          {showForm && formType === 'globalSound' && (
            <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
              <h3 className="text-wasteland-300 text-sm font-bold">Загрузить глобальный звук</h3>
              <input placeholder="Название" value={newGlobalSound.name} onChange={e => setNewGlobalSound({...newGlobalSound, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <label className={`inline-block bg-wasteland-700 hover:bg-wasteland-600 text-wasteland-300 text-xs font-bold px-4 py-2 rounded cursor-pointer text-center ${uploadingSound ? 'opacity-50' : ''}`}>
                {uploadingSound ? '⏳ Загрузка...' : '📁 Выбрать аудиофайл'}
                <input type="file" accept="audio/*" className="hidden" onChange={handleUploadGlobalSound} disabled={uploadingSound} />
              </label>
              <select value={newGlobalSound.category} onChange={e => setNewGlobalSound({...newGlobalSound, category: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                <option value="ambient">Эмбиент</option><option value="combat">Бой</option><option value="music">Музыка</option><option value="sfx">Эффекты</option><option value="общее">Общее</option>
              </select>
              <select value={newGlobalSound.playlist_id} onChange={e => setNewGlobalSound({...newGlobalSound, playlist_id: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
                <option value="">Без плейлиста</option>
                {playlists.map(pl => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
              </select>
            </div>
          )}
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {globalSounds.map(s => (
              <div key={s.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
                <span className="text-wasteland-200">{s.name}</span>
                <button onClick={() => handleDeleteGlobalSound(s.id)} className="text-accent-red hover:text-red-400">🗑️</button>
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
              <button onClick={() => handleDeleteCampaign(c)} className="text-accent-red hover:text-red-400 text-xs">🗑️</button>
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
                <button onClick={() => handleToggleUserRole(u)} className="text-wasteland-400 hover:text-wasteland-200 text-xs">{u.role === 'admin' ? '→ player' : '→ admin'}</button>
                <button onClick={() => handleDeleteUser(u.id)} className="text-accent-red hover:text-red-400 text-xs">🗑️</button>
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
              <button onClick={() => handleDeleteBackground(bg.id)} className="text-accent-red hover:text-red-400">🗑️</button>
            </div>
          ))}
        </div>
      )}

      {ConfirmModal}
      {PromptModal}
    </div>
  );
}
