const mongoose = require('mongoose');

const membershipPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a plan name'],
      unique: true,
      trim: true,
      maxlength: [50, 'Plan name cannot exceed 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    duration: {
      type: Number, // duration in months (e.g. 1, 3, 6, 12)
      required: [true, 'Please specify plan duration in months'],
      min: [1, 'Duration must be at least 1 month'],
      default: 1,
    },
    price: {
      type: Number,
      required: [true, 'Please specify plan price'],
      min: [0, 'Price cannot be negative'],
    },
    features: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive'],
        message: '{VALUE} is not a valid status',
      },
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MembershipPlan', membershipPlanSchema);
