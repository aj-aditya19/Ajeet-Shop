import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { getCustomers } from '../../services/adminApi';
import { EmptyState, ErrorState, Pagination, Spinner } from '../../components/ui';
import { formatDate } from '../../utils/format';

export default function AdminCustomers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounce(search);
  const { data, loading, error, reload } = useAsync(() => getCustomers({ search: q, page, limit: 10 }), [q, page]);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Customers</h1>
      <input className="input mb-4 max-w-sm" placeholder="Search name, email or phone" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : !data.items.length ? <div className="card"><EmptyState title="No customers found" /></div> : (
        <>
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Registered</th><th>Requests</th><th>Last request</th><th /></tr></thead>
            <tbody>{data.items.map((c) => (
              <tr key={c._id}><td className="font-medium">{c.name}</td><td>{c.phone}</td><td>{c.email}</td><td>{formatDate(c.createdAt)}</td><td>{c.totalRequests}</td><td>{formatDate(c.lastRequestAt)}</td>
                <td><Link className="text-brand-700 hover:underline" to={`/admin/shop/customers/${c._id}`}>View</Link></td></tr>
            ))}</tbody></table></div>
          <Pagination pagination={data.pagination} onPage={setPage} />
        </>
      )}
    </div>
  );
}
