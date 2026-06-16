// components/character/PerksSection.jsx

export default function PerksSection({ perks }) {
  return (
    <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600">
      <h3 className="text-wasteland-300 font-stylized mb-2">Перки</h3>
      {perks.map(perk => (
        <div key={perk.id} className="text-sm mb-1">
          <span className={`font-bold ${
            perk.type === 'positive' ? 'text-accent-green' :
            perk.type === 'negative' ? 'text-accent-red' :
            'text-wasteland-300'
          }`}>{perk.name}</span>
          <span className="text-wasteland-500 ml-1">({perk.cost > 0 ? '+' : ''}{perk.cost})</span>
          <p className="text-wasteland-400 text-xs">{perk.description}</p>
        </div>
      ))}
    </div>
  );
}
