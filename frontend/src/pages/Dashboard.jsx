import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { suburbsApi } from '../services/api';

export default function Dashboard() {
  const [suburbs, setSuburbs] = useState([]);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    suburbsApi.list()
      .then(setSuburbs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const hasActivity = (s) => Number(s.listing_count) > 0 || Number(s.buyer_count) > 0;

  const filtered = suburbs
    .filter(s => showAll || hasActivity(s))
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="page-loading">Loading suburbs…</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <input
          className="search-input"
          type="text"
          placeholder="Search suburb…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {error && <div className="auth-error">{error}</div>}
      <label className="show-all-toggle">
        <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
        Show all Gold Coast suburbs (including ones with no activity)
      </label>
      <div className="suburb-grid">
        {filtered.map(s => (
          <Link key={s.id} to={`/suburbs/${s.id}`} className="suburb-card">
            <div className="suburb-card-name">{s.name}</div>
            <div className="suburb-card-stats">
              <span className="stat-listings">{s.listing_count} listing{s.listing_count === '1' ? '' : 's'}</span>
              <span className="stat-buyers">{s.buyer_count} buyer{s.buyer_count === '1' ? '' : 's'}</span>
            </div>
          </Link>
        ))}
        {!filtered.length && !showAll && (
          <p className="empty-state">No suburbs with active listings or buyers yet. <button className="link-btn" onClick={() => setShowAll(true)}>Show all suburbs</button> to add one.</p>
        )}
        {!filtered.length && showAll && <p className="empty-state">No suburbs match "{search}"</p>}
      </div>
    </div>
  );
}
