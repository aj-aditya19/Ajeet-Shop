const router = require('express').Router();
const env = require('../config/env');
const { ok } = require('../utils/response');
const whatsapp = require('../services/whatsappService');
const { authLimiter } = require('../middleware/rateLimit');
const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { uploadFiles } = require('../middleware/upload');
const { registerSchema, loginSchema } = require('../validators/authValidators');
const { serviceSchema, activeSchema } = require('../validators/serviceValidators');
const { createRequestSchema, statusUpdateSchema } = require('../validators/requestValidators');
const { equipmentSchema, rentalSchema } = require('../validators/cateringValidators');
const auth = require('../controllers/authController');
const services = require('../controllers/serviceController');
const requests = require('../controllers/requestController');
const uploads = require('../controllers/uploadController');
const admin = require('../controllers/adminController');
const catering = require('../controllers/cateringController');
const photoStudio = require('../controllers/photoStudioController');

router.get('/health', (_req, res) => ok(res, { status: 'up' }));
router.get('/config/business', (_req, res) =>
  ok(res, { ...env.business, whatsappLink: whatsapp.shopLink(), limits: { maxFileSizeMb: env.maxFileSizeMb, maxFiles: env.maxFiles } }));

// Auth
router.post('/auth/register', authLimiter, validate(registerSchema), auth.register);
router.post('/auth/login', authLimiter, validate(loginSchema), auth.login);
router.post('/auth/admin/login', authLimiter, validate(loginSchema), auth.adminLogin);
router.post('/auth/logout', authenticate, auth.logout);
router.get('/auth/me', authenticate, auth.me);

// Services (public read, admin write)
router.get('/services', optionalAuth, services.list);
router.get('/services/:id', optionalAuth, services.get);
router.post('/services', authenticate, requireAdmin, validate(serviceSchema), services.create);
router.put('/services/:id', authenticate, requireAdmin, validate(serviceSchema), services.update);
router.patch('/services/:id/active', authenticate, requireAdmin, validate(activeSchema), services.setActive);
router.delete('/services/:id', authenticate, requireAdmin, services.remove);

// Service requests
router.post('/requests', authenticate, uploadFiles, validate(createRequestSchema), requests.create);
router.get('/requests', authenticate, requests.list);
router.get('/requests/stats', authenticate, requests.stats);
router.get('/requests/:id', authenticate, requests.get);
router.patch('/requests/:id/status', authenticate, requireAdmin, validate(statusUpdateSchema), requests.updateStatus);

// Uploaded files (owner or admin)
router.get('/uploads/:id/download', authenticate, uploads.download);

// Admin
router.get('/admin/dashboard', authenticate, requireAdmin, admin.dashboard);
router.get('/admin/customers', authenticate, requireAdmin, admin.customers);
router.get('/admin/customers/:id', authenticate, requireAdmin, admin.customer);

// Passport photo studio (staff only)
router.post('/photo-studio/process', authenticate, requireAdmin, photoStudio.uploadPhoto, photoStudio.process);
router.post('/photo-studio/sheet', authenticate, requireAdmin, photoStudio.uploadPhoto, photoStudio.sheet);

// Catering: public
router.get('/catering/public/equipment', catering.publicEquipment);
// Catering: admin
const cat = [authenticate, requireAdmin];
router.get('/catering/dashboard', ...cat, catering.dashboard);
router.get('/catering/clients', ...cat, catering.clients);
router.get('/catering/alerts', ...cat, catering.alerts);
router.post('/catering/alerts/send', ...cat, catering.sendAlertsNow);
router.get('/catering/reports', ...cat, catering.reports);
router.get('/catering/equipment', ...cat, catering.listEquipment);
router.post('/catering/equipment', ...cat, validate(equipmentSchema), catering.createEquipment);
router.put('/catering/equipment/:id', ...cat, validate(equipmentSchema), catering.updateEquipment);
router.delete('/catering/equipment/:id', ...cat, catering.deactivateEquipment);
router.get('/catering/rentals', ...cat, catering.listRentals);
router.post('/catering/rentals', ...cat, validate(rentalSchema), catering.createRental);
router.get('/catering/rentals/:id', ...cat, catering.getRental);
router.put('/catering/rentals/:id', ...cat, validate(rentalSchema), catering.updateRental);
router.patch('/catering/rentals/:id/return', ...cat, catering.returnRental);
router.patch('/catering/rentals/:id/cancel', ...cat, catering.cancelRental);

module.exports = router;
