import { Loader2, Inbox, AlertCircle } from 'lucide-react';
import { statusLabel } from '../utils/format';

export const Spinner = ({ label = 'Loading...' }) => (
  <div className="flex items-center justify-center gap-2 py-12 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />{label}</div>
);
export const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
    <AlertCircle className="h-6 w-6" />{message}
    {onRetry && <button className="btn-secondary btn-sm" onClick={onRetry}>Try again</button>}
  </div>
);
export const EmptyState = ({ title = 'Nothing here yet', hint }) => (
  <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-500">
    <Inbox className="h-8 w-8" /><p className="font-medium text-slate-700">{title}</p>{hint && <p className="text-sm">{hint}</p>}
  </div>
);
export const Alert = ({ type = 'error', children }) =>
  children ? (
    <div className={`rounded-lg border px-3 py-2 text-sm ${type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>{children}</div>
  ) : null;

const COLORS = {
  pending: 'bg-amber-100 text-amber-800', accepted: 'bg-blue-100 text-blue-800', in_progress: 'bg-indigo-100 text-indigo-800',
  ready: 'bg-teal-100 text-teal-800', completed: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800',
  active: 'bg-blue-100 text-blue-800', due: 'bg-amber-100 text-amber-800', overdue: 'bg-red-100 text-red-800',
  returned: 'bg-green-100 text-green-800', cancelled: 'bg-slate-200 text-slate-700',
};
export const StatusBadge = ({ status }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[status] || 'bg-slate-100 text-slate-700'}`}>{statusLabel(status)}</span>
);

export function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages, total } = pagination;
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
      <span>{total} total</span>
      <div className="flex items-center gap-2">
        <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
        <span>Page {page} of {pages}</span>
        <button className="btn-secondary btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}

export const Field = ({ label, error, children, hint }) => (
  <div>
    {label && <label className="label">{label}</label>}
    {children}
    {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    {error && <p className="field-error">{error}</p>}
  </div>
);

export const StatCard = ({ label, value, tone = 'text-slate-900' }) => (
  <div className="card"><p className="text-sm text-slate-500">{label}</p><p className={`mt-1 text-3xl font-semibold ${tone}`}>{value ?? '-'}</p></div>
);
