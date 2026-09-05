const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Trainer must be linked to a User account'],
      unique: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    specialization: {
      type: String,
      trim: true,
      default: 'General Strength & Conditioning',
    },
    experience: {
      type: String,
      trim: true,
      default: '1 Year',
    },
    certifications: {
      type: [String],
      default: [],
    },
    bio: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive'],
        message: '{VALUE} is not a valid trainer status',
      },
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Trainer', trainerSchema);
