import { useState } from 'react';

// Small "add something" control: a button that turns into an inline input
export default function AddForm({ label, placeholder, onAdd }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const title = value.trim();
    if (!title) return;
    await onAdd(title);
    setValue('');
  };

  if (!open) return <button className="btn add" onClick={() => setOpen(true)}>+ {label}</button>;
  return (
    <form className="add-form" onSubmit={submit}>
      <input autoFocus value={value} placeholder={placeholder} maxLength={200} onChange={(e) => setValue(e.target.value)} />
      <div className="row">
        <button className="btn primary" type="submit">{label}</button>
        <button className="btn ghost" type="button" onClick={() => { setOpen(false); setValue(''); }}>Cancel</button>
      </div>
    </form>
  );
}
