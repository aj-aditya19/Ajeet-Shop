import { Link } from 'react-router-dom';
import useAsync from '../../hooks/useAsync';
import { getAdminDashboard } from '../../services/adminApi';
import { EmptyState, ErrorState, Spinner, StatCard, StatusBadge } from '../../components/ui';
import { formatDate } from '../../utils/format';

export default function AdminDashboard() {
  const { data: d, loading, error, reload } = useAsync(getAdminDashboard, []);
  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="New Requests (24h)" value={d.newRequests} tone="text-brand-700" />
        <StatCard label="Pending" value={d.pending} tone="text-amber-600" />
        <StatCard label="In Progress" value={d.inProgress} tone="text-indigo-600" />
        <StatCard label="Ready" value={d.ready} tone="text-teal-600" />
        <StatCard label="Completed" value={d.completed} tone="text-green-600" />
        <StatCard label="Total Customers" value={d.totalCustomers} />
        <StatCard label="Active Rentals" value={d.activeRentals} />
        <StatCard label="Overdue Rentals" value={d.overdueRentals} tone="text-red-600" />
      </div>
      <div className="mb-3 mt-8 flex items-center justify-between"><h2 className="text-lg font-semibold">Recent service requests</h2><Link className="text-sm text-brand-700 hover:underline" to="/admin/shop/requests">View all</Link></div>
      {!d.recentRequests.length ? <div className="card"><EmptyState title="No requests yet" /></div> : (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Request ID</th><th>Customer</th><th>Service</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>{d.recentRequests.map((r) => (
            <tr key={r._id}><td><Link className="font-medium text-brand-700 hover:underline" to={`/admin/shop/requests/${r._id}`}>{r.requestId}</Link></td>
              <td>{r.contact.name}</td><td>{r.service?.name}</td><td>{formatDate(r.createdAt)}</td><td><StatusBadge status={r.status} /></td></tr>
          ))}</tbody></table></div>
      )}
    </div>
  );
}
