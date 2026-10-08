import { Link, useParams } from 'react-router-dom';
import useAsync from '../../hooks/useAsync';
import { getCustomer } from '../../services/adminApi';
import { EmptyState, ErrorState, Spinner, StatusBadge } from '../../components/ui';
import { formatDate } from '../../utils/format';

export default function AdminCustomerDetail() {
  const { id } = useParams();
  const { data, loading, error, reload } = useAsync(() => getCustomer(id), [id]);
  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const c = data.customer;
  return (
    <div className="max-w-4xl space-y-5">
      <Link to="/admin/shop/customers" className="text-sm text-brand-700 hover:underline">&larr; Back to customers</Link>
      <div className="card"><h1 className="text-2xl font-bold">{c.name}</h1><p className="mt-1 text-sm text-slate-600">{c.phone} &middot; {c.email} &middot; registered {formatDate(c.createdAt)}</p></div>
      <h2 className="text-lg font-semibold">Request history</h2>
      {!data.requests.length ? <div className="card"><EmptyState title="No requests yet" /></div> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>Request ID</th><th>Service</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>{data.requests.map((r) => (
            <tr key={r._id}><td><Link className="font-medium text-brand-700 hover:underline" to={`/admin/shop/requests/${r._id}`}>{r.requestId}</Link></td><td>{r.service?.name}</td><td>{formatDate(r.createdAt)}</td><td><StatusBadge status={r.status} /></td></tr>
          ))}</tbody></table></div>
      )}
    </div>
  );
}
