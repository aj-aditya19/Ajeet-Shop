import { MapPin, Phone, Mail } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import ContactButtons from '../../components/ContactButtons';

export default function Contact() {
  const b = useBusiness();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <div className="card mt-6 space-y-5">
        <p className="text-lg font-semibold">{b.name}</p>
        <div className="flex gap-3"><MapPin className="mt-1 h-5 w-5 shrink-0 text-brand-600" /><address className="not-italic">{b.address.map((l) => <div key={l}>{l}</div>)}</address></div>
        <div className="flex gap-3"><Phone className="h-5 w-5 text-brand-600" /><div>{b.phones.map((p) => <a key={p} href={`tel:+91${p}`} className="mr-4 hover:underline">{p}</a>)}</div></div>
        <div className="flex gap-3"><Mail className="h-5 w-5 text-brand-600" /><a href={`mailto:${b.email}`} className="hover:underline">{b.email}</a></div>
        <ContactButtons />
        {b.mapsUrl && <a className="btn-secondary" href={b.mapsUrl} target="_blank" rel="noopener noreferrer">Open in Google Maps</a>}
      </div>
    </div>
  );
}
