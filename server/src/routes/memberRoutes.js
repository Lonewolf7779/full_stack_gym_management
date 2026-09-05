const express = require('express');
const {
  getMembers,
  getMemberById,
  getMemberProfile,
  createMember,
  updateMember,
  deleteMember,
} = require('../controllers/memberController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Member profile self-lookup
router.get('/me/profile', protect, authorizeRoles('member'), getMemberProfile);

// Admin & Trainer reading members list
router.get('/', protect, authorizeRoles('admin', 'trainer'), getMembers);

// Get single member details
router.get('/:id', protect, getMemberById); // getMemberById verifies admin/trainer/owner permissions

// Admin-only member creation and deletion
router.post('/', protect, authorizeRoles('admin'), createMember);
router.delete('/:id', protect, authorizeRoles('admin'), deleteMember);

// Member update (Admin or Owner)
router.put('/:id', protect, updateMember);

module.exports = router;
