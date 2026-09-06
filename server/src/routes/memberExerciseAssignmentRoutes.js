const express = require('express');
const {
  createMemberExerciseAssignment,
  getMemberExerciseAssignments,
  getAssignmentsByMemberId,
  deleteMemberExerciseAssignment,
} = require('../controllers/memberExerciseAssignmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Protect all routes
router.use(protect);

// GET all assignments (RBAC filtered)
router.get('/', authorize('admin', 'trainer', 'member'), getMemberExerciseAssignments);

// GET assignments for specific member
router.get('/member/:memberId', authorize('admin', 'trainer', 'member'), getAssignmentsByMemberId);

// POST: Trainer only can create exercise assignments for their members
router.post('/', authorize('trainer'), createMemberExerciseAssignment);

// DELETE: Trainer or Admin can delete assignment
router.delete('/:id', authorize('admin', 'trainer'), deleteMemberExerciseAssignment);

module.exports = router;
