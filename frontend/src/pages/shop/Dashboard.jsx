import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useAsync from '../../hooks/useAsync';
import { getRequests, getRequestStats } from '../../services/requestApi';
import { EmptyState, ErrorState, Spinner, StatCard, StatusBadge } from '../../components/ui';
import { formatDate } from '../../utils/format';

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(async () => {
    const [stats, list] = await Promise.all([getRequestStats(), getRequests({ limit: 10 })]);
    return { stats, list };
  }, []);
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
        <Link to="/shop/request" className="btn-primary">New Request</Link>
      </div>
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
            <StatCard label="Total Requests" value={data.stats.total} />
            <StatCard label="Pending" value={data.stats.pending} tone="text-amber-600" />
            <StatCard label="In Progress" value={data.stats.inProgress} tone="text-indigo-600" />
            <StatCard label="Ready" value={data.stats.ready} tone="text-teal-600" />
            <StatCard label="Completed" value={data.stats.completed} tone="text-green-600" />
          </div>
          <h2 className="mb-3 mt-8 text-lg font-semibold">Recent requests</h2>
          {!data.list.items.length ? <div className="card"><EmptyState title="No requests yet" hint="Submit your first service request." /></div> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Request ID</th><th>Service</th><th>Date</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {data.list.items.map((r) => (
                    <tr key={r._id}>
                      <td className="font-medium">{r.requestId}</td><td>{r.service?.name}</td><td>{formatDate(r.createdAt)}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td><Link className="text-brand-700 hover:underline" to={`/shop/requests/${r._id}`}>Open</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
