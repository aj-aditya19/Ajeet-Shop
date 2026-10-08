import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { createService, getServices, setServiceActive, updateService } from '../../services/serviceApi';
import { getErrorMessage } from '../../services/api';
import { Alert, ErrorState, Field, Spinner } from '../../components/ui';
import { CATEGORY_LABELS } from '../../utils/format';

const blank = { name: '', category: 'printing', description: '', active: true, fields: [] };
const keyFrom = (label) => label.trim().split(/\s+/).map((w, i) => { const c = w.replace(/[^a-zA-Z0-9]/g, ''); return i ? c.charAt(0).toUpperCase() + c.slice(1) : c.charAt(0).toLowerCase() + c.slice(1); }).join('');

function ServiceForm({ initial, onSaved, onCancel }) {
  const [s, setS] = useState({ ...initial, fields: (initial.fields || []).map((f) => ({ ...f, optionsText: (f.options || []).join(', ') })) });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const setField = (i, patch) => setS({ ...s, fields: s.fields.map((f, j) => (j === i ? { ...f, ...patch } : f)) });

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    const body = {
      name: s.name, category: s.category, description: s.description, active: s.active,
      fields: s.fields.map((f) => ({ key: f.key || keyFrom(f.label), label: f.label, type: f.type, required: !!f.required, options: f.type === 'select' ? f.optionsText.split(',').map((o) => o.trim()).filter(Boolean) : [] })),
    };
    try { initial._id ? await updateService(initial._id, body) : await createService(body); onSaved(); } catch (e2) { setErr(getErrorMessage(e2)); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="card mb-6 space-y-4">
      <h2 className="font-semibold">{initial._id ? 'Edit service' : 'New service'}</h2>
      <Alert>{err}</Alert>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name"><input required className="input" value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} /></Field>
        <Field label="Category"><select className="input" value={s.category} onChange={(e) => setS({ ...s, category: e.target.value })}>{Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
      </div>
      <Field label="Description"><textarea rows={2} className="input" value={s.description} onChange={(e) => setS({ ...s, description: e.target.value })} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.active} onChange={(e) => setS({ ...s, active: e.target.checked })} />Active (visible to customers)</label>
      <div>
        <div className="mb-2 flex items-center justify-between"><p className="label mb-0">Service-specific fields</p>
          <button type="button" className="btn-secondary btn-sm" onClick={() => setS({ ...s, fields: [...s.fields, { key: '', label: '', type: 'text', required: false, optionsText: '' }] })}><Plus className="h-3.5 w-3.5" />Add field</button></div>
        {s.fields.map((f, i) => (
          <div key={i} className="mb-2 grid gap-2 rounded-lg border p-3 sm:grid-cols-12">
            <input required placeholder="Label" className="input sm:col-span-4" value={f.label} onChange={(e) => setField(i, { label: e.target.value, key: initial.fields?.[i]?.key || keyFrom(e.target.value) })} />
            <select className="input sm:col-span-2" value={f.type} onChange={(e) => setField(i, { type: e.target.value })}>{['text', 'number', 'select', 'textarea'].map((t) => <option key={t}>{t}</option>)}</select>
            {f.type === 'select' ? <input required placeholder="Options, comma separated" className="input sm:col-span-4" value={f.optionsText} onChange={(e) => setField(i, { optionsText: e.target.value })} /> : <div className="sm:col-span-4" />}
            <label className="flex items-center gap-1 text-sm sm:col-span-1"><input type="checkbox" checked={f.required} onChange={(e) => setField(i, { required: e.target.checked })} />Req.</label>
            <button type="button" aria-label="Remove field" className="text-red-600 sm:col-span-1" onClick={() => setS({ ...s, fields: s.fields.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2"><button className="btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button><button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button></div>
    </form>
  );
}

export default function AdminServices() {
  const { data, loading, error, reload } = useAsync(() => getServices(true), []);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState('');
  const toggle = async (s) => { setErr(''); try { await setServiceActive(s._id, !s.active); reload(); } catch (e) { setErr(getErrorMessage(e)); } };
  return (
    <div>
      <div className="mb-4 flex items-center justify-between"><h1 className="text-2xl font-bold">Services</h1>
        {!editing && <button className="btn-primary" onClick={() => setEditing(blank)}><Plus className="h-4 w-4" />New service</button>}</div>
      <Alert>{err}</Alert>
      {editing && <ServiceForm key={editing._id || 'new'} initial={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Name</th><th>Category</th><th>Fields</th><th>Status</th><th /></tr></thead>
          <tbody>{data.map((s) => (
            <tr key={s._id}><td className="font-medium">{s.name}</td><td>{CATEGORY_LABELS[s.category]}</td><td>{s.fields.length}</td>
              <td><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.active ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'}`}>{s.active ? 'Active' : 'Inactive'}</span></td>
              <td className="space-x-2"><button className="btn-secondary btn-sm" onClick={() => setEditing(s)}>Edit</button>
                <button className={`btn-sm ${s.active ? 'btn-danger' : 'btn-success'}`} onClick={() => toggle(s)}>{s.active ? 'Deactivate' : 'Reactivate'}</button></td></tr>
          ))}</tbody></table></div>
      )}
    </div>
  );
}
