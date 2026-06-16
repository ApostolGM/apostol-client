// components/character/DeathLoanSection.jsx

export default function DeathLoanSection({ char, socketRef }) {
  const requestDeathLoan = () => {
    if (!socketRef?.current) return;
    socketRef.current.emit('death_loan_request', {
      campaignId: char.campaign_id,
      characterId: char.id,
      characterName: char.name,
    });
  };

  return (
    <div className="bg-wasteland-800 p-4 rounded-lg border border-accent-purple/30">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-wasteland-300 font-stylized">💀 Рассрочка гибели</h3>
          <p className="text-wasteland-500 text-xs">Использовано: {char.death_loan_count || 0}</p>
        </div>
        <button
          onClick={requestDeathLoan}
          className="text-xs bg-accent-purple/20 hover:bg-accent-purple/40 text-purple-400 px-3 py-1.5 rounded border border-accent-purple/30"
        >
          Запросить удачу
        </button>
      </div>
    </div>
  );
}
