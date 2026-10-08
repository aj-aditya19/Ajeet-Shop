import { Mail, MessageCircle, Phone } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

export default function ContactButtons({ whatsappText, className = '' }) {
  const b = useBusiness();
  const wa = whatsappText ? `https://wa.me/91${b.whatsapp}?text=${encodeURIComponent(whatsappText)}` : b.whatsappLink;
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <a className="btn-primary" href={`tel:+91${b.phones[0]}`}><Phone className="h-4 w-4" />Call</a>
      <a className="btn-success" href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" />WhatsApp</a>
      <a className="btn-secondary" href={`mailto:${b.email}`}><Mail className="h-4 w-4" />Email</a>
    </div>
  );
}
