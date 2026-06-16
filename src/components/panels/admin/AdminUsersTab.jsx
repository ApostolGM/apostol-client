// components/panels/admin/AdminUsersTab.jsx
import { admin } from '../../../api/admin.js';
import useConfirm from '../../../hooks/useConfirm.jsx';

export default function AdminUsersTab({ users, currentUserId, onRefresh }) {
  const { confirm, ConfirmModal } = useConfirm();

  const handleToggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'player' : 'admin';
    await admin.updateUser(user.id, newRole);
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!await confirm('Удалить пользователя?')) return;
    await admin.deleteUser(id);
    onRefresh();
  };

  return (
    <div className="space-y-1 max-h-[60vh] overflow-y-auto">
      {users.map(u => (
        <div key={u.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
          <div>
            <span className="text-wasteland-200">{u.username}</span>
            <span className={`ml-2 ${u.role === 'admin' ? 'text-accent-orange' : 'text-wasteland-500'}`}>{u.role}</span>
            <span className="text-wasteland-500 ml-2">{new Date(u.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex gap-1">
            <button onClick={() => handleToggleRole(u)} className="text-wasteland-400 hover:text-wasteland-200 text-xs">
              {u.role === 'admin' ? '→ player' : '→ admin'}
            </button>
            <button onClick={() => handleDelete(u.id)} className="text-accent-red hover:text-red-400 text-xs">🗑️</button>
          </div>
        </div>
      ))}
      {ConfirmModal}
    </div>
  );
}
