import { useState } from 'react';
import { Plus } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { createEquipment, deactivateEquipment, getEquipment, updateEquipment } from '../../services/cateringApi';
import { getErrorMessage } from '../../services/api';
import { Alert, EmptyState, ErrorState, Field, Spinner } from '../../components/ui';
import { formatCurrency } from '../../utils/format';

const blank = { name: '', category: 'other', description: '', imageUrl: '', totalQuantity: 1, defaultRate: 0, active: true, showAvailability: false };

function EquipmentForm({ initial, onSaved, onCancel }) {
  const [s, setS] = useState(initial);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    const body = { name: s.name, category: s.category, description: s.description, imageUrl: s.imageUrl || '', totalQuantity: Number(s.totalQuantity), defaultRate: Number(s.defaultRate), active: s.active, showAvailability: s.showAvailability };
    try { initial._id ? await updateEquipment(initial._id, body) : await createEquipment(body); onSaved(); } catch (e2) { setErr(getErrorMessage(e2)); } finally { setBusy(false); }
  };
  const set = (k) => (e) => setS({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  return (
    <form onSubmit={submit} className="card mb-6 space-y-4">
      <h2 className="font-semibold">{initial._id ? 'Edit equipment' : 'Add equipment'}</h2>
      <Alert>{err}</Alert>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Name"><input required className="input" value={s.name} onChange={set('name')} /></Field>
        <Field label="Category"><select className="input" value={s.category} onChange={set('category')}>{['bhati', 'chari', 'kadai', 'patila', 'other'].map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Total quantity"><input type="number" min="0" required className="input" value={s.totalQuantity} onChange={set('totalQuantity')} /></Field>
        <Field label="Default rate (₹/day)"><input type="number" min="0" required className="input" value={s.defaultRate} onChange={set('defaultRate')} /></Field>
      </div>
      <Field label="Description"><textarea rows={2} className="input" value={s.description} onChange={set('description')} /></Field>
      <Field label="Image URL (optional)"><input type="url" className="input" value={s.imageUrl} onChange={set('imageUrl')} placeholder="https://..." /></Field>
      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={s.active} onChange={set('active')} />Active</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={s.showAvailability} onChange={set('showAvailability')} />Show "Available / Rented out" on the public page</label>
      </div>
      <div className="flex gap-2"><button className="btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button><button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button></div>
    </form>
  );
}

export default function CateringEquipment() {
  const { data, loading, error, reload } = useAsync(getEquipment, []);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState('');
  const deactivate = async (e) => { setErr(''); try { await deactivateEquipment(e._id); reload(); } catch (x) { setErr(getErrorMessage(x)); } };
  const reactivate = async (e) => { setErr(''); try { await updateEquipment(e._id, { ...e, active: true }); reload(); } catch (x) { setErr(getErrorMessage(x)); } };
  return (
    <div>
      <div className="mb-4 flex items-center justify-between"><h1 className="text-2xl font-bold">Equipment</h1>
        {!editing && <button className="btn-primary" onClick={() => setEditing(blank)}><Plus className="h-4 w-4" />Add equipment</button>}</div>
      <Alert>{err}</Alert>
      {editing && <EquipmentForm key={editing._id || 'new'} initial={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : !data.length ? <div className="card"><EmptyState title="No equipment yet" /></div> : (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Name</th><th>Total</th><th>Rented</th><th>Available</th><th>Rate / day</th><th>Status</th><th /></tr></thead>
          <tbody>{data.map((e) => (
            <tr key={e._id}><td className="font-medium">{e.name}</td><td>{e.totalQuantity}</td><td>{e.rented}</td>
              <td className={e.available === 0 ? 'font-semibold text-red-600' : 'font-semibold text-green-700'}>{e.available}</td><td>{formatCurrency(e.defaultRate)}</td>
              <td>{e.active ? 'Active' : 'Inactive'}</td>
              <td className="space-x-2"><button className="btn-secondary btn-sm" onClick={() => setEditing(e)}>Edit</button>
                {e.active ? <button className="btn-danger btn-sm" onClick={() => deactivate(e)}>Deactivate</button> : <button className="btn-success btn-sm" onClick={() => reactivate(e)}>Reactivate</button>}</td></tr>
          ))}</tbody></table></div>
      )}
    </div>
  );
}
