import { Link } from 'react-router-dom';
import { MapPin, MessageCircle, UserPlus, Upload, Bell, CheckCircle2 } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import useAsync from '../../hooks/useAsync';
import { getServices } from '../../services/serviceApi';
import { Spinner, ErrorState, EmptyState } from '../../components/ui';
import { CATEGORY_LABELS } from '../../utils/format';

const STEPS = [[UserPlus, 'Register', 'Create a free account.'], [Upload, 'Request & upload', 'Pick a service and upload your documents.'],
  [Bell, 'We process it', 'Track the status from your dashboard.'], [CheckCircle2, 'Collect', 'Visit the shop when it is ready.']];

export default function ShopHome() {
  const b = useBusiness();
  const { data: services, loading, error, reload } = useAsync(() => getServices(), []);
  const groups = ['printing', 'digital', 'other'].map((c) => [c, (services || []).filter((s) => s.category === c)]).filter(([, l]) => l.length);
  return (
    <>
      <section className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center">
          <h1 className="text-3xl font-bold md:text-5xl">{b.name}</h1>
          <p className="mt-3 text-lg text-slate-600">Printing, Documentation &amp; Digital Services</p>
          <p className="mt-2 flex items-center justify-center gap-1 text-sm text-slate-500"><MapPin className="h-4 w-4" />Nanda Ki Chowki, Sudhowala, Dehradun</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/shop/request" className="btn-primary px-6 py-3">Request a Service</Link>
            <a href={b.whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-success px-6 py-3"><MessageCircle className="h-4 w-4" />WhatsApp Us</a>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
        <h2 className="text-2xl font-bold">Our Services</h2>
        {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : !groups.length ? <EmptyState title="No services available right now" /> : groups.map(([cat, list]) => (
          <div key={cat} className="mt-8">
            <h3 className="mb-3 text-lg font-semibold text-slate-700">{CATEGORY_LABELS[cat]}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((s) => (
                <Link key={s._id} to={`/shop/request?service=${s._id}`} className="card transition hover:border-brand-600">
                  <p className="font-semibold">{s.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{s.description}</p>
                  <p className="mt-3 text-sm font-medium text-brand-700">Request this service &rarr;</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section id="how-it-works" className="scroll-mt-20 border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-bold">How It Works</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([Icon, t, d], i) => (
              <div key={t} className="card"><Icon className="h-6 w-6 text-brand-600" /><p className="mt-2 font-semibold">{i + 1}. {t}</p><p className="text-sm text-slate-600">{d}</p></div>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate-500">Payment is made at the shop. There is no online payment.</p>
        </div>
      </section>
    </>
  );
}
