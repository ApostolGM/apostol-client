// components/campaign/CampaignTabs.jsx

export default function CampaignTabs({ tabs, activeTab, onSelect }) {
  return (
    <div className="bg-wasteland-800 border-b border-wasteland-600 flex overflow-x-auto flex-shrink-0">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onSelect(tab.key)}
          className={`flex-shrink-0 px-3 py-2 text-xs md:text-sm md:px-4 ${
            activeTab === tab.key
              ? 'bg-wasteland-700 text-accent-orange border-b-2 border-accent-orange'
              : 'text-wasteland-400'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
