const express = require('express');
const {
  getTrainers,
  getTrainerById,
  getTrainerProfile,
  createTrainer,
  updateTrainer,
  deleteTrainer,
} = require('../controllers/trainerController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public / Authenticated read list
router.get('/', getTrainers);

// Trainer viewing own profile
router.get('/me/profile', protect, authorizeRoles('trainer'), getTrainerProfile);

// Get trainer details
router.get('/:id', getTrainerById);

// Admin / Trainer management
router.post('/', protect, authorizeRoles('admin'), createTrainer);
router.put('/:id', protect, updateTrainer); // updateTrainer verifies admin or owner
router.delete('/:id', protect, authorizeRoles('admin'), deleteTrainer);

module.exports = router;
