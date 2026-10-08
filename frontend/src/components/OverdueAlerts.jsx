import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BellRing, ChevronDown, ChevronUp, MessageCircle, Phone } from 'lucide-react';
import { getAlerts, sendAlertsNow } from '../services/cateringApi';
import { getErrorMessage } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';

const POLL_MS = 60 * 1000;            // check every minute
const NOTIFY_EVERY_MS = 30 * 60 * 1000; // repeat desktop notification every 30 minutes while overdue

export const reminderLink = (r) =>
  `https://wa.me/91${r.phone}?text=${encodeURIComponent(
    `Namaste ${r.customerName}, Ajeet Catering Services se message. Aapke rental ${r.rentalId} ki last date ${formatDate(r.dueDate)} thi (${r.daysOverdue} din ho gaye). ` +
    `Kripya saaman jaldi wapas karein. Baaki rakam: ${formatCurrency(r.balance)}. Dhanyavaad.`
  )}`;

export default function OverdueAlerts() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [perm, setPerm] = useState(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
  const lastNotified = useRef(Number(sessionStorage.getItem('lastOverdueNotify') || 0));
  const baseTitle = useRef(document.title);

  const load = useCallback(() => getAlerts().then(setData).catch(() => {}), []);
  useEffect(() => { load(); const t = setInterval(load, POLL_MS); return () => clearInterval(t); }, [load]);

  const count = data?.overdue?.length || 0;
  useEffect(() => {
    document.title = count ? `(${count} OVERDUE) ${baseTitle.current}` : baseTitle.current;
    if (count && perm === 'granted' && Date.now() - lastNotified.current > NOTIFY_EVERY_MS) {
      lastNotified.current = Date.now();
      sessionStorage.setItem('lastOverdueNotify', String(lastNotified.current));
      new Notification(`${count} catering rental(s) overdue`, { body: data.overdue.map((r) => `${r.customerName} - ${r.rentalId}`).join('\n'), requireInteraction: true });
    }
    return () => { document.title = baseTitle.current; };
  }, [count, perm, data]);

  const enable = async () => setPerm(await Notification.requestPermission());
  const sendNow = async () => {
    setMsg('');
    try {
      const r = await sendAlertsNow();
      const ch = r.result;
      setMsg(ch.email ? 'Alert sent by email.' : 'Email alerts are not set up in the server .env, so nothing was sent. The banner above still works.');
    } catch (e) { setMsg(getErrorMessage(e)); }
  };

  if (!count) return null;
  return (
    <div className="mb-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900" role="alert">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button className="flex items-center gap-2 font-semibold" onClick={() => setOpen(!open)}>
          <AlertTriangle className="h-5 w-5" />{count} catering rental{count > 1 ? 's are' : ' is'} OVERDUE
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <div className="flex flex-wrap gap-2">
          {perm === 'default' && <button className="btn-secondary btn-sm" onClick={enable}><BellRing className="h-3.5 w-3.5" />Enable desktop alerts</button>}
          <button className="btn-danger btn-sm" onClick={sendNow}>Send alert now</button>
          <Link className="btn-secondary btn-sm" to="/admin/catering/rentals">Open rentals</Link>
        </div>
      </div>
      {msg && <p className="mt-2 text-xs">{msg}</p>}
      {open && (
        <ul className="mt-3 space-y-2">
          {data.overdue.map((r) => (
            <li key={r._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3 text-slate-800">
              <span>
                <b>{r.customerName}</b> ({r.phone}) &middot; {r.rentalId}<br />
                <span className="text-xs text-slate-600">
                  {r.items.map((i) => `${i.quantity} ${i.equipment?.name || ''}`).join(', ')} &middot; last date {formatDate(r.dueDate)} ({r.daysOverdue} day{r.daysOverdue > 1 ? 's' : ''} late) &middot; balance {formatCurrency(r.balance)}
                </span>
              </span>
              <span className="flex gap-2">
                <a className="btn-success btn-sm" href={reminderLink(r)} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-3.5 w-3.5" />Remind</a>
                <a className="btn-primary btn-sm" href={`tel:+91${r.phone}`}><Phone className="h-3.5 w-3.5" />Call</a>
              </span>
            </li>
          ))}
        </ul>
      )}
      {!open && <p className="mt-1 text-xs text-red-800">{data.overdue.slice(0, 3).map((r) => r.customerName).join(', ')}{count > 3 ? ` +${count - 3} more` : ''} &mdash; click to see details.</p>}
      <p className="mt-2 text-xs text-red-700">
        Email alerts: {data.channels.email ? 'ON' : 'OFF'} (repeats every {data.channels.everyHours} hours until returned).
      </p>
    </div>
  );
}
