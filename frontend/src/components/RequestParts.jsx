import { useState } from 'react';
import { Download } from 'lucide-react';
import { openFile } from '../services/requestApi';
import { getErrorMessage } from '../services/api';
import { formatBytes, formatDateTime } from '../utils/format';
import { StatusBadge } from './ui';

export function FileList({ files }) {
  const [err, setErr] = useState('');
  if (!files?.length) return <p className="text-sm text-slate-500">No documents uploaded.</p>;
  return (
    <div>
      <ul className="space-y-2">
        {files.map((f) => (
          <li key={f._id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
            <span className="min-w-0 truncate">{f.originalName} <span className="text-xs text-slate-500">({formatBytes(f.size)})</span></span>
            <button className="btn-secondary btn-sm" onClick={() => openFile(f).catch((e) => setErr(getErrorMessage(e)))}><Download className="h-3.5 w-3.5" />Open</button>
          </li>
        ))}
      </ul>
      {err && <p className="field-error">{err}</p>}
    </div>
  );
}

export const FormDataList = ({ data }) =>
  data && Object.keys(data).length ? (
    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
      {Object.entries(data).map(([k, v]) => (
        <div key={k}><dt className="text-slate-500">{k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}</dt><dd className="font-medium">{String(v)}</dd></div>
      ))}
    </dl>
  ) : <p className="text-sm text-slate-500">No extra details.</p>;

export const Timeline = ({ history }) => (
  <ol className="space-y-1 text-sm">
    {(history || []).map((h, i) => <li key={i} className="flex items-center gap-2"><StatusBadge status={h.status} /><span className="text-slate-500">{formatDateTime(h.at)}</span></li>)}
  </ol>
);
