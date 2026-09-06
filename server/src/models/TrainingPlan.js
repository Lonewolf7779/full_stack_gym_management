const mongoose = require('mongoose');

const trainingPlanExerciseSchema = new mongoose.Schema(
  {
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: [true, 'Exercise reference is required'],
    },
    sets: {
      type: Number,
      default: 3,
      min: 1,
    },
    reps: {
      type: Number,
      default: 10,
      min: 0,
    },
    duration: {
      type: Number,
      default: 0, // in seconds or minutes
      min: 0,
    },
    restTime: {
      type: Number,
      default: 60, // in seconds
      min: 0,
    },
    targetWeight: {
      type: Number,
      default: 0, // kg or lbs
      min: 0,
    },
    instructions: {
      type: String,
      trim: true,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const trainingPlanSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member is required'],
      index: true,
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
      required: [true, 'Trainer is required'],
      index: true,
    },
    planName: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    goal: {
      type: String,
      enum: ['Hypertrophy', 'Strength', 'Fat Loss', 'Endurance', 'Rehabilitation', 'General Fitness'],
      default: 'General Fitness',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active',
      index: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    exercises: [trainingPlanExerciseSchema],
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const TrainingPlan = mongoose.model('TrainingPlan', trainingPlanSchema);

module.exports = TrainingPlan;
