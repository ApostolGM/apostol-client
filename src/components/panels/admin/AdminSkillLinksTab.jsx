// components/panels/admin/AdminSkillLinksTab.jsx
import { useState } from 'react';
import { admin } from '../../../api/admin.js';
import { request } from '../../../api/index.js';
import useConfirm from '../../../hooks/useConfirm.jsx';

export default function AdminSkillLinksTab({ skillLinks, skills, onRefresh }) {
  const [parentId, setParentId] = useState('');
  const [childId, setChildId] = useState('');
  const [coeff, setCoeff] = useState(1.0);
  const [editId, setEditId] = useState(null);
  const [editCoeff, setEditCoeff] = useState(1.0);
  const { confirm, ConfirmModal } = useConfirm();

  const handleCreate = async () => {
    if (!parentId || !childId) return;
    await admin.createSkillLink({ parent_skill_id: parentId, child_skill_id: childId, coefficient: coeff });
    setParentId(''); setChildId(''); setCoeff(1.0);
    onRefresh();
  };

  const handleEdit = (link) => { setEditId(link.id); setEditCoeff(link.coefficient); };
  const handleSaveEdit = async () => {
    await request('/admin/skill-links/' + editId, { method: 'PUT', body: JSON.stringify({ coefficient: editCoeff }) });
    setEditId(null);
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!await confirm('Удалить связь?')) return;
    await admin.deleteSkillLink(id);
    onRefresh();
  };

  return (
    <div>
      <div className="flex gap-2 mb-3 items-end flex-wrap">
        <select value={parentId} onChange={e => setParentId(e.target.value)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
          <option value="">Родительский</option>
          {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <span className="text-wasteland-400">→</span>
        <select value={childId} onChange={e => setChildId(e.target.value)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
          <option value="">Дочерний</option>
          {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="number" step="0.1" value={coeff} onChange={e => setCoeff(parseFloat(e.target.value)||1.0)} className="w-16 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
        <button onClick={handleCreate} disabled={!parentId || !childId} className="bg-accent-orange text-wasteland-900 text-xs px-3 py-1.5 rounded">+</button>
      </div>

      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
        {skillLinks.map(link => (
          <div key={link.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
            {editId === link.id ? (
              <div className="flex items-center gap-2 flex-1">
                <span className="text-wasteland-200">{link.parent?.name || '...'} → {link.child?.name || '...'}</span>
                <input type="number" step="0.1" value={editCoeff} onChange={e => setEditCoeff(parseFloat(e.target.value)||1.0)} className="w-16 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs" />
                <button onClick={handleSaveEdit} className="text-accent-green text-xs px-2">✓</button>
                <button onClick={() => setEditId(null)} className="text-wasteland-400 text-xs px-2">✕</button>
              </div>
            ) : (
              <>
                <span className="text-wasteland-200">{link.parent?.name || '...'} → {link.child?.name || '...'} <span className="text-accent-yellow ml-2">×{link.coefficient}</span></span>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(link)} className="text-wasteland-400 hover:text-wasteland-200">✏</button>
                  <button onClick={() => handleDelete(link.id)} className="text-accent-red hover:text-red-400">✕</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      {ConfirmModal}
    </div>
  );
}
