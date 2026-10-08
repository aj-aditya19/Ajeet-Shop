import { Link, Navigate, useLocation } from 'react-router-dom';
import { CheckCircle2, MessageCircle } from 'lucide-react';

export default function RequestSuccess() {
  const { state } = useLocation();
  const req = state?.request;
  if (!req) return <Navigate to="/shop/dashboard" replace />;
  return (
    <div className="mx-auto max-w-lg px-4 py-12 text-center">
      <div className="card">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
        <h1 className="mt-3 text-2xl font-bold">Request Submitted Successfully</h1>
        <p className="mt-4 text-sm text-slate-500">Request ID</p>
        <p className="text-3xl font-bold text-brand-700">{req.requestId}</p>
        <p className="mt-4 text-sm text-slate-600">We have received your request. You can check its status from your dashboard or contact the shop.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link className="btn-primary" to={`/shop/requests/${req._id}`}>View My Request</Link>
          <a className="btn-success" href={req.shopWhatsappLink} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" />WhatsApp Shop</a>
        </div>
      </div>
    </div>
  );
}
