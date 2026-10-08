import { formatCurrency, formatDate } from './format';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Opens a clean printable bill for a rental in a new window. */
export function printBill(r, biz) {
  const rows = r.items.map((i, n) => `<tr><td>${n + 1}</td><td>${esc(i.equipment?.name)}</td><td class="n">${i.quantity}</td><td class="n">${formatCurrency(i.rate)}</td><td class="n">${r.days}</td><td class="n">${formatCurrency(i.quantity * i.rate * r.days)}</td></tr>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Bill ${esc(r.rentalId)}</title><style>
  body{font-family:Arial,sans-serif;margin:32px;color:#111} h1{margin:0;font-size:22px} .m{color:#555;font-size:13px}
  table{width:100%;border-collapse:collapse;margin-top:16px;font-size:14px} th,td{border:1px solid #999;padding:6px 8px;text-align:left} .n{text-align:right}
  .box{display:flex;justify-content:space-between;margin-top:14px;font-size:14px} .tot{margin-left:auto;width:260px;margin-top:12px;font-size:14px}
  .tot div{display:flex;justify-content:space-between;padding:3px 0} .bold{font-weight:bold;border-top:2px solid #111;margin-top:4px;padding-top:6px}
  .sign{display:flex;justify-content:space-between;margin-top:60px;font-size:13px} @media print{button{display:none}}</style></head><body>
  <h1>${esc(biz.cateringName)}</h1><div class="m">${esc(biz.address.join(', '))}<br>Phone: ${esc(biz.phones.join(' / '))}</div><hr>
  <div class="box"><div><b>Bill to:</b> ${esc(r.customerName)}<br>Phone: ${esc(r.phone)}<br>${esc(r.address || '')}</div>
  <div style="text-align:right"><b>Bill no:</b> ${esc(r.rentalId)}<br><b>Rental date:</b> ${formatDate(r.rentalDate)}<br><b>Last date:</b> ${formatDate(r.dueDate)}${r.returnDate ? `<br><b>Returned:</b> ${formatDate(r.returnDate)}` : ''}</div></div>
  <table><thead><tr><th>#</th><th>Item</th><th class="n">Qty</th><th class="n">Rate/day</th><th class="n">Days</th><th class="n">Amount</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="tot"><div><span>Total</span><span>${formatCurrency(r.subtotal)}</span></div>
  ${r.discount ? `<div><span>Discount</span><span>- ${formatCurrency(r.discount)}</span></div>` : ''}
  <div><span>Bill amount</span><span>${formatCurrency(r.billAmount)}</span></div>
  <div><span>Advance paid</span><span>- ${formatCurrency(r.advancePaid)}</span></div>
  <div class="bold"><span>Balance due</span><span>${formatCurrency(r.balance)}</span></div></div>
  ${r.notes ? `<p class="m">Notes: ${esc(r.notes)}</p>` : ''}
  <div class="sign"><span>Customer signature</span><span>For ${esc(biz.cateringName)}</span></div>
  <p class="m">Equipment must be returned by the last date. Late return is charged per day.</p>
  <button onclick="window.print()">Print</button><script>window.onload=function(){setTimeout(function(){window.print()},300)}</script></body></html>`;
  const w = window.open('', '_blank');
  if (!w) return alert('Please allow pop-ups to print the bill.');
  w.document.write(html);
  w.document.close();
}
