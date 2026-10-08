const { api, connect, disconnect, clear, registerCustomer, createAdmin, auth } = require('./helpers');

beforeAll(connect);
afterAll(disconnect);
beforeEach(clear);

describe('auth', () => {
  test('registers a customer, hashes the password and never exposes it', async () => {
    const { res } = await registerCustomer();
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('customer');
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|Passw0rdX/);
    const User = require('../src/models/User');
    const u = await User.findOne({}).select('+passwordHash');
    expect(u.passwordHash).not.toBe('Passw0rdX');
  });

  test('ignores a role sent by the client', async () => {
    const { res } = await registerCustomer({ role: 'admin' });
    expect(res.body.data.user.role).toBe('customer');
  });

  test('duplicate email -> 409', async () => {
    const { body } = await registerCustomer({ email: 'dup@example.com' });
    const res = await api().post('/api/auth/register').send(body);
    expect(res.status).toBe(409);
  });

  test('login success and wrong password', async () => {
    const { body } = await registerCustomer({ email: 'a@example.com' });
    expect((await api().post('/api/auth/login').send({ email: body.email, password: body.password })).status).toBe(200);
    expect((await api().post('/api/auth/login').send({ email: body.email, password: 'WrongPass1' })).status).toBe(401);
  });

  test('/me returns the current user', async () => {
    const { token } = await registerCustomer();
    const res = await api().get('/api/auth/me').set(auth(token));
    expect(res.status).toBe(200);
  });

  test('customer gets 403 on admin APIs, anonymous gets 401', async () => {
    const { token } = await registerCustomer();
    expect((await api().get('/api/admin/dashboard').set(auth(token))).status).toBe(403);
    expect((await api().get('/api/catering/equipment').set(auth(token))).status).toBe(403);
    expect((await api().get('/api/admin/dashboard')).status).toBe(401);
  });

  test('admin login rejects customers; admin can reach admin APIs', async () => {
    const { body } = await registerCustomer({ email: 'c@example.com' });
    expect((await api().post('/api/auth/admin/login').send({ email: body.email, password: body.password })).status).toBe(401);
    const adminToken = await createAdmin();
    expect((await api().get('/api/admin/dashboard').set(auth(adminToken))).status).toBe(200);
  });
});
