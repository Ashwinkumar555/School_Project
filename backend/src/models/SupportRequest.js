import mongoose from 'mongoose';

export const SUPPORT_CATEGORIES = [
  'Books & Notebooks',
  'School Uniform',
  'School Bag & Stationery',
  'Scholarship / Financial Assistance',
  'Laptop / Tablet / Digital Device',
  'Transport Support / Bicycle',
  'Other Educational Needs',
];

export const SUPPORT_STATUSES = [
  'Pending',
  'Under Review',
  'Approved',
  'Forwarded to NGO/Partner',
  'Accepted',
  'Ongoing',
  'Rejected',
  'Completed',
];

export const SUPPORT_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const supportRequestSchema = new mongoose.Schema(
  {
    // Linked Student
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Linked student is required'],
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    studentRoll: {
      type: String,
      default: '',
      trim: true,
    },
    studentClass: {
      type: String,
      default: '',
      trim: true,
    },
    village: {
      type: String,
      default: 'Sundarpur',
      trim: true,
    },
    schoolName: {
      type: String,
      default: 'Govt Higher Secondary School',
      trim: true,
    },

    // Requester details (Parent or Village Local Head)
    requestedBy: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
      required: [true, 'Requester user ID is required'],
    },
    requesterRole: {
      type: String,
      enum: ['parent', 'student_parent', 'village_head', 'headmaster_admin', 'admin', 'villager'],
      required: true,
    },
    requesterName: {
      type: String,
      default: 'EduConnect User',
      trim: true,
    },
    requesterPhone: {
      type: String,
      default: '',
      trim: true,
    },

    // Request Details
    category: {
      type: String,
      enum: {
        values: SUPPORT_CATEGORIES,
        message: '{VALUE} is not a valid support category',
      },
      required: [true, 'Support category is required'],
    },
    title: {
      type: String,
      required: [true, 'Support request title/summary is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Detailed description is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: SUPPORT_PRIORITIES,
      default: 'Medium',
    },
    estimatedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Estimated amount cannot be negative'],
    },
    supportRequired: {
      type: String,
      default: '',
      trim: true,
    },

    // Current Status
    status: {
      type: String,
      enum: SUPPORT_STATUSES,
      default: 'Pending',
    },

    // Head Master Review & Verification
    headMasterReview: {
      reviewedBy: {
        type: mongoose.Schema.Types.Mixed,
        ref: 'User',
      },
      reviewerName: {
        type: String,
        default: '',
      },
      decision: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Request Information', 'Forwarded'],
        default: 'Pending',
      },
      reviewNotes: {
        type: String,
        default: '',
      },
      reviewedAt: {
        type: Date,
      },
    },

    // NGO / Partner Forwarding
    targetNgo: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
    },
    targetNgoName: {
      type: String,
      default: '',
    },
    forwardedAt: {
      type: Date,
    },

    // NGO Support Provision & Completion
    ngoSupport: {
      acceptedBy: {
        type: mongoose.Schema.Types.Mixed,
        ref: 'User',
      },
      ngoName: {
        type: String,
        default: '',
      },
      supportType: {
        type: String,
        default: '',
      },
      supportDetails: {
        type: String,
        default: '',
      },
      fulfillmentDate: {
        type: Date,
      },
      completionNotes: {
        type: String,
        default: '',
      },
      rejectionReason: {
        type: String,
        default: '',
      },
    },

    // Status Timeline & Audit History
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        changedBy: {
          type: mongoose.Schema.Types.Mixed,
          ref: 'User',
        },
        changerName: {
          type: String,
          default: 'EduConnect User',
        },
        changerRole: {
          type: String,
          default: 'user',
        },
        note: {
          type: String,
          default: '',
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup & filtering
supportRequestSchema.index({ requestedBy: 1, status: 1 });
supportRequestSchema.index({ student: 1 });
supportRequestSchema.index({ targetNgo: 1, status: 1 });
supportRequestSchema.index({ village: 1 });

const SupportRequest = mongoose.model('SupportRequest', supportRequestSchema);
export default SupportRequest;
