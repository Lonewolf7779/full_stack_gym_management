const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const memberRoutes = require('./memberRoutes');
const trainerRoutes = require('./trainerRoutes');
const membershipPlanRoutes = require('./membershipPlanRoutes');
const dashboardRoutes = require('./dashboardRoutes');

const router = express.Router();

// Mount feature routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/members', memberRoutes);
router.use('/trainers', trainerRoutes);
router.use('/membership-plans', membershipPlanRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
