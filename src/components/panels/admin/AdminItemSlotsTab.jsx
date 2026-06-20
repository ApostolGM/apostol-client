// components/panels/admin/AdminItemSlotsTab.jsx
import { useState, useEffect } from 'react';
import { admin } from '../../../api/admin.js';
import { request } from '../../../api/index.js';
import useConfirm from '../../../hooks/useConfirm.jsx';

const RULE_TEMPLATES = [
  { key: 'equippable', label: 'Можно экипировать', category: 'Основное' },
  { key: 'is_container', label: 'Это контейнер', category: 'Основное' },
  { key: 'is_quest', label: 'Квестовый предмет', category: 'Основное' },
  { key: 'is_heavy', label: 'Занимает две руки', category: 'Основное' },
  { key: 'skill_check', label: 'Требуется проверка навыка', category: 'Действия' },
  { key: 'consume_ammo', label: 'Тратит патроны при атаке', category: 'Действия' },
  { key: 'roll_per_shot', label: 'Бросок на каждый выстрел', category: 'Действия' },
  { key: 'destroy_on_use', label: 'Уничтожается после использования', category: 'Действия' },
  { key: 'reload', label: 'Можно перезарядить', category: 'Действия' },
  { key: 'heal', label: 'Восстанавливает здоровье', category: 'Действия' },
  { key: 'show_ammo', label: 'Показывать патроны', category: 'Поля' },
  { key: 'show_shots', label: 'Показывать выстрелы', category: 'Поля' },
  { key: 'show_weight', label: 'Показывать вес', category: 'Поля' },
  { key: 'show_price', label: 'Показывать цену', category: 'Поля' },
  { key: 'show_durability', label: 'Показывать прочность', category: 'Поля' },
];

