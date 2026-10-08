import axios from 'axios';
import { clearToken, getToken } from '../utils/tokenStorage';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 30000 });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url = err.config?.url || '';
    // 401 on a protected call = expired/invalid session. (Login endpoints legitimately return 401.)
    if (status === 401 && !url.includes('/auth/login') && !url.includes('/auth/admin/login')) {
      clearToken();
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(err);
  }
);

export const unwrap = (res) => res.data.data;

export function getErrorMessage(err) {
  const d = err.response?.data;
  if (err.response?.status === 403) return d?.message || 'You do not have permission to do that.';
  if (err.response?.status >= 500) return 'Something went wrong on the server. Please try again.';
  if (!err.response) return 'Cannot reach the server. Check your connection.';
  const first = d?.errors?.[0]?.message;
  return first && d.message === 'Validation failed' ? first : d?.message || 'Request failed';
}

export default api;
