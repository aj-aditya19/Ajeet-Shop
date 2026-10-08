// Usage: npm run seed   (idempotent: safe to run more than once)
const bcrypt = require('bcryptjs');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const mongoose = require('mongoose');
const User = require('./models/User');
const Service = require('./models/Service');
const CateringEquipment = require('./models/CateringEquipment');

const n = (key, label, required = true) => ({ key, label, type: 'number', required });
const sel = (key, label, options, required = true) => ({ key, label, type: 'select', required, options });
const txt = (key, label, required = false, type = 'text') => ({ key, label, type, required });

const SERVICES = [
  ['B&W Printout', 'printing', 'Black & white printouts from your files.', [n('numberOfPages', 'Number of pages'), n('numberOfCopies', 'Number of copies'), sel('printType', 'Print type', ['Single side', 'Both sides'])]],
  ['Photocopy', 'printing', 'Photocopy of your documents.', [n('numberOfPages', 'Number of pages'), n('numberOfCopies', 'Number of copies'), sel('printType', 'Print type', ['Single side', 'Both sides'])]],
  ['Lamination', 'printing', 'Lamination for ID cards, certificates and documents.', [n('numberOfDocuments', 'Number of documents'), sel('documentSize', 'Document size', ['ID card', 'A4', 'A3', 'Other'])]],
  ['Passport Size Photo', 'printing', 'Passport size photos.', [n('numberOfPhotos', 'Number of photos')]],
  ['Aadhaar Print', 'printing', 'Aadhaar card printout.', [sel('printType', 'Print type', ['Black & white', 'Colour'], false)]],
  ['PAN Registration', 'printing', 'New PAN card application.', []],
  ['PAN Update', 'printing', 'Correction or update of an existing PAN card.', [txt('panNumber', 'PAN number (if you have one)')]],
  ['Binding', 'printing', 'Spiral, soft and hard binding.', [n('numberOfPages', 'Number of pages'), sel('bindingType', 'Binding type', ['Spiral', 'Soft', 'Hard'])]],
  ['Document Scanning', 'digital', 'Scanning of documents into PDF.', [n('numberOfDocuments', 'Number of documents')]],
  ['Online Form Filling', 'digital', 'We fill and submit online forms for you.', [txt('formName', 'Form name', true), txt('instructions', 'Form details', false, 'textarea')]],
  ['Project File Making', 'digital', 'College project file preparation.', [txt('subject', 'Subject / topic', true), n('numberOfPages', 'Approx. pages', false)]],
  ['College Front Page', 'digital', 'College cover / front page design.', [txt('collegeName', 'College name', true), txt('subject', 'Subject / topic')]],
  ['Hindi Typing', 'digital', 'Hindi typing from handwritten or printed matter.', [n('numberOfPages', 'Number of pages')]],
];

const EQUIPMENT = [
  ['Bhati', 'bhati', 'Heavy-duty cooking bhati for catering events.', 5, 300],
  ['Chari', 'chari', 'Large cooking chari.', 10, 100],
  ['Kadai', 'kadai', 'Large catering kadai.', 10, 150],
  ['Patila', 'patila', 'Large patila (cooking pot).', 10, 200],
];

(async () => {
  try {
    if (env.isProd && !process.env.SEED_ADMIN_PASSWORD) throw new Error('Set SEED_ADMIN_PASSWORD when seeding in production');
    await connectDB();
    const email = (process.env.SEED_ADMIN_EMAIL || 'admin@ajeetdigital.local').toLowerCase();
    const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
    if (!(await User.exists({ email }))) {
      await User.create({
        name: process.env.SEED_ADMIN_NAME || 'Shop Admin', email, phone: env.business.phones[0],
        passwordHash: await bcrypt.hash(password, env.bcryptRounds), role: 'admin',
      });
      console.log(`Admin created: ${email}${process.env.SEED_ADMIN_PASSWORD ? '' : ` / ${password}  (DEVELOPMENT DEFAULT - change it)`}`);
    } else console.log(`Admin already exists: ${email}`);

    for (const [name, category, description, fields] of SERVICES)
      await Service.updateOne({ name }, { $setOnInsert: { name, category, description, fields, active: true } }, { upsert: true });
    for (const [name, category, description, totalQuantity, defaultRate] of EQUIPMENT)
      await CateringEquipment.updateOne({ name }, { $setOnInsert: { name, category, description, totalQuantity, defaultRate } }, { upsert: true });
    console.log(`Seeded ${SERVICES.length} services and ${EQUIPMENT.length} equipment types.`);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
