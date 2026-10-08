import useAsync from '../../hooks/useAsync';
import { getClients } from '../../services/cateringApi';
import { EmptyState, ErrorState, Spinner } from '../../components/ui';
import { formatDate } from '../../utils/format';

export default function CateringClients() {
  const { data, loading, error, reload } = useAsync(getClients, []);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Catering Clients</h1>
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : !data.length ? <div className="card"><EmptyState title="No clients yet" hint="Clients appear automatically when you create rentals." /></div> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>Name</th><th>Phone</th><th>Address</th><th>Rentals</th><th>Last rental</th></tr></thead>
          <tbody>{data.map((c) => <tr key={c.phone}><td className="font-medium">{c.name}</td><td>{c.phone}</td><td>{c.address || '-'}</td><td>{c.rentals}</td><td>{formatDate(c.lastRental)}</td></tr>)}</tbody></table></div>
      )}
    </div>
  );
}
