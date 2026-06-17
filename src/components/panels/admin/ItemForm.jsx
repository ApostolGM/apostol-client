// components/panels/admin/ItemForm.jsx
import { useState, useEffect } from 'react';
import ItemListEditor from '../../editors/ItemListEditor.jsx';

const ITEM_ICONS = ['🗡️','🔫','🪓','🏹','🛡️','🦺','🤖','💠','🥫','💧','💉','🔦','🪢','🔧','💎','⚙️','📦','🧪','📜','🔑'];

export default function ItemForm({ initialData, ammoTypes, items, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '', slot: 'item', subcategory: '', icon: '', weight: 0,
    condition_percent: 100, description: '', trade_price: 0,
    is_global: true, container_items: [],
    weapon_type: '', max_ammo: 0, is_heavy: false,
    ammo_type_id: '', mod_target: '', weapon_mod_subtype: ''
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '', slot: initialData.slot || 'item',
        subcategory: initialData.subcategory || '', icon: initialData.icon || '',
        weight: initialData.weight || 0, condition_percent: initialData.condition_percent ?? 100,
        description: initialData.description || '', trade_price: initialData.trade_price || 0,
        is_global: initialData.is_global ?? true,
        container_items: (initialData.container_items || []).map(ci => ({
          item_id: ci.item_id || '',
          quantity: ci.quantity || 1,
        })),
        weapon_type: initialData.weapon_type || '', max_ammo: initialData.max_ammo || 0,
        is_heavy: initialData.is_heavy || false, ammo_type_id: initialData.ammo_type_id || '',
        mod_target: initialData.mod_target || '', weapon_mod_subtype: initialData.weapon_mod_subtype || ''
      });
    }
  }, [initialData]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    const payload = { ...form };

    if (!payload.ammo_type_id) payload.ammo_type_id = null;
    if (!payload.mod_target) payload.mod_target = null;
    if (!payload.weapon_mod_subtype) payload.weapon_mod_subtype = null;
    if (!payload.weapon_type) payload.weapon_type = null;

    if (payload.slot === 'container' && payload.container_items?.length > 0) {
      payload.container_items = payload.container_items
        .filter(ci => ci.item_id)
        .map(ci => ({ item_id: ci.item_id, quantity: ci.quantity || 1 }));
    } else if (payload.slot !== 'container') {
      payload.container_items = [];
    }

    if (payload.slot === 'weapon') payload.subcategory = payload.weapon_type || 'melee';

    onSave(payload);
  };

  const isContainer = form.slot === 'container';

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

      <select value={form.slot} onChange={e => update('slot', e.target.value)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
        <option value="weapon">Оружие</option><option value="armor">Броня</option><option value="exo">Экзоскелет</option>
        <option value="mod">Модификация</option><option value="ammo">Патроны</option>
        <option value="consumable">Расходник</option><option value="item">Предмет</option><option value="currency">Валюта</option>
        <option value="container">📦 Контейнер</option>
      </select>

      {form.slot === 'weapon' && (
        <select value={form.weapon_type} onChange={e => update('weapon_type', e.target.value)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
          <option value="">Тип оружия</option>
          <option value="melee">Ближний бой</option><option value="ranged">Дальний бой</option><option value="thrown">Метательное</option>
        </select>
      )}

      {form.slot === 'weapon' && form.weapon_type === 'ranged' && (
        <>
          <select value={form.ammo_type_id || ''} onChange={e => update('ammo_type_id', e.target.value)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
            <option value="">Тип патронов</option>
            {ammoTypes.map(at => <option key={at.id} value={at.id}>{at.name}</option>)}
          </select>
          <input type="number" placeholder="Макс. патронов" value={form.max_ammo || ''} onChange={e => update('max_ammo', parseInt(e.target.value)||0)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
        </>
      )}
      {form.slot === 'weapon' && (
        <label className="flex items-center gap-2 text-xs text-wasteland-300">
          <input type="checkbox" checked={form.is_heavy} onChange={e => update('is_heavy', e.target.checked)} />Тяжёлое оружие
        </label>
      )}
      {form.slot === 'mod' && (
        <>
          <select value={form.mod_target || ''} onChange={e => update('mod_target', e.target.value)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
            <option value="">На что устанавливается</option>
            <option value="weapon">Оружие</option><option value="armor">Броня</option><option value="exo">Экзоскелет</option><option value="any">Любой предмет</option>
          </select>
          {form.mod_target === 'weapon' && (
            <select value={form.weapon_mod_subtype || ''} onChange={e => update('weapon_mod_subtype', e.target.value)} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
              <option value="">Подтип оружия</option>
              <option value="melee">Ближний бой</option><option value="ranged">Дальний бой</option><option value="thrown">Метательное</option><option value="any">Любое</option>
            </select>
          )}
        </>
      )}
      {form.slot === 'ammo' && (
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
