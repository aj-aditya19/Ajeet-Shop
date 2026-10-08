import { useState } from 'react';
import useAsync from '../../hooks/useAsync';
import { getReports } from '../../services/cateringApi';
import { EmptyState, ErrorState, Spinner, StatCard } from '../../components/ui';
import { formatCurrency } from '../../utils/format';

export default function CateringReports() {
  const [range, setRange] = useState({ from: '', to: '' });
  const { data: d, loading, error, reload } = useAsync(() => getReports(range), [range.from, range.to]);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Reports</h1>
      <div className="mb-4 flex flex-wrap gap-3">
        <input type="date" className="input max-w-[11rem]" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} aria-label="From" />
        <input type="date" className="input max-w-[11rem]" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} aria-label="To" />
      </div>
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4"><StatCard label="Rentals" value={d.totalRentals} /><StatCard label="Estimated revenue" value={formatCurrency(d.totalRevenue)} /></div>
          <p className="mt-2 text-xs text-slate-500">{d.note}</p>
          {!d.totalRentals ? <div className="card mt-6"><EmptyState title="No rentals in this period" /></div> : (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="table-wrap"><table className="table"><thead><tr><th>Equipment</th><th>Qty rented</th><th>Revenue</th></tr></thead>
                <tbody>{d.byEquipment.map((e) => <tr key={e.name}><td className="font-medium">{e.name}</td><td>{e.quantityRented}</td><td>{formatCurrency(e.revenue)}</td></tr>)}</tbody></table></div>
              <div className="table-wrap"><table className="table"><thead><tr><th>Month</th><th>Rentals</th><th>Revenue</th></tr></thead>
                <tbody>{d.byMonth.map((m) => <tr key={m.month}><td className="font-medium">{m.month}</td><td>{m.rentals}</td><td>{formatCurrency(m.revenue)}</td></tr>)}</tbody></table></div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
