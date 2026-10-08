// Query-string helpers: always coerce to primitives so operators like ?status[$ne]=x can't reach Mongo.
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
const int = (v, def, min = 1, max = 100) => {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) return def;
  return Math.min(Math.max(n, min), max);
};
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isObjectId = (v) => typeof v === 'string' && /^[a-f\d]{24}$/i.test(v);
const pageParams = (q) => {
  const page = int(q.page, 1, 1, 100000);
  const limit = int(q.limit, 10, 1, 100);
  return { page, limit, skip: (page - 1) * limit };
};
const pagination = (page, limit, total) => ({ page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) });
module.exports = { str, int, escapeRegex, isObjectId, pageParams, pagination };
