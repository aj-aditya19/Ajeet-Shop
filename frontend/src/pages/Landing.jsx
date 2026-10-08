import { Link } from 'react-router-dom';
import { Printer, ChefHat, MapPin, Phone } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

export default function Landing() {
  const b = useBusiness();
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-4 py-12">
      <h1 className="text-center text-3xl font-bold md:text-4xl">{b.name}</h1>
      <p className="mt-2 flex items-center justify-center gap-1 text-center text-slate-600"><MapPin className="h-4 w-4" />{b.address.slice(1, 4).join(', ')}</p>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <Link to="/shop" className="card transition hover:border-brand-600 hover:shadow-md">
          <Printer className="h-8 w-8 text-brand-600" />
          <h2 className="mt-3 text-xl font-semibold">Printing &amp; Digital Services</h2>
          <p className="mt-1 text-sm text-slate-600">Printouts, photocopy, lamination, PAN, Aadhaar, scanning, form filling and more. Request online and track status.</p>
        </Link>
        <Link to="/catering" className="card transition hover:border-brand-600 hover:shadow-md">
          <ChefHat className="h-8 w-8 text-brand-600" />
          <h2 className="mt-3 text-xl font-semibold">Catering Equipment Rental</h2>
          <p className="mt-1 text-sm text-slate-600">Bhati, chari, kadai, patila and other catering equipment on rent for your events.</p>
        </Link>
      </div>
      <p className="mt-8 flex items-center justify-center gap-1 text-sm text-slate-600"><Phone className="h-4 w-4" />{b.phones.join(' / ')}</p>
      <p className="mt-4 text-center text-xs text-slate-400"><Link to="/admin/login">Staff login</Link></p>
    </div>
  );
}
