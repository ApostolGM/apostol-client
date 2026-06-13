// src/components/NPCPanel.jsx
import { useState, useEffect } from 'react';
import { api } from '../api';

export default function NPCPanel({ campaignId, socketRef }) {
  const [npcs, setNpcs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  // Поля формы
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [visibility, setVisibility] = useState('hidden');
  const [specialProperties, setSpecialProperties] = useState('');

  // Пороги здоровья
  const [healthHealthy, setHealthHealthy] = useState(100);
  const [healthWounded, setHealthWounded] = useState(50);
  const [healthDying, setHealthDying] = useState(0);

  // Навыки — массив объектов {id, name, modifier}
  const [skillList, setSkillList] = useState([]);

  const load = async () => {
    const [npcList, tmplList] = await Promise.all([
      api.getNPCs(campaignId),
      api.getTemplates()
    ]);
    setNpcs(npcList);
    setTemplates(tmplList);
  };

  useEffect(() => { load(); }, [campaignId]);

  const resetForm = () => {
    setName('');
    setType('');
    setVisibility('hidden');
    setSpecialProperties('');
    setHealthHealthy(100);
    setHealthWounded(50);
    setHealthDying(0);
    setSkillList([]);
    setEditingId(null);
    setShowCreate(false);
    setError('');
  };

  const openCreate = () => {
    resetForm();
    setShowCreate(true);
  };

  const openEdit = (npc) => {
    setName(npc.name);
    setType(npc.type || '');
    setVisibility(npc.visibility || 'hidden');
    setSpecialProperties(npc.special_properties || '');

    // Парсим пороги здоровья
    const ht = npc.health_thresholds || {};
    setHealthHealthy(ht.здоров ?? ht.healthy ?? 100);
    setHealthWounded(ht.ранен ?? ht.wounded ?? 50);
    setHealthDying(ht['при смерти'] ?? ht.dying ?? 0);

    // Парсим навыки
    const skills = Array.isArray(npc.skills) ? npc.skills : [];
    setSkillList(skills.map((s, i) => ({
      id: i,
      name: s.name || '',
      modifier: s.modifier || 0
    })));

    setEditingId(npc.id);
    setShowCreate(true);
  };

  const addSkill = () => {
    setSkillList(prev => [...prev, { id: Date.now(), name: '', modifier: 0 }]);
  };

  const updateSkill = (id, field, value) => {
    setSkillList(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSkill = (id) => {
    setSkillList(prev => prev.filter(s => s.id !== id));
  };

  const handleSave = async () => {
    setError('');
    try {
      const healthThresholds = {
        здоров: healthHealthy,
        ранен: healthWounded,
        'при смерти': healthDying
      };

      const skills = skillList
        .filter(s => s.name.trim())
        .map(s => ({ name: s.name.trim(), modifier: parseInt(s.modifier) || 0 }));

      const data = {
        name,
        type,
        health_thresholds: healthThresholds,
        skills,
        special_properties: specialProperties,
        visibility,
        campaign_id: campaignId,
        is_template: false
      };

      if (editingId) {
        await api.updateNPC(editingId, data);
      } else {
        await api.createNPC(data);
      }
      resetForm();
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleClone = async (npc) => {
    await api.cloneNPC(npc.id);
    load();
  };

  const handleDelete = async (id) => {
    if (confirm('Удалить NPC?')) {
      await api.deleteNPC(id);
      load();
    }
  };

  const handleSaveAsTemplate = async (npc) => {
    await api.createNPC({
      name: npc.name,
      type: npc.type,
      health_thresholds: npc.health_thresholds,
      skills: npc.skills,
      special_properties: npc.special_properties,
      visibility: 'hidden',
      is_template: true,
      template_name: npc.name,
      campaign_id: null
    });
    load();
  };

  const handleUseTemplate = (tmpl) => {
    setName(tmpl.name);
    setType(tmpl.type || '');
    setVisibility('hidden');
    setSpecialProperties(tmpl.special_properties || '');

    const ht = tmpl.health_thresholds || {};
    setHealthHealthy(ht.здоров ?? ht.healthy ?? 100);
    setHealthWounded(ht.ранен ?? ht.wounded ?? 50);
    setHealthDying(ht['при смерти'] ?? ht.dying ?? 0);

    const skills = Array.isArray(tmpl.skills) ? tmpl.skills : [];
    setSkillList(skills.map((s, i) => ({
      id: i,
      name: s.name || '',
      modifier: s.modifier || 0
    })));

    setEditingId(null);
    setShowCreate(true);
  };

  const visibilityLabel = (v) => {
    if (v === 'hidden') return 'Скрыт';
    if (v === 'combat') return 'Бой';
    if (v === 'trade') return 'Торговля';
    return v;
  };

  const parseSkills = (skills) => {
    return Array.isArray(skills) ? skills : [];
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-stylized text-accent-orange">NPC и Бестиарий</h2>
        <button
          onClick={openCreate}
          className="bg-accent-orange text-wasteland-900 text-sm font-bold px-4 py-2 rounded hover:bg-orange-500 transition"
        >
          + Новый NPC
        </button>
      </div>

      {error && <p className="text-accent-red text-sm bg-wasteland-800 p-3 rounded">{error}</p>}

      {showCreate && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 space-y-4">
          <h3 className="text-wasteland-300 font-stylized">
            {editingId ? 'Редактировать NPC' : 'Новый NPC'}
          </h3>

          <input
            className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm"
            placeholder="Имя"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <input
            className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm"
            placeholder="Тип (человек, мутант, робот...)"
            value={type}
            onChange={e => setType(e.target.value)}
          />

          {/* Пороги здоровья */}
          <div>
            <label className="text-wasteland-400 text-xs uppercase block mb-2">Пороги здоровья</label>
            <div className="space-y-3">
              {[
                { label: 'Здоров', value: healthHealthy, setter: setHealthHealthy, color: '#33cc33' },
                { label: 'Ранен', value: healthWounded, setter: setHealthWounded, color: '#cc6600' },
                { label: 'При смерти', value: healthDying, setter: setHealthDying, color: '#cc3333' },
              ].map(({ label, value, setter, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-wasteland-400 text-xs w-20">{label}</span>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={value}
                    onChange={e => setter(parseInt(e.target.value))}
                    className="flex-1 h-1.5 rounded cursor-pointer"
                    style={{ accentColor: color }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={value}
                    onChange={e => setter(parseInt(e.target.value) || 0)}
                    className="bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs w-14 text-center"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Навыки */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-wasteland-400 text-xs uppercase">Навыки</label>
              <button
                onClick={addSkill}
                className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300"
              >
                + Навык
              </button>
            </div>

            {skillList.length === 0 && (
              <p className="text-wasteland-500 text-xs">Нет навыков. Нажмите «+ Навык» чтобы добавить.</p>
            )}

            <div className="space-y-2">
              {skillList.map(skill => (
                <div key={skill.id} className="flex items-center gap-2">
                  <input
                    className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm"
                    placeholder="Название навыка"
                    value={skill.name}
                    onChange={e => updateSkill(skill.id, 'name', e.target.value)}
                  />
                  <input
                    type="number"
                    className="w-16 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm text-center"
                    placeholder="Мод"
                    value={skill.modifier}
                    onChange={e => updateSkill(skill.id, 'modifier', e.target.value)}
                  />
                  <button
                    onClick={() => removeSkill(skill.id)}
                    className="text-accent-red hover:text-red-400 text-sm px-1"
                    title="Удалить навык"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <textarea
            className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm"
            placeholder="Особые свойства"
            value={specialProperties}
            onChange={e => setSpecialProperties(e.target.value)}
            rows={2}
          />

          <select
            className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm"
            value={visibility}
            onChange={e => setVisibility(e.target.value)}
          >
            <option value="hidden">Скрыт</option>
            <option value="combat">Для боя</option>
            <option value="trade">Для торговли</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="bg-accent-orange text-wasteland-900 font-bold px-4 py-2 rounded text-sm hover:bg-orange-500 transition disabled:opacity-50"
            >
              Сохранить
            </button>
            <button
              onClick={resetForm}
              className="bg-wasteland-600 text-wasteland-300 px-4 py-2 rounded text-sm hover:bg-wasteland-500 transition"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Список NPC */}
      <div className="space-y-2">
        {npcs.length === 0 && (
          <p className="text-wasteland-500 text-sm">Нет NPC. Создайте первого или используйте шаблон.</p>
        )}
        {npcs.map(npc => (
          <div key={npc.id} className="bg-wasteland-800 p-3 rounded-lg border border-wasteland-600">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-wasteland-100 font-bold">{npc.name}</h3>
                <p className="text-wasteland-400 text-xs">
                  {npc.type} | {visibilityLabel(npc.visibility)}
                </p>
                {npc.special_properties && (
                  <p className="text-wasteland-300 text-xs mt-1">{npc.special_properties}</p>
                )}
                {/* Пороги здоровья */}
                {npc.health_thresholds && Object.keys(npc.health_thresholds).length > 0 && (
                  <div className="flex gap-2 mt-1">
                    {Object.entries(npc.health_thresholds).map(([key, val]) => (
                      <span key={key} className="text-xs bg-wasteland-700 px-1.5 py-0.5 rounded text-wasteland-400">
                        {key}: {val}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(npc)} className="text-wasteland-400 hover:text-wasteland-200 text-xs px-2 py-1" title="Редактировать">✏️</button>
                <button onClick={() => handleClone(npc)} className="text-wasteland-400 hover:text-wasteland-200 text-xs px-2 py-1" title="Клонировать">📋</button>
                <button onClick={() => handleSaveAsTemplate(npc)} className="text-wasteland-400 hover:text-accent-yellow text-xs px-2 py-1" title="В шаблон">💾</button>
                <button onClick={() => handleDelete(npc.id)} className="text-wasteland-400 hover:text-accent-red text-xs px-2 py-1" title="Удалить">🗑️</button>
              </div>
            </div>

            {parseSkills(npc.skills).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {parseSkills(npc.skills).map((skill, i) => (
                  <button
                    key={i}
                    onClick={async () => {
                      try {
                        const result = await api.rollNPC(npc.id, skill.name);
                        if (socketRef?.current) {
                          socketRef.current.emit('dice_roll', {
                            campaignId,
                            userId: 'npc',
                            username: npc.name,
                            skillName: skill.name,
                            formula: result.formula,
                            sum: result.sum,
                            hidden: false,
                          });
                        }
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-xs text-wasteland-300 transition"
                  >
                    {skill.name} +{skill.modifier}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Шаблоны */}
      {templates.length > 0 && (
        <div className="mt-6">
          <h3 className="text-wasteland-300 font-stylized mb-2">Шаблоны</h3>
          <div className="space-y-1">
            {templates.map(tmpl => (
              <div
                key={tmpl.id}
                className="flex justify-between items-center bg-wasteland-800 p-2 rounded border border-wasteland-600"
              >
                <span className="text-wasteland-300 text-sm">{tmpl.template_name || tmpl.name}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleUseTemplate(tmpl)}
                    className="text-xs bg-wasteland-600 text-wasteland-300 px-2 py-1 rounded hover:bg-wasteland-500"
                  >
                    Использовать
                  </button>
                  <button
                    onClick={() => { if (confirm('Удалить шаблон?')) { api.deleteNPC(tmpl.id).then(load); } }}
                    className="text-xs bg-accent-red/20 hover:bg-accent-red/40 text-accent-red px-2 py-1 rounded"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
