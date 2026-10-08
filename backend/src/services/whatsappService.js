// Click-to-chat links only (wa.me). No unofficial WhatsApp API.
const env = require('../config/env');
const { toWhatsAppNumber } = require('../utils/phone');

const link = (number, text) => `https://wa.me/${toWhatsAppNumber(number)}?text=${encodeURIComponent(text)}`;

const shopLink = (text = 'Hello Ajeet Digital Services, I would like to know more about your services.') =>
  link(env.business.whatsapp, text);

function requestStatusMessage({ requestId, contact, serviceName }) {
  return `Hello Ajeet Digital Services, I am ${contact.name}. My request ID is ${requestId} regarding ${serviceName}. I would like to know the status of my request.`;
}

function customerMessage({ requestId, serviceName, status }) {
  return `Hello, this is Ajeet Digital Services regarding your request ${requestId} (${serviceName}). Current status: ${String(status).replace('_', ' ')}.`;
}

module.exports = { link, shopLink, requestStatusMessage, customerMessage };
