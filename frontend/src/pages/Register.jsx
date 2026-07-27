import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '', last_name: '', team: '', mobile_number: '', email: '', password: '',
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
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>GC Off-Market</h1>
        <p className="auth-subtitle">Create your agent account</p>
        {error && <div className="auth-error">{error}</div>}
        <div className="form-row">
          <label>First name
            <input type="text" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} required autoFocus />
          </label>
          <label>Last name
            <input type="text" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} required />
          </label>
        </div>
        <label>Team (optional)
          <input type="text" value={form.team} onChange={(e) => set('team', e.target.value)} />
        </label>
        <label>Mobile number
          <input type="tel" value={form.mobile_number} onChange={(e) => set('mobile_number', e.target.value)} required />
        </label>
        <label>Email
          <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
        </label>
        <label>Password
          <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={8} />
        </label>
        <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
