import useConfirm from '../hooks/useConfirm';

export default function MembersSidebar({ members, isMaster, currentUserId, onKick }) {
  const { confirm, ConfirmModal } = useConfirm();

  const handleKick = async (member) => {
    const ok = await confirm(`Выгнать игрока "${member.user?.username}" из кампании?`);
    if (ok) onKick(member.user_id);
  };

  return (
    <div className="hidden md:block w-64 bg-wasteland-800 border-l border-wasteland-600 p-3 overflow-y-auto flex-shrink-0">
      <h2 className="text-lg font-stylized mb-3 text-wasteland-300">Группа</h2>
      {members?.map(m => (
        <div key={m.user_id} className="text-sm py-1.5 px-2 rounded mb-1 bg-wasteland-700/50 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-1">
              {m.role === 'master' && <span>👑</span>}
              {m.role === 'co-master' && <span>🛡️</span>}
              <span className="text-wasteland-300">{m.user?.username || m.user_id?.substring(0, 8)}</span>
            </div>
            {m.character_id && <span className="text-wasteland-500 text-xs">🎭 В игре</span>}
          </div>
          {isMaster && m.user_id !== currentUserId && m.role !== 'master' && (
            <button onClick={() => handleKick(m)} className="text-accent-red hover:text-red-400 text-xs" title="Выгнать">🚫</button>
          )}
        </div>
      ))}
      {ConfirmModal}
    </div>
  );
}
