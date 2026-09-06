const express = require('express');
const {
  createTrainerExerciseAssignment,
  getTrainerExerciseAssignments,
  deleteTrainerExerciseAssignment,
} = require('../controllers/trainerExerciseAssignmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Protect all routes
router.use(protect);

// GET: Admin and Trainer can view assignments
router.get('/', authorize('admin', 'trainer'), getTrainerExerciseAssignments);

// POST: Admin only can create assignments for trainers
router.post('/', authorize('admin'), createTrainerExerciseAssignment);

// DELETE: Admin only can delete assignments
router.delete('/:id', authorize('admin'), deleteTrainerExerciseAssignment);

module.exports = router;
