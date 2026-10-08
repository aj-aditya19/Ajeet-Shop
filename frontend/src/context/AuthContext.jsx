import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMe, loginAdmin, loginUser, logoutApi, registerUser } from '../services/authApi';
import { clearToken, getToken, setToken } from '../utils/tokenStorage';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    fetchMe().then((d) => setUser(d.user)).catch(() => clearToken()).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const finish = useCallback((d) => { setToken(d.token); setUser(d.user); return d.user; }, []);
  const value = useMemo(() => ({
    user, loading,
    isAdmin: user?.role === 'admin',
    login: async (b) => finish(await loginUser(b)),
    adminLogin: async (b) => finish(await loginAdmin(b)),
    register: async (b) => finish(await registerUser(b)),
    logout: async () => { await logoutApi(); clearToken(); setUser(null); },
  }), [user, loading, finish]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
