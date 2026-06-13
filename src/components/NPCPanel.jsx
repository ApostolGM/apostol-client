import { useState, useEffect } from 'react';
import { api } from '../api';
import NPCForm from './NPCForm';
import useConfirm from '../hooks/useConfirm';

export default function NPCPanel({ campaignId, socketRef }) {
  const [npcs, setNpcs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingNpc, setEditingNpc] = useState(null);
  const { confirm, ConfirmModal } = useConfirm();

  const load = async () => {
    const [npcList, tmplList] = await Promise.all([api.getNPCs(campaignId), api.getTemplates()]);
    setNpcs(npcList); setTemplates(tmplList);
  };
  useEffect(() => { load(); }, [campaignId]);

  const handleSave = async (data) => {
    if (editingNpc) await api.updateNPC(editingNpc.id, { ...data, campaign_id: campaignId, is_template: false });
    else await api.createNPC({ ...data, campaign_id: campaignId, is_template: false });
    setShowForm(false); setEditingNpc(null); load();
  };

  const handleDelete = async (id) => { if (await confirm('Удалить NPC?')) { await api.deleteNPC(id); load(); } };
  const handleClone = async (npc) => { await api.cloneNPC(npc.id); load(); };
  const handleSaveAsTemplate = async (npc) => { await api.createNPC({ ...npc, is_template: true, campaign_id: null }); load(); };
  const handleUseTemplate = (tmpl) => { setEditingNpc(tmpl); setShowForm(true); };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-stylized text-accent-orange">NPC и Бестиарий</h2>
        <button onClick={() => { setEditingNpc(null); setShowForm(true); }} className="bg-accent-orange text-wasteland-900 text-sm font-bold px-4 py-2 rounded hover:bg-orange-500 transition">+ Новый NPC</button>
      </div>

      {showForm && <NPCForm initialData={editingNpc} onSave={handleSave} onCancel={() => setShowForm(false)} />}

      <div className="space-y-2">
        {npcs.map(npc => (
          <div key={npc.id} className="bg-wasteland-800 p-3 rounded-lg border border-wasteland-600">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-wasteland-100 font-bold">{npc.name}</h3>
                <p className="text-wasteland-400 text-xs">{npc.type} | {npc.visibility}</p>
                {npc.health_thresholds && <div className="flex gap-2 mt-1">{Object.entries(npc.health_thresholds).map(([k,v]) => <span key={k} className="text-xs bg-wasteland-700 px-1.5 py-0.5 rounded">{k}: {v}</span>)}</div>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingNpc(npc); setShowForm(true); }} className="text-wasteland-400 hover:text-wasteland-200 text-xs px-2 py-1">✏️</button>
                <button onClick={() => handleClone(npc)} className="text-wasteland-400 hover:text-wasteland-200 text-xs px-2 py-1">📋</button>
                <button onClick={() => handleSaveAsTemplate(npc)} className="text-wasteland-400 hover:text-accent-yellow text-xs px-2 py-1">💾</button>
                <button onClick={() => handleDelete(npc.id)} className="text-wasteland-400 hover:text-accent-red text-xs px-2 py-1">🗑️</button>
              </div>
            </div>
            {npc.skills?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {npc.skills.map((skill, i) => (
                  <button key={i} onClick={async () => {
                    const res = await api.rollNPC(npc.id, skill.name);
                    if (socketRef?.current) socketRef.current.emit('dice_roll', { campaignId, userId: 'npc', username: npc.name, skillName: skill.name, formula: res.formula, sum: res.sum, hidden: false });
                  }} className="bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-xs text-wasteland-300">{skill.name} +{skill.modifier}</button>
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
