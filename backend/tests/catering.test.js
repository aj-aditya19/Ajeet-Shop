const { api, connect, disconnect, clear, createAdmin, registerCustomer, auth } = require('./helpers');
const CateringRental = require('../src/models/CateringRental');
const rentalService = require('../src/services/rentalService');

beforeAll(connect);
afterAll(disconnect);
beforeEach(clear);

const iso = (offsetDays) => {
  const d = new Date(); d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
async function setup() {
  const token = await createAdmin();
  const kadai = (await api().post('/api/catering/equipment').set(auth(token)).send({ name: 'Kadai', category: 'kadai', totalQuantity: 10, defaultRate: 150 })).body.data.equipment;
  return { token, kadai };
}
const rent = (token, kadai, quantity, over = {}) =>
  api().post('/api/catering/rentals').set(auth(token)).send({
    customerName: 'Ramesh Kumar', phone: '9876543210', address: 'Sudhowala',
    items: [{ equipment: kadai._id, quantity }], rentalDate: iso(0), dueDate: iso(2), ...over,
  });

describe('catering', () => {
  test('equipment is admin-only and validated', async () => {
    const c = await registerCustomer();
    expect((await api().post('/api/catering/equipment').set(auth(c.token)).send({ name: 'X', totalQuantity: 1, defaultRate: 1 })).status).toBe(403);
    const { token } = await setup();
    expect((await api().post('/api/catering/equipment').set(auth(token)).send({ name: 'Bad', totalQuantity: -3, defaultRate: 1 })).status).toBe(422);
  });

  test('creates a rental with generated ID and default rate; availability drops', async () => {
    const { token, kadai } = await setup();
    const res = await rent(token, kadai, 3);
    expect(res.status).toBe(201);
    expect(res.body.data.rental.rentalId).toMatch(/^CR-\d{4}-00001$/);
    expect(res.body.data.rental.items[0].rate).toBe(150);
    const list = (await api().get('/api/catering/equipment').set(auth(token))).body.data.items;
    expect(list[0]).toMatchObject({ totalQuantity: 10, rented: 3, available: 7 });
  });

  test('cannot rent more than available (checked on the backend, incl. duplicate lines)', async () => {
    const { token, kadai } = await setup();
    expect((await rent(token, kadai, 8)).status).toBe(201);
    const over = await rent(token, kadai, 3);
    expect(over.status).toBe(409);
    expect(over.body.message).toMatch(/Only 2 Kadai available/);
    const dup = await rent(token, kadai, 1, { items: [{ equipment: kadai._id, quantity: 2 }, { equipment: kadai._id, quantity: 1 }] });
    expect(dup.status).toBe(409);
  });

  test('return frees inventory; double return is rejected', async () => {
    const { token, kadai } = await setup();
    const rental = (await rent(token, kadai, 10)).body.data.rental;
    expect((await rent(token, kadai, 1)).status).toBe(409);
    const ret = await api().patch(`/api/catering/rentals/${rental._id}/return`).set(auth(token));
    expect(ret.status).toBe(200);
    expect(ret.body.data.rental.status).toBe('returned');
    expect(ret.body.data.rental.returnDate).toBeTruthy();
    expect((await rent(token, kadai, 10)).status).toBe(201);
    expect((await api().patch(`/api/catering/rentals/${rental._id}/return`).set(auth(token))).status).toBe(409);
  });

  test('overdue is determined by the backend from dates', async () => {
    const { token, kadai } = await setup();
    const res = await rent(token, kadai, 1, { rentalDate: iso(-5), dueDate: iso(-1) });
    expect(res.body.data.rental.status).toBe('overdue');
    const dash = (await api().get('/api/catering/dashboard').set(auth(token))).body.data;
    expect(dash.overdue).toBe(1);
    expect(dash.active).toBe(1);
    // a stored "active" rental whose due date has passed is corrected on sync
    await CateringRental.updateMany({}, { status: 'active' });
    await rentalService.syncStatuses();
    expect((await CateringRental.findOne()).status).toBe('overdue');
  });

  test('search by name, phone, rental ID and equipment; history filter', async () => {
    const { token, kadai } = await setup();
    const r = (await rent(token, kadai, 1)).body.data.rental;
    for (const q of ['Ramesh', '98765', r.rentalId, 'Kada']) {
      const res = await api().get('/api/catering/rentals').query({ search: q }).set(auth(token));
      expect(res.body.data.items).toHaveLength(1);
    }
    await api().patch(`/api/catering/rentals/${r._id}/return`).set(auth(token));
    expect((await api().get('/api/catering/rentals').query({ status: 'history' }).set(auth(token))).body.data.items).toHaveLength(1);
    expect((await api().get('/api/catering/rentals').query({ status: 'open' }).set(auth(token))).body.data.items).toHaveLength(0);
  });

  test('public equipment hides quantities', async () => {
    const { kadai } = await setup();
    const res = await api().get('/api/catering/public/equipment');
    expect(res.status).toBe(200);
    expect(res.body.data.items[0].name).toBe('Kadai');
    expect(JSON.stringify(res.body)).not.toMatch(/totalQuantity|rented|available/);
    expect(kadai).toBeTruthy();
  });
});
