// components/panels/AdminPanel.jsx — контейнер
import { useState, useEffect } from 'react';
import { admin } from '../../api/admin.js';
import { ammo } from '../../api/ammo.js';
import { currencies } from '../../api/currencies.js';
import { characteristics } from '../../api/characteristics.js';
import { shop } from '../../api/shop.js';
import { playlists } from '../../api/playlists.js';
import { subcategories } from '../../api/subcategories.js';
import AdminItemsTab from './admin/AdminItemsTab.jsx';
import AdminPerksTab from './admin/AdminPerksTab.jsx';
import AdminProfessionsTab from './admin/AdminProfessionsTab.jsx';
import AdminSkillsTab from './admin/AdminSkillsTab.jsx';
import AdminCharacteristicsTab from './admin/AdminCharacteristicsTab.jsx';
import AdminAmmoTab from './admin/AdminAmmoTab.jsx';
import AdminCurrenciesTab from './admin/AdminCurrenciesTab.jsx';
import AdminShopTab from './admin/AdminShopTab.jsx';
import AdminPlaylistsTab from './admin/AdminPlaylistsTab.jsx';
import AdminSubcategoriesTab from './admin/AdminSubcategoriesTab.jsx';
import AdminSoundsTab from './admin/AdminSoundsTab.jsx';
import AdminCampaignsTab from './admin/AdminCampaignsTab.jsx';
import AdminUsersTab from './admin/AdminUsersTab.jsx';
import AdminBackgroundsTab from './admin/AdminBackgroundsTab.jsx';

export default function AdminPanel() {
  const [tab, setTab] = useState('items');
  const [items, setItems] = useState([]);
  const [perks, setPerks] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [ammoTypes, setAmmoTypes] = useState([]);
  const [currenciesList, setCurrenciesList] = useState([]);
  const [users, setUsers] = useState([]);
  const [shopPresets, setShopPresets] = useState([]);
  const [globalBackgrounds, setGlobalBackgrounds] = useState([]);
  const [globalSounds, setGlobalSounds] = useState([]);
  const [campaignsList, setCampaignsList] = useState([]);
  const [playlistsList, setPlaylistsList] = useState([]);
  const [subcategoriesList, setSubcategoriesList] = useState([]);
  const [characteristicsList, setCharacteristicsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    const [i, p, prof, s, at, cur, usr, sp, bg, sd, camp, pl, sub, chars] = await Promise.all([
      admin.getItems(), admin.getPerks(), admin.getProfessions(), admin.getSkills(),
      ammo.getAll(), currencies.getAll(), admin.getUsers(), shop.getPresets(),
      admin.getBackgrounds(), admin.getSounds(), admin.getCampaigns().catch(() => []),
      playlists.getAll().catch(() => []), subcategories.getAll().catch(() => []),
      characteristics.getAll().catch(() => [])
    ]);
    setItems(i); setPerks(p); setProfessions(prof); setSkills(s);
    setAmmoTypes(at); setCurrenciesList(cur); setUsers(usr); setShopPresets(sp);
    setGlobalBackgrounds(bg); setGlobalSounds(sd);
    setCampaignsList(camp); setPlaylistsList(pl); setSubcategoriesList(sub);
    setCharacteristicsList(chars);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const refreshItems = async () => {
    const i = await admin.getItems();
    setItems(i);
  };

  const refreshPerks = async () => {
    const p = await admin.getPerks();
    setPerks(p);
  };

  const refreshProfessions = async () => {
    const p = await admin.getProfessions();
    setProfessions(p);
  };

  const refreshSkills = async () => {
    const s = await admin.getSkills();
    setSkills(s);
  };

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

  if (loading) return <p className="text-wasteland-400 text-center py-4">Загрузка...</p>;

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-stylized text-accent-orange mb-4">Админ-панель</h2>
      <div className="flex gap-1 overflow-x-auto flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-xs px-3 py-1.5 rounded ${tab === t.key ? 'bg-accent-orange text-wasteland-900' : 'bg-wasteland-700 text-wasteland-300'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'items' && <AdminItemsTab items={items} ammoTypes={ammoTypes} subcategories={subcategoriesList} onRefresh={refreshItems} />}
      {tab === 'perks' && <AdminPerksTab perks={perks} skills={skills} onRefresh={refreshPerks} />}
      {tab === 'professions' && <AdminProfessionsTab professions={professions} skills={skills} onRefresh={refreshProfessions} />}
      {tab === 'skills' && <AdminSkillsTab skills={skills} characteristics={characteristicsList} onRefresh={refreshSkills} />}
      {tab === 'characteristics' && <AdminCharacteristicsTab characteristics={characteristicsList} onRefresh={loadAll} />}
      {tab === 'ammo' && <AdminAmmoTab ammoTypes={ammoTypes} onRefresh={loadAll} />}
      {tab === 'currencies' && <AdminCurrenciesTab currencies={currenciesList} onRefresh={loadAll} />}
      {tab === 'shop' && <AdminShopTab presets={shopPresets} items={items} onRefresh={loadAll} />}
      {tab === 'playlists' && <AdminPlaylistsTab playlists={playlistsList} onRefresh={loadAll} />}
      {tab === 'subcategories' && <AdminSubcategoriesTab subcategories={subcategoriesList} onRefresh={loadAll} />}
      {tab === 'sounds' && <AdminSoundsTab sounds={globalSounds} playlists={playlistsList} onRefresh={loadAll} />}
      {tab === 'campaigns' && <AdminCampaignsTab campaigns={campaignsList} onRefresh={loadAll} />}
      {tab === 'users' && <AdminUsersTab users={users} currentUserId={null} onRefresh={loadAll} />}
      {tab === 'backgrounds' && <AdminBackgroundsTab backgrounds={globalBackgrounds} onRefresh={loadAll} />}
    </div>
  );
}
