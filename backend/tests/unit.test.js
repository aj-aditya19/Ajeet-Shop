// DB-free tests: pure logic + security behaviour that is decided before any DB access.
const request = require('supertest');
const app = require('../src/app');
const { computeStatus } = require('../src/services/rentalService');
const { validateFormData } = require('../src/services/requestService');
const { validateFile } = require('../src/services/uploadService');
const { normalizePhone, isValidIndianMobile } = require('../src/utils/phone');

describe('overdue rental logic', () => {
  const now = new Date(2026, 5, 10, 15, 0); // 10 Jun 2026 15:00 local
  const d = (day) => new Date(2026, 5, day);
  test('future due date -> active', () => expect(computeStatus({ dueDate: d(12), returnDate: null, status: 'active' }, now)).toBe('active'));
  test('due today (even late in the day) -> due', () => expect(computeStatus({ dueDate: d(10), returnDate: null, status: 'active' }, now)).toBe('due'));
  test('past due and not returned -> overdue', () => expect(computeStatus({ dueDate: d(9), returnDate: null, status: 'active' }, now)).toBe('overdue'));
  test('returned stays returned even if late', () => expect(computeStatus({ dueDate: d(1), returnDate: d(9), status: 'returned' }, now)).toBe('returned'));
  test('cancelled stays cancelled', () => expect(computeStatus({ dueDate: d(1), returnDate: null, status: 'cancelled' }, now)).toBe('cancelled'));
});

describe('service-specific form validation', () => {
  const fields = [
    { key: 'numberOfPages', label: 'Pages', type: 'number', required: true, options: [] },
    { key: 'printType', label: 'Print type', type: 'select', required: true, options: ['Single side', 'Both sides'] },
  ];
  test('accepts valid data and drops unknown keys', () => {
    expect(validateFormData(fields, { numberOfPages: '12', printType: 'Both sides', hack: 'x' })).toEqual({ numberOfPages: 12, printType: 'Both sides' });
  });
  test('rejects missing / invalid values with 422', () => {
    expect.assertions(2);
    try { validateFormData(fields, { numberOfPages: '0', printType: 'Triple' }); } catch (e) { expect(e.status).toBe(422); expect(e.errors).toHaveLength(2); }
  });
});

describe('file validation', () => {
  const mk = (name, mimetype, bytes, size = 100) => ({ originalName: name, originalname: name, mimetype, buffer: Buffer.from(bytes), size });
  test('accepts a real PDF', () => expect(validateFile(mk('a.pdf', 'application/pdf', [0x25, 0x50, 0x44, 0x46]), 1e6)).toBe('pdf'));
  test('rejects executables', () => expect(() => validateFile(mk('virus.exe', 'application/x-msdownload', [0x4d, 0x5a]), 1e6)).toThrow(/not allowed/));
  test('rejects extension/content mismatch (exe renamed to pdf)', () => expect(() => validateFile(mk('virus.pdf', 'application/pdf', [0x4d, 0x5a, 0x90]), 1e6)).toThrow(/valid PDF/));
  test('rejects oversize files', () => expect(() => validateFile(mk('a.pdf', 'application/pdf', [0x25, 0x50, 0x44, 0x46], 5e6), 1e6)).toThrow(/too large/));
});

describe('phone helpers', () => {
  test('normalises +91 numbers', () => expect(normalizePhone('+91 94583-44385')).toBe('9458344385'));
  test('validates Indian mobiles', () => { expect(isValidIndianMobile('9458344385')).toBe(true); expect(isValidIndianMobile('12345')).toBe(false); });
});

describe('unauthenticated access (no DB needed)', () => {
  test('401 on protected customer route', async () => { const r = await request(app).get('/api/requests'); expect(r.status).toBe(401); expect(r.body.success).toBe(false); });
  test('401 on admin route', async () => { expect((await request(app).get('/api/admin/dashboard')).status).toBe(401); });
  test('401 for forged token', async () => { expect((await request(app).get('/api/auth/me').set('Authorization', 'Bearer abc.def.ghi')).status).toBe(401); });
  test('422 for invalid registration body', async () => {
    const r = await request(app).post('/api/auth/register').send({ name: 'x', email: 'nope', phone: '1', password: 'short' });
    expect(r.status).toBe(422); expect(r.body.errors.length).toBeGreaterThan(0);
  });
  test('404 envelope for unknown route', async () => { const r = await request(app).get('/api/nothing'); expect(r.status).toBe(404); expect(r.body.success).toBe(false); });
  test('business config is public', async () => { const r = await request(app).get('/api/config/business'); expect(r.status).toBe(200); expect(r.body.data.whatsappLink).toMatch(/wa\.me\/919458344385/); });
});
