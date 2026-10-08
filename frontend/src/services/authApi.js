import api, { unwrap } from './api';
export const registerUser = (body) => api.post('/auth/register', body).then(unwrap);
export const loginUser = (body) => api.post('/auth/login', body).then(unwrap);
export const loginAdmin = (body) => api.post('/auth/admin/login', body).then(unwrap);
export const fetchMe = () => api.get('/auth/me').then(unwrap);
export const logoutApi = () => api.post('/auth/logout').catch(() => {});
