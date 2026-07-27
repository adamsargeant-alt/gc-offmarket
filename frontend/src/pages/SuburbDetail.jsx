import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { suburbsApi, listingsApi, buyersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ListingForm from '../components/ListingForm';
import BuyerForm from '../components/BuyerForm';

const money = (n) => `$${Number(n).toLocaleString()}`;

function canManage(entity, user) {
  return user && (user.role === 'admin' || entity.agent_id === user.id);
}

function daysLeft(expiresAt) {
  return Math.max(0, Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24)));
}

export default function SuburbDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [showListingForm, setShowListingForm] = useState(false);
  const [showBuyerForm, setShowBuyerForm] = useState(false);

  async function load() {
    try {
      setData(await suburbsApi.get(id));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleCreateListing(payload) {
    await listingsApi.create(payload);
    setShowListingForm(false);
    load();
  }

  async function handleCreateBuyer(payload) {
    await buyersApi.create(payload);
    setShowBuyerForm(false);
    load();
  }

  async function handleDeleteListing(listingId) {
    if (!confirm('Delete this listing?')) return;
    await listingsApi.delete(listingId);
    load();
  }

  async function handleDeleteBuyer(buyerId) {
    if (!confirm('Delete this buyer?')) return;
    await buyersApi.delete(buyerId);
    load();
  }

  if (error) return <div className="auth-error">{error}</div>;
  if (!data) return <div className="page-loading">Loading…</div>;

  const { suburb, listings, buyers } = data;

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/dashboard" className="back-link">← All suburbs</Link>
          <h1>{suburb.name}</h1>
        </div>
      </div>

      <div className="suburb-columns">
        <section className="suburb-column">
          <div className="column-header">
            <h2>Off-market listings ({listings.length})</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setShowListingForm(true)}>+ Add listing</button>
          </div>
          {!listings.length && <p className="empty-state">No listings in {suburb.name} yet.</p>}
          {listings.map(l => (
            <div key={l.id} className={`entity-card${l.status !== 'active' ? ' withdrawn' : ''}`}>
              <div className="entity-card-main">
                <div className="entity-price">{money(l.price)}</div>
                <div className="entity-tags">
                  <span>{l.property_type}</span>
                  <span>{l.bedrooms} bed</span>
                  <span>{l.bathrooms} bath</span>
                </div>
                {l.notes && <div className="entity-notes">{l.notes}</div>}
                <div className="entity-agent">Listed by {l.agent_name}{l.agent_team ? ` (${l.agent_team})` : ''} · <a href={`tel:${l.agent_mobile}`}>{l.agent_mobile}</a> · expires in {daysLeft(l.expires_at)}d</div>
              </div>
              <div className="entity-card-side">
                {l.matching_buyer_ids.length > 0
                  ? <span className="match-badge">{l.matching_buyer_ids.length} matching buyer{l.matching_buyer_ids.length === 1 ? '' : 's'}</span>
                  : <span className="match-badge muted">No matches yet</span>}
                {canManage(l, user) && (
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteListing(l.id)}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </section>

        <section className="suburb-column">
          <div className="column-header">
            <h2>Buyers looking ({buyers.length})</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setShowBuyerForm(true)}>+ Add buyer</button>
          </div>
          {!buyers.length && <p className="empty-state">No buyers registered for {suburb.name} yet.</p>}
          {buyers.map(b => (
            <div key={b.id} className={`entity-card${b.status !== 'active' ? ' withdrawn' : ''}`}>
              <div className="entity-card-main">
                <div className="entity-price">Up to {money(b.max_price)}</div>
                <div className="entity-tags">
                  <span>{b.property_type}</span>
                  <span>{b.min_bedrooms}+ bed</span>
                  <span>{b.min_bathrooms}+ bath</span>
                </div>
                {b.notes && <div className="entity-notes">{b.notes}</div>}
                <div className="entity-agent">Buyer via {b.agent_name}{b.agent_team ? ` (${b.agent_team})` : ''} · <a href={`tel:${b.agent_mobile}`}>{b.agent_mobile}</a> · expires in {daysLeft(b.expires_at)}d</div>
              </div>
              <div className="entity-card-side">
                {b.matching_listing_ids.length > 0
                  ? <span className="match-badge">{b.matching_listing_ids.length} matching listing{b.matching_listing_ids.length === 1 ? '' : 's'}</span>
                  : <span className="match-badge muted">No matches yet</span>}
                {canManage(b, user) && (
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteBuyer(b.id)}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </section>
      </div>

      {showListingForm && (
        <Modal title={`Add listing in ${suburb.name}`} onClose={() => setShowListingForm(false)}>
          <ListingForm suburbs={[suburb]} lockedSuburbId={suburb.id} onSubmit={handleCreateListing} onCancel={() => setShowListingForm(false)} />
        </Modal>
      )}
      {showBuyerForm && (
        <Modal title={`Add buyer for ${suburb.name}`} onClose={() => setShowBuyerForm(false)}>
          <BuyerForm suburbs={[suburb]} lockedSuburbId={suburb.id} onSubmit={handleCreateBuyer} onCancel={() => setShowBuyerForm(false)} />
        </Modal>
      )}
    </div>
  );
}
