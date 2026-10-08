import { Link, useParams } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { getRequest } from '../../services/requestApi';
import { ErrorState, Spinner, StatusBadge } from '../../components/ui';
import { FileList, FormDataList, Timeline } from '../../components/RequestParts';
import { formatDateTime } from '../../utils/format';

export default function MyRequestDetail() {
  const { id } = useParams();
  const { data: r, loading, error, reload } = useAsync(() => getRequest(id), [id]);
  if (loading) return <Spinner />;
  if (error) return <div className="mx-auto max-w-3xl p-4"><ErrorState message={error} onRetry={reload} /></div>;
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <Link to="/shop/dashboard" className="text-sm text-brand-700 hover:underline">&larr; Back to dashboard</Link>
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="text-2xl font-bold">{r.requestId}</h1><StatusBadge status={r.status} /></div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500">Service</dt><dd className="font-medium">{r.service?.name}</dd></div>
          <div><dt className="text-slate-500">Submitted</dt><dd className="font-medium">{formatDateTime(r.createdAt)}</dd></div>
          <div><dt className="text-slate-500">Contact preference</dt><dd className="font-medium capitalize">{r.contactPreference}</dd></div>
        </dl>
      </div>
      {r.adminMessage && <div className="card border-brand-600/30 bg-brand-50"><p className="text-sm font-semibold text-brand-800">Message from the shop</p><p className="mt-1 text-sm">{r.adminMessage}</p></div>}
      <div className="card"><h2 className="mb-3 font-semibold">Details</h2><FormDataList data={r.formData} />
        {r.additionalInstructions && <p className="mt-4 text-sm"><span className="text-slate-500">Instructions: </span>{r.additionalInstructions}</p>}</div>
      <div className="card"><h2 className="mb-3 font-semibold">Documents</h2><FileList files={r.uploadedFiles} /></div>
      <div className="card"><h2 className="mb-3 font-semibold">Progress</h2><Timeline history={r.statusHistory} /></div>
      <a className="btn-success" href={r.shopWhatsappLink} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" />Contact shop on WhatsApp</a>
    </div>
  );
}
