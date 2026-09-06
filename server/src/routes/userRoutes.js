const express = require('express');
const { updateUserStatus, resetUserPassword } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// All user management routes are strictly restricted to Admin
router.use(protect);
router.use(authorize('admin'));

router.patch('/:id/status', updateUserStatus);
router.patch('/:id/password', resetUserPassword);

module.exports = router;
