const mongoose = require('mongoose');

const trainerExerciseAssignmentSchema = new mongoose.Schema(
  {
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
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigning user reference is required'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
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

// Compound index to quickly look up active assignments and prevent duplicates
trainerExerciseAssignmentSchema.index({ trainer: 1, exercise: 1, status: 1 });

const TrainerExerciseAssignment = mongoose.model(
  'TrainerExerciseAssignment',
  trainerExerciseAssignmentSchema
);

module.exports = TrainerExerciseAssignment;
