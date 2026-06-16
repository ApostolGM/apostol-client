// components/panels/NPCPanel.jsx
import { useState, useEffect } from 'react';
import { npc } from '../../api/npc.js';
import NPCForm from '../editors/NPCForm.jsx';
import useConfirm from '../../hooks/useConfirm.jsx';

export default function NPCPanel({ campaignId, socketRef }) {
  const [npcs, setNpcs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingNpc, setEditingNpc] = useState(null);
  const { confirm, ConfirmModal } = useConfirm();

  const load = async () => {
    const [npcList, tmplList] = await Promise.all([npc.getAll(campaignId), npc.getTemplates()]);
    setNpcs(npcList); setTemplates(tmplList);
  };
  useEffect(() => { load(); }, [campaignId]);

  const handleSave = async (data) => {
    if (editingNpc) await npc.update(editingNpc.id, { ...data, campaign_id: campaignId, is_template: false });
    else await npc.create({ ...data, campaign_id: campaignId, is_template: false });
    setShowForm(false); setEditingNpc(null); load();
  };

  const handleDelete = async (id) => { if (await confirm('Удалить NPC?')) { await npc.delete(id); load(); } };
  const handleClone = async (n) => { await npc.clone(n.id); load(); };
  const handleSaveAsTemplate = async (n) => { await npc.create({ ...n, is_template: true, campaign_id: null }); load(); };
  const handleUseTemplate = (tmpl) => { setEditingNpc(tmpl); setShowForm(true); };

  const handleRollNpc = async (npcData, skillName) => {
    const res = await npc.roll(npcData.id, skillName);
    if (socketRef?.current) socketRef.current.emit('dice_roll', { campaignId, userId: 'npc', username: npcData.name, skillName: skillName, formula: res.formula, sum: res.sum, hidden: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-stylized text-accent-orange">NPC и Бестиарий</h2>
        <button onClick={() => { setEditingNpc(null); setShowForm(true); }} className="bg-accent-orange text-wasteland-900 text-sm font-bold px-4 py-2 rounded">+ Новый NPC</button>
      </div>

      {showForm && <NPCForm initialData={editingNpc} onSave={handleSave} onCancel={() => setShowForm(false)} />}

      <div className="space-y-2">
        {npcs.map(n => (
          <div key={n.id} className="bg-wasteland-800 p-3 rounded-lg border border-wasteland-600">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-wasteland-100 font-bold">{n.name}</h3>
                <p className="text-wasteland-400 text-xs">{n.type} | {n.visibility}</p>
                {n.health_thresholds && <div className="flex gap-2 mt-1">{Object.entries(n.health_thresholds).map(([k,v]) => <span key={k} className="text-xs bg-wasteland-700 px-1.5 py-0.5 rounded">{k}: {v}</span>)}</div>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingNpc(n); setShowForm(true); }} className="text-wasteland-400 hover:text-wasteland-200 text-xs px-2 py-1">✏️</button>
                <button onClick={() => handleClone(n)} className="text-wasteland-400 hover:text-wasteland-200 text-xs px-2 py-1">📋</button>
                <button onClick={() => handleSaveAsTemplate(n)} className="text-wasteland-400 hover:text-accent-yellow text-xs px-2 py-1">💾</button>
                <button onClick={() => handleDelete(n.id)} className="text-wasteland-400 hover:text-accent-red text-xs px-2 py-1">🗑️</button>
              </div>
            </div>
            {n.skills?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {n.skills.map((skill, i) => (
                  <button key={i} onClick={() => handleRollNpc(n, skill.name)} className="bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-xs text-wasteland-300">{skill.name} +{skill.modifier}</button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {templates.length > 0 && (
        <div className="mt-6">
          <h3 className="text-wasteland-300 font-stylized mb-2">Шаблоны</h3>
          {templates.map(tmpl => (
            <div key={tmpl.id} className="flex justify-between items-center bg-wasteland-800 p-2 rounded border border-wasteland-600">
              <span className="text-wasteland-300 text-sm">{tmpl.template_name || tmpl.name}</span>
              <button onClick={() => handleUseTemplate(tmpl)} className="text-xs bg-wasteland-600 text-wasteland-300 px-2 py-1 rounded">Использовать</button>
            </div>
          ))}
        </div>
      )}
      {ConfirmModal}
    </div>
  );
}
