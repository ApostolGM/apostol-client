// src/components/TimeCounter.jsx
import { useState, useEffect } from 'react';

export default function TimeCounter({ date, hours, minutes, onChange }) {
  const initDate = date || '2026-01-01';
  const [y, setY] = useState(parseInt(initDate.substring(0, 4)));
  const [mo, setMo] = useState(parseInt(initDate.substring(5, 7)));
  const [d, setD] = useState(parseInt(initDate.substring(8, 10)));
  const [h, setH] = useState(hours ?? 12);
  const [m, setM] = useState(minutes ?? 0);
  const [saveTimer, setSaveTimer] = useState(null);

  useEffect(() => {
    const nd = date || '2026-01-01';
    setY(parseInt(nd.substring(0, 4)));
    setMo(parseInt(nd.substring(5, 7)));
    setD(parseInt(nd.substring(8, 10)));
    setH(hours ?? 12);
    setM(minutes ?? 0);
  }, [date, hours, minutes]);

  const save = (ny, nmo, nd, nh, nm) => {
    const month = Math.max(1, Math.min(12, nmo || 1));
    const day = Math.max(1, Math.min(31, nd || 1));
    const hours = Math.max(0, Math.min(23, nh ?? 0));
    const mins = Math.max(0, Math.min(59, nm ?? 0));
    onChange(
      `${ny}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      hours,
      mins
    );
  };

  // Дебаунс сохранения — срабатывает через 1.5 секунды после последнего изменения
  const debouncedSave = (ny, nmo, nd, nh, nm) => {
    if (saveTimer) clearTimeout(saveTimer);
    setSaveTimer(setTimeout(() => save(ny, nmo, nd, nh, nm), 1500));
  };

  const addHours = (n) => {
    let nh = h + n, nd = d, nmo = mo, ny = y;
    if (nh >= 24) {
      const add = Math.floor(nh / 24);
      nh %= 24;
      const dt = new Date(y, mo - 1, d + add);
      ny = dt.getFullYear();
      nmo = dt.getMonth() + 1;
      nd = dt.getDate();
    } else if (nh < 0) {
      const total = h + n;
      const add = Math.floor(total / 24);
      nh = ((total % 24) + 24) % 24;
      const dt = new Date(y, mo - 1, d + add);
      ny = dt.getFullYear();
      nmo = dt.getMonth() + 1;
      nd = dt.getDate();
    }
    setY(ny);
    setMo(nmo);
    setD(nd);
    setH(nh);
    save(ny, nmo, nd, nh, m);
  };

  // Сохраняем при размонтировании, если есть несохранённые изменения
  useEffect(() => {
    return () => {
      if (saveTimer) clearTimeout(saveTimer);
    };
  }, []);

  return (
    <div className="flex items-center gap-1 text-xs">
      <button
        onClick={() => addHours(-1)}
        className="bg-wasteland-700 hover:bg-wasteland-600 px-1.5 py-0.5 rounded text-wasteland-300"
        title="-1 час"
      >
        −
      </button>

      <div className="flex items-center gap-0.5">
        <input
          type="number"
          value={y}
          onChange={e => { setY(parseInt(e.target.value) || 2026); debouncedSave(parseInt(e.target.value) || 2026, mo, d, h, m); }}
          className="bg-wasteland-900 border border-wasteland-600 rounded p-0.5 text-wasteland-100 w-14 text-center"
          min="2000"
          max="2100"
        />
        <span className="text-wasteland-500">-</span>
        <input
          type="number"
          value={mo}
          onChange={e => { setMo(parseInt(e.target.value) || 1); debouncedSave(y, parseInt(e.target.value) || 1, d, h, m); }}
          className="bg-wasteland-900 border border-wasteland-600 rounded p-0.5 text-wasteland-100 w-10 text-center"
          min="1"
          max="12"
        />
        <span className="text-wasteland-500">-</span>
        <input
          type="number"
          value={d}
          onChange={e => { setD(parseInt(e.target.value) || 1); debouncedSave(y, mo, parseInt(e.target.value) || 1, h, m); }}
          className="bg-wasteland-900 border border-wasteland-600 rounded p-0.5 text-wasteland-100 w-10 text-center"
          min="1"
          max="31"
        />
      </div>

      <div className="flex items-center gap-0.5 ml-1">
        <input
          type="number"
          value={h}
          onChange={e => { setH(parseInt(e.target.value) || 0); debouncedSave(y, mo, d, parseInt(e.target.value) || 0, m); }}
          className="bg-wasteland-900 border border-wasteland-600 rounded p-0.5 text-wasteland-100 w-10 text-center"
          min="0"
          max="23"
        />
        <span className="text-wasteland-500">:</span>
        <input
          type="number"
          value={m}
          onChange={e => { setM(parseInt(e.target.value) || 0); debouncedSave(y, mo, d, h, parseInt(e.target.value) || 0); }}
          className="bg-wasteland-900 border border-wasteland-600 rounded p-0.5 text-wasteland-100 w-10 text-center"
          min="0"
          max="59"
        />
      </div>

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
