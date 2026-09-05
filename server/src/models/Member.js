const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Member must be linked to a User account'],
      unique: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: {
        values: ['male', 'female', 'other', 'unspecified'],
        message: '{VALUE} is not a valid gender',
      },
      default: 'unspecified',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    emergencyContact: {
      name: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
      relation: { type: String, trim: true, default: '' },
    },
    membershipPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipPlan',
      default: null,
    },
    membershipStartDate: {
      type: Date,
      default: null,
    },
    membershipEndDate: {
      type: Date,
      default: null,
    },
    assignedTrainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive', 'expired'],
        message: '{VALUE} is not a valid member status',
      },
      default: 'active',
    },
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

module.exports = mongoose.model('Member', memberSchema);
