const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const memberRoutes = require('./memberRoutes');
const trainerRoutes = require('./trainerRoutes');
const membershipPlanRoutes = require('./membershipPlanRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const exerciseRoutes = require('./exerciseRoutes');
const trainingPlanRoutes = require('./trainingPlanRoutes');
const trainerExerciseAssignmentRoutes = require('./trainerExerciseAssignmentRoutes');
const memberExerciseAssignmentRoutes = require('./memberExerciseAssignmentRoutes');
const userRoutes = require('./userRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const paymentRoutes = require('./paymentRoutes');
const progressRoutes = require('./progressRoutes');
const notificationRoutes = require('./notificationRoutes');

const router = express.Router();

// Mount feature routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/members', memberRoutes);
router.use('/trainers', trainerRoutes);
router.use('/membership-plans', membershipPlanRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/exercises', exerciseRoutes);
router.use('/training-plans', trainingPlanRoutes);
router.use('/trainer-exercise-assignments', trainerExerciseAssignmentRoutes);
router.use('/member-exercise-assignments', memberExerciseAssignmentRoutes);
router.use('/users', userRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/payments', paymentRoutes);
router.use('/progress', progressRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;

