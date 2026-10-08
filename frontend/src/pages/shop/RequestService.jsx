import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Trash2, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';
import useAsync from '../../hooks/useAsync';
import { getServices } from '../../services/serviceApi';
import { createRequest } from '../../services/requestApi';
import { getErrorMessage } from '../../services/api';
import { Alert, ErrorState, Field, Spinner } from '../../components/ui';
import { CATEGORY_LABELS, formatBytes } from '../../utils/format';

const EXT = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];

export default function RequestService() {
  const { user } = useAuth();
  const biz = useBusiness();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { data: services, loading, error, reload } = useAsync(() => getServices(), []);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { name: user.name, phone: user.phone, email: user.email, serviceId: params.get('service') || '', contactPreference: 'whatsapp' },
  });
  const [files, setFiles] = useState([]);
  const [fileErr, setFileErr] = useState('');
  const [serverErr, setServerErr] = useState('');
  const input = useRef();
  const serviceId = watch('serviceId');
  const service = useMemo(() => (services || []).find((s) => s._id === serviceId), [services, serviceId]);
  const maxBytes = biz.limits.maxFileSizeMb * 1024 * 1024;

  const addFiles = (list) => {
    setFileErr('');
    const next = [...files];
    for (const f of list) {
      const ext = f.name.split('.').pop().toLowerCase();
      if (!EXT.includes(ext)) { setFileErr(`${f.name}: only ${EXT.join(', ').toUpperCase()} files are allowed`); continue; }
      if (f.size > maxBytes) { setFileErr(`${f.name} is larger than ${biz.limits.maxFileSizeMb} MB`); continue; }
      if (next.length >= biz.limits.maxFiles) { setFileErr(`You can upload at most ${biz.limits.maxFiles} files`); break; }
      next.push(f);
    }
    setFiles(next);
    if (input.current) input.current.value = '';
  };

  const onSubmit = async (v) => {
    setServerErr('');
    const fd = new FormData();
    ['name', 'phone', 'email', 'serviceId', 'contactPreference'].forEach((k) => fd.append(k, v[k]));
    fd.append('additionalInstructions', v.additionalInstructions || '');
    fd.append('formData', JSON.stringify(v.formData || {}));
    files.forEach((f) => fd.append('files', f));
    try {
      const { request } = await createRequest(fd);
      nav('/shop/request/success', { state: { request }, replace: true });
    } catch (e) { setServerErr(getErrorMessage(e)); window.scrollTo(0, 0); }
  };

  if (loading) return <Spinner />;
  if (error) return <div className="mx-auto max-w-2xl p-4"><ErrorState message={error} onRetry={reload} /></div>;

  const grouped = ['printing', 'digital', 'other'].map((c) => [c, services.filter((s) => s.category === c)]).filter(([, l]) => l.length);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Request a Service</h1>
      <p className="mt-1 text-sm text-slate-600">Fill in the details and upload your documents. No online payment is needed.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="card mt-6 space-y-4" noValidate>
        <Alert>{serverErr}</Alert>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" error={errors.name?.message}><input className="input" {...register('name', { required: 'Name is required' })} /></Field>
          <Field label="Mobile number" error={errors.phone?.message}><input type="tel" inputMode="numeric" className="input" {...register('phone', { required: 'Mobile number is required', pattern: { value: /^(\+?91)?[6-9]\d{9}$/, message: 'Enter a valid 10-digit mobile number' } })} /></Field>
        </div>
        <Field label="Email" error={errors.email?.message}><input type="email" className="input" {...register('email', { required: 'Email is required' })} /></Field>

        <Field label="Service" error={errors.serviceId?.message}>
          <select className="input" {...register('serviceId', { required: 'Please choose a service' })}>
            <option value="">Select a service...</option>
            {grouped.map(([c, list]) => <optgroup key={c} label={CATEGORY_LABELS[c]}>{list.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</optgroup>)}
          </select>
        </Field>

        {service?.fields.map((f) => (
          <Field key={`${service._id}-${f.key}`} label={`${f.label}${f.required ? '' : ' (optional)'}`} error={errors.formData?.[f.key]?.message}>
            {f.type === 'select' ? (
              <select className="input" {...register(`formData.${f.key}`, { required: f.required && `${f.label} is required` })}><option value="">Select...</option>{f.options.map((o) => <option key={o}>{o}</option>)}</select>
            ) : f.type === 'textarea' ? (
              <textarea rows={3} className="input" {...register(`formData.${f.key}`, { required: f.required && `${f.label} is required` })} />
            ) : (
              <input type={f.type === 'number' ? 'number' : 'text'} min={f.type === 'number' ? 1 : undefined} inputMode={f.type === 'number' ? 'numeric' : undefined} className="input"
                {...register(`formData.${f.key}`, { required: f.required && `${f.label} is required`, min: f.type === 'number' ? { value: 1, message: 'Must be at least 1' } : undefined })} />
            )}
          </Field>
        ))}

        <Field label="Additional instructions (optional)" error={errors.additionalInstructions?.message}>
          <textarea rows={3} maxLength={1000} className="input" {...register('additionalInstructions')} />
        </Field>

        <div>
          <p className="label">Contact preference</p>
          <div className="flex flex-wrap gap-4 text-sm">
            {[['whatsapp', 'WhatsApp'], ['call', 'Phone call'], ['email', 'Email']].map(([v, l]) => (
              <label key={v} className="flex items-center gap-2"><input type="radio" value={v} {...register('contactPreference')} />{l}</label>
            ))}
          </div>
        </div>

        <div>
          <p className="label">Upload documents</p>
          <input ref={input} type="file" multiple hidden accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => addFiles(e.target.files)} />
          <button type="button" className="btn-secondary w-full border-dashed py-6" onClick={() => input.current.click()}>
            <Upload className="h-4 w-4" />Choose files (PDF, JPG, PNG, DOC, DOCX)
          </button>
          <p className="mt-1 text-xs text-slate-500">Up to {biz.limits.maxFiles} files, {biz.limits.maxFileSizeMb} MB each.</p>
          {fileErr && <p className="field-error">{fileErr}</p>}
          <ul className="mt-3 space-y-2">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-lg border bg-slate-50 px-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2"><FileText className="h-4 w-4 shrink-0" /><span className="truncate">{f.name}</span><span className="shrink-0 text-xs text-slate-500">{formatBytes(f.size)}</span></span>
                <button type="button" aria-label={`Remove ${f.name}`} className="text-red-600" onClick={() => setFiles(files.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        </div>

        <button className="btn-primary w-full py-3" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Request'}</button>
      </form>
    </div>
  );
}
