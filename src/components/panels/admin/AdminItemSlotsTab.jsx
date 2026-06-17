// components/panels/admin/AdminItemSlotsTab.jsx
import { useState } from 'react';
import { admin } from '../../../api/admin.js';
import useConfirm from '../../../hooks/useConfirm.jsx';

export default function AdminItemSlotsTab({ itemSlots, onRefresh }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const { confirm, ConfirmModal } = useConfirm();

  const handleCreate = async () => {
    if (!name.trim()) return;
    await admin.createItemSlot(name.trim(), desc);
    setName(''); setDesc('');
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!await confirm('Удалить слот? Предметы этого слота останутся без привязки.')) return;
    await admin.deleteItemSlot(id);
    onRefresh();
  };

  return (
    <div>
      <div className="flex gap-2 mb-3 items-end">
        <input placeholder="Название (weapon, helmet...)" value={name} onChange={e => setName(e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
        <input placeholder="Описание" value={desc} onChange={e => setDesc(e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
        <button onClick={handleCreate} disabled={!name.trim()} className="bg-accent-orange text-wasteland-900 text-xs px-3 py-1.5 rounded">+ Создать</button>
      </div>

      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
        {itemSlots.map(slot => (
          <div key={slot.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
            <span className="text-wasteland-200 font-bold">{slot.name}</span>
            <button onClick={() => handleDelete(slot.id)} className="text-accent-red hover:text-red-400">🗑️</button>
          </div>
        ))}
      </div>
      {ConfirmModal}
    </div>
  );
}
