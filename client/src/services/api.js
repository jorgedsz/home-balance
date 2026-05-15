import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('hb_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (password) => api.post('/auth/login', { password })
};

export const accountsAPI = {
  list: () => api.get('/accounts'),
  create: (data) => api.post('/accounts', data),
  update: (id, data) => api.patch(`/accounts/${id}`, data),
  remove: (id) => api.delete(`/accounts/${id}`)
};

export const billsAPI = {
  list: () => api.get('/bills'),
  create: (data) => api.post('/bills', data),
  update: (id, data) => api.patch(`/bills/${id}`, data),
  remove: (id) => api.delete(`/bills/${id}`)
};

export const transactionsAPI = {
  list: (params) => api.get('/transactions', { params }),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.patch(`/transactions/${id}`, data),
  togglePaid: (id) => api.post(`/transactions/${id}/toggle-paid`),
  remove: (id) => api.delete(`/transactions/${id}`)
};

export const overviewAPI = {
  get: (months = 6) => api.get('/overview', { params: { months } })
};

export default api;
