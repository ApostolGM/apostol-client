import { useState, useEffect } from 'react';
import { api } from '../api';

export default function AdminPanel() {
  const [tab, setTab] = useState('items');
  const [items, setItems] = useState([]);
  const [perks, setPerks] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editValues, setEditValues] = useState({});

  const load = async () => {
    setLoading(true);
    const [i, p, prof, s] = await Promise.all([
      api.getAdminItems(),
      api.getAdminPerks(),
      api.getAdminProfessions(),
      api.getAdminSkills(),
    ]);
    setItems(i); setPerks(p); setProfessions(prof); setSkills(s);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleEdit = (item) => {
    setEditing(item.id);
    setEditValues({ ...item });
  };

  const handleSave = async (type) => {
    if (type === 'items') {
      await api.updateAdminItem(editing, editValues);
    } else if (type === 'perks') {
      await api.updateAdminPerk(editing, editValues);
    } else if (type === 'professions') {
      await api.updateAdminProfession(editing, editValues);
    } else if (type === 'skills') {
      await api.updateAdminSkill(editing, editValues);
    }
    setEditing(null);
    load();
  };

  const handleDelete = async (type, id) => {
    if (!confirm('Удалить?')) return;
    if (type === 'items') await api.deleteAdminItem(id);
    load();
  };

  if (loading) return <p className="text-wasteland-400 text-center py-4">Загрузка...</p>;

  const data = tab === 'items' ? items : tab === 'perks' ? perks : tab === 'professions' ? professions : skills;

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-stylized text-accent-orange mb-4">Админ-панель (БД)</h2>

      <div className="flex gap-1 overflow-x-auto">
        {['items', 'perks', 'professions', 'skills'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`text-xs px-3 py-1.5 rounded ${tab === t ? 'bg-accent-orange text-wasteland-900' : 'bg-wasteland-700 text-wasteland-300'}`}>
            {t === 'items' ? 'Предметы' : t === 'perks' ? 'Перки' : t === 'professions' ? 'Профессии' : 'Навыки'}
          </button>
        ))}
      </div>

      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
        {data.map(item => (
          <div key={item.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs">
            {editing === item.id ? (
              <div className="space-y-1">
                {Object.keys(editValues).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at').map(key => (
                  <div key={key} className="flex gap-2 items-center">
                    <span className="text-wasteland-400 w-24 text-right flex-shrink-0">{key}:</span>
                    {key === 'description' || key === 'effect_text' || key === 'special_properties' ? (
                      <textarea value={editValues[key] || ''} onChange={e => setEditValues({ ...editValues, [key]: e.target.value })} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100" rows={2} />
                    ) : key === 'is_weapon' || key === 'is_heavy' || key === 'is_armor' || key === 'is_global' || key === 'is_template' || key === 'is_pinned' || key === 'is_visible' ? (
                      <input type="checkbox" checked={!!editValues[key]} onChange={e => setEditValues({ ...editValues, [key]: e.target.checked })} />
                    ) : (
                      <input value={editValues[key] || ''} onChange={e => setEditValues({ ...editValues, [key]: e.target.value })} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100" />
                    )}
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => handleSave(tab)} className="bg-accent-green text-wasteland-900 px-2 py-1 rounded text-xs font-bold">Сохранить</button>
                  <button onClick={() => setEditing(null)} className="bg-wasteland-600 text-wasteland-300 px-2 py-1 rounded text-xs">Отмена</button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-wasteland-200 font-bold">{item.name}</span>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(item)} className="text-wasteland-400 hover:text-wasteland-200">✏️</button>
                  {tab === 'items' && (
                    <button onClick={() => handleDelete('items', item.id)} className="text-accent-red hover:text-red-400">🗑️</button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
