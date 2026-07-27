import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { suburbsApi } from '../services/api';

export default function Dashboard() {
  const [suburbs, setSuburbs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    suburbsApi.list()
      .then(setSuburbs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = suburbs.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="page-loading">Loading suburbs…</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Suburbs</h1>
        <input
          className="search-input"
          type="text"
          placeholder="Search suburb…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {error && <div className="auth-error">{error}</div>}
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
        {!filtered.length && <p className="empty-state">No suburbs match "{search}"</p>}
      </div>
    </div>
  );
}
