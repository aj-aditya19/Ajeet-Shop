import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, FileText, Users, Wrench, Package, ClipboardList, BarChart3, UserSquare, LogOut, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OverdueAlerts from '../components/OverdueAlerts';

const GROUPS = [
  ['Shop', [
    ['/admin/dashboard', 'Dashboard', LayoutDashboard], ['/admin/shop/requests', 'Requests', FileText],
    ['/admin/shop/customers', 'Customers', Users], ['/admin/shop/services', 'Services', Wrench], ['/admin/shop/photo-studio', 'Passport Photo', Camera],
  ]],
  ['Catering', [
    ['/admin/catering', 'Catering Dashboard', LayoutDashboard], ['/admin/catering/rentals', 'Rentals', ClipboardList],
    ['/admin/catering/equipment', 'Equipment', Package], ['/admin/catering/clients', 'Clients', UserSquare],
    ['/admin/catering/reports', 'Reports', BarChart3],
  ]],
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const cls = ({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`;
  return (
    <div className="min-h-screen md:flex">
      <div className="flex items-center justify-between border-b bg-white px-4 py-3 md:hidden">
        <span className="font-bold text-brand-700">Admin</span>
        <button onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
      </div>
      <aside className={`${open ? 'block' : 'hidden'} w-full shrink-0 border-r border-slate-200 bg-white p-4 md:block md:w-60`}>
        <p className="mb-4 hidden text-lg font-bold text-brand-700 md:block">Ajeet Digital Admin</p>
        {GROUPS.map(([title, links]) => (
          <div key={title} className="mb-5">
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
            {links.map(([to, label, Icon]) => (
              <NavLink key={to} to={to} end className={cls} onClick={() => setOpen(false)}><Icon className="h-4 w-4" />{label}</NavLink>
            ))}
          </div>
        ))}
        <div className="border-t pt-3 text-xs text-slate-500">
          <p className="mb-2 truncate">{user?.email}</p>
          <button className="btn-secondary btn-sm w-full" onClick={async () => { await logout(); nav('/admin/login'); }}><LogOut className="h-3.5 w-3.5" />Logout</button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8"><OverdueAlerts /><Outlet /></main>
    </div>
  );
}
