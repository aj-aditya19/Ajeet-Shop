const CateringRental = require("../models/CateringRental");
const rentals = require("./rentalService");
const email = require("./emailService");
const env = require("../config/env");

const money = (n) => `Rs ${Number(n || 0).toLocaleString("en-IN")}`;
const fmt = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function formatDigest(list) {
  const lines = list.map((r, i) => {
    const items = r.items
      .map((it) => `${it.quantity} ${it.equipment?.name || "item"}`)
      .join(", ");
    return `${i + 1}) ${r.rentalId} - ${r.customerName} (${r.phone})${r.address ? `, ${r.address}` : ""}\n   ${items}\n   Last date: ${fmt(r.dueDate)} (${r.daysOverdue} day${r.daysOverdue > 1 ? "s" : ""} late) | Balance: ${money(r.balance)}`;
  });
  return `OVERDUE catering rentals: ${list.length}\n\n${lines.join("\n\n")}\n\nOpen the admin panel > Catering > Rentals and mark them returned when the equipment is back.`;
}

/** Sends one digest. `force` ignores the repeat interval (used by the "Send alert now" button). */
async function runOnce({ force = false, now = new Date() } = {}) {
  await rentals.syncStatuses(now);
  const filter = { status: "overdue", returnDate: null };
  if (!force) {
    const cutoff = new Date(
      now.getTime() - env.alerts.overdueEveryHours * 3600 * 1000,
    );
    filter.$or = [
      { lastOverdueAlertAt: null },
      { lastOverdueAlertAt: { $lte: cutoff } },
    ];
  }
  const docs = await CateringRental.find(filter)
    .sort({ dueDate: 1 })
    .populate("items.equipment", "name");
  if (!docs.length) return { overdue: 0, email: false };

  const list = docs.map((d) => rentals.present(d, now));
  const text = formatDigest(list);
  const emailOk = await email.send({
    to: env.alerts.adminEmail,
    subject: `OVERDUE: ${list.length} catering rental(s) not returned`,
    text,
  });
  if (emailOk) {
    await CateringRental.updateMany(
      { _id: { $in: docs.map((d) => d._id) } },
      { lastOverdueAlertAt: now, $inc: { overdueAlertCount: 1 } },
    );
  }
  return { overdue: list.length, email: emailOk };
}

function channels() {
  return {
    email: email.configured(),
    everyHours: env.alerts.overdueEveryHours,
    adminEmail: env.alerts.adminEmail,
  };
}

let timer;
function start() {
  if (env.isTest || timer) return;
  const tick = () =>
    runOnce()
      .then(
        (r) =>
          r.overdue &&
          console.log(`[alerts] overdue digest: ${JSON.stringify(r)}`),
      )
      .catch((e) => console.warn(`[alerts] ${e.message}`));
  setTimeout(tick, 30 * 1000);
  timer = setInterval(tick, 15 * 60 * 1000);
  console.log(
    `[alerts] overdue alerts every ${env.alerts.overdueEveryHours}h | email: ${email.configured()}`,
  );
}

module.exports = { runOnce, start, channels, formatDigest };
