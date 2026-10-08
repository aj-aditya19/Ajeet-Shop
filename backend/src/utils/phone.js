const normalizePhone = (p) => {
  let d = String(p || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d;
};
const isValidIndianMobile = (p) => /^[6-9]\d{9}$/.test(normalizePhone(p));
const toWhatsAppNumber = (p) => `91${normalizePhone(p)}`;
module.exports = { normalizePhone, isValidIndianMobile, toWhatsAppNumber };
