import React, { useEffect, useState } from 'react';
import { listingsApi, suburbsApi } from '../services/api';
import Modal from '../components/Modal';
import ListingForm from '../components/ListingForm';

const money = (n) => `$${Number(n).toLocaleString()}`;
const daysLeft = (expiresAt) => Math.max(0, Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24)));

export default function MyListings() {
  const [listings, setListings] = useState([]);
  const [suburbs, setSuburbs] = useState([]);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {...} = edit
  const [error, setError] = useState('');

  async function load() {
    const [mine, allSuburbs] = await Promise.all([listingsApi.mine(), suburbsApi.list()]);
    setListings(mine);
    setSuburbs(allSuburbs);
  }

  useEffect(() => { load().catch((err) => setError(err.message)); }, []);

  async function handleSave(payload) {
    if (editing?.id) await listingsApi.update(editing.id, payload);
    else await listingsApi.create(payload);
    setEditing(null);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this listing?')) return;
    await listingsApi.delete(id);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <h1>My Listings</h1>
        <button className="btn btn-primary" onClick={() => setEditing({})}>+ Add listing</button>
      </div>
      {error && <div className="auth-error">{error}</div>}
      {!listings.length && <p className="empty-state">You haven't added any listings yet.</p>}
      <div className="record-table">
        {listings.map(l => (
          <div key={l.id} className="record-row">
            <div className="record-main">
              <strong>{l.suburb_name}</strong> · {money(l.price)} · {l.property_type} · {l.bedrooms} bed / {l.bathrooms} bath
              {l.status !== 'active' && <span className="status-pill">{l.status}</span>}
              <span className="status-pill">expires in {daysLeft(l.expires_at)}d</span>
            </div>
            <div className="record-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(l)}>Edit</button>
              <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(l.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {editing !== null && (
        <Modal title={editing.id ? 'Edit listing' : 'Add listing'} onClose={() => setEditing(null)}>
          <ListingForm suburbs={suburbs} initial={editing} onSubmit={handleSave} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}
