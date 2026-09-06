const express = require('express');
const {
  createProgress,
  getMyProgress,
  getMemberProgress,
  getAllProgress,
  getProgressById,
  updateProgress,
  deleteProgress,
} = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// All progress routes require authentication
router.use(protect);

// Member personal progress route
router.get('/me', authorize('member'), getMyProgress);
router.get('/my-progress', authorize('member'), getMyProgress);

// Member progress by memberId (Member [own] / Trainer [assigned] / Admin)
router.get('/member/:memberId', authorize('member', 'trainer', 'admin'), getMemberProgress);

// Gym-wide progress list (Admin) and Create progress (Member [own], Trainer [assigned], Admin)
router.get('/admin/all', authorize('admin'), getAllProgress);
router
  .route('/')
  .get(authorize('admin'), getAllProgress)
  .post(authorize('member', 'trainer', 'admin'), createProgress);

// Single progress record routes
router
  .route('/:id')
  .get(authorize('member', 'trainer', 'admin'), getProgressById)
  .put(authorize('member', 'trainer', 'admin'), updateProgress)
  .delete(authorize('member', 'trainer', 'admin'), deleteProgress);

module.exports = router;
