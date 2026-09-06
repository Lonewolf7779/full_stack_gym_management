const express = require('express');
const {
  getTrainingPlans,
  getTrainingPlanById,
  getMemberPlans,
  createTrainingPlan,
  updateTrainingPlan,
  deleteTrainingPlan,
} = require('../controllers/trainingPlanController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getTrainingPlans)
  .post(authorize('admin', 'trainer'), createTrainingPlan);

router.route('/member/:memberId').get(getMemberPlans);

router
  .route('/:id')
  .get(getTrainingPlanById)
  .put(authorize('admin', 'trainer'), updateTrainingPlan)
  .delete(authorize('admin', 'trainer'), deleteTrainingPlan);

module.exports = router;
