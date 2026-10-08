// Optional email. Never throws: missing credentials or SMTP failures only log a warning.
const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter;
const configured = () => Boolean(env.email.host && env.email.user && env.email.password);

function getTransporter() {
  if (!transporter) {
    if (String(env.email.host).includes('@'))
      console.warn('[email] EMAIL_HOST must be an SMTP server like smtp.gmail.com, not an email address.');
    transporter = nodemailer.createTransport({
      host: env.email.host,
      port: env.email.port,
      secure: env.email.port === 465,
      auth: { user: env.email.user, pass: env.email.password },
    });
  }
  return transporter;
}

async function send({ to, subject, text }) {
  if (env.isTest || !configured() || !to) return false;
  try {
    await getTransporter().sendMail({ from: env.email.from, to, subject, text });
    return true;
  } catch (err) {
    console.warn(`[email] failed to send "${subject}": ${err.message}`);
    return false;
  }
}

const notifyNewRequest = (req, serviceName) =>
  Promise.all([
    send({
      to: req.contact.email,
      subject: `Request received: ${req.requestId}`,
      text: `Hello ${req.contact.name},\n\nWe have received your request ${req.requestId} for ${serviceName}. You can track it from your dashboard.\n\n- ${env.business.name}`,
    }),
    send({
      to: env.business.email,
      subject: `New service request ${req.requestId}`,
      text: `New request ${req.requestId} (${serviceName}) from ${req.contact.name}, phone ${req.contact.phone}.`,
    }),
  ]);

const notifyStatusChanged = (req, serviceName) =>
  send({
    to: req.contact.email,
    subject: req.status === 'completed' ? `Request completed: ${req.requestId}` : `Request update: ${req.requestId}`,
    text: `Hello ${req.contact.name},\n\nYour request ${req.requestId} (${serviceName}) is now "${req.status.replace('_', ' ')}".${
      req.adminMessage ? `\n\nMessage from the shop: ${req.adminMessage}` : ''
    }\n\n- ${env.business.name}`,
  });

module.exports = { send, notifyNewRequest, notifyStatusChanged, configured };
