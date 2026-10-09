const mongoose = require("mongoose");
const CateringEquipment = require("../models/CateringEquipment");
const CateringRental = require("../models/CateringRental");
const ApiError = require("../utils/ApiError");
const { nextId } = require("../utils/idGenerator");
const { withLock } = require("../utils/mutex");
const { startOfDay, addDays } = require("../utils/dates");
const {
  escapeRegex,
  isObjectId,
  pageParams,
  pagination,
  str,
} = require("../utils/query");
const { normalizePhone } = require("../utils/phone");

const OPEN = ["active", "due", "overdue"];
const DAY = 86400000;

/** Pure: status a rental should have at time `now`. Due date is inclusive (overdue starts the day after). */
function computeStatus(rental, now = new Date()) {
  if (rental.status === "cancelled") return "cancelled";
  if (rental.returnDate || rental.status === "returned") return "returned";
  const today = startOfDay(now);
  const due = new Date(rental.dueDate);
  if (due < today) return "overdue";
  if (due < addDays(today, 1)) return "due";
  return "active";
}

/** Persist date-driven statuses so queries/filters on `status` are always correct. */
async function syncStatuses(now = new Date()) {
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const open = { returnDate: null, status: { $in: OPEN } };
  await Promise.all([
    CateringRental.updateMany(
      { ...open, dueDate: { $lt: today }, status: { $ne: "overdue" } },
      { status: "overdue" },
    ),
    CateringRental.updateMany(
      {
        ...open,
        dueDate: { $gte: today, $lt: tomorrow },
        status: { $ne: "due" },
      },
      { status: "due" },
    ),
    CateringRental.updateMany(
      { ...open, dueDate: { $gte: tomorrow }, status: { $ne: "active" } },
      { status: "active" },
    ),
  ]);
}

async function rentedMap(excludeRentalId) {
  const match = { returnDate: null, status: { $in: OPEN } };
  if (excludeRentalId)
    match._id = { $ne: new mongoose.Types.ObjectId(excludeRentalId) };
  const rows = await CateringRental.aggregate([
    { $match: match },
    { $unwind: "$items" },
    {
      $group: { _id: "$items.equipment", rented: { $sum: "$items.quantity" } },
    },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.rented]));
}

async function listEquipment({ includeInactive = true } = {}) {
  const [items, rented] = await Promise.all([
    CateringEquipment.find(includeInactive ? {} : { active: true })
      .sort({ name: 1 })
      .lean(),
    rentedMap(),
  ]);
  return items.map((e) => {
    const r = rented.get(String(e._id)) || 0;
    return { ...e, rented: r, available: Math.max(0, e.totalQuantity - r) };
  });
}

async function publicEquipment() {
  const items = await listEquipment({ includeInactive: false });
  return items.map((e) => ({
    _id: e._id,
    name: e.name,
    category: e.category,
    description: e.description,
    imageUrl: e.imageUrl,
    ...(e.showAvailability ? { inStock: e.available > 0 } : {}),
  }));
}

async function saveEquipment(data, id) {
  if (id) {
    const used = await rentedMap();
    if (data.totalQuantity < (used.get(String(id)) || 0))
      throw new ApiError(
        409,
        "Total quantity cannot be lower than the quantity currently rented out",
      );
    const e = await CateringEquipment.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!e) throw new ApiError(404, "Equipment not found");
    return e;
  }
  return CateringEquipment.create(data);
}

async function deactivateEquipment(id) {
  const e = await CateringEquipment.findByIdAndUpdate(
    id,
    { active: false },
    { new: true },
  );
  if (!e) throw new ApiError(404, "Equipment not found");
  return e;
}

async function buildItems(items, excludeRentalId) {
  const merged = new Map();
  for (const it of items) {
    const k = String(it.equipment);
    const prev = merged.get(k);
    merged.set(
      k,
      prev ? { ...prev, quantity: prev.quantity + it.quantity } : { ...it },
    );
  }
  const ids = [...merged.keys()];
  const [equipment, rented] = await Promise.all([
    CateringEquipment.find({ _id: { $in: ids } }),
    rentedMap(excludeRentalId),
  ]);
  const byId = new Map(equipment.map((e) => [String(e._id), e]));
  const errors = [];
  const result = [];
  for (const [id, it] of merged) {
    const e = byId.get(id);
    if (!e || !e.active) {
      errors.push({
        field: "items",
        message: "Equipment not found or inactive",
      });
      continue;
    }
    const available = e.totalQuantity - (rented.get(id) || 0);
    if (it.quantity > available)
      errors.push({
        field: "items",
        message: `Only ${Math.max(0, available)} ${e.name} available (requested ${it.quantity})`,
      });
    result.push({
      equipment: e._id,
      quantity: it.quantity,
      rate: it.rate ?? e.defaultRate,
    });
  }
  if (errors.length) throw new ApiError(409, errors[0].message, errors);
  return result;
}