export default function AdminItemSlotsTab({ itemSlots, inventoryCells, onRefresh }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [rulesEditor, setRulesEditor] = useState(null);
  const [activeRules, setActiveRules] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [customValue, setCustomValue] = useState('true');
  const [customType, setCustomType] = useState('boolean');
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

  const handleDelete = async (id) => {
    if (!await confirm('Удалить слот?')) return;
    await admin.deleteItemSlot(id);
    onRefresh();
  };

  const openRules = (slot) => {
    setRulesEditor(slot.id);
    const rules = slot.rules || {};
    const parsed = [];
    for (const [key, value] of Object.entries(rules)) {
      if (key === 'actions' || key === 'properties') continue;
      parsed.push({ key, value: typeof value === 'boolean' ? value : JSON.stringify(value), isCustom: !RULE_TEMPLATES.find(t => t.key === key) });
    }
    if (rules.actions) {
      for (const action of rules.actions) {
        for (const [key, value] of Object.entries(action)) {
          if (key === 'name' || key === 'label') continue;
          parsed.push({ key, value: typeof value === 'boolean' ? value : JSON.stringify(value), isCustom: false, actionName: action.name });
        }
      }
    }
    if (rules.properties) {
      for (const prop of rules.properties) {
        parsed.push({ key: `prop:${prop.name}`, value: `${prop.type}:${prop.label}`, isCustom: false });
      }
    }
    setActiveRules(parsed);
    setSelectedTemplate('');
  };

  const addTemplateRule = (templateKey) => {
    const template = RULE_TEMPLATES.find(t => t.key === templateKey);
    if (!template) return;
    if (activeRules.find(r => r.key === templateKey && !r.actionName)) return;
    setActiveRules(prev => [...prev, { key: templateKey, value: true, isCustom: false }]);
    setSelectedTemplate('');
  };

  const removeRule = (index) => {
    setActiveRules(prev => prev.filter((_, i) => i !== index));
  };

  const addCustomRule = () => {
    if (!customKey.trim()) return;
    let value = customValue;
    if (customType === 'boolean') value = customValue === 'true';
    else if (customType === 'number') value = Number(customValue);
    setActiveRules(prev => [...prev, { key: customKey.trim(), value, isCustom: true }]);
    setCustomKey(''); setCustomValue('true'); setCustomType('boolean');
  };

  const handleSaveRules = async () => {
    const rules = {};
    const actions = [];
    const properties = [];
    const actionProps = {};

    for (const rule of activeRules) {
      if (rule.key.startsWith('prop:')) {
        const [type, label] = rule.value.split(':');
        properties.push({ name: rule.key.replace('prop:', ''), type: type || 'text', label: label || '' });
        continue;
      }
      if (rule.actionName) {
        if (!actionProps[rule.actionName]) actionProps[rule.actionName] = {};
        actionProps[rule.actionName][rule.key] = rule.value;
        continue;
      }
      if (RULE_TEMPLATES.find(t => t.key === rule.key && t.category === 'Действия')) {
        if (!actionProps['attack']) actionProps['attack'] = {};
        actionProps['attack'][rule.key] = rule.value;
        continue;
      }
      rules[rule.key] = rule.value;
    }

    for (const [name, props] of Object.entries(actionProps)) {
      actions.push({ name, label: name === 'attack' ? 'Атаковать' : name, ...props });
    }

    if (actions.length) rules.actions = actions;
    if (properties.length) rules.properties = properties;

    await request('/admin/item-slots/' + rulesEditor, { method: 'PUT', body: JSON.stringify({ rules }) });
    setRulesEditor(null);
    onRefresh();
  };

  const availableTemplates = RULE_TEMPLATES.filter(t => !activeRules.find(r => r.key === t.key && !r.actionName));
  const grouped = {};
  for (const t of availableTemplates) {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  }

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
                    {slot.rules && Object.keys(slot.rules).length > 0 && <span className="text-accent-green text-xs ml-1">⚙</span>}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => openRules(slot)} className="text-accent-green hover:text-green-400 text-xs px-1" title="Правила">⚙</button>
                    <button onClick={() => handleEdit(slot)} className="text-wasteland-400 hover:text-wasteland-200">✏</button>
                    <button onClick={() => handleDelete(slot.id)} className="text-accent-red hover:text-red-400">✕</button>
                  </div>
                </>
              )}
            </div>

            {rulesEditor === slot.id && (
              <div className="bg-wasteland-700 p-3 rounded-b border border-t-0 border-wasteland-600 space-y-3 ml-2">
                <h4 className="text-wasteland-300 text-xs font-bold">Правила: {slot.name}</h4>

                {/* Активные правила */}
                <div className="space-y-1">
                  {activeRules.length === 0 && <p className="text-wasteland-500 text-xs">Нет активных правил</p>}
                  {activeRules.map((rule, i) => (
                    <div key={i} className="flex justify-between items-center bg-wasteland-800 p-1.5 rounded text-xs">
                      <span className="text-wasteland-200">
                        {rule.key}
                        {rule.value !== true && rule.value !== false && <span className="text-wasteland-500 ml-1">= {String(rule.value)}</span>}
                        {rule.isCustom && <span className="text-accent-yellow ml-1">(своё)</span>}
                      </span>
                      <button onClick={() => removeRule(i)} className="text-accent-red text-xs px-1">✕</button>
                    </div>
                  ))}
                </div>

                {/* Добавить из списка */}
                <div>
                  <label className="text-wasteland-400 text-xs block mb-1">Добавить из списка:</label>
                  <div className="flex gap-1">
                    <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs">
                      <option value="">Выбрать...</option>
                      {Object.entries(grouped).map(([cat, temps]) => (
                        <optgroup key={cat} label={cat}>
                          {temps.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                        </optgroup>
                      ))}
                    </select>
                    <button onClick={() => addTemplateRule(selectedTemplate)} disabled={!selectedTemplate} className="bg-accent-green text-wasteland-900 text-xs px-2 py-1 rounded">+</button>
                  </div>
                </div>

                {/* Своё правило */}
                <div>
                  <label className="text-wasteland-400 text-xs block mb-1">Своё правило:</label>
                  <div className="flex gap-1 items-center">
                    <input placeholder="Ключ" value={customKey} onChange={e => setCustomKey(e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs" />
                    <select value={customType} onChange={e => setCustomType(e.target.value)} className="w-16 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs">
                      <option value="boolean">Да/Нет</option>
                      <option value="text">Текст</option>
                      <option value="number">Число</option>
                    </select>
                    {customType === 'boolean' ? (
                      <select value={customValue} onChange={e => setCustomValue(e.target.value)} className="w-12 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs">
                        <option value="true">Да</option>
                        <option value="false">Нет</option>
                      </select>
                    ) : (
                      <input value={customValue} onChange={e => setCustomValue(e.target.value)} className="w-20 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs" placeholder="Значение" />
                    )}
                    <button onClick={addCustomRule} disabled={!customKey.trim()} className="bg-accent-yellow text-wasteland-900 text-xs px-2 py-1 rounded">+</button>
                  </div>
                </div>

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
