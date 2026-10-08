// All JWT persistence lives here. To migrate to httpOnly cookies later, make these no-ops,
// set `withCredentials: true` in services/api.js and have the backend set the cookie.
const KEY = 'ads_token';
export const getToken = () => localStorage.getItem(KEY);
export const setToken = (t) => localStorage.setItem(KEY, t);
export const clearToken = () => localStorage.removeItem(KEY);
