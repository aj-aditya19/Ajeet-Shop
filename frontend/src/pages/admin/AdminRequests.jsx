import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { getRequests } from '../../services/requestApi';
import { getServices } from '../../services/serviceApi';
import { EmptyState, ErrorState, Pagination, Spinner, StatusBadge } from '../../components/ui';
import { formatDate } from '../../utils/format';

const STATUSES = ['pending', 'accepted', 'in_progress', 'ready', 'completed', 'rejected'];

export default function AdminRequests() {
  const [f, setF] = useState({ search: '', status: '', service: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const search = useDebounce(f.search);
  const { data: services } = useAsync(() => getServices(true), []);
  const { data, loading, error, reload } = useAsync(() => getRequests({ ...f, search, page, limit: 10 }), [search, f.status, f.service, f.from, f.to, page]);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setPage(1); };
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Service Requests</h1>
      <div className="card mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input className="input" placeholder="Search ID, name, phone" value={f.search} onChange={set('search')} />
        <select className="input" value={f.status} onChange={set('status')}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select>
        <select className="input" value={f.service} onChange={set('service')}><option value="">All services</option>{(services || []).map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</select>
        <input type="date" className="input" value={f.from} onChange={set('from')} aria-label="From date" />
        <input type="date" className="input" value={f.to} onChange={set('to')} aria-label="To date" />
      </div>
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : !data.items.length ? <div className="card"><EmptyState title="No requests found" hint="Try changing the filters." /></div> : (
        <>
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Request ID</th><th>Customer</th><th>Phone</th><th>Service</th><th>Date</th><th>Status</th><th>Files</th><th /></tr></thead>
            <tbody>{data.items.map((r) => (
              <tr key={r._id}><td className="font-medium">{r.requestId}</td><td>{r.contact.name}</td><td>{r.contact.phone}</td><td>{r.service?.name}</td>
                <td>{formatDate(r.createdAt)}</td><td><StatusBadge status={r.status} /></td><td>{r.uploadedFiles?.length || 0}</td>
                <td><Link className="text-brand-700 hover:underline" to={`/admin/shop/requests/${r._id}`}>Open</Link></td></tr>
            ))}</tbody></table></div>
          <Pagination pagination={data.pagination} onPage={setPage} />
        </>
      )}
    </div>
  );
}
