// components/panels/admin/AdminBackgroundsTab.jsx
import { admin } from '../../../api/admin.js';
import useConfirm from '../../../hooks/useConfirm.jsx';

export default function AdminBackgroundsTab({ backgrounds, onRefresh }) {
  const { confirm, ConfirmModal } = useConfirm();

  const handleDelete = async (id) => {
    if (!await confirm('Удалить фон?')) return;
    await admin.deleteBackground(id);
    onRefresh();
  };

  return (
    <div className="space-y-1 max-h-[60vh] overflow-y-auto">
      {backgrounds.map(bg => (
        <div key={bg.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={bg.url} alt={bg.name} className="h-8 w-12 object-cover rounded" />
            <span className="text-wasteland-200">{bg.name}</span>
          </div>
          <button onClick={() => handleDelete(bg.id)} className="text-accent-red hover:text-red-400">🗑️</button>
        </div>
      ))}
      {ConfirmModal}
    </div>
  );
}
