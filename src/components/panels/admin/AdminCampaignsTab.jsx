// components/panels/admin/AdminCampaignsTab.jsx
import { admin } from '../../../api/admin.js';
import useConfirm from '../../../hooks/useConfirm.jsx';

export default function AdminCampaignsTab({ campaigns, onRefresh }) {
  const { confirm, ConfirmModal } = useConfirm();

  const handleDelete = async (campaign) => {
    if (!await confirm(`Удалить кампанию "${campaign.title}"?`)) return;
    await admin.deleteCampaign(campaign.id);
    onRefresh();
  };

  return (
    <div className="space-y-1 max-h-[60vh] overflow-y-auto">
      {campaigns.map(c => (
        <div key={c.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
          <div>
            <span className="text-wasteland-200 font-bold">{c.title}</span>
            <span className="text-wasteland-500 ml-2">👑 {c.master?.username || '?'}</span>
            <span className="text-wasteland-500 ml-2">{new Date(c.created_at).toLocaleDateString()}</span>
          </div>
          <button onClick={() => handleDelete(c)} className="text-accent-red hover:text-red-400 text-xs">🗑️</button>
        </div>
      ))}
      {ConfirmModal}
    </div>
  );
}
