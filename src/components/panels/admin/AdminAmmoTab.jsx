// components/panels/admin/AdminAmmoTab.jsx
import { useState } from 'react';
import { ammo } from '../../../api/ammo.js';
import useConfirm from '../../../hooks/useConfirm.jsx';

export default function AdminAmmoTab({ ammoTypes, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const { confirm, ConfirmModal } = useConfirm();

  const handleCreate = async () => {
    if (!name.trim()) return;
    await ammo.create(name);
    setName('');
    setShowForm(false);
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!await confirm('Удалить тип патронов?')) return;
    await ammo.delete(id);
    onRefresh();
  };

  return (
    <div>
      <button onClick={() => setShowForm(!showForm)} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded mb-3">
        {showForm ? 'Отмена' : '+ Тип патронов'}
      </button>

      {showForm && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
          <input placeholder="Название" value={name} onChange={e => setName(e.target.value)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
          <button onClick={handleCreate} disabled={!name} className="w-full bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">Создать</button>
        </div>
      )}

      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
        {ammoTypes.map(at => (
          <div key={at.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
            <span className="text-wasteland-200">{at.name}</span>
            <button onClick={() => handleDelete(at.id)} className="text-accent-red hover:text-red-400">🗑️</button>
          </div>
        ))}
      </div>
      {ConfirmModal}
    </div>
  );
}
