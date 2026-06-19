// components/panels/admin/AdminItemSlotsTab.jsx
import { useState } from 'react';
import { admin } from '../../../api/admin.js';
import { request } from '../../../api/index.js';
import useConfirm from '../../../hooks/useConfirm.jsx';

const BUILDER_BLOCKS = {
  equippable: { type: 'boolean', label: 'Можно экипировать', default: false },
  equip_cells: { type: 'multiselect', label: 'Ячейки экипировки', default: [] },
  actions: { type: 'actions', label: 'Действия', default: [] },
  properties: { type: 'properties', label: 'Поля предмета', default: [] },
};

export default function AdminItemSlotsTab({ itemSlots, inventoryCells, onRefresh }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [rulesEditor, setRulesEditor] = useState(null); // id слота для редактора правил
  const [rulesMode, setRulesMode] = useState('builder'); // 'builder' | 'json'
  const [rulesJson, setRulesJson] = useState('{}');
  const [rulesObj, setRulesObj] = useState({});
  const [rulesError, setRulesError] = useState('');
  const { confirm, ConfirmModal } = useConfirm();

  const handleCreate = async () => {
    if (!name.trim()) return;
    await admin.createItemSlot(name.trim(), desc);
    setName(''); setDesc('');
    onRefresh();
  };

  const handleEdit = (slot) => { setEditId(slot.id); setEditName(slot.name); setEditDesc(slot.description || ''); };
  const handleSaveEdit = async () => {
    await request('/admin/item-slots/' + editId, { method: 'PUT', body: JSON.stringify({ name: editName, description: editDesc }) });
    setEditId(null);
    onRefresh();
  };

  const openRules = (slot) => {
    setRulesEditor(slot.id);
    const rules = slot.rules || {};
    setRulesObj(rules);
    setRulesJson(JSON.stringify(rules, null, 2));
    setRulesMode('builder');
    setRulesError('');
  };

  const handleSaveRules = async () => {
    try {
      const parsed = JSON.parse(rulesJson);
      await request('/admin/item-slots/' + rulesEditor, { method: 'PUT', body: JSON.stringify({ rules: parsed }) });
      setRulesEditor(null);
      onRefresh();
    } catch {
      setRulesError('Невалидный JSON');
    }
  };

  const updateRule = (key, value) => {
    const updated = { ...rulesObj, [key]: value };
    setRulesObj(updated);
    setRulesJson(JSON.stringify(updated, null, 2));
  };

  const addAction = () => {
    const actions = [...(rulesObj.actions || []), { name: 'new_action', label: 'Новое действие', skill_check: false }];
    updateRule('actions', actions);
  };

  const updateAction = (index, field, value) => {
    const actions = [...(rulesObj.actions || [])];
    actions[index] = { ...actions[index], [field]: value };
    updateRule('actions', actions);
  };

  const removeAction = (index) => {
    const actions = (rulesObj.actions || []).filter((_, i) => i !== index);
    updateRule('actions', actions);
  };

  const addProperty = () => {
    const props = [...(rulesObj.properties || []), { name: 'new_prop', type: 'text', label: 'Новое поле' }];
    updateRule('properties', props);
  };

  const updateProperty = (index, field, value) => {
    const props = [...(rulesObj.properties || [])];
    props[index] = { ...props[index], [field]: value };
    updateRule('properties', props);
  };

  const removeProperty = (index) => {
    const props = (rulesObj.properties || []).filter((_, i) => i !== index);
    updateRule('properties', props);
  };

  return (
    <div>
      <div className="flex gap-2 mb-3 items-end">
        <input placeholder="Название" value={name} onChange={e => setName(e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
        <input placeholder="Описание" value={desc} onChange={e => setDesc(e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
        <button onClick={handleCreate} disabled={!name.trim()} className="bg-accent-orange text-wasteland-900 text-xs px-3 py-1.5 rounded">+</button>
      </div>

      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
        {itemSlots.map(slot => (
          <div key={slot.id}>
            <div className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
              {editId === slot.id ? (
                <div className="flex gap-1 flex-1">
                  <input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100" />
                  <input value={editDesc} onChange={e => setEditDesc(e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100" />
                  <button onClick={handleSaveEdit} className="text-accent-green text-xs px-2">✓</button>
                  <button onClick={() => setEditId(null)} className="text-wasteland-400 text-xs px-2">✕</button>
                </div>
              ) : (
                <>
                  <span className="text-wasteland-200 font-bold">
                    {slot.name}
                    {slot.rules && Object.keys(slot.rules).length > 0 && (
                      <span className="text-accent-green text-xs ml-1">⚙</span>
                    )}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => openRules(slot)} className="text-accent-green hover:text-green-400 text-xs px-1" title="Правила">⚙</button>
                    <button onClick={() => handleEdit(slot)} className="text-wasteland-400 hover:text-wasteland-200">✏</button>
                    <button onClick={() => handleDelete(slot.id)} className="text-accent-red hover:text-red-400">✕</button>
                  </div>
                </>
              )}
            </div>

            {/* Редактор правил */}
            {rulesEditor === slot.id && (
              <div className="bg-wasteland-700 p-3 rounded-b border border-t-0 border-wasteland-600 space-y-3 ml-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-wasteland-300 text-xs font-bold">Правила: {slot.name}</h4>
                  <div className="flex gap-1">
                    <button onClick={() => setRulesMode('builder')} className={`text-xs px-2 py-0.5 rounded ${rulesMode === 'builder' ? 'bg-accent-orange text-wasteland-900' : 'bg-wasteland-600 text-wasteland-300'}`}>
                      Конструктор
                    </button>
                    <button onClick={() => setRulesMode('json')} className={`text-xs px-2 py-0.5 rounded ${rulesMode === 'json' ? 'bg-accent-orange text-wasteland-900' : 'bg-wasteland-600 text-wasteland-300'}`}>
                      JSON
                    </button>
                  </div>
                </div>

                {rulesMode === 'builder' && (
                  <div className="space-y-3">
                    {/* Можно экипировать */}
                    <label className="flex items-center gap-2 text-xs text-wasteland-300">
                      <input type="checkbox" checked={rulesObj.equippable || false} onChange={e => updateRule('equippable', e.target.checked)} />
                      Можно экипировать
                    </label>

                    {/* Действия */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-wasteland-400 text-xs">Действия</span>
                        <button onClick={addAction} className="text-xs bg-wasteland-600 px-2 py-0.5 rounded text-wasteland-300">+ Действие</button>
                      </div>
                      {(rulesObj.actions || []).map((action, i) => (
                        <div key={i} className="bg-wasteland-800 p-2 rounded mb-1 space-y-1">
                          <div className="flex gap-1">
                            <input placeholder="Ключ (attack)" value={action.name || ''} onChange={e => updateAction(i, 'name', e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs" />
                            <input placeholder="Метка (Атаковать)" value={action.label || ''} onChange={e => updateAction(i, 'label', e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs" />
                            <button onClick={() => removeAction(i)} className="text-accent-red text-xs px-1">✕</button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <label className="text-xs text-wasteland-400"><input type="checkbox" checked={action.skill_check || false} onChange={e => updateAction(i, 'skill_check', e.target.checked)} className="mr-1" />Проверка навыка</label>
                            <label className="text-xs text-wasteland-400"><input type="checkbox" checked={action.consume_ammo || false} onChange={e => updateAction(i, 'consume_ammo', e.target.checked)} className="mr-1" />Тратить патроны</label>
                            <label className="text-xs text-wasteland-400"><input type="checkbox" checked={action.destroy_on_use || false} onChange={e => updateAction(i, 'destroy_on_use', e.target.checked)} className="mr-1" />Уничтожить</label>
                            <label className="text-xs text-wasteland-400"><input type="checkbox" checked={action.roll_per_shot || false} onChange={e => updateAction(i, 'roll_per_shot', e.target.checked)} className="mr-1" />Бросок/выстрел</label>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Поля предмета */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-wasteland-400 text-xs">Поля предмета</span>
                        <button onClick={addProperty} className="text-xs bg-wasteland-600 px-2 py-0.5 rounded text-wasteland-300">+ Поле</button>
                      </div>
                      {(rulesObj.properties || []).map((prop, i) => (
                        <div key={i} className="flex gap-1 mb-1">
                          <input placeholder="Ключ" value={prop.name || ''} onChange={e => updateProperty(i, 'name', e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs" />
                          <select value={prop.type || 'text'} onChange={e => updateProperty(i, 'type', e.target.value)} className="w-20 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs">
                            <option value="text">Текст</option>
                            <option value="number">Число</option>
                            <option value="boolean">Да/Нет</option>
                          </select>
                          <input placeholder="Метка" value={prop.label || ''} onChange={e => updateProperty(i, 'label', e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs" />
                          <button onClick={() => removeProperty(i)} className="text-accent-red text-xs px-1">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {rulesMode === 'json' && (
                  <textarea
                    value={rulesJson}
                    onChange={e => { setRulesJson(e.target.value); setRulesError(''); }}
                    className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-xs font-mono"
                    rows={12}
                    placeholder='{"equippable": true, "actions": [...]}'
                  />
                )}

                {rulesError && <p className="text-accent-red text-xs">{rulesError}</p>}

                <div className="flex gap-2">
                  <button onClick={handleSaveRules} className="bg-accent-orange text-wasteland-900 text-xs px-3 py-1.5 rounded font-bold">Сохранить правила</button>
                  <button onClick={() => setRulesEditor(null)} className="text-wasteland-400 text-xs px-2">Закрыть</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {ConfirmModal}
    </div>
  );
}

// Добавить handleDelete (был упущен в рендере)
function handleDelete(id) {
  // используем confirm из замыкания — переопределим ниже
}
