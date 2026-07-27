import React, { useState } from 'react';
import CurrencyInput from './CurrencyInput';
import SuburbAutocomplete from './SuburbAutocomplete';
import CheckboxGroup from './CheckboxGroup';

const PROPERTY_TYPES = ['House', 'Apartment', 'Townhouse', 'Villa', 'Land', 'Waterfront', 'Penthouse'];
const FEATURES = ['Penthouse', 'Sub-penthouse', 'Waterfront', 'Pool', 'Multi-level'];
const FACINGS = ['North', 'East', 'South', 'West'];
const DURATIONS = [
  { days: 3, label: '3 days' },
  { days: 7, label: '1 week' },
  { days: 14, label: '2 weeks' },
  { days: 30, label: '1 month' },
];

export default function BuyerForm({ suburbs, lockedSuburbId, initial, onSubmit, onCancel }) {
  const isEdit = !!initial?.id;
  const initialSuburbIds = initial?.suburbs?.map(s => s.id) || (lockedSuburbId ? [lockedSuburbId] : []);
  const [form, setForm] = useState({
    suburb_id_1: initialSuburbIds[0] || lockedSuburbId || '',
    suburb_id_2: initialSuburbIds[1] || '',
    suburb_id_3: initialSuburbIds[2] || '',
    max_price: initial?.max_price || '',
    property_type: initial?.property_type || 'House',
    min_bedrooms: initial?.min_bedrooms ?? '',
    min_bathrooms: initial?.min_bathrooms ?? '',
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
    const suburb_ids = [form.suburb_id_1, form.suburb_id_2, form.suburb_id_3]
      .filter(Boolean)
      .map(Number);
    setBusy(true);
    try {
      await onSubmit({
        suburb_ids,
        max_price: Number(form.max_price),
        property_type: form.property_type,
        min_bedrooms: Number(form.min_bedrooms),
        min_bathrooms: Number(form.min_bathrooms),
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
      <label>Suburb (up to 3)
        <SuburbAutocomplete
          suburbs={suburbs}
          value={form.suburb_id_1}
          onChange={(id) => set('suburb_id_1', id)}
          excludeIds={[form.suburb_id_2, form.suburb_id_3]}
          required
          disabled={!!lockedSuburbId}
        />
      </label>
      <label>2nd suburb (optional)
        <SuburbAutocomplete
          suburbs={suburbs}
          value={form.suburb_id_2}
          onChange={(id) => set('suburb_id_2', id)}
          excludeIds={[form.suburb_id_1, form.suburb_id_3]}
          placeholder="— None —"
        />
      </label>
      <label>3rd suburb (optional)
        <SuburbAutocomplete
          suburbs={suburbs}
          value={form.suburb_id_3}
          onChange={(id) => set('suburb_id_3', id)}
          excludeIds={[form.suburb_id_1, form.suburb_id_2]}
          placeholder="— None —"
        />
      </label>
      <label>Max price (budget)
        <CurrencyInput value={form.max_price} onChange={(v) => set('max_price', v)} required />
      </label>
      <label>Property type
        <select value={form.property_type} onChange={(e) => set('property_type', e.target.value)} required>
          {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <div className="form-row-3">
        <label>Min bedrooms
          <input type="number" min="0" value={form.min_bedrooms} onChange={(e) => set('min_bedrooms', e.target.value)} required />
        </label>
        <label>Min bathrooms
          <input type="number" min="0" value={form.min_bathrooms} onChange={(e) => set('min_bathrooms', e.target.value)} required />
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
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save buyer'}</button>
      </div>
    </form>
  );
}
