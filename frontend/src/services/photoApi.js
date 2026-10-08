import api, { unwrap } from './api';

export const processPhoto = (file) => {
  const fd = new FormData();
  fd.append('photo', file);
  return api.post('/photo-studio/process', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 180000 }).then(unwrap);
};

export const createSheet = (blob, { copies, paper }) => {
  const fd = new FormData();
  fd.append('photo', blob, 'photo.jpg');
  fd.append('copies', String(copies));
  fd.append('paper', paper);
  return api.post('/photo-studio/sheet', fd, { headers: { 'Content-Type': 'multipart/form-data' }, responseType: 'blob' }).then((r) => r.data);
};
