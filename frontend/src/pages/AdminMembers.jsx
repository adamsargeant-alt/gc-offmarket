import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../services/api';

export default function AdminMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setMembers(await usersApi.list());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(member) {
    if (!confirm(`Delete ${member.first_name} ${member.last_name}? This also deletes all their listings and buyers.`)) return;
    try {
      await usersApi.delete(member.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  if (loading) return <div className="page-loading">Loading members…</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Members</h1>
      </div>
      {error && <div className="auth-error">{error}</div>}
      <div className="record-table">
        {members.map(m => (
          <div key={m.id} className="record-row">
            <div className="record-main">
              <strong>{m.first_name} {m.last_name}</strong>{m.team ? ` (${m.team})` : ''} · {m.email} · <a href={`tel:${m.mobile_number}`}>{m.mobile_number}</a>
              {m.role === 'admin' && <span className="status-pill">Admin</span>}
            </div>
            <div className="record-actions">
              {m.id !== user.id && (
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(m)}>Delete</button>
              )}
            </div>
          </div>
        ))}
        {!members.length && <p className="empty-state">No members yet.</p>}
      </div>
    </div>
  );
}
