const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Payment must be associated with a valid member'],
      index: true,
    },
    membershipPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipPlan',
      default: null,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be greater than 0'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['razorpay', 'cash', 'upi', 'card', 'bank_transfer', 'other'],
        message: '{VALUE} is not a supported payment method',
      },
      default: 'razorpay',
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'pending',
      index: true,
    },
    purpose: {
      type: String,
      enum: {
        values: ['membership', 'renewal', 'other'],
        message: '{VALUE} is not a valid payment purpose',
      },
      default: 'membership',
    },
    razorpayOrderId: {
      type: String,
      default: null,
      trim: true,
      sparse: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
      trim: true,
      sparse: true,
      index: true,
    },
    razorpaySignature: {
      type: String,
      default: null,
      select: false, // Never leak cryptographic signature in normal API queries
    },
    receiptNumber: {
      type: String,
      required: [true, 'Receipt number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Helper method to format receipt representation
paymentSchema.methods.toReceiptJSON = function () {
  const obj = this.toObject();
  delete obj.razorpaySignature;
  return obj;
};

module.exports = mongoose.model('Payment', paymentSchema);
