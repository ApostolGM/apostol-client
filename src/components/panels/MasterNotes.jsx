// components/panels/MasterNotes.jsx
import { useState, useEffect } from 'react';
import { notes } from '../../api/notes.js';
import useConfirm from '../../hooks/useConfirm.jsx';

export default function MasterNotes({ campaignId }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', world: '', region: '', city: '', location: '', tags: '', is_pinned: false });
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { confirm, ConfirmModal } = useConfirm();

  const load = async () => { const data = await notes.getAll(campaignId); setList(data); setLoading(false); };
  useEffect(() => { load(); }, [campaignId]);

  const handleSave = async () => {
    const tagsArray = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const payload = { ...form, tags: tagsArray, campaign_id: campaignId };
    if (editing) await notes.update(editing, payload);
    else await notes.create(payload);
    resetForm(); load();
  };

  const handleEdit = (note) => {
    setEditing(note.id);
    setForm({ title: note.title, content: note.content || '', world: note.world || '', region: note.region || '', city: note.city || '', location: note.location || '', tags: (note.tags || []).join(', '), is_pinned: note.is_pinned || false });
    setShowForm(true);
  };

  const handleDelete = async (id) => { if (!await confirm('Удалить заметку?')) return; await notes.delete(id); load(); };

  const resetForm = () => { setForm({ title: '', content: '', world: '', region: '', city: '', location: '', tags: '', is_pinned: false }); setEditing(null); setShowForm(false); };

  const filtered = list.filter(n => {
    if (!filter) return true;
    const f = filter.toLowerCase();
    return (n.title?.toLowerCase().includes(f) || n.content?.toLowerCase().includes(f) || (n.tags || []).some(t => t.toLowerCase().includes(f)) || n.world?.toLowerCase().includes(f) || n.region?.toLowerCase().includes(f) || n.city?.toLowerCase().includes(f));
  });

  const pinned = filtered.filter(n => n.is_pinned);
  const unpinned = filtered.filter(n => !n.is_pinned);

  if (loading) return <p className="text-wasteland-400 text-center py-4">Загрузка...</p>;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-stylized text-accent-orange">Заметки Мастера</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-accent-orange text-wasteland-900 text-sm font-bold px-4 py-2 rounded">+ Заметка</button>
      </div>
      <input placeholder="Поиск..." value={filter} onChange={e => setFilter(e.target.value)} className="w-full bg-wasteland-800 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm" />

      {showForm && (
        <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600 space-y-3">
          <h3 className="text-wasteland-300 font-stylized">{editing ? 'Редактировать' : 'Новая'}</h3>
          <input placeholder="Заголовок" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm" />
          <textarea placeholder="Содержание" value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm" rows={4} />
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Мир" value={form.world} onChange={e => setForm({...form, world: e.target.value})} className="bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
            <input placeholder="Регион" value={form.region} onChange={e => setForm({...form, region: e.target.value})} className="bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
            <input placeholder="Город" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
            <input placeholder="Локация" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
          </div>
          <input placeholder="Теги (через запятую)" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-1.5 text-wasteland-100 text-sm" />
          <label className="flex items-center gap-2 text-sm text-wasteland-300"><input type="checkbox" checked={form.is_pinned} onChange={e => setForm({...form, is_pinned: e.target.checked})} />Закрепить</label>
          <div className="flex gap-2">
            <button onClick={handleSave} className="bg-accent-orange text-wasteland-900 font-bold px-4 py-2 rounded text-sm">Сохранить</button>
            <button onClick={resetForm} className="bg-wasteland-600 text-wasteland-300 px-4 py-2 rounded text-sm">Отмена</button>
          </div>
        </div>
      )}

      {pinned.length > 0 && (
        <div>
          <h3 className="text-wasteland-400 text-xs uppercase mb-1">📌 Закреплённые</h3>
          {pinned.map(note => <NoteCard key={note.id} note={note} onEdit={handleEdit} onDelete={handleDelete} />)}
        </div>
      )}
      {unpinned.length === 0 && pinned.length === 0 && <p className="text-wasteland-500 text-center py-4">Нет заметок</p>}
      {unpinned.map(note => <NoteCard key={note.id} note={note} onEdit={handleEdit} onDelete={handleDelete} />)}
      {ConfirmModal}
    </div>
  );
}

function NoteCard({ note, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-wasteland-800 p-3 rounded-lg border border-wasteland-600 mb-2">
      <div className="flex justify-between items-start cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div>
          <h3 className="text-wasteland-100 font-bold text-sm">{note.title}</h3>
          <div className="flex flex-wrap gap-1 mt-1">
            {note.world && <span className="text-wasteland-500 text-xs">🌍 {note.world}</span>}
            {note.region && <span className="text-wasteland-500 text-xs">/ {note.region}</span>}
            {note.city && <span className="text-wasteland-500 text-xs">/ {note.city}</span>}
            {note.location && <span className="text-wasteland-500 text-xs">/ {note.location}</span>}
          </div>
          {(note.tags || []).length > 0 && <div className="flex flex-wrap gap-1 mt-1">{note.tags.map((tag, i) => <span key={i} className="bg-wasteland-700 text-wasteland-400 text-xs px-1.5 py-0.5 rounded">{tag}</span>)}</div>}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onEdit(note); }} className="text-wasteland-400 hover:text-wasteland-200 text-xs px-2 py-1">✏️</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(note.id); }} className="text-accent-red hover:text-red-400 text-xs px-2 py-1">🗑️</button>
        </div>
      </div>
      {expanded && note.content && <div className="mt-2 pt-2 border-t border-wasteland-600"><p className="text-wasteland-300 text-sm whitespace-pre-wrap">{note.content}</p></div>}
    </div>
  );
}
