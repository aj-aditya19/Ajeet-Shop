export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
export const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
export const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
export const formatBytes = (b) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);
export const toInputDate = (d) => {
  const x = d ? new Date(d) : new Date();
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
export const statusLabel = (s) => String(s || '').replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase());
export const CATEGORY_LABELS = { printing: 'Printing & Documents', digital: 'Digital Services', other: 'Other Services' };
