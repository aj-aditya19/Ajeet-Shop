import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { cancelRental, createRental, getEquipment, getRentals, returnRental, updateRental } from '../../services/cateringApi';
import { getErrorMessage } from '../../services/api';
import { Alert, EmptyState, ErrorState, Field, Pagination, Spinner, StatusBadge } from '../../components/ui';
import { formatCurrency, formatDate, toInputDate } from '../../utils/format';
import { printBill } from '../../utils/printBill';
import { useBusiness } from '../../context/BusinessContext';
import { reminderLink } from '../../components/OverdueAlerts';

function RentalForm({ initial, equipment, onSaved, onCancel }) {
  const [s, setS] = useState(initial);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const eq = (id) => equipment.find((e) => e._id === id);
  const setItem = (i, patch) => setS({ ...s, items: s.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
  const total = s.items.reduce((a, it) => a + (Number(it.quantity) || 0) * (Number(it.rate) || 0), 0);

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (s.items.some((i) => !i.equipment)) return setErr('Choose equipment for every row');
    setBusy(true);
    const body = {
      customerName: s.customerName, phone: s.phone, address: s.address, notes: s.notes, rentalDate: s.rentalDate, dueDate: s.dueDate,
      discount: Number(s.discount) || 0, advancePaid: Number(s.advancePaid) || 0,
      items: s.items.map((i) => ({ equipment: i.equipment, quantity: Number(i.quantity), rate: Number(i.rate) })),
    };
    try { initial._id ? await updateRental(initial._id, body) : await createRental(body); onSaved(); } catch (e2) { setErr(getErrorMessage(e2)); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="card mb-6 space-y-4">
      <h2 className="font-semibold">{initial._id ? `Edit ${initial.rentalId}` : 'New rental'}</h2>
      <Alert>{err}</Alert>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Customer name"><input required className="input" value={s.customerName} onChange={(e) => setS({ ...s, customerName: e.target.value })} /></Field>
        <Field label="Phone"><input required type="tel" inputMode="numeric" className="input" value={s.phone} onChange={(e) => setS({ ...s, phone: e.target.value })} /></Field>
        <Field label="Address (optional)"><input className="input" value={s.address} onChange={(e) => setS({ ...s, address: e.target.value })} /></Field>
        <Field label="Rental date"><input required type="date" className="input" value={s.rentalDate} onChange={(e) => setS({ ...s, rentalDate: e.target.value })} /></Field>
        <Field label="Due date"><input required type="date" min={s.rentalDate} className="input" value={s.dueDate} onChange={(e) => setS({ ...s, dueDate: e.target.value })} /></Field>
        <Field label="Notes"><input className="input" value={s.notes} onChange={(e) => setS({ ...s, notes: e.target.value })} /></Field>
      </div>
      <div>
        <p className="label">Items</p>
        {s.items.map((it, i) => (
          <div key={i} className="mb-2 grid grid-cols-12 items-center gap-2">
            <select required className="input col-span-12 sm:col-span-5" value={it.equipment} onChange={(e) => setItem(i, { equipment: e.target.value, rate: eq(e.target.value)?.defaultRate ?? 0 })}>
              <option value="">Select equipment...</option>
              {equipment.filter((e) => e.active || e._id === it.equipment).map((e) => <option key={e._id} value={e._id}>{e.name} ({e.available} available)</option>)}
            </select>
            <input required type="number" min="1" className="input col-span-5 sm:col-span-3" placeholder="Qty" value={it.quantity} onChange={(e) => setItem(i, { quantity: e.target.value })} />
            <input required type="number" min="0" className="input col-span-5 sm:col-span-3" placeholder="₹ / day" value={it.rate} onChange={(e) => setItem(i, { rate: e.target.value })} />
            <button type="button" aria-label="Remove item" disabled={s.items.length === 1} className="col-span-2 justify-self-center text-red-600 disabled:opacity-30 sm:col-span-1" onClick={() => setS({ ...s, items: s.items.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        <button type="button" className="btn-secondary btn-sm" onClick={() => setS({ ...s, items: [...s.items, { equipment: '', quantity: 1, rate: 0 }] })}><Plus className="h-3.5 w-3.5" />Add item</button>
        <p className="mt-2 text-sm text-slate-600">Per-day total: <b>{formatCurrency(total)}</b> (bill = per-day total x number of days)</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Discount (₹)"><input type="number" min="0" className="input" value={s.discount} onChange={(e) => setS({ ...s, discount: e.target.value })} /></Field>
        <Field label="Advance paid (₹)"><input type="number" min="0" className="input" value={s.advancePaid} onChange={(e) => setS({ ...s, advancePaid: e.target.value })} /></Field>
      </div>
      <div className="flex gap-2"><button className="btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save rental'}</button><button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button></div>
    </form>
  );
}

const TABS = [['open', 'Current'], ['overdue', 'Overdue'], ['history', 'History'], ['', 'All']];

export default function CateringRentals() {
  const biz = useBusiness();
  const [tab, setTab] = useState('open');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState('');
  const q = useDebounce(search);
  const { data: equipment, reload: reloadEq } = useAsync(getEquipment, []);
  const { data, loading, error, reload } = useAsync(() => getRentals({ status: tab, search: q, page, limit: 10 }), [tab, q, page]);
  const showReturned = tab === 'history' || tab === '';
  const refresh = () => { reload(); reloadEq(); };

  const act = async (fn, id) => { setErr(''); try { await fn(id); refresh(); } catch (e) { setErr(getErrorMessage(e)); } };
  const startEdit = (r) => setEditing({
    _id: r._id, rentalId: r.rentalId, customerName: r.customerName, phone: r.phone, address: r.address || '', notes: r.notes || '',
    rentalDate: toInputDate(r.rentalDate), dueDate: toInputDate(r.dueDate), discount: r.discount || 0, advancePaid: r.advancePaid || 0,
    items: r.items.map((i) => ({ equipment: i.equipment?._id, quantity: i.quantity, rate: i.rate })),
  });
  const blank = () => setEditing({ customerName: '', phone: '', address: '', notes: '', discount: 0, advancePaid: 0, rentalDate: toInputDate(), dueDate: toInputDate(new Date(Date.now() + 86400000)), items: [{ equipment: '', quantity: 1, rate: 0 }] });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between"><h1 className="text-2xl font-bold">Rentals</h1>
        {!editing && equipment && <button className="btn-primary" onClick={blank}><Plus className="h-4 w-4" />New rental</button>}</div>
      <Alert>{err}</Alert>
      {editing && equipment && <RentalForm key={editing._id || 'new'} initial={editing} equipment={equipment} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg bg-slate-200 p-1">{TABS.map(([v, l]) => (
          <button key={l} className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === v ? 'bg-white shadow' : 'text-slate-600'}`} onClick={() => { setTab(v); setPage(1); }}>{l}</button>))}</div>
        <input className="input max-w-xs" placeholder="Search name, phone, rental ID, equipment" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : !data.items.length ? <div className="card"><EmptyState title="No rentals found" /></div> : (
        <>
          <div className="table-wrap"><table className="table w-full table-fixed">
            <thead><tr><th className="w-44">Rental / Dates</th><th className="w-52">Customer</th><th className="w-40">Items</th><th className="w-28">Bill</th><th className="w-28">Status</th><th>Actions</th></tr></thead>
            <tbody>{data.items.map((r) => (
              <tr key={r._id} className="align-top">
                <td className="whitespace-normal"><span className="font-medium">{r.rentalId}</span>
                  <div className="text-xs text-slate-500">Date: {formatDate(r.rentalDate)}</div>
                  <div className="text-xs text-slate-700">Last date: <b>{formatDate(r.dueDate)}</b></div>
                  {r.returnDate && <div className="text-xs text-green-700">Returned {formatDate(r.returnDate)}</div>}</td>
                <td className="whitespace-normal">{r.customerName}<div className="text-xs text-slate-500">{r.phone}{r.address ? ` · ${r.address}` : ''}</div></td>
                <td className="whitespace-normal">{r.items.map((i) => `${i.quantity} × ${i.equipment?.name || '?'}`).join(', ')}</td>
                <td className="whitespace-normal">{formatCurrency(r.billAmount)}
                  <div className={`text-xs ${r.balance > 0 ? 'font-semibold text-red-600' : 'text-green-700'}`}>Balance {formatCurrency(r.balance)}</div></td>
                <td className="whitespace-normal"><StatusBadge status={r.status} />{r.status === 'overdue' && <div className="mt-1 text-xs font-semibold text-red-600">{r.daysOverdue} day(s) late</div>}</td>
                <td className="whitespace-normal"><div className="flex flex-wrap gap-1">
                  <button className="btn-secondary btn-sm" onClick={() => printBill(r, biz)}>Bill</button>
                  {r.status === 'overdue' && <a className="btn-success btn-sm" href={reminderLink(r)} target="_blank" rel="noopener noreferrer">Remind</a>}
                  {!['returned', 'cancelled'].includes(r.status) && (<>
                    <button className="btn-success btn-sm" onClick={() => act(returnRental, r._id)}>Mark returned</button>
                    <button className="btn-secondary btn-sm" onClick={() => startEdit(r)}>Edit</button>
                    <button className="btn-danger btn-sm" onClick={() => window.confirm(`Cancel ${r.rentalId}?`) && act(cancelRental, r._id)}>Cancel</button></>)}
                </div></td>
              </tr>))}</tbody></table></div>
          <Pagination pagination={data.pagination} onPage={setPage} />
        </>
      )}
    </div>
  );
}
