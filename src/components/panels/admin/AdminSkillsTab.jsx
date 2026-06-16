// components/panels/admin/AdminSkillsTab.jsx
import { useState } from 'react';
import { admin } from '../../../api/admin.js';
import { request } from '../../../api/index.js';
import useConfirm from '../../../hooks/useConfirm.jsx';

export default function AdminSkillsTab({ skills, characteristics, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', characteristic_id: '', is_global: true });
  const { confirm, ConfirmModal } = useConfirm();

  const openCreate = () => { setEditId(null); setForm({ name: '', characteristic_id: '', is_global: true }); setShowForm(true); };
  const openEdit = (skill) => { setEditId(skill.id); setForm({ name: skill.name, characteristic_id: skill.characteristic_id || '' }); setShowForm(true); };

  const handleSave = async () => {
    if (editId) await admin.updateSkill(editId, form);
    else await request('/admin/skills', { method: 'POST', body: JSON.stringify({ ...form, is_global: true }) });
    setShowForm(false);
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!await confirm('Удалить навык?')) return;
    await request(`/admin/skills/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  return (
    <div>
      <button onClick={openCreate} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded mb-3">
        {showForm ? 'Отмена' : '+ Навык'}
      </button>

      {showForm && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
          <h3 className="text-wasteland-300 text-sm font-bold">{editId ? 'Редактировать' : 'Новый навык'}</h3>
          <input placeholder="Название" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
          <select value={form.characteristic_id} onChange={e => setForm({...form, characteristic_id: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
            <option value="">Характеристика</option>
            {characteristics.map(ch => <option key={ch.id} value={ch.id}>{ch.short_name} — {ch.name}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={!form.name} className="flex-1 bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">{editId ? 'Сохранить' : 'Создать'}</button>
            <button onClick={() => setShowForm(false)} className="flex-1 bg-wasteland-600 text-wasteland-300 py-2 rounded text-sm">Отмена</button>
          </div>
        </div>
      )}

      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
        {skills.map(skill => (
          <div key={skill.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
            <span className="text-wasteland-200 font-bold">{skill.name}</span>
            <div className="flex gap-1">
              <button onClick={() => openEdit(skill)} className="text-wasteland-400 hover:text-wasteland-200">✏️</button>
              <button onClick={() => handleDelete(skill.id)} className="text-accent-red hover:text-red-400">🗑️</button>
            </div>
          </div>
        ))}
      </div>
      {ConfirmModal}
    </div>
  );
}
