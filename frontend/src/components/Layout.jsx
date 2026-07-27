import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">GC Off-Market</div>
        <nav className="topbar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>Suburbs</NavLink>
          <NavLink to="/my-listings" className={({ isActive }) => isActive ? 'active' : ''}>My Listings</NavLink>
          <NavLink to="/my-buyers" className={({ isActive }) => isActive ? 'active' : ''}>My Buyers</NavLink>
        </nav>
        <div className="topbar-user">
          <span>{user?.first_name} {user?.last_name}{user?.role === 'admin' ? ' · Admin' : ''}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Log out</button>
        </div>
      </header>
      <main className="main-area">
        <Outlet />
      </main>
    </div>
  );
}
