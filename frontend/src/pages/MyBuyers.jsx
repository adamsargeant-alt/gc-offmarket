import React, { useEffect, useState } from 'react';
import { buyersApi, suburbsApi } from '../services/api';
import Modal from '../components/Modal';
import BuyerForm from '../components/BuyerForm';

const money = (n) => `$${Number(n).toLocaleString()}`;

export default function MyBuyers() {
  const [buyers, setBuyers] = useState([]);
  const [suburbs, setSuburbs] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    const [mine, allSuburbs] = await Promise.all([buyersApi.mine(), suburbsApi.list()]);
    setBuyers(mine);
    setSuburbs(allSuburbs);
  }

  useEffect(() => { load().catch((err) => setError(err.message)); }, []);

  async function handleSave(payload) {
    if (editing?.id) await buyersApi.update(editing.id, payload);
    else await buyersApi.create(payload);
    setEditing(null);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this buyer?')) return;
    await buyersApi.delete(id);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <h1>My Buyers</h1>
        <button className="btn btn-primary" onClick={() => setEditing({})}>+ Add buyer</button>
      </div>
      {error && <div className="auth-error">{error}</div>}
      {!buyers.length && <p className="empty-state">You haven't added any buyers yet.</p>}
      <div className="record-table">
        {buyers.map(b => (
          <div key={b.id} className="record-row">
            <div className="record-main">
              <strong>{b.suburb_name}</strong> · up to {money(b.max_price)} · {b.property_type} · {b.min_bedrooms}+ bed / {b.min_bathrooms}+ bath
              {b.status !== 'active' && <span className="status-pill">{b.status}</span>}
            </div>
            <div className="record-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(b)}>Edit</button>
              <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(b.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {editing !== null && (
        <Modal title={editing.id ? 'Edit buyer' : 'Add buyer'} onClose={() => setEditing(null)}>
          <BuyerForm suburbs={suburbs} initial={editing} onSubmit={handleSave} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}
