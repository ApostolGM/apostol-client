// components/editors/NPCForm.jsx
import { useState, useEffect } from 'react';

export default function NPCForm({ initialData, onSave, onCancel }) {
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState(initialData?.type || '');
  const [visibility, setVisibility] = useState(initialData?.visibility || 'hidden');
  const [specialProperties, setSpecialProperties] = useState(initialData?.special_properties || '');
  const [healthHealthy, setHealthHealthy] = useState(100);
  const [healthWounded, setHealthWounded] = useState(50);
  const [healthDying, setHealthDying] = useState(0);
  const [skillList, setSkillList] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      const ht = initialData.health_thresholds || {};
      setHealthHealthy(ht.здоров ?? ht.healthy ?? 100);
      setHealthWounded(ht.ранен ?? ht.wounded ?? 50);
      setHealthDying(ht['при смерти'] ?? ht.dying ?? 0);
      const skills = Array.isArray(initialData.skills) ? initialData.skills : [];
      setSkillList(skills.map((s, i) => ({ id: i, name: s.name || '', modifier: s.modifier || 0 })));
    }
  }, [initialData]);

  const addSkill = () => setSkillList(prev => [...prev, { id: Date.now(), name: '', modifier: 0 }]);
  const updateSkill = (id, field, value) => setSkillList(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  const removeSkill = (id) => setSkillList(prev => prev.filter(s => s.id !== id));

  const handleSubmit = () => {
    if (!name.trim()) { setError('Введите имя'); return; }
    onSave({
      name, type, visibility, special_properties: specialProperties,
      health_thresholds: { здоров: healthHealthy, ранен: healthWounded, 'при смерти': healthDying },
      skills: skillList.filter(s => s.name.trim()).map(s => ({ name: s.name.trim(), modifier: parseInt(s.modifier) || 0 })),
    });
  };

  return (
    <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 space-y-4">
      <h3 className="text-wasteland-300 font-stylized">{initialData ? 'Редактировать NPC' : 'Новый NPC'}</h3>
      {error && <p className="text-accent-red text-sm">{error}</p>}
      <input className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm" placeholder="Имя" value={name} onChange={e => setName(e.target.value)} />
      <input className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm" placeholder="Тип (человек, мутант, робот...)" value={type} onChange={e => setType(e.target.value)} />

      <div>
        <label className="text-wasteland-400 text-xs uppercase block mb-2">Пороги здоровья</label>
        {[
          { label: 'Здоров', value: healthHealthy, setter: setHealthHealthy, color: '#33cc33' },
          { label: 'Ранен', value: healthWounded, setter: setHealthWounded, color: '#cc6600' },
          { label: 'При смерти', value: healthDying, setter: setHealthDying, color: '#cc3333' },
        ].map(({ label, value, setter, color }) => (
          <div key={label} className="flex items-center gap-3 mb-1">
            <span className="text-wasteland-400 text-xs w-20">{label}</span>
            <input type="range" min="0" max="200" value={value} onChange={e => setter(parseInt(e.target.value))} className="flex-1 h-1.5 rounded cursor-pointer" style={{ accentColor: color }} />
            <input type="number" min="0" max="200" value={value} onChange={e => setter(parseInt(e.target.value) || 0)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs w-14 text-center" />
          </div>
        ))}
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-wasteland-400 text-xs uppercase">Навыки</label>
          <button onClick={addSkill} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">+ Навык</button>
        </div>
        {skillList.length === 0 && <p className="text-wasteland-500 text-xs">Нет навыков.</p>}
        <div className="space-y-2">
          {skillList.map(skill => (
            <div key={skill.id} className="flex items-center gap-2">
              <input className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" placeholder="Название навыка" value={skill.name} onChange={e => updateSkill(skill.id, 'name', e.target.value)} />
              <input type="number" className="w-16 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm text-center" placeholder="Мод" value={skill.modifier} onChange={e => updateSkill(skill.id, 'modifier', e.target.value)} />
              <button onClick={() => removeSkill(skill.id)} className="text-accent-red hover:text-red-400 text-sm px-1">✕</button>
            </div>
          ))}
        </div>
      </div>

      <textarea className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm" placeholder="Особые свойства" value={specialProperties} onChange={e => setSpecialProperties(e.target.value)} rows={2} />

      <select className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm" value={visibility} onChange={e => setVisibility(e.target.value)}>
        <option value="hidden">Скрыт</option><option value="combat">Для боя</option><option value="trade">Для торговли</option>
      </select>

      <div className="flex gap-2">
        <button onClick={handleSubmit} className="bg-accent-orange text-wasteland-900 font-bold px-4 py-2 rounded text-sm">Сохранить</button>
        <button onClick={onCancel} className="bg-wasteland-600 text-wasteland-300 px-4 py-2 rounded text-sm">Отмена</button>
      </div>
    </div>
  );
}
