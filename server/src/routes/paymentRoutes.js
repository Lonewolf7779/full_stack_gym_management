const express = require('express');
const {
  getPaymentConfig,
  createRazorpayOrder,
  verifyPayment,
  handleWebhook,
  recordManualPayment,
  getMyPayments,
  getAllPayments,
  getPaymentStats,
  getPaymentById,
  updatePaymentNotes,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes (Webhook & Config)
router.post('/webhook', handleWebhook);
router.get('/config', getPaymentConfig);

// Protected routes (Require authenticated active session)
router.use(protect);

// Order creation & Signature verification
router.post('/create-order', authorize('member', 'admin'), createRazorpayOrder);
router.post('/verify', authorize('member', 'admin'), verifyPayment);
router.post('/verify-payment', authorize('member', 'admin'), verifyPayment);

// Member payment history
router.get('/my-payments', authorize('member'), getMyPayments);

// Admin financial management
router.post('/manual', authorize('admin'), recordManualPayment);
router.get('/', authorize('admin'), getAllPayments);
router.get('/all', authorize('admin'), getAllPayments);
router.get('/stats', authorize('admin'), getPaymentStats);
router.patch('/:id/notes', authorize('admin'), updatePaymentNotes);

// Single payment receipt lookup (Member own / Admin)
router.get('/:id', authorize('member', 'admin'), getPaymentById);

module.exports = router;
