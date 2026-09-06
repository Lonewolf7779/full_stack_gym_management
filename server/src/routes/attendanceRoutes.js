const express = require('express');
const {
  checkIn,
  checkOut,
  getTodayStatus,
  getMyAttendance,
  getTrainerAttendance,
  getAllAttendance,
  getAttendanceStats,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// All attendance routes require authentication
router.use(protect);

// Member self-service routes
router.post('/check-in', authorize('member'), checkIn);
router.patch('/check-out', authorize('member'), checkOut);
router.get('/me/today', authorize('member'), getTodayStatus);
router.get('/me', authorize('member'), getMyAttendance);

// Trainer roster route
router.get('/trainer', authorize('trainer'), getTrainerAttendance);

// Admin stats route
router.get('/stats', authorize('admin'), getAttendanceStats);

// Admin list & create routes
router
  .route('/')
  .get(authorize('admin'), getAllAttendance)
  .post(authorize('admin'), createAttendance);

// Single record routes (Admin or Trainer for read, Admin only for update/delete)
router
  .route('/:id')
  .get(authorize('admin', 'trainer'), getAttendanceById)
  .patch(authorize('admin'), updateAttendance)
  .delete(authorize('admin'), deleteAttendance);

module.exports = router;
