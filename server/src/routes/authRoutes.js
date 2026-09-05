const express = require('express');
const { register, login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { successResponse } = require('../utils/apiResponse');

const router = express.Router();

// Public auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected session route
router.get('/me', protect, getMe);

// Role verification test routes (for verifying RBAC)
router.get('/test/admin', protect, authorizeRoles('admin'), (req, res) => {
  return successResponse(res, 'Admin authorization verified.', { user: req.user });
});

router.get('/test/trainer', protect, authorizeRoles('trainer'), (req, res) => {
  return successResponse(res, 'Trainer authorization verified.', { user: req.user });
});

router.get('/test/member', protect, authorizeRoles('member'), (req, res) => {
  return successResponse(res, 'Member authorization verified.', { user: req.user });
});

module.exports = router;
