// components/ui/WeightBar.jsx

export default function WeightBar({ weightInfo }) {
  if (!weightInfo) return null;

  const barColor = weightInfo.percent > 110 ? 'bg-accent-red' :
                   weightInfo.percent > 85 ? 'bg-accent-yellow' : 'bg-accent-green';

  const textColor = weightInfo.percent > 110 ? 'text-accent-red' :
                    weightInfo.percent > 85 ? 'text-accent-yellow' : 'text-wasteland-300';

  return (
    <div className="bg-wasteland-800 p-3 rounded-lg border border-wasteland-600">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-wasteland-400">Вес</span>
        <span className={`font-bold ${textColor}`}>
          {weightInfo.totalWeight.toFixed(1)} / {weightInfo.maxWeight} кг ({weightInfo.percent}%)
        </span>
      </div>
      <div className="w-full h-2 bg-wasteland-900 rounded overflow-hidden">
        <div className={`h-full rounded transition-all ${barColor}`} style={{ width: `${Math.min(100, weightInfo.percent)}%` }} />
      </div>
      {weightInfo.penalty.label !== 'Норма' && (
        <p className={`text-xs mt-1 ${weightInfo.penalty.label.includes('Помеха') ? 'text-accent-red' : 'text-accent-yellow'}`}>
          ⚠️ {weightInfo.penalty.label}
          {typeof weightInfo.penalty.penalty === 'number' && ` (${weightInfo.penalty.penalty}% к броскам)`}
        </p>
      )}
    </div>
  );
}
