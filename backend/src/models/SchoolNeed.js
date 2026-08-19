import mongoose from 'mongoose';

const schoolNeedSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'School need title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Detailed description is required'],
    },
    category: {
      type: String,
      required: true,
      enum: [
        'IT & Computers',
        'Laboratory Equipment',
        'Library & Books',
        'Sports Equipment',
        'Classroom Furniture',
        'Infrastructure & Sanitation',
        'Learning Kits & Stationery',
      ],
      default: 'IT & Computers',
    },
    urgency: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'High',
    },
    targetDepartment: {
      type: String,
      default: 'Computer Lab',
    },
    requiredQuantity: {
      type: Number,
      required: [true, 'Required quantity is required'],
      min: [1, 'Must need at least 1 item'],
    },
    receivedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingQuantity: {
      type: Number,
      default: function () {
        return this.requiredQuantity;
      },
    },
    unit: {
      type: String,
      default: 'Units',
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Open', 'Drive Created', 'Partially Fulfilled', 'Completed', 'Cancelled'],
      default: 'Open',
    },
    verifiedByAdmin: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    linkedDrive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommunityDrive',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to recalculate remaining quantity and status
schoolNeedSchema.pre('save', function (next) {
  this.remainingQuantity = Math.max(0, this.requiredQuantity - (this.receivedQuantity || 0));
  if (this.receivedQuantity >= this.requiredQuantity) {
    this.status = 'Completed';
  } else if (this.receivedQuantity > 0) {
    this.status = 'Partially Fulfilled';
  }
  next();
});

const SchoolNeed = mongoose.model('SchoolNeed', schoolNeedSchema);
export default SchoolNeed;
