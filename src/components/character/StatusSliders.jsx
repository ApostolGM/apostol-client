// components/character/StatusSliders.jsx
import { useState, useEffect } from 'react';

export default function StatusSliders({ statuses, editMode, isMaster, onSave, onEditToggle }) {
  const [values, setValues] = useState({});

  useEffect(() => {
    const map = {};
    for (const s of statuses) map[s.id] = s.value;
    setValues(map);
  }, [statuses]);

  const handleChange = (id, val) => setValues(prev => ({ ...prev, [id]: parseInt(val) }));

  const handleSave = () => {
    const statusArray = statuses.map(s => ({
      status_id: s.id,
      value: values[s.id] ?? s.value
    }));
    onSave(statusArray);
  };

  return (
    <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-wasteland-300 font-stylized">Состояние</h3>
        {isMaster && (
          <button onClick={() => editMode ? handleSave() : onEditToggle()}
            className={`text-xs px-3 py-1 rounded ${editMode ? 'bg-accent-green text-wasteland-900' : 'bg-wasteland-600 text-wasteland-300'}`}>
            {editMode ? 'Сохранить' : 'Изменить'}
          </button>
        )}
      </div>
      {statuses.map(s => (
        <div key={s.id} className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-wasteland-400">{s.icon} {s.name}</span>
            <span className="text-wasteland-300">{values[s.id] ?? s.value}%</span>
          </div>
          <input type="range" min={s.min || 0} max={s.max || 100}
            value={values[s.id] ?? s.value}
            onChange={e => handleChange(s.id, e.target.value)}
            disabled={!isMaster && !editMode}
            className="w-full h-2 rounded cursor-pointer"
            style={{ accentColor: '#33cc33', opacity: isMaster || editMode ? 1 : 0.7 }} />
        </div>
      ))}
    </div>
  );
}
