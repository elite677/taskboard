import { useState } from 'react';

export default function CardModal({ card, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [dueDate, setDueDate] = useState(card.due_date || '');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await onSave(card.id, { title: title.trim(), description, due_date: dueDate || null });
    setSaving(false);
    onClose();
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <form className="modal" onMouseDown={(e) => e.stopPropagation()} onSubmit={submit}>
        <label>Title
          <input value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>Description
          <textarea rows={5} value={description} maxLength={5000} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label>Due date
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>
        <div className="row spread">
          <button type="button" className="btn danger" onClick={async () => { await onDelete(card.id); onClose(); }}>
            Delete card
          </button>
          <div className="row">
            <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary" disabled={saving}>Save changes</button>
          </div>
        </div>
      </form>
    </div>
  );
}
