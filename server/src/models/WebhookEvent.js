const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: [true, 'Webhook event ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    eventType: {
      type: String,
      required: [true, 'Webhook event type is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['processed', 'ignored', 'failed'],
      default: 'processed',
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
