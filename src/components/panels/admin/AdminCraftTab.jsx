// components/panels/admin/AdminCraftTab.jsx
import { useState } from 'react';
import { admin } from '../../../api/admin.js';
import ItemListEditor from '../../editors/ItemListEditor.jsx';
import useConfirm from '../../../hooks/useConfirm.jsx';

export default function AdminCraftTab({ stations, recipes, skills, items, onRefresh }) {
  const [subtab, setSubtab] = useState('recipes');
  const { confirm, ConfirmModal } = useConfirm();

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button onClick={() => setSubtab('recipes')} className={`text-xs px-3 py-1.5 rounded ${subtab === 'recipes' ? 'bg-accent-orange text-wasteland-900' : 'bg-wasteland-700 text-wasteland-300'}`}>Рецепты</button>
        <button onClick={() => setSubtab('stations')} className={`text-xs px-3 py-1.5 rounded ${subtab === 'stations' ? 'bg-accent-orange text-wasteland-900' : 'bg-wasteland-700 text-wasteland-300'}`}>Станции</button>
      </div>

      {subtab === 'recipes' && <RecipeList recipes={recipes} skills={skills} items={items} stations={stations} onRefresh={onRefresh} />}
      {subtab === 'stations' && <StationList stations={stations} items={items} onRefresh={onRefresh} />}
      {ConfirmModal}
    </div>
  );
}

function StationList({ stations, items, onRefresh }) {
  const [name, setName] = useState('');
  const [itemId, setItemId] = useState('');
  const { confirm, ConfirmModal } = useConfirm();

  const handleCreate = async () => {
    if (!name.trim()) return;
    await admin.createCraftStation({ name, item_id: itemId || null, is_global: true });
    setName(''); setItemId('');
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!await confirm('Удалить станцию?')) return;
    await admin.deleteCraftStation(id);
    onRefresh();
  };

  return (
    <div>
      <div className="flex gap-2 mb-3 items-end">
        <input placeholder="Название станции" value={name} onChange={e => setName(e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
        <select value={itemId} onChange={e => setItemId(e.target.value)} className="bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
          <option value="">Без предмета</option>
          {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
        <button onClick={handleCreate} disabled={!name.trim()} className="bg-accent-orange text-wasteland-900 text-xs px-3 py-1.5 rounded">+ Станция</button>
      </div>
      <div className="space-y-1 max-h-[40vh] overflow-y-auto">
        {stations.map(s => (
          <div key={s.id} className="bg-wasteland-800 p-2 rounded border border-wasteland-600 text-xs flex justify-between items-center">
            <span className="text-wasteland-200">{s.name} {s.item ? `(${s.item.name})` : ''}</span>
            <button onClick={() => handleDelete(s.id)} className="text-accent-red hover:text-red-400">🗑️</button>
          </div>
        ))}
      </div>
      {ConfirmModal}
    </div>
  );
}

function RecipeList({ recipes, skills, items, stations, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', skill_id: '', difficulty: 0,
    station_required_id: '', result_item_id: '', result_quantity: 1, ingredients: []
  });
  const { confirm, ConfirmModal } = useConfirm();

  const openCreate = () => { setEditId(null); setForm({ name: '', description: '', skill_id: '', difficulty: 0, station_required_id: '', result_item_id: '', result_quantity: 1, ingredients: [] }); setShowForm(true); };
  const openEdit = (r) => {
    setEditId(r.id);
    setForm({
      name: r.name, description: r.description || '', skill_id: r.skill_id || '',
      difficulty: r.difficulty || 0, station_required_id: r.station_required_id || '',
      result_item_id: r.result_item_id, result_quantity: r.result_quantity || 1,
      ingredients: (r.ingredients || []).map(ing => ({ item_id: ing.item_id, quantity: ing.quantity || 1, consumed_on_fail: ing.consumed_on_fail !== false }))
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    const data = {
      ...form,
      skill_id: form.skill_id || null,
      station_required_id: form.station_required_id || null,
      ingredients: form.ingredients.filter(ing => ing.item_id).map(ing => ({
        item_id: ing.item_id,
        quantity: ing.quantity || 1,
        consumed_on_fail: ing.consumed_on_fail !== false
      }))
    };
    if (editId) await admin.updateCraftRecipe(editId, data);
    else await admin.createCraftRecipe(data);
    setShowForm(false);
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!await confirm('Удалить рецепт?')) return;
    await admin.deleteCraftRecipe(id);
    onRefresh();
  };

  return (
    <div>
      <button onClick={openCreate} className="text-xs bg-accent-orange text-wasteland-900 px-3 py-1.5 rounded mb-3">
        {showForm ? 'Отмена' : '+ Рецепт'}
      </button>

      {showForm && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 mb-3 space-y-2">
          <h3 className="text-wasteland-300 text-sm font-bold">{editId ? 'Редактировать' : 'Новый рецепт'}</h3>
          <input placeholder="Название" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
          <textarea placeholder="Описание" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" rows={2} />

          <div className="flex gap-2">
            <select value={form.skill_id} onChange={e => setForm({...form, skill_id: e.target.value})} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
              <option value="">Без навыка</option>
              {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="number" placeholder="Сложность" value={form.difficulty} onChange={e => setForm({...form, difficulty: parseInt(e.target.value)||0})} className="w-20 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
          </div>

          <select value={form.station_required_id} onChange={e => setForm({...form, station_required_id: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
            <option value="">Без станции</option>
            {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <div className="flex gap-2 items-center">
            <span className="text-wasteland-400 text-xs">Результат:</span>
            <select value={form.result_item_id} onChange={e => setForm({...form, result_item_id: e.target.value})} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm">
              <option value="">Выбрать...</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <input type="number" min="1" value={form.result_quantity} onChange={e => setForm({...form, result_quantity: parseInt(e.target.value)||1})} className="w-16 bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
          </div>

          <div>
            <label className="text-wasteland-400 text-xs block mb-1">Ингредиенты:</label>
            <ItemListEditor
              items={form.ingredients}
              allItems={items}
              onChange={(val) => setForm({...form, ingredients: val})}
              showPrice={false}
              showConsumedOnFail={true}
            />
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={!form.name || !form.result_item_id} className="flex-1 bg-accent-orange text-wasteland-900 py-2 rounded text-sm font-bold disabled:opacity-50">Сохранить</button>
            <button onClick={() => setShowForm(false)} className="flex-1 bg-wasteland-600 text-wasteland-300 py-2 rounded text-sm">Отмена</button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
        {recipes.map(r => (
          <div key={r.id} className="bg-wasteland-800 p-3 rounded border border-wasteland-600 text-xs">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-wasteland-200 font-bold">{r.name}</span>
                {r.skill && <span className="text-accent-yellow ml-2">🎯 {r.skill.name}</span>}
                {r.station && <span className="text-accent-green ml-2">🔧 {r.station.name}</span>}
                <p className="text-wasteland-400 mt-1">→ {r.result_item?.name} ×{r.result_quantity}</p>
                {r.ingredients?.length > 0 && (
                  <p className="text-wasteland-500">Ингредиенты: {r.ingredients.map(i => `${i.item?.name}×${i.quantity}`).join(', ')}</p>
                )}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(r)} className="text-wasteland-400 hover:text-wasteland-200">✏️</button>
                <button onClick={() => handleDelete(r.id)} className="text-accent-red hover:text-red-400">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {ConfirmModal}
    </div>
  );
}
