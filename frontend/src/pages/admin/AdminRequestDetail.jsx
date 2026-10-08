import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { getRequest, updateRequestStatus } from '../../services/requestApi';
import { getErrorMessage } from '../../services/api';
import { Alert, ErrorState, Spinner, StatusBadge } from '../../components/ui';
import { FileList, FormDataList, Timeline } from '../../components/RequestParts';
import { formatDateTime, statusLabel } from '../../utils/format';

export default function AdminRequestDetail() {
  const { id } = useParams();
  const { data: r, loading, error, reload } = useAsync(() => getRequest(id), [id]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState({ type: '', text: '' });
  useEffect(() => { if (r) setMsg(r.adminMessage || ''); }, [r]);

  const save = async (body, okText) => {
    setBusy(true); setNote({ type: '', text: '' });
    try { await updateRequestStatus(id, body); setNote({ type: 'success', text: okText }); reload(); }
    catch (e) { setNote({ type: 'error', text: getErrorMessage(e) }); }
    finally { setBusy(false); }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const next = r.allowedTransitions || [];
  return (
    <div className="max-w-4xl space-y-5">
      <Link to="/admin/shop/requests" className="text-sm text-brand-700 hover:underline">&larr; Back to requests</Link>
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="text-2xl font-bold">{r.requestId}</h1><StatusBadge status={r.status} /></div>
        <p className="mt-1 text-sm text-slate-500">{r.service?.name} &middot; submitted {formatDateTime(r.createdAt)} &middot; prefers {r.contactPreference}</p>
      </div>
      <div className="card">
        <h2 className="mb-3 font-semibold">Customer</h2>
        <p className="text-sm">{r.contact.name} &middot; {r.contact.phone} &middot; {r.contact.email}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a className="btn-primary btn-sm" href={`tel:+91${r.contact.phone}`}><Phone className="h-3.5 w-3.5" />Call</a>
          <a className="btn-success btn-sm" href={r.customerWhatsappLink} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>
          <a className="btn-secondary btn-sm" href={`mailto:${r.contact.email}`}><Mail className="h-3.5 w-3.5" />Email</a>
          {r.customer?._id && <Link className="btn-secondary btn-sm" to={`/admin/shop/customers/${r.customer._id}`}>History</Link>}
        </div>
      </div>
      <div className="card"><h2 className="mb-3 font-semibold">Details</h2><FormDataList data={r.formData} />
        {r.additionalInstructions && <p className="mt-4 text-sm"><span className="text-slate-500">Instructions: </span>{r.additionalInstructions}</p>}</div>
      <div className="card"><h2 className="mb-3 font-semibold">Documents</h2><FileList files={r.uploadedFiles} /></div>
      <div className="card space-y-3">
        <h2 className="font-semibold">Manage request</h2>
        <Alert type={note.type}>{note.text}</Alert>
        <div>
          <label className="label">Message to customer</label>
          <textarea rows={3} maxLength={1000} className="input" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="e.g. Your documents will be ready by 5 PM." />
          <button className="btn-secondary btn-sm mt-2" disabled={busy} onClick={() => save({ adminMessage: msg }, 'Message saved')}>Save message</button>
        </div>
        {next.length ? (
          <div className="flex flex-wrap gap-2 border-t pt-3">
            <span className="w-full text-sm text-slate-500">Change status to:</span>
            {next.map((s) => (
              <button key={s} disabled={busy} className={s === 'rejected' ? 'btn-danger btn-sm' : s === 'completed' ? 'btn-success btn-sm' : 'btn-primary btn-sm'}
                onClick={() => save({ status: s, adminMessage: msg }, `Marked as ${statusLabel(s)}`)}>{s === 'completed' ? 'Mark completed' : statusLabel(s)}</button>
            ))}
          </div>
        ) : <p className="border-t pt-3 text-sm text-slate-500">This request is closed.</p>}
      </div>
      <div className="card"><h2 className="mb-3 font-semibold">History</h2><Timeline history={r.statusHistory} /></div>
    </div>
  );
}
