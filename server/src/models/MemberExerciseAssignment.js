const mongoose = require('mongoose');

const memberExerciseAssignmentSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member reference is required'],
      index: true,
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
      required: [true, 'Trainer reference is required'],
      index: true,
    },
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: [true, 'Exercise reference is required'],
      index: true,
    },
    sets: {
      type: Number,
      default: 3,
      min: [1, 'Sets must be at least 1'],
    },
    reps: {
      type: Number,
      default: 10,
      min: [0, 'Reps cannot be negative'],
    },
    duration: {
      type: Number,
      default: 0, // in seconds
      min: [0, 'Duration cannot be negative'],
    },
    restTime: {
      type: Number,
      default: 60, // in seconds
      min: [0, 'Rest time cannot be negative'],
    },
    targetWeight: {
      type: Number,
      default: 0, // in kg/lbs
      min: [0, 'Target weight cannot be negative'],
    },
    instructions: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'inactive'],
      default: 'active',
      index: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly look up active member assignments and prevent duplicates
memberExerciseAssignmentSchema.index({ member: 1, exercise: 1, status: 1 });

const MemberExerciseAssignment = mongoose.model(
  'MemberExerciseAssignment',
  memberExerciseAssignmentSchema
);

module.exports = MemberExerciseAssignment;