function present(r, now = new Date()) {
  const o = r.toObject ? r.toObject() : r;
  o.status = computeStatus(o, now);
  const end = o.returnDate ? new Date(o.returnDate) : new Date(o.dueDate);
  const days = Math.max(
    1,
    Math.ceil((startOfDay(end) - startOfDay(o.rentalDate)) / DAY) || 1,
  );
  o.days = days;
  o.subtotal = o.items.reduce((s, i) => s + i.quantity * i.rate * days, 0);
  o.discount = o.discount || 0;
  o.advancePaid = o.advancePaid || 0;
  o.billAmount = Math.max(0, o.subtotal - o.discount); // rate x quantity xzz days, minus discount
  o.balance = Math.max(0, o.billAmount - o.advancePaid);
  o.estimatedTotal = o.billAmount; // kept for older screens/reports
  o.daysOverdue =
    o.status === "overdue"
      ? Math.max(1, Math.round((startOfDay(now) - startOfDay(o.dueDate)) / DAY))
      : 0;
  return o;
}

const populate = (q) => q.populate("items.equipment", "name category");

function createRental(admin, data) {
  return withLock(async () => {
    const items = await buildItems(data.items);
    const rental = await CateringRental.create({
      rentalId: await nextId("CR"),
      customerName: data.customerName,
      phone: normalizePhone(data.phone),
      address: data.address,
      items,
      rentalDate: startOfDay(data.rentalDate),
      dueDate: startOfDay(data.dueDate),
      notes: data.notes,
      discount: data.discount || 0,
      advancePaid: data.advancePaid || 0,
      createdBy: admin._id,
    });
    rental.status = computeStatus(rental);
    await rental.save();
    return present(await populate(CateringRental.findById(rental._id)));
  });
}

function updateRental(id, data) {
  return withLock(async () => {
    const rental = await CateringRental.findById(id);
    if (!rental) throw new ApiError(404, "Rental not found");
    if (["returned", "cancelled"].includes(rental.status))
      throw new ApiError(409, `A ${rental.status} rental cannot be edited`);
    rental.items = await buildItems(data.items, id);
    Object.assign(rental, {
      customerName: data.customerName,
      phone: normalizePhone(data.phone),
      address: data.address,
      notes: data.notes,
      discount: data.discount || 0,
      advancePaid: data.advancePaid || 0,
      rentalDate: startOfDay(data.rentalDate),
      dueDate: startOfDay(data.dueDate),
    });
    rental.status = computeStatus(rental);
    await rental.save();
    return present(await populate(CateringRental.findById(id)));
  });
}

async function markReturned(id, now = new Date()) {
  const rental = await CateringRental.findById(id);
  if (!rental) throw new ApiError(404, "Rental not found");
  if (rental.status === "returned")
    throw new ApiError(409, "Rental is already marked as returned");
  if (rental.status === "cancelled")
    throw new ApiError(409, "A cancelled rental cannot be returned");
  rental.returnDate = now;
  rental.status = "returned";
  await rental.save();
  return present(await populate(CateringRental.findById(id)));
}

async function cancelRental(id) {
  const rental = await CateringRental.findById(id);
  if (!rental) throw new ApiError(404, "Rental not found");
  if (rental.status === "returned")
    throw new ApiError(409, "A returned rental cannot be cancelled");
  rental.status = "cancelled";
  await rental.save();
  return present(await populate(CateringRental.findById(id)));
}

async function getRental(id) {
  await syncStatuses();
  if (!isObjectId(id)) throw new ApiError(400, "Invalid identifier");
  const r = await populate(CateringRental.findById(id));
  if (!r) throw new ApiError(404, "Rental not found");
  return present(r);
}

