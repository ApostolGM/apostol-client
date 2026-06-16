// components/panels/admin/AdminProfessionsTab.jsx
import { useState } from 'react';
import { admin } from '../../../api/admin.js';
import { request } from '../../../api/index.js';
import SkillListEditor from '../../editors/SkillListEditor.jsx';
import useConfirm from '../../../hooks/useConfirm.jsx';

export default function AdminProfessionsTab({ professions, skills, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', starter_skills: [], is_global: true });
  const { confirm, ConfirmModal } = useConfirm();

  const openCreate = () => { setEditId(null); setForm({ name: '', description: '', starter_skills: [], is_global: true }); setShowForm(true); };
  const openEdit = (prof) => { setEditId(prof.id); setForm({ ...prof, starter_skills: prof.starter_skills || [] }); setShowForm(true); };

  const handleSave = async () => {
    if (editId) await admin.updateProfession(editId, form);
    else await request('/admin/professions', { method: 'POST', body: JSON.stringify({ ...form, is_global: true }) });
    setShowForm(false);
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!await confirm('Удалить профессию?')) return;
    await request(`/admin/professions/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  return (
    <div>
      <button onClick={openCreate} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded mb-3">
        {showForm ? 'Отмена' : '+ Профессия'}
      </button>

      {showForm && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
          <h3 className="text-wasteland-300 text-sm font-bold">{editId ? 'Редактировать' : 'Новая профессия'}</h3>
          <input placeholder="Название" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
          <textarea placeholder="Описание" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" rows={2} />
          <SkillListEditor skills={form.starter_skills} allSkills={skills} onChange={(val) => setForm({...form, starter_skills: val})} showSkillSelect={true} showModifier={true} />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={!form.name} className="flex-1 bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">{editId ? 'Сохранить' : 'Создать'}</button>
            <button onClick={() => setShowForm(false)} className="flex-1 bg-wasteland-600 text-wasteland-300 py-2 rounded text-sm">Отмена</button>
          </div>
        </div>
      )}

      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
        {professions.map(prof => (
          <div key={prof.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
            <span className="text-wasteland-200 font-bold">{prof.name}</span>
            <div className="flex gap-1">
              <button onClick={() => openEdit(prof)} className="text-wasteland-400 hover:text-wasteland-200">✏️</button>
              <button onClick={() => handleDelete(prof.id)} className="text-accent-red hover:text-red-400">🗑️</button>
            </div>
          </div>
        ))}
      </div>
      {ConfirmModal}
    </div>
  );
}
