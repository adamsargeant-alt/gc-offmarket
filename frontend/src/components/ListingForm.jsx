import React, { useState } from 'react';
import CurrencyInput from './CurrencyInput';

const PROPERTY_TYPES = ['House', 'Apartment', 'Townhouse', 'Villa', 'Land', 'Waterfront', 'Penthouse'];
const DURATIONS = [
  { days: 3, label: '3 days' },
  { days: 7, label: '1 week' },
  { days: 14, label: '2 weeks' },
  { days: 30, label: '1 month' },
];

export default function ListingForm({ suburbs, lockedSuburbId, initial, onSubmit, onCancel }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    suburb_id: initial?.suburb_id || lockedSuburbId || '',
    price: initial?.price || '',
    property_type: initial?.property_type || 'House',
    bedrooms: initial?.bedrooms ?? '',
    bathrooms: initial?.bathrooms ?? '',
    land_size: initial?.land_size || '',
    notes: initial?.notes || '',
    duration_days: 7,
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
        land_size: form.land_size,
        notes: form.notes,
        duration_days: Number(form.duration_days),
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
        <CurrencyInput value={form.price} onChange={(v) => set('price', v)} required />
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
      <label>Approx land size (optional)
        <input type="text" placeholder="e.g. 600m²" value={form.land_size} onChange={(e) => set('land_size', e.target.value)} />
      </label>
      <label>Notes (optional)
        <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} />
      </label>
      {!isEdit && (
        <label>How long should this stay listed?
          <select value={form.duration_days} onChange={(e) => set('duration_days', e.target.value)} required>
            {DURATIONS.map(d => <option key={d.days} value={d.days}>{d.label}</option>)}
          </select>
        </label>
      )}
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save listing'}</button>
      </div>
    </form>
  );
}
