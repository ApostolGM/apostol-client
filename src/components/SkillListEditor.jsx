// src/components/SkillListEditor.jsx
export default function SkillListEditor({ skills = [], allSkills = [], onChange, showSkillSelect = true, showModifier = true }) {
  const addRow = () => {
    onChange([...skills, { skill: '', modifier: 0 }]);
  };

  const updateRow = (index, field, value) => {
    const updated = skills.map((s, i) => {
      if (i !== index) return s;
      if (field === 'param') {
        return { param: value.replace('param:', ''), modifier: s.modifier || 0 };
      }
      return { ...s, [field]: value, param: undefined };
    });
    onChange(updated);
  };

  const removeRow = (index) => {
    onChange(skills.filter((_, i) => i !== index));
  };

  const getSelectValue = (s) => {
    if (s.param) return `param:${s.param}`;
    return s.skill || '';
  };

  return (
    <div className="space-y-2">
      {skills.map((s, i) => (
        <div key={i} className="flex gap-1 items-center">
          <select
            value={getSelectValue(s)}
            onChange={e => {
              const val = e.target.value;
              if (val.startsWith('param:')) updateRow(i, 'param', val);
              else updateRow(i, 'skill', val);
            }}
            className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs"
          >
            <option value="">Выбрать...</option>
            <optgroup label="Навыки">
              {allSkills.map(sk => <option key={sk.id} value={sk.name}>{sk.name}</option>)}
            </optgroup>
            <optgroup label="Параметры персонажа">
              <option value="param:carry_weight_max">💪 Переносимый вес</option>
            </optgroup>
          </select>
          {showModifier && (
            <input
              type="number"
              value={s.modifier || 0}
              onChange={e => updateRow(i, 'modifier', parseInt(e.target.value)||0)}
              className="w-16 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs text-center"
            />
          )}
          <button onClick={() => removeRow(i)} className="text-accent-red text-xs">✕</button>
        </div>
      ))}
      <button onClick={addRow} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">+ Добавить</button>
    </div>
  );
}
