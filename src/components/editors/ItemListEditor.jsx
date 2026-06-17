// components/editors/ItemListEditor.jsx

export default function ItemListEditor({ items = [], allItems = [], onChange, showPrice = false, showConsumedOnFail = false }) {
  const addRow = () => {
    const newItem = { item_id: '', quantity: 1 };
    if (showPrice) newItem.price_override = 0;
    if (showConsumedOnFail) newItem.consumed_on_fail = true;
    onChange([...items, newItem]);
  };

  const updateRow = (index, field, value) => {
    const updated = items.map((item, i) => i === index ? { ...item, [field]: value } : item);
    onChange(updated);
  };

  const removeRow = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-1 items-center flex-wrap">
          <select value={item.item_id || ''} onChange={e => updateRow(i, 'item_id', e.target.value)} className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs min-w-[100px]">
            <option value="">Предмет</option>
            {allItems.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
          </select>
          <input type="number" min="1" value={item.quantity || 1} onChange={e => updateRow(i, 'quantity', parseInt(e.target.value)||1)} className="w-14 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs text-center" />
          {showPrice && (
            <input type="number" value={item.price_override || 0} onChange={e => updateRow(i, 'price_override', parseInt(e.target.value)||0)} className="w-16 bg-wasteland-900 border border-wasteland-600 rounded p-1 text-wasteland-100 text-xs" placeholder="Цена" />
          )}
          {showConsumedOnFail && (
            <label className="flex items-center gap-1 text-wasteland-400 text-xs">
              <input type="checkbox" checked={item.consumed_on_fail !== false} onChange={e => updateRow(i, 'consumed_on_fail', e.target.checked)} />
              Тратятся
            </label>
          )}
          <button onClick={() => removeRow(i)} className="text-accent-red text-xs px-1">✕</button>
        </div>
      ))}
      <button onClick={addRow} className="text-xs bg-wasteland-700 hover:bg-wasteland-600 px-2 py-1 rounded text-wasteland-300">+ Добавить</button>
    </div>
  );
}
