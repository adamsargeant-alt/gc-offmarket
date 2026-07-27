import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('gc_token');
      localStorage.removeItem('gc_user');
      if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
    }
    const msg = err.response?.data?.error || err.message || 'Request failed';
    return Promise.reject(new Error(msg));
  }
);

// ── Auth ────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// ── Suburbs ──────────────────────────────────────────────────────────
export const suburbsApi = {
  list: () => api.get('/suburbs'),
  get: (id) => api.get(`/suburbs/${id}`),
};

// ── Listings ─────────────────────────────────────────────────────────
export const listingsApi = {
  mine: () => api.get('/listings/mine'),
  create: (data) => api.post('/listings', data),
  update: (id, data) => api.put(`/listings/${id}`, data),
  delete: (id) => api.delete(`/listings/${id}`),
};

// ── Buyers ───────────────────────────────────────────────────────────
export const buyersApi = {
  mine: () => api.get('/buyers/mine'),
  create: (data) => api.post('/buyers', data),
  update: (id, data) => api.put(`/buyers/${id}`, data),
  delete: (id) => api.delete(`/buyers/${id}`),
};

// ── Users (admin) ──────────────────────────────────────────────────
export const usersApi = {
  list: () => api.get('/users'),
  delete: (id) => api.delete(`/users/${id}`),
};

export default api;
