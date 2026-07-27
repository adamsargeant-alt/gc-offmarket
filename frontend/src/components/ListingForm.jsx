import React, { useState } from 'react';

const PROPERTY_TYPES = ['House', 'Unit', 'Townhouse', 'Villa', 'Land'];

export default function ListingForm({ suburbs, lockedSuburbId, initial, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    suburb_id: initial?.suburb_id || lockedSuburbId || '',
    price: initial?.price || '',
    property_type: initial?.property_type || 'House',
    bedrooms: initial?.bedrooms ?? '',
    bathrooms: initial?.bathrooms ?? '',
    notes: initial?.notes || '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSubmit({
        suburb_id: Number(form.suburb_id),
        price: Number(form.price),
        property_type: form.property_type,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        notes: form.notes,
      });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      {error && <div className="auth-error">{error}</div>}
      <label>Suburb
        <select value={form.suburb_id} onChange={(e) => set('suburb_id', e.target.value)} required disabled={!!lockedSuburbId}>
          <option value="" disabled>Select suburb…</option>
          {suburbs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
      <label>Price
        <input type="number" min="0" step="1000" value={form.price} onChange={(e) => set('price', e.target.value)} required />
      </label>
      <label>Property type
        <select value={form.property_type} onChange={(e) => set('property_type', e.target.value)} required>
          {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <div className="form-row">
        <label>Bedrooms
          <input type="number" min="0" value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} required />
        </label>
        <label>Bathrooms
          <input type="number" min="0" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} required />
        </label>
      </div>
      <label>Notes (optional)
        <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} />
      </label>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save listing'}</button>
      </div>
    </form>
  );
}
