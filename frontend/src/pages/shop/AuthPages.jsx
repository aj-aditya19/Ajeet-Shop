import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/api';
import { Alert, Field } from '../../components/ui';

const Shell = ({ title, children, footer }) => (
  <div className="mx-auto max-w-md px-4 py-12"><div className="card"><h1 className="mb-5 text-2xl font-bold">{title}</h1>{children}</div><p className="mt-4 text-center text-sm text-slate-600">{footer}</p></div>
);

export function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { login } = useAuth();
  const nav = useNavigate();
  const { state } = useLocation();
  const [err, setErr] = useState('');
  const onSubmit = async (v) => {
    setErr('');
    try { const u = await login(v); nav(u.role === 'admin' ? '/admin/dashboard' : state?.from || '/shop/dashboard', { replace: true }); }
    catch (e) { setErr(getErrorMessage(e)); }
  };
  return (
    <Shell title="Login" footer={<>New here? <Link className="text-brand-700 underline" to="/shop/register">Create an account</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Alert>{err}</Alert>
        <Field label="Email" error={errors.email?.message}><input type="email" className="input" autoComplete="email" {...register('email', { required: 'Email is required' })} /></Field>
        <Field label="Password" error={errors.password?.message}><input type="password" className="input" autoComplete="current-password" {...register('password', { required: 'Password is required' })} /></Field>
        <button className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Login'}</button>
      </form>
    </Shell>
  );
}

export function Register() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { register: signUp } = useAuth();
  const nav = useNavigate();
  const [err, setErr] = useState('');
  const onSubmit = async (v) => {
    setErr('');
    try { await signUp(v); nav('/shop/dashboard', { replace: true }); } catch (e) { setErr(getErrorMessage(e)); }
  };
  return (
    <Shell title="Create account" footer={<>Already registered? <Link className="text-brand-700 underline" to="/shop/login">Login</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Alert>{err}</Alert>
        <Field label="Full name" error={errors.name?.message}><input className="input" autoComplete="name" {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Too short' } })} /></Field>
        <Field label="Email" error={errors.email?.message}><input type="email" className="input" autoComplete="email" {...register('email', { required: 'Email is required' })} /></Field>
        <Field label="Mobile number" error={errors.phone?.message}><input type="tel" inputMode="numeric" className="input" autoComplete="tel" {...register('phone', { required: 'Mobile number is required', pattern: { value: /^(\+?91)?[6-9]\d{9}$/, message: 'Enter a valid 10-digit mobile number' } })} /></Field>
        <Field label="Password" error={errors.password?.message} hint="At least 8 characters with a letter and a number">
          <input type="password" className="input" autoComplete="new-password" {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'At least 8 characters' }, validate: (v) => (/[A-Za-z]/.test(v) && /\d/.test(v)) || 'Use letters and numbers' })} />
        </Field>
        <button className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Register'}</button>
      </form>
    </Shell>
  );
}