async function listRentals(q) {
  await syncStatuses();
  const filter = {};
  const status = str(q.status);
  if (status === "open") filter.status = { $in: OPEN };
  else if (status === "history")
    filter.status = { $in: ["returned", "cancelled"] };
  else if (
    status &&
    ["active", "due", "overdue", "returned", "cancelled"].includes(status)
  )
    filter.status = status;
  const search = str(q.search);
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    const eq = await CateringEquipment.find({ name: rx }).select("_id");
    filter.$or = [
      { customerName: rx },
      { phone: rx },
      { rentalId: rx },
      { "items.equipment": { $in: eq.map((e) => e._id) } },
    ];
  }
  const { page, limit, skip } = pageParams(q);
  const [items, total] = await Promise.all([
    populate(
      CateringRental.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ),
    CateringRental.countDocuments(filter),
  ]);
  return {
    items: items.map((r) => present(r)),
    pagination: pagination(page, limit, total),
  };
}

async function dashboard(now = new Date()) {
  await syncStatuses(now);
  const [active, dueToday, overdue, returned, totalEquipment] =
    await Promise.all([
      CateringRental.countDocuments({
        returnDate: null,
        status: { $in: OPEN },
      }),
      CateringRental.countDocuments({ status: "due" }),
      CateringRental.countDocuments({ status: "overdue" }),
      CateringRental.countDocuments({ status: "returned" }),
      CateringEquipment.countDocuments({ active: true }),
    ]);
  return { active, dueToday, overdue, returned, totalEquipment };
}

async function clients() {
  const rentals = await CateringRental.find({ status: { $ne: "cancelled" } })
    .sort({ createdAt: -1 })
    .limit(2000)
    .select("phone customerName address rentalDate")
    .lean();
  const byPhone = new Map();
  for (const r of rentals) {
    const cur = byPhone.get(r.phone);
    if (!cur)
      byPhone.set(r.phone, {
        phone: r.phone,
        name: r.customerName,
        address: r.address,
        rentals: 1,
        lastRental: r.rentalDate,
      });
    else {
      cur.rentals += 1;
      if (r.rentalDate > cur.lastRental) cur.lastRental = r.rentalDate;
    }
  }
  return [...byPhone.values()].sort((a, b) => b.lastRental - a.lastRental);
}

async function reports({ from, to } = {}) {
  const filter = { status: { $ne: "cancelled" } };
  const f = from ? new Date(from) : null;
  const t = to ? new Date(to) : null;
  if (f && !isNaN(f)) filter.rentalDate = { $gte: f };
  if (t && !isNaN(t)) filter.rentalDate = { ...filter.rentalDate, $lte: t };
  const rentals = (await populate(CateringRental.find(filter))).map((r) =>
    present(r),
  );
  const byEquipment = {};
  const byMonth = {};
  for (const r of rentals) {
    const m = new Date(r.rentalDate).toISOString().slice(0, 7);
    byMonth[m] = byMonth[m] || { month: m, rentals: 0, revenue: 0 };
    byMonth[m].rentals += 1;
    byMonth[m].revenue += r.estimatedTotal;
    for (const i of r.items) {
      const k = i.equipment?.name || "Unknown";
      byEquipment[k] = byEquipment[k] || {
        name: k,
        quantityRented: 0,
        revenue: 0,
      };
      byEquipment[k].quantityRented += i.quantity;
      byEquipment[k].revenue += i.quantity * i.rate * r.days;
    }
  }
  return {
    totalRentals: rentals.length,
    totalRevenue: rentals.reduce((s, r) => s + r.estimatedTotal, 0),
    byEquipment: Object.values(byEquipment).sort(
      (a, b) => b.revenue - a.revenue,
    ),
    byMonth: Object.values(byMonth).sort((a, b) =>
      a.month.localeCompare(b.month),
    ),
    note: "Revenue is estimated as quantity x rate x rental days; no payments are recorded in the system.",
  };
}

module.exports = {
  present,
  OPEN,
  computeStatus,
  syncStatuses,
  listEquipment,
  publicEquipment,
  saveEquipment,
  deactivateEquipment,
  createRental,
  updateRental,
  markReturned,
  cancelRental,
  getRental,
  listRentals,
  dashboard,
  clients,
  reports,
};
