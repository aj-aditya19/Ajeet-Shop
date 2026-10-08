// DB-free: bill maths and overdue alert text.
const { present } = require('../src/services/rentalService');
const { formatDigest } = require('../src/services/overdueAlertService');

const d = (day) => new Date(2026, 5, day);
const rental = (over = {}) => ({
  rentalId: 'CR-2026-00001', customerName: 'Ramesh Kumar', phone: '9876543210', address: 'Sudhowala',
  items: [{ quantity: 2, rate: 150, equipment: { name: 'Kadai' } }, { quantity: 1, rate: 300, equipment: { name: 'Bhati' } }],
  rentalDate: d(1), dueDate: d(4), returnDate: null, status: 'active', discount: 0, advancePaid: 0, ...over,
});

describe('bill', () => {
  test('bill = quantity x rate x days, balance = bill - advance - discount', () => {
    const r = present(rental({ discount: 100, advancePaid: 500 }), d(2));
    expect(r.days).toBe(3);
    expect(r.subtotal).toBe((2 * 150 + 300) * 3); // 1800
    expect(r.billAmount).toBe(1700);
    expect(r.balance).toBe(1200);
  });
  test('late return is billed for the extra days', () => {
    const r = present(rental({ returnDate: d(6), status: 'returned' }), d(7));
    expect(r.days).toBe(5);
    expect(r.billAmount).toBe((2 * 150 + 300) * 5);
  });
  test('balance never goes below zero', () => {
    expect(present(rental({ advancePaid: 99999 }), d(2)).balance).toBe(0);
  });
});

describe('overdue alert text', () => {
  test('lists customer, phone, items, days late and balance', () => {
    const r = present(rental({ status: 'overdue', advancePaid: 300 }), d(8));
    expect(r.daysOverdue).toBe(4);
    const text = formatDigest([r]);
    expect(text).toMatch(/CR-2026-00001 - Ramesh Kumar \(9876543210\)/);
    expect(text).toMatch(/2 Kadai, 1 Bhati/);
    expect(text).toMatch(/4 days late/);
    expect(text).toMatch(/Balance: Rs 1,500/);
  });
});
