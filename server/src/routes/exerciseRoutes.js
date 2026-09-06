const express = require('express');
const {
  getExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
} = require('../controllers/exerciseController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Apply auth to all exercise endpoints
router.use(protect);

router
  .route('/')
  .get(getExercises)
  .post(authorize('admin'), createExercise);

router
  .route('/:id')
  .get(getExerciseById)
  .put(authorize('admin'), updateExercise)
  .delete(authorize('admin'), deleteExercise);

module.exports = router;
