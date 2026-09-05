const express = require('express');
const {
  getAdminStats,
  getTrainerDashboardData,
  getMemberDashboardData,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Role-specific dashboard endpoints
router.get('/stats', protect, authorizeRoles('admin'), getAdminStats);
router.get('/trainer', protect, authorizeRoles('trainer'), getTrainerDashboardData);
router.get('/member', protect, authorizeRoles('member'), getMemberDashboardData);

module.exports = router;
