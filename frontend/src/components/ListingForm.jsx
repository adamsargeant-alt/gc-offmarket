import React, { useState } from 'react';
import CurrencyInput from './CurrencyInput';
import SuburbAutocomplete from './SuburbAutocomplete';
import CheckboxGroup from './CheckboxGroup';

const PROPERTY_TYPES = ['House', 'Apartment', 'Townhouse', 'Villa', 'Land'];
const FEATURES = ['Penthouse', 'Sub-penthouse', 'Waterfront', 'Pool', 'Multi-level'];
const FACINGS = ['North', 'East', 'South', 'West'];
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
    car_spaces: initial?.car_spaces ?? '',
    land_size: initial?.land_size || '',
    features: initial?.features || [],
    facing: initial?.facing || [],
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
        car_spaces: form.car_spaces === '' ? null : Number(form.car_spaces),
        land_size: form.land_size,
        features: form.features,
        facing: form.facing,
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
        <SuburbAutocomplete suburbs={suburbs} value={form.suburb_id} onChange={(id) => set('suburb_id', id)} required disabled={!!lockedSuburbId} />
      </label>
      <label>Price
        <CurrencyInput value={form.price} onChange={(v) => set('price', v)} required />
      </label>
      <label>Property type
        <select value={form.property_type} onChange={(e) => set('property_type', e.target.value)} required>
          {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <div className="form-row-3">
        <label>Bedrooms
          <input type="number" min="0" value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} required />
        </label>
        <label>Bathrooms
          <input type="number" min="0" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} required />
        </label>
        <label>Car spaces
          <input type="number" min="0" value={form.car_spaces} onChange={(e) => set('car_spaces', e.target.value)} />
        </label>
      </div>
      <label>Approx land size (optional)
        <input type="text" placeholder="e.g. 600m²" value={form.land_size} onChange={(e) => set('land_size', e.target.value)} />
      </label>
      <label>Features (optional)
        <CheckboxGroup options={FEATURES} values={form.features} onChange={(v) => set('features', v)} />
      </label>
      <label>Facing (optional)
        <CheckboxGroup options={FACINGS} values={form.facing} onChange={(v) => set('facing', v)} />
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
