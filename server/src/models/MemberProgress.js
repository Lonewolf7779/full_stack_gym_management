const mongoose = require('mongoose');

const memberProgressSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member reference is required'],
      index: true,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    weight: {
      type: Number,
      min: [20, 'Weight must be at least 20 kg'],
      max: [500, 'Weight cannot exceed 500 kg'],
      default: null,
    },
    bodyFatPercentage: {
      type: Number,
      min: [1, 'Body fat percentage must be at least 1%'],
      max: [75, 'Body fat percentage cannot exceed 75%'],
      default: null,
    },
    chest: {
      type: Number,
      min: [20, 'Chest measurement must be at least 20 cm'],
      max: [250, 'Chest measurement cannot exceed 250 cm'],
      default: null,
    },
    waist: {
      type: Number,
      min: [20, 'Waist measurement must be at least 20 cm'],
      max: [250, 'Waist measurement cannot exceed 250 cm'],
      default: null,
    },
    hips: {
      type: Number,
      min: [20, 'Hips measurement must be at least 20 cm'],
      max: [250, 'Hips measurement cannot exceed 250 cm'],
      default: null,
    },
    arms: {
      type: Number,
      min: [10, 'Arms measurement must be at least 10 cm'],
      max: [100, 'Arms measurement cannot exceed 100 cm'],
      default: null,
    },
    thighs: {
      type: Number,
      min: [15, 'Thighs measurement must be at least 15 cm'],
      max: [150, 'Thighs measurement cannot exceed 150 cm'],
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User recorder reference is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound Index: Optimize querying member history chronologically
memberProgressSchema.index({ member: 1, recordedAt: -1 });

// Ensure at least one valid measurement is present
memberProgressSchema.pre('validate', function (next) {
  const hasMeasurement =
    (this.weight !== null && this.weight !== undefined && Number.isFinite(this.weight)) ||
    (this.bodyFatPercentage !== null && this.bodyFatPercentage !== undefined && Number.isFinite(this.bodyFatPercentage)) ||
    (this.chest !== null && this.chest !== undefined && Number.isFinite(this.chest)) ||
    (this.waist !== null && this.waist !== undefined && Number.isFinite(this.waist)) ||
    (this.hips !== null && this.hips !== undefined && Number.isFinite(this.hips)) ||
    (this.arms !== null && this.arms !== undefined && Number.isFinite(this.arms)) ||
    (this.thighs !== null && this.thighs !== undefined && Number.isFinite(this.thighs));

  if (!hasMeasurement) {
    this.invalidate(
      'weight',
      'At least one fitness measurement (weight, body fat %, chest, waist, hips, arms, or thighs) is required.'
    );
  }
  next();
});

module.exports = mongoose.model('MemberProgress', memberProgressSchema);