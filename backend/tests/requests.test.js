const { api, connect, disconnect, clear, registerCustomer, createAdmin, auth, pdf } = require('./helpers');
const Service = require('../src/models/Service');

beforeAll(connect);
afterAll(disconnect);
beforeEach(clear);

async function makeService() {
  return Service.create({
    name: 'B&W Printout', category: 'printing',
    fields: [
      { key: 'numberOfPages', label: 'Pages', type: 'number', required: true },
      { key: 'printType', label: 'Print type', type: 'select', required: true, options: ['Single side', 'Both sides'] },
    ],
  });
}
const submit = (token, service, over = {}, files = [{ buf: pdf, name: 'notes.pdf', type: 'application/pdf' }]) => {
  let r = api().post('/api/requests').set(auth(token))
    .field('name', 'Rahul Sharma').field('phone', '9876543210').field('email', 'rahul@example.com')
    .field('serviceId', String(service._id)).field('contactPreference', 'whatsapp')
    .field('formData', JSON.stringify({ numberOfPages: 10, printType: 'Both sides', ...over }));
  files.forEach((f) => (r = r.attach('files', f.buf, { filename: f.name, contentType: f.type })));
  return r;
};

describe('service requests', () => {
  test('requires login', async () => {
    const s = await makeService();
    const res = await api().post('/api/requests').field('serviceId', String(s._id));
    expect(res.status).toBe(401);
  });

  test('customer creates a request with a document; human readable ID is generated', async () => {
    const s = await makeService();
    const { token } = await registerCustomer();
    const res = await submit(token, s);
    expect(res.status).toBe(201);
    expect(res.body.data.request.requestId).toMatch(/^AJ-\d{4}-00001$/);
    expect(res.body.data.request.uploadedFiles).toHaveLength(1);
    expect(JSON.stringify(res.body)).not.toMatch(/storageUrl|storageId/);
  });

  test('backend validates service-specific fields', async () => {
    const s = await makeService();
    const { token } = await registerCustomer();
    const res = await submit(token, s, { numberOfPages: 0, printType: 'Nope' });
    expect(res.status).toBe(422);
  });

  test('rejects disallowed and fake files', async () => {
    const s = await makeService();
    const { token } = await registerCustomer();
    expect((await submit(token, s, {}, [{ buf: Buffer.from('MZ..'), name: 'x.exe', type: 'application/x-msdownload' }])).status).toBe(422);
    expect((await submit(token, s, {}, [{ buf: Buffer.from('MZ..'), name: 'x.pdf', type: 'application/pdf' }])).status).toBe(422);
  });

  test('customers only see their own requests and files', async () => {
    const s = await makeService();
    const a = await registerCustomer();
    const b = await registerCustomer();
    const created = (await submit(a.token, s)).body.data.request;
    expect((await api().get(`/api/requests/${created._id}`).set(auth(a.token))).status).toBe(200);
    expect((await api().get(`/api/requests/${created._id}`).set(auth(b.token))).status).toBe(404);
    expect((await api().get('/api/requests').set(auth(b.token))).body.data.items).toHaveLength(0);
    const fileId = created.uploadedFiles[0]._id;
    expect((await api().get(`/api/uploads/${fileId}/download`).set(auth(a.token))).status).toBe(200);
    expect((await api().get(`/api/uploads/${fileId}/download`).set(auth(b.token))).status).toBe(404);
  });

  test('admin updates status; customer cannot; invalid transitions are 409', async () => {
    const s = await makeService();
    const c = await registerCustomer();
    const adminToken = await createAdmin();
    const created = (await submit(c.token, s)).body.data.request;

    expect((await api().patch(`/api/requests/${created._id}/status`).set(auth(c.token)).send({ status: 'completed' })).status).toBe(403);
    expect((await api().patch(`/api/requests/${created._id}/status`).set(auth(adminToken)).send({ status: 'completed' })).status).toBe(409);

    const ok = await api().patch(`/api/requests/${created._id}/status`).set(auth(adminToken)).send({ status: 'accepted', adminMessage: 'Ready tomorrow' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.request.status).toBe('accepted');

    const seen = await api().get(`/api/requests/${created._id}`).set(auth(c.token));
    expect(seen.body.data.request.status).toBe('accepted');
    expect(seen.body.data.request.adminMessage).toBe('Ready tomorrow');

    const done = await api().patch(`/api/requests/${created._id}/status`).set(auth(adminToken)).send({ status: 'completed' });
    expect(done.body.data.request.completedAt).toBeTruthy();
  });

  test('admin dashboard uses real counts', async () => {
    const s = await makeService();
    const c = await registerCustomer();
    const adminToken = await createAdmin();
    await submit(c.token, s);
    const res = await api().get('/api/admin/dashboard').set(auth(adminToken));
    expect(res.body.data.pending).toBe(1);
    expect(res.body.data.totalCustomers).toBe(1);
  });
});
