// components/panels/admin/ItemForm.jsx
import { useState, useEffect } from 'react';
import ItemListEditor from '../../editors/ItemListEditor.jsx';

const ITEM_ICONS = ['🗡️','🔫','🪓','🏹','🛡️','🦺','🤖','💠','🥫','💧','💉','🔦','🪢','🔧','💎','⚙️','📦','🧪','📜','🔑'];

export default function ItemForm({ initialData, ammoTypes, items, itemSlots, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '', item_slot_id: '', subcategory: '', icon: '', weight: 0,
    condition_percent: 100, description: '', trade_price: 0,
    is_global: true, container_items: [],
    weapon_type: '', max_ammo: 0, is_heavy: false,
    ammo_type_id: '', mod_item_slot_id: '',
    linked_skill_ids: [], skill_coefficients: [],
    shots_per_action: 1, ammo_per_shot: 1
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        item_slot_id: initialData.item_slot_id || initialData.item_slot?.id || '',
        subcategory: initialData.subcategory || '',
        icon: initialData.icon || '',
        weight: initialData.weight || 0,
        condition_percent: initialData.condition_percent ?? 100,
        description: initialData.description || '',
        trade_price: initialData.trade_price || 0,
        is_global: initialData.is_global ?? true,
        container_items: (initialData.container_items || []).map(ci => ({
          item_id: ci.item_id || '', quantity: ci.quantity || 1,
        })),
        weapon_type: initialData.weapon_type || '',
        max_ammo: initialData.max_ammo || 0,
        is_heavy: initialData.is_heavy || false,
        ammo_type_id: initialData.ammo_type_id || '',
        mod_item_slot_id: initialData.mod_item_slot_id || '',
        linked_skill_ids: initialData.linked_skill_ids || [],
        skill_coefficients: initialData.skill_coefficients || [],
        shots_per_action: initialData.shots_per_action || 1,
        ammo_per_shot: initialData.ammo_per_shot || 1,
      });
    }
  }, [initialData]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const currentSlotName = itemSlots.find(s => s.id === form.item_slot_id)?.name || '';
  const isWeapon = currentSlotName === 'weapon';
  const isMod = currentSlotName === 'mod';
  const isAmmo = currentSlotName === 'ammo';
  const isContainer = currentSlotName === 'container';

  const handleSubmit = () => {
    const payload = { ...form };
    if (!payload.ammo_type_id) payload.ammo_type_id = null;
    if (!payload.mod_item_slot_id) payload.mod_item_slot_id = null;
    if (!payload.weapon_type) payload.weapon_type = null;
    if (!isContainer) payload.container_items = [];
    if (isWeapon) payload.subcategory = payload.weapon_type || 'melee';
    onSave(payload);
  };

  return (
    <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
      <h3 className="text-wasteland-300 text-sm font-bold">{initialData ? 'Редактировать предмет' : 'Новый предмет'}</h3>

      <div className="flex gap-2">
        <input placeholder="Название" value={form.name} onChange={e => update('name', e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
        <select value={form.icon} onChange={e => update('icon', e.target.value)} className="w-16 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm text-center">
          <option value="">—</option>
          {ITEM_ICONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
        </select>
      </div>

      <select value={form.item_slot_id} onChange={e => update('item_slot_id', e.target.value)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
        <option value="">Тип предмета</option>
        {itemSlots.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      {isWeapon && (
        <>
          <select value={form.weapon_type} onChange={e => update('weapon_type', e.target.value)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
            <option value="">Тип оружия</option>
            <option value="melee">Ближний бой</option><option value="ranged">Дальний бой</option><option value="thrown">Метательное</option>
          </select>
        </>
      )}

      {isWeapon && form.weapon_type === 'ranged' && (
        <>
          <select value={form.ammo_type_id || ''} onChange={e => update('ammo_type_id', e.target.value)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
            <option value="">Тип патронов</option>
            {ammoTypes.map(at => <option key={at.id} value={at.id}>{at.name}</option>)}
          </select>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-wasteland-400 text-xs">Макс. патронов</label>
              <input type="number" value={form.max_ammo || ''} onChange={e => update('max_ammo', parseInt(e.target.value)||0)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
            </div>
            <div className="flex-1">
              <label className="text-wasteland-400 text-xs">Выстрелов за ход</label>
              <input type="number" min="1" value={form.shots_per_action} onChange={e => update('shots_per_action', parseInt(e.target.value)||1)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
            </div>
            <div className="flex-1">
              <label className="text-wasteland-400 text-xs">Патронов/выстрел</label>
              <input type="number" min="1" value={form.ammo_per_shot} onChange={e => update('ammo_per_shot', parseInt(e.target.value)||1)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
            </div>
          </div>
        </>
      )}

      {isWeapon && (
        <label className="flex items-center gap-2 text-xs text-wasteland-300">
          <input type="checkbox" checked={form.is_heavy} onChange={e => update('is_heavy', e.target.checked)} />Тяжёлое оружие
        </label>
      )}

      {isMod && (
        <select value={form.mod_item_slot_id || ''} onChange={e => update('mod_item_slot_id', e.target.value)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
          <option value="">На любой предмет</option>
          {itemSlots.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      )}

      {isAmmo && (
        <select value={form.ammo_type_id || ''} onChange={e => update('ammo_type_id', e.target.value)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
          <option value="">Тип патронов</option>
          {ammoTypes.map(at => <option key={at.id} value={at.id}>{at.name}</option>)}
        </select>
      )}

      {isContainer && (
        <>
          <label className="text-wasteland-400 text-xs block">Содержимое контейнера:</label>
          <ItemListEditor items={form.container_items} allItems={items} onChange={(val) => update('container_items', val)} showPrice={false} />
        </>
      )}

      {!isContainer && (
        <>
          <div className="flex gap-2">
            <div className="flex-1"><label className="text-wasteland-400 text-xs">Вес (кг)</label><input type="number" value={form.weight} onChange={e => update('weight', parseFloat(e.target.value)||0)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" /></div>
            <div className="flex-1"><label className="text-wasteland-400 text-xs">Базовая цена</label><input type="number" value={form.trade_price} onChange={e => update('trade_price', parseInt(e.target.value)||0)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" /></div>
          </div>
          <textarea placeholder="Описание" value={form.description} onChange={e => update('description', e.target.value)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" rows={2} />
        </>
      )}

      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={!form.name} className="flex-1 bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">
          {initialData ? 'Сохранить' : 'Создать'}
        </button>
        <button onClick={onCancel} className="flex-1 bg-wasteland-600 text-wasteland-300 py-2 rounded text-sm">Отмена</button>
      </div>
    </div>
  );
}
