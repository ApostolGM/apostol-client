// src/components/TimeCounter.jsx
import { useState, useEffect } from 'react';

export default function TimeCounter({ gameTime, onChange }) {
  const [value, setValue] = useState(gameTime || '2026-01-01 12:00');

  useEffect(() => {
    setValue(gameTime || '2026-01-01 12:00');
  }, [gameTime]);

  const handleSave = () => {
    onChange(value);
  };

  const addHours = (n) => {
    try {
      const dt = new Date(value);
      if (isNaN(dt.getTime())) return;
      dt.setHours(dt.getHours() + n);
      const y = dt.getFullYear();
      const mo = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      const h = String(dt.getHours()).padStart(2, '0');
      const mi = String(dt.getMinutes()).padStart(2, '0');
      const newValue = `${y}-${mo}-${d} ${h}:${mi}`;
      setValue(newValue);
      onChange(newValue);
    } catch {}
  };

  return (
    <div className="flex items-center gap-1 text-xs">
      <button
        onClick={() => addHours(-1)}
        className="bg-wasteland-700 hover:bg-wasteland-600 px-1.5 py-0.5 rounded text-wasteland-300"
        title="-1 час"
      >
        −
      </button>

      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
        className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs w-36 text-center"
        placeholder="2026-01-01 12:00"
      />

      <button
        onClick={() => addHours(1)}
        className="bg-wasteland-700 hover:bg-wasteland-600 px-1.5 py-0.5 rounded text-wasteland-300"
        title="+1 час"
      >
        +
      </button>
    </div>
  );
}
