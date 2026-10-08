import api, { unwrap } from './api';
export const getAdminDashboard = () => api.get('/admin/dashboard').then(unwrap);
export const getCustomers = (params) => api.get('/admin/customers', { params }).then(unwrap);
export const getCustomer = (id) => api.get(`/admin/customers/${id}`).then(unwrap);
