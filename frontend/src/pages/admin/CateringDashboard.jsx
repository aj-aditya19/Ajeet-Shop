import { Link } from 'react-router-dom';
import useAsync from '../../hooks/useAsync';
import { getCateringDashboard } from '../../services/cateringApi';
import { ErrorState, Spinner, StatCard } from '../../components/ui';

export default function CateringDashboard() {
  const { data: d, loading, error, reload } = useAsync(getCateringDashboard, []);
  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Catering Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Active Rentals" value={d.active} tone="text-brand-700" />
        <StatCard label="Due Today" value={d.dueToday} tone="text-amber-600" />
        <StatCard label="Overdue" value={d.overdue} tone="text-red-600" />
        <StatCard label="Returned" value={d.returned} tone="text-green-600" />
        <StatCard label="Total Equipment" value={d.totalEquipment} />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link className="btn-primary" to="/admin/catering/rentals">Manage rentals</Link>
        <Link className="btn-secondary" to="/admin/catering/equipment">Manage equipment</Link>
      </div>
    </div>
  );
}
