export default function SkillListEditor({ skills = [], allSkills = [], onChange, showSkillSelect = true, showModifier = true }) {
  const addRow = () => {
    onChange([...skills, { skill: '', modifier: 0 }]);
  };

  const updateRow = (index, field, value) => {
    const updated = skills.map((s, i) => i === index ? { ...s, [field]: value } : s);
    onChange(updated);
  };

  const removeRow = (index) => {
    onChange(skills.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {skills.map((s, i) => (
        <div key={i} className="flex gap-1 items-center">
          {showSkillSelect ? (
            <select value={s.skill || ''} onChange={e => updateRow(i, 'skill', e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs">
              <option value="">Навык</option>
              {allSkills.map(sk => <option key={sk.id} value={sk.name}>{sk.name}</option>)}
            </select>
          ) : (
            <input value={s.skill || ''} onChange={e => updateRow(i, 'skill', e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs" placeholder="Название" />
          )}
          {showModifier && (
            <input type="number" value={s.modifier || 0} onChange={e => updateRow(i, 'modifier', parseInt(e.target.value)||0)} className="w-16 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs text-center" />
          )}
          <button onClick={() => removeRow(i)} className="text-accent-red text-xs">✕</button>
        </div>
      ))}
      <button onClick={addRow} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">+ Добавить</button>
    </div>
  );
}
