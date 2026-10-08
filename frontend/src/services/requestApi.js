import api, { unwrap } from './api';

export const createRequest = (formData) =>
  api.post('/requests', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(unwrap);
export const getRequests = (params) => api.get('/requests', { params }).then(unwrap);
export const getRequestStats = () => api.get('/requests/stats').then(unwrap);
export const getRequest = (id) => api.get(`/requests/${id}`).then(unwrap).then((d) => d.request);
export const updateRequestStatus = (id, body) => api.patch(`/requests/${id}/status`, body).then(unwrap).then((d) => d.request);

// Authenticated file open: fetch as blob (the API needs the JWT header), then open in a new tab.
export async function openFile(file) {
  const res = await api.get(`/uploads/${file._id}/download`, { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([res.data], { type: file.mimeType }));
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener';
  a.download = file.originalName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
