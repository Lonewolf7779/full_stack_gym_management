const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Exercise name is required'],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Strength', 'Cardio', 'Flexibility', 'Bodyweight', 'Olympic', 'Core'],
      default: 'Strength',
    },
    muscleGroup: {
      type: String,
      required: [true, 'Primary muscle group is required'],
      enum: ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body'],
      default: 'Full Body',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    instructions: {
      type: [String],
      default: [],
    },
    equipment: {
      type: String,
      enum: ['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Kettlebell', 'Bands', 'Other', 'None'],
      default: 'None',
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    defaultSets: {
      type: Number,
      default: 3,
      min: 1,
    },
    defaultReps: {
      type: Number,
      default: 10,
      min: 1,
    },
    defaultDuration: {
      type: Number,
      default: 0,
      min: 0,
    },
    defaultRestTime: {
      type: Number,
      default: 60,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

const Exercise = mongoose.model('Exercise', exerciseSchema);

module.exports = Exercise;
