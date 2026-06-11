import { useState, useEffect } from 'react';
import { api } from '../api';

export default function NPCPanel({ campaignId, socketRef }) {
  const [npcs, setNpcs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    type: '',
    health_thresholds: '{}',
    skills: '[]',
    special_properties: '',
    visibility: 'hidden'
  });
  const [error, setError] = useState('');

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
    setForm({
      name: '',
      type: '',
      health_thresholds: '{}',
      skills: '[]',
      special_properties: '',
      visibility: 'hidden'
    });
    setEditingId(null);
    setShowCreate(false);
    setError('');
  };

  const handleSave = async () => {
    setError('');
    try {
      let parsedHealth, parsedSkills;
      try {
        parsedHealth = JSON.parse(form.health_thresholds);
      } catch {
        setError('Ошибка в JSON порогов здоровья');
        return;
      }
      try {
        parsedSkills = JSON.parse(form.skills);
      } catch {
        setError('Ошибка в JSON навыков');
        return;
      }

      const data = {
        name: form.name,
        type: form.type,
        health_thresholds: parsedHealth,
        skills: parsedSkills,
        special_properties: form.special_properties,
        visibility: form.visibility,
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

  const handleEdit = (npc) => {
    setForm({
      name: npc.name,
      type: npc.type || '',
      health_thresholds: JSON.stringify(npc.health_thresholds || {}, null, 2),
      skills: JSON.stringify(npc.skills || [], null, 2),
      special_properties: npc.special_properties || '',
      visibility: npc.visibility || 'hidden'
    });
    setEditingId(npc.id);
    setShowCreate(true);
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
    setForm({
      name: tmpl.name,
      type: tmpl.type || '',
      health_thresholds: JSON.stringify(tmpl.health_thresholds || {}, null, 2),
      skills: JSON.stringify(tmpl.skills || [], null, 2),
      special_properties: tmpl.special_properties || '',
      visibility: 'hidden'
    });
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
    try {
      return Array.isArray(skills) ? skills : JSON.parse(skills || '[]');
    } catch {
      return [];
    }
  };

  const skillsExample = `[
  {"name": "Атака", "modifier": 5},
  {"name": "Уклонение", "modifier": 3}
]`;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-stylized text-accent-orange">NPC и Бестиарий</h2>
        <button
          onClick={() => { resetForm(); setShowCreate(true); }}
          className="bg-accent-orange text-wasteland-900 text-sm font-bold px-4 py-2 rounded hover:bg-orange-500 transition"
        >
          + Новый NPC
        </button>
      </div>

      {error && <p className="text-accent-red text-sm bg-wasteland-800 p-3 rounded">{error}</p>}

      {showCreate && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 space-y-3">
          <h3 className="text-wasteland-300 font-stylized">
            {editingId ? 'Редактировать NPC' : 'Новый NPC'}
          </h3>

          <input
            className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm"
            placeholder="Имя"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />

          <input
            className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm"
            placeholder="Тип (человек, мутант, робот...)"
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value })}
          />

          <div>
            <label className="text-wasteland-400 text-xs">Пороги здоровья (JSON)</label>
            <textarea
              className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm font-mono"
              rows={3}
              value={form.health_thresholds}
              onChange={e => setForm({ ...form, health_thresholds: e.target.value })}
              placeholder='{"здоров": 100, "ранен": 50, "при смерти": 0}'
            />
          </div>

          <div>
            <label className="text-wasteland-400 text-xs">Навыки (JSON):</label>
            <textarea
              className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm font-mono"
              rows={4}
              value={form.skills}
              onChange={e => setForm({ ...form, skills: e.target.value })}
              placeholder={skillsExample}
            />
          </div>

          <textarea
            className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm"
            placeholder="Особые свойства"
            value={form.special_properties}
            onChange={e => setForm({ ...form, special_properties: e.target.value })}
          />

          <select
            className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm"
            value={form.visibility}
            onChange={e => setForm({ ...form, visibility: e.target.value })}
          >
            <option value="hidden">Скрыт</option>
            <option value="combat">Для боя</option>
            <option value="trade">Для торговли</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="bg-accent-orange text-wasteland-900 font-bold px-4 py-2 rounded text-sm hover:bg-orange-500 transition"
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
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(npc)} className="text-wasteland-400 hover:text-wasteland-200 text-xs px-2 py-1" title="Редактировать">✏️</button>
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
                <button
                  onClick={() => handleUseTemplate(tmpl)}
                  className="text-xs bg-wasteland-600 text-wasteland-300 px-2 py-1 rounded hover:bg-wasteland-500"
                >
                  Использовать
                </button>
                <button onClick={() => { if (confirm('Удалить шаблон?')) { api.deleteNPC(tmpl.id).then(load); } }} className="text-xs bg-accent-red/20 hover:bg-accent-red/40 text-accent-red px-2 py-1 rounded">🗑️</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
