import api, { unwrap } from './api';
export const getServices = (all = false) => api.get('/services', { params: all ? { all: true } : {} }).then(unwrap).then((d) => d.items);
export const createService = (body) => api.post('/services', body).then(unwrap);
export const updateService = (id, body) => api.put(`/services/${id}`, body).then(unwrap);
export const setServiceActive = (id, active) => api.patch(`/services/${id}/active`, { active }).then(unwrap);
export const getBusiness = () => api.get('/config/business').then(unwrap);
