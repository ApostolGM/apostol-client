// src/components/AdminPanel.jsx
import { useState, useEffect } from 'react';
import { api } from '../api';

const SUBCATEGORIES = {
  weapon: ['melee', 'ranged', 'thrown'],
  armor: ['light', 'heavy'],
  consumable: ['food', 'water', 'meds', 'other'],
  item: ['tool', 'container', 'other'],
  mod: ['weapon-mod', 'armor-mod', 'exo-mod', 'universal'],
};

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
  const [playlists, setPlaylists] = useState([]); // новое
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
  const [newItem, setNewItem] = useState({ name: '', slot: 'item', subcategory: '', weight: 0, condition_percent: 100, description: '', trade_price: 0, is_global: true, is_container: false, container_slots: 0, container_items: '[]' });
  const [newPerk, setNewPerk] = useState({ name: '', type: 'positive', cost: 0, description: '', effect_text: '', effect_modifiers: '[]', tags: '', is_global: true });
  const [newProfession, setNewProfession] = useState({ name: '', description: '', starter_skills: '[]', is_global: true });
  const [newSkill, setNewSkill] = useState({ name: '', characteristic: '', tags: '', is_global: true });
  const [newAmmoType, setNewAmmoType] = useState({ name: '' });
  const [newCurrency, setNewCurrency] = useState({ name: '', icon: '💎', item_id: '' });
  const [newPreset, setNewPreset] = useState({ name: '', is_active: false, price_multiplier: 1.0, items: '[]' });
  const [editingPreset, setEditingPreset] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState(''); // новое

  const load = async () => {
    setLoading(true);
    const [i, p, prof, s, at, cur, usr, sp, bg, sd, camp, pl] = await Promise.all([
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
      api.getPlaylists().catch(() => []), // новое
    ]);
    setItems(i); setPerks(p); setProfessions(prof); setSkills(s);
    setAmmoTypes(at); setCurrencies(cur); setUsers(usr); setShopPresets(sp);
    setGlobalBackgrounds(bg); setGlobalSounds(sd);
    setCampaigns(camp); setPlaylists(pl); // новое
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ... все остальные функции (handleEdit, handleSave, handleDelete, handleCreateItem, handleCreatePerk и т.д.) без изменений ...

  const handleCreatePlaylist = async () => { // новая функция
    if (!newPlaylistName.trim()) return;
    await api.createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setShowForm(false);
    load();
  };

  const openForm = (type) => { setFormType(type); setShowForm(true); };

  const tabs = [
    { key: 'items', label: 'Предметы' },
    { key: 'perks', label: 'Перки' },
    { key: 'professions', label: 'Профессии' },
    { key: 'skills', label: 'Навыки' },
    { key: 'ammo', label: 'Патроны' },
    { key: 'currencies', label: 'Валюты' },
    { key: 'shop', label: 'Магазин' },
    { key: 'playlists', label: 'Плейлисты' }, // новое
    { key: 'campaigns', label: 'Кампании' },
    { key: 'users', label: 'Пользователи' },
    { key: 'backgrounds', label: 'Фоны' },
    { key: 'sounds', label: 'Звуки' },
  ];

  if (loading) return <p className="text-wasteland-400 text-center py-4">Загрузка...</p>;

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

      {/* ... все остальные вкладки (items, perks, professions, skills, ammo, currencies, shop, campaigns, users, backgrounds, sounds) без изменений ... */}

      {/* ===== PLAYLISTS ===== */}
      {tab === 'playlists' && (
        <div>
          <button onClick={() => openForm('playlist')} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded mb-3">
            {showForm && formType === 'playlist' ? 'Отмена' : '+ Плейлист'}
          </button>
          {showForm && formType === 'playlist' && (
            <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
              <h3 className="text-wasteland-300 text-sm font-bold">Новый плейлист</h3>
              <input placeholder="Название" value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
              <button onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim()} className="w-full bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">Создать</button>
            </div>
          )}
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {playlists.map(pl => (
              <div key={pl.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
                <span className="text-wasteland-200">{pl.name}</span>
                <button onClick={() => { if (confirm('Удалить плейлист?')) api.deletePlaylist(pl.id).then(load); }} className="text-accent-red hover:text-red-400">🗑️</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
