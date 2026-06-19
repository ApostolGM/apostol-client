// components/panels/admin/ItemForm.jsx
import { useState, useEffect, useRef } from 'react';
import ItemListEditor from '../../editors/ItemListEditor.jsx';

export default function ItemForm({ initialData, ammoTypes, items, itemSlots, icons, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '', item_slot_id: '', subcategory: '', icon_id: '', weight: 0,
    condition_percent: 100, description: '', trade_price: 0,
    is_global: true, is_dynamic: false, container_items: [],
    weapon_type: '', max_ammo: 0, is_heavy: false,
    ammo_type_id: '', mod_item_slot_id: '',
    linked_skill_ids: [], skill_coefficients: [],
    shots_per_action: 1, ammo_per_shot: 1
  });

  const [showIconPicker, setShowIconPicker] = useState(false);
  const iconPickerRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        item_slot_id: initialData.item_slot_id || initialData.item_slot?.id || '',
        subcategory: initialData.subcategory || '',
        icon_id: initialData.icon_id || initialData.icon_data?.id || '',
        weight: initialData.weight || 0,
        condition_percent: initialData.condition_percent ?? 100,
        description: initialData.description || '',
        trade_price: initialData.trade_price || 0,
        is_global: initialData.is_global ?? true,
        is_dynamic: initialData.is_dynamic || false,
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (iconPickerRef.current && !iconPickerRef.current.contains(e.target)) {
        setShowIconPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const currentSlot = itemSlots.find(s => s.id === form.item_slot_id);
  const currentSlotName = currentSlot?.name || '';
  const slotRules = currentSlot?.rules || {};
  const isEquippable = slotRules.equippable || false;
  const hasActions = (slotRules.actions || []).length > 0;
  const hasAmmoAction = (slotRules.actions || []).some(a => a.consume_ammo);
  const isMod = currentSlotName === 'mod';
  const isAmmo = currentSlotName === 'ammo';
  const isContainer = currentSlotName === 'container';

  const selectedIcon = icons.find(i => i.id === form.icon_id);

  const handleSubmit = () => {
    const payload = { ...form };
    if (!payload.ammo_type_id) payload.ammo_type_id = null;
    if (!payload.mod_item_slot_id) payload.mod_item_slot_id = null;
    if (!payload.weapon_type) payload.weapon_type = null;
    if (!payload.icon_id) payload.icon_id = null;
    if (!isContainer) payload.container_items = [];
    if (hasActions) payload.subcategory = payload.weapon_type || '';
    onSave(payload);
  };

  return (
    <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
      <h3 className="text-wasteland-300 text-sm font-bold">{initialData ? 'Редактировать предмет' : 'Новый предмет'}</h3>

      <div className="flex gap-2 items-start">
        <input placeholder="Название" value={form.name} onChange={e => update('name', e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />

        <div className="relative flex-shrink-0" ref={iconPickerRef}>
          <button type="button" onClick={() => setShowIconPicker(!showIconPicker)}
            className="w-10 h-10 bg-wasteland-900 border border-wasteland-600 rounded flex items-center justify-center hover:border-wasteland-500 transition"
            title={selectedIcon ? selectedIcon.name : 'Выбрать иконку'}>
            {selectedIcon ? <img src={selectedIcon.url} alt="" className="w-8 h-8 object-contain" /> : <span className="text-wasteland-500 text-lg">+</span>}
          </button>
          {selectedIcon && (
            <button onClick={() => update('icon_id', '')} className="absolute -top-1 -right-1 w-4 h-4 bg-accent-red text-wasteland-900 rounded-full text-xs flex items-center justify-center">×</button>
          )}
          {showIconPicker && (
            <div className="absolute top-12 right-0 w-64 max-h-64 overflow-y-auto bg-wasteland-800 border border-wasteland-600 rounded-lg p-2 z-50 grid grid-cols-4 gap-1 shadow-xl">
              <button onClick={() => { update('icon_id', ''); setShowIconPicker(false); }} className="w-full aspect-square bg-wasteland-700 rounded border border-wasteland-600 flex items-center justify-center hover:bg-wasteland-600 text-wasteland-400 text-xs">—</button>
              {icons.map(icon => (
                <button key={icon.id} onClick={() => { update('icon_id', icon.id); setShowIconPicker(false); }}
                  className={`w-full aspect-square rounded border flex items-center justify-center p-1 hover:border-accent-orange transition ${form.icon_id === icon.id ? 'border-accent-orange bg-wasteland-700' : 'border-wasteland-600 bg-wasteland-900'}`}
                  title={icon.name}>
                  <img src={icon.url} alt={icon.name} className="max-w-full max-h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <select value={form.item_slot_id} onChange={e => update('item_slot_id', e.target.value)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
        <option value="">Тип предмета</option>
        {itemSlots.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      {hasActions && (
        <select value={form.weapon_type} onChange={e => update('weapon_type', e.target.value)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
          <option value="">Подтип</option>
          <option value="melee">Ближний бой</option>
          <option value="ranged">Дальний бой</option>
          <option value="thrown">Метательное</option>
        </select>
      )}

      {hasAmmoAction && (
        <>
          <select value={form.ammo_type_id || ''} onChange={e => update('ammo_type_id', e.target.value)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
            <option value="">Тип патронов</option>
            {ammoTypes.map(at => <option key={at.id} value={at.id}>{at.name}</option>)}
          </select>
          <div className="flex gap-2">
            <div className="flex-1"><label className="text-wasteland-400 text-xs">Макс. патронов</label><input type="number" value={form.max_ammo || ''} onChange={e => update('max_ammo', parseInt(e.target.value)||0)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" /></div>
            <div className="flex-1"><label className="text-wasteland-400 text-xs">Выстрелов/ход</label><input type="number" min="1" value={form.shots_per_action} onChange={e => update('shots_per_action', parseInt(e.target.value)||1)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" /></div>
            <div className="flex-1"><label className="text-wasteland-400 text-xs">Патронов/выстрел</label><input type="number" min="1" value={form.ammo_per_shot} onChange={e => update('ammo_per_shot', parseInt(e.target.value)||1)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" /></div>
          </div>
        </>
      )}

      {isEquippable && (
        <label className="flex items-center gap-2 text-xs text-wasteland-300">
          <input type="checkbox" checked={form.is_heavy} onChange={e => update('is_heavy', e.target.checked)} />Тяжёлое (занимает две руки)
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

      <label className="flex items-center gap-2 text-xs text-wasteland-300">
        <input type="checkbox" checked={form.is_dynamic} onChange={e => update('is_dynamic', e.target.checked)} />
        Динамический (изменения применяются ко всем экземплярам)
      </label>

      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={!form.name} className="flex-1 bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">
          {initialData ? 'Сохранить' : 'Создать'}
        </button>
        <button onClick={onCancel} className="flex-1 bg-wasteland-600 text-wasteland-300 py-2 rounded text-sm">Отмена</button>
      </div>
    </div>
  );
}
