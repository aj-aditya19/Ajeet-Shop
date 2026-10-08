import { ChefHat } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import useAsync from '../../hooks/useAsync';
import { getPublicEquipment } from '../../services/cateringApi';
import ContactButtons from '../../components/ContactButtons';
import { EmptyState, ErrorState, Spinner } from '../../components/ui';

export default function CateringPublic() {
  const b = useBusiness();
  const { data, loading, error, reload } = useAsync(getPublicEquipment, []);
  return (
    <>
      <section className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center">
          <h1 className="text-3xl font-bold md:text-5xl">{b.cateringName}</h1>
          <p className="mt-3 text-lg text-slate-600">Catering equipment on rent for weddings, functions and events</p>
          <ContactButtons className="mt-6 justify-center" whatsappText="Hello Ajeet Catering Services, I would like to rent catering equipment." />
        </div>
      </section>
      <section id="equipment" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
        <h2 className="text-2xl font-bold">Equipment available for rent</h2>
        {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : !data.length ? <EmptyState title="Equipment list coming soon" hint="Please call us for availability." /> : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.map((e) => (
              <div key={e._id} className="card flex flex-col">
                {e.imageUrl ? <img src={e.imageUrl} alt={e.name} loading="lazy" className="mb-3 h-36 w-full rounded-lg object-cover" />
                  : <div className="mb-3 flex h-36 items-center justify-center rounded-lg bg-slate-100 text-slate-400"><ChefHat className="h-10 w-10" /></div>}
                <p className="font-semibold">{e.name}</p>
                <p className="mt-1 flex-1 text-sm text-slate-600">{e.description}</p>
                {e.inStock !== undefined && <p className={`mt-2 text-xs font-medium ${e.inStock ? 'text-green-700' : 'text-red-600'}`}>{e.inStock ? 'Available' : 'Currently rented out'}</p>}
                <a className="btn-success btn-sm mt-3" target="_blank" rel="noopener noreferrer"
                  href={`https://wa.me/91${b.whatsapp}?text=${encodeURIComponent(`Hello, I would like to rent ${e.name}.`)}`}>Enquire on WhatsApp</a>
              </div>
            ))}
          </div>
        )}
      </section>
      <section id="contact" className="scroll-mt-20 border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center">
          <h2 className="text-2xl font-bold">Contact us for Catering Equipment Rental</h2>
          <p className="mt-2 text-slate-600">{b.address.join(', ')}</p>
          <p className="mt-1 text-slate-600">{b.phones.join(' / ')}</p>
          <ContactButtons className="mt-5 justify-center" />
        </div>
      </section>
    </>
  );
}
