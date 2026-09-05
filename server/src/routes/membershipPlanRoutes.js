const express = require('express');
const {
  getMembershipPlans,
  getMembershipPlanById,
  createMembershipPlan,
  updateMembershipPlan,
  deleteMembershipPlan,
} = require('../controllers/membershipPlanController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public / Authenticated reading
router.get('/', getMembershipPlans);
router.get('/:id', getMembershipPlanById);

// Admin-only management
router.post('/', protect, authorizeRoles('admin'), createMembershipPlan);
router.put('/:id', protect, authorizeRoles('admin'), updateMembershipPlan);
router.delete('/:id', protect, authorizeRoles('admin'), deleteMembershipPlan);

module.exports = router;
