import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/api';
import { Alert, Field } from '../../components/ui';

export default function AdminLogin() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { adminLogin, user, isAdmin } = useAuth();
  const nav = useNavigate();
  const [err, setErr] = useState('');
  if (user && isAdmin) return <Navigate to="/admin/dashboard" replace />;
  const onSubmit = async (v) => {
    setErr('');
    try { await adminLogin(v); nav('/admin/dashboard', { replace: true }); } catch (e) { setErr(getErrorMessage(e)); }
  };
  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <form onSubmit={handleSubmit(onSubmit)} className="card w-full space-y-4" noValidate>
        <h1 className="text-2xl font-bold">Admin Login</h1>
        <Alert>{err}</Alert>
        <Field label="Email" error={errors.email?.message}><input type="email" className="input" {...register('email', { required: 'Email is required' })} /></Field>
        <Field label="Password" error={errors.password?.message}><input type="password" className="input" {...register('password', { required: 'Password is required' })} /></Field>
        <button className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Login'}</button>
      </form>
    </div>
  );
}
