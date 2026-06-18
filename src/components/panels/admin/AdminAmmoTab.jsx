// components/panels/admin/AdminAmmoTab.jsx
import { useState } from 'react';
import { ammo } from '../../../api/ammo.js';
import { request } from '../../../api/index.js';
import useConfirm from '../../../hooks/useConfirm.jsx';

export default function AdminAmmoTab({ ammoTypes, onRefresh }) {
  const [name, setName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const { confirm, ConfirmModal } = useConfirm();

  const handleCreate = async () => {
    if (!name.trim()) return;
    await ammo.create(name.trim());
    setName(''); onRefresh();
  };

  const handleEdit = (a) => { setEditId(a.id); setEditName(a.name); };
  const handleSaveEdit = async () => {
    await request('/admin/ammo-types/' + editId, { method: 'PUT', body: JSON.stringify({ name: editName }) });
    setEditId(null); onRefresh();
  };

  const handleDelete = async (id) => {
    if (!await confirm('Удалить?')) return;
    await ammo.delete(id);
    onRefresh();
  };

  return (
    <div>
      <div className="flex gap-2 mb-3 items-end">
        <input placeholder="Название" value={name} onChange={e => setName(e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
        <button onClick={handleCreate} disabled={!name.trim()} className="bg-accent-orange text-wasteland-900 text-xs px-3 py-1.5 rounded">+</button>
      </div>
      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
        {ammoTypes.map(at => (
          <div key={at.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
            {editId === at.id ? (
              <div className="flex gap-1 flex-1">
                <input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100" />
                <button onClick={handleSaveEdit} className="text-accent-green px-2">✓</button>
                <button onClick={() => setEditId(null)} className="text-wasteland-400 px-2">✕</button>
              </div>
            ) : (
              <>
                <span className="text-wasteland-200">{at.name}</span>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(at)} className="text-wasteland-400 hover:text-wasteland-200">✏</button>
                  <button onClick={() => handleDelete(at.id)} className="text-accent-red hover:text-red-400">✕</button>
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
