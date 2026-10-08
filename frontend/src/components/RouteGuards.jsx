import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './ui';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/shop/login" state={{ from: location.pathname + location.search }} replace />;
  return children;
}

export function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/shop/dashboard" replace />; // UI guard only; the API enforces 403
  return children;
}
