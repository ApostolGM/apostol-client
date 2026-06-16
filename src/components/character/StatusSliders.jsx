// components/character/StatusSliders.jsx

const SLIDERS = [
  { label: 'Еда', field: 'food', color: '#33cc33' },
  { label: 'Вода', field: 'water', color: '#3399ff' },
  { label: 'Стресс', field: 'stress', color: '#cc3333' },
];

export default function StatusSliders({ params, editMode, isMaster, onSliderChange, onSave, onEditToggle }) {
  return (
    <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-wasteland-300 font-stylized">Состояние</h3>
        {isMaster && (
          <button
            onClick={() => editMode ? onSave() : onEditToggle()}
            className={`text-xs px-3 py-1 rounded ${editMode ? 'bg-accent-green text-wasteland-900' : 'bg-wasteland-600 text-wasteland-300'}`}
          >
            {editMode ? 'Сохранить' : 'Изменить'}
          </button>
        )}
      </div>
      {SLIDERS.map(({ label, field, color }) => (
        <div key={field} className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-wasteland-400">{label}</span>
            <span className="text-wasteland-300">{params[field]}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={params[field]}
            onChange={e => onSliderChange(field, e.target.value)}
            disabled={!isMaster && !editMode}
            className="w-full h-2 rounded cursor-pointer"
            style={{ accentColor: color, opacity: isMaster || editMode ? 1 : 0.7 }}
          />
        </div>
      ))}
    </div>
  );
}
