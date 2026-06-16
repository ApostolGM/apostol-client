// components/campaign/CampaignHeader.jsx
import TimeCounter from '../layout/TimeCounter.jsx';

export default function CampaignHeader({ campaign, navigate, isMaster, hiddenMode, setHiddenMode, saveStatus, onTimeChange }) {
  return (
    <header className="bg-wasteland-800 border-b border-wasteland-600 p-2 md:p-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/dashboard')} className="text-wasteland-400 hover:text-wasteland-200 text-sm">←</button>
        <h1 className="text-base md:text-xl font-stylized text-accent-orange truncate max-w-[120px] md:max-w-none">{campaign.title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {isMaster && (
          <button
            onClick={() => setHiddenMode(!hiddenMode)}
            className={`text-xs px-2 py-0.5 rounded ${hiddenMode ? 'bg-accent-red text-wasteland-900' : 'bg-wasteland-600 text-wasteland-300'}`}
          >
            {hiddenMode ? '🔒' : '👁'}
          </button>
        )}
        <span className="text-wasteland-500 text-xs hidden sm:inline">Код: {campaign.invite_code}</span>
        {isMaster ? (
          <div className="flex items-center gap-1">
            <TimeCounter gameTime={campaign.game_time || '2026-01-01 12:00'} onChange={onTimeChange} />
            {saveStatus === 'saving' && <span className="text-accent-yellow text-xs">⏳</span>}
            {saveStatus === 'error' && <span className="text-accent-red text-xs">⚠️</span>}
          </div>
        ) : (
          <span className="text-xs text-wasteland-500">🕐 {campaign.game_time || '2026-01-01 12:00'}</span>
        )}
      </div>
    </header>
  );
}
