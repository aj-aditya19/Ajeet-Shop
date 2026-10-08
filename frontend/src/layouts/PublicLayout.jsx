import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, MapPin, Phone, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';

function ScrollToHash() {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (hash) setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 50);
    else window.scrollTo(0, 0);
  }, [hash, pathname]);
  return null;
}

export default function PublicLayout({ variant = 'shop' }) {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const b = useBusiness();
  const nav = useNavigate();
  const link = 'rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:text-brand-700';
  const active = ({ isActive }) => `${link} ${isActive ? 'text-brand-700' : ''}`;
  const close = () => setOpen(false);

  const items = variant === 'shop'
    ? [['Home', '/shop'], ['Services', '/shop#services'], ['How It Works', '/shop#how-it-works'], ['Contact', '/shop/contact']]
    : [['Equipment', '/catering#equipment'], ['Contact', '/catering#contact'], ['Shop', '/shop']];

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToHash />
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to={variant === 'shop' ? '/shop' : '/catering'} className="text-lg font-bold text-brand-700" onClick={close}>
            {variant === 'shop' ? b.name : b.cateringName}
          </Link>
          <button className="md:hidden" aria-label="Menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
          <nav className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-full flex-col gap-1 border-b bg-white p-4 md:static md:flex md:flex-row md:items-center md:border-0 md:p-0`}>
            {items.map(([label, to]) => (to.includes('#')
              ? <Link key={label} to={to} className={link} onClick={close}>{label}</Link>
              : <NavLink key={label} to={to} end className={active} onClick={close}>{label}</NavLink>))}
            {variant === 'shop' && (user ? (
              <>
                <NavLink to={isAdmin ? '/admin/dashboard' : '/shop/dashboard'} className={active} onClick={close}>{isAdmin ? 'Admin' : 'Dashboard'}</NavLink>
                <button className="btn-secondary btn-sm" onClick={async () => { await logout(); close(); nav('/shop'); }}>Logout</button>
              </>
            ) : (
              <>
                <NavLink to="/shop/login" className={active} onClick={close}>Login</NavLink>
                <Link to="/shop/register" className="btn-primary btn-sm" onClick={close}>Register</Link>
                <Link to="/admin/login" className="text-xs text-slate-500 hover:text-brand-700 md:ml-2" onClick={close}>Staff Login</Link>
              </>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1"><Outlet /></main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm text-slate-600 md:grid-cols-3">
          <div><p className="font-semibold text-slate-900">{b.name}</p><p>Printing, Documentation, Digital Services &amp; Catering Equipment Rental</p></div>
          <p className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /><span>{b.address.join(', ')}</span></p>
          <div className="space-y-1">
            <p className="flex gap-2"><Phone className="h-4 w-4" />{b.phones.join(' / ')}</p>
            <p className="flex gap-2"><Mail className="h-4 w-4" />{b.email}</p>
          </div>
        </div>
        <p className="border-t py-3 text-center text-xs text-slate-500">&copy; {new Date().getFullYear()} {b.name}. Owner: {b.owner}</p>
      </footer>
    </div>
  );
}
