import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('gc_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('gc_token');
    if (!token) { setLoading(false); return; }
    authApi.me()
      .then((me) => { setUser(me); localStorage.setItem('gc_user', JSON.stringify(me)); })
      .catch(() => { localStorage.removeItem('gc_token'); localStorage.removeItem('gc_user'); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  function persist({ token, user }) {
    localStorage.setItem('gc_token', token);
    localStorage.setItem('gc_user', JSON.stringify(user));
    setUser(user);
  }

  async function login(email, password) {
    persist(await authApi.login({ email, password }));
  }

  async function register(name, email, password) {
    persist(await authApi.register({ name, email, password }));
  }

  function logout() {
    localStorage.removeItem('gc_token');
    localStorage.removeItem('gc_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
